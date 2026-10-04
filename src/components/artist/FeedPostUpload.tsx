import { useRef, useState } from "react";
import { Image, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedMusicUrl } from "@/lib/music-url";

interface FeedPostUploadProps {
  userId: string;
  accent: string;
  surface: string;
  onPostCreated?: () => void;
}

export function FeedPostUpload({ userId, accent, surface, onPostCreated }: FeedPostUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!preview || !fileRef.current?.files?.[0]) return;

    setUploading(true);
    setNotice(null);

    try {
      const file = fileRef.current.files[0];
      const path =
        userId + "/feed-" + crypto.randomUUID() + "." + (file.name.split(".").pop() || "jpg");

      // Upload image
      const { error: uploadError } = await supabase.storage
        .from("feed-images")
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      // Create post record
      const { error: dbError } = await supabase.from("feed_posts").insert({
        user_id: userId,
        image_url: path,
        caption: caption.trim() || null,
        // Held for review: an admin must approve before it is public.
        status: "pending",
      });

      if (dbError) throw dbError;

      setNotice({
        ok: true,
        text: "Post shared! It will appear publicly once an admin approves it.",
      });
      setPreview(null);
      setCaption("");
      fileRef.current.value = "";
      onPostCreated?.();
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-xl p-5 md:p-6" style={{ backgroundColor: surface }}>
      <div className="flex items-center gap-2 mb-4">
        <Image className="w-5" style={{ color: accent }} />
        <h3 className="font-display text-xl uppercase">Share a post</h3>
      </div>

      {notice && (
        <p
          className={
            "mb-4 rounded px-3 py-2 text-sm " +
            (notice.ok ? "bg-emerald-400/10 text-emerald-200" : "bg-red-400/10 text-red-200")
          }
        >
          {notice.text}
        </p>
      )}

      {preview ? (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg bg-[#111]">
            <img src={preview} alt="Preview" className="w-full max-h-96 object-cover" />
            <button
              onClick={() => {
                setPreview(null);
                fileRef.current!.value = "";
              }}
              className="absolute top-2 right-2 rounded bg-black/60 p-1.5 hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={300}
            placeholder="Add a caption... (optional)"
            className="w-full rounded bg-[#222] p-3 text-sm text-white outline-none resize-none"
          />
          <p className="text-right text-xs text-white/35">{caption.length} / 300 characters</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPreview(null);
                fileRef.current!.value = "";
              }}
              className="flex-1 rounded bg-white/10 px-4 py-2.5 text-sm font-bold uppercase hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={uploading}
              className="flex-1 rounded px-4 py-2.5 text-sm font-bold uppercase text-[#00382d]"
              style={{ backgroundColor: accent, opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-white/20 rounded-lg p-8 hover:border-white/40 transition"
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-white/40" />
          <p className="text-sm font-bold uppercase text-white/60">Click to select image</p>
          <p className="text-xs text-white/40 mt-1">JPG, PNG, WebP (max 10MB)</p>
        </button>
      )}

      <input ref={fileRef} hidden type="file" accept="image/*" onChange={handleFileSelect} />
    </section>
  );
}
