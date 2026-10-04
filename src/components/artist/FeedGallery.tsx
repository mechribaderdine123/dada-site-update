import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/music-url";
import { Trash2 } from "lucide-react";
import type { ApprovalStatus } from "@/lib/auth";

interface FeedPost {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  status: ApprovalStatus;
}

interface FeedGalleryProps {
  userId: string;
  accent: string;
  surface: string;
  refreshTrigger?: number;
}

export function FeedGallery({ userId, accent, surface, refreshTrigger }: FeedGalleryProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, [userId, refreshTrigger]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("id,image_url,caption,created_at,status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsWithUrls = await Promise.all(
        (data || []).map(async (post: FeedPost) => ({
          ...post,
          image_url: await signedUrl("feed-images", post.image_url),
        })),
      );

      setPosts(postsWithUrls);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string, imageUrl: string) => {
    if (!confirm("Delete this post?")) return;

    setDeleting(postId);
    try {
      // Delete image from storage
      await supabase.storage.from("feed-images").remove([imageUrl]);

      // Delete post record
      const { error } = await supabase.from("feed_posts").delete().eq("id", postId);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl p-5 md:p-6" style={{ backgroundColor: surface }}>
        <p className="text-sm text-white/50">Loading posts...</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl p-5 md:p-6" style={{ backgroundColor: surface }}>
      <h3 className="font-display text-xl uppercase mb-4">Your feed</h3>

      {posts.length === 0 ? (
        <p className="text-sm text-white/50">No posts yet. Share your first image!</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-lg bg-[#222]">
              <div className="relative aspect-square overflow-hidden bg-[#111]">
                <img
                  src={post.image_url}
                  alt={post.caption || "Feed post"}
                  className="w-full h-full object-cover hover:scale-105 transition"
                />
                <span
                  className={
                    "absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase " +
                    (post.status === "approved"
                      ? "bg-emerald-500/90 text-black"
                      : post.status === "rejected"
                        ? "bg-red-500/90 text-white"
                        : "bg-amber-400/90 text-black")
                  }
                >
                  {post.status === "approved"
                    ? "Publié"
                    : post.status === "rejected"
                      ? "Refusé"
                      : "En attente"}
                </span>
              </div>
              {post.caption && (
                <div className="p-3 border-t border-white/10">
                  <p className="text-sm text-white/80 line-clamp-2">{post.caption}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div className="px-3 pb-3 pt-2 border-t border-white/10">
                <button
                  onClick={() => deletePost(post.id, post.image_url)}
                  disabled={deleting === post.id}
                  className="w-full flex items-center justify-center gap-2 rounded py-1.5 text-xs font-bold uppercase text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  {deleting === post.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
