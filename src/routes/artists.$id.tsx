import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, User as UserIcon, Music as MusicIcon, Youtube, Instagram, Facebook, Twitter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedMusicUrl } from "@/lib/music-url";

export const Route = createFileRoute("/artists/$id")({
  head: () => ({
    meta: [
      { title: "Profil artiste — Dada Hip Hop Academy" },
      { name: "description", content: "Découvrez le profil d'un artiste de Dada Hip Hop Academy." },
    ],
  }),
  component: PublicArtistPage,
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center bg-[#1a1a1a] text-white">
      <p>Impossible de charger ce profil.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-[#1a1a1a] text-white">
      <p>Artiste introuvable.</p>
    </div>
  ),
});

type PublicProfile = {
  id: string;
  artist_name: string;
  genre: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  youtube: string | null;
  spotify: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
};

type Track = {
  id: string;
  title: string;
  genre: string | null;
  cover_url: string | null;
  audio_url: string | null;
};

function PublicArtistPage() {
  const { id } = Route.useParams();
  const location = useLocation();
  const backTo = (location.state as { backTo?: string } | null)?.backTo;
  const backLink = backTo && backTo.startsWith("/") ? backTo : "/dada-reseaux-artist";
  const backLabel = backLink === "/admin/accounts" ? "Retour aux comptes" : "Retour aux artistes";
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [privateView, setPrivateView] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Try the public view first (approved profiles, visible to everyone).
      const { data: pub } = await supabase
        .from("public_profiles")
        .select("id, artist_name, genre, city, bio, avatar_url, youtube, spotify, facebook, instagram, tiktok, twitter")
        .eq("id", id)
        .maybeSingle();

      let p: PublicProfile | null = (pub as PublicProfile | null) ?? null;
      let isPrivate = false;

      // Fallback: admins (and owners) can read the base profiles table thanks to RLS.
      if (!p) {
        const { data: full } = await supabase
          .from("profiles")
          .select("id, artist_name, genre, city, bio, avatar_url, youtube, spotify, facebook, instagram, tiktok, twitter")
          .eq("id", id)
          .maybeSingle();
        p = (full as PublicProfile | null) ?? null;
        isPrivate = !!p;
      }

      if (cancelled) return;
      if (!p) {
        setMissing(true);
        setLoading(false);
        return;
      }
      const avatar_url = await signedMusicUrl(p.avatar_url);
      setProfile({ ...(p as PublicProfile), avatar_url });
      setPrivateView(isPrivate);

      // Approved tracks for public visitors; admins/owners also see pending/rejected via RLS.
      const trackQuery = supabase
        .from("tracks")
        .select("id, title, genre, cover_url, audio_url")
        .eq("user_id", id)
        .order("created_at", { ascending: false });
      const { data: t } = isPrivate
        ? await trackQuery
        : await trackQuery.eq("status", "approved");
      const list = (t as Track[]) ?? [];
      const resolved = await Promise.all(
        list.map(async (x) => ({
          ...x,
          cover_url: await signedMusicUrl(x.cover_url),
          audio_url: await signedMusicUrl(x.audio_url),
        })),
      );
      if (cancelled) return;
      setTracks(resolved);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#1a1a1a] text-white">
        <p className="text-white/70">Chargement…</p>
      </div>
    );
  }

  if (missing || !profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#1a1a1a] text-white px-6 text-center">
        <div>
          <p className="text-xl">Artiste introuvable.</p>
          <Link to="/dada-reseaux-artist" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Retour aux artistes
          </Link>
        </div>
      </div>
    );
  }

  const socials: { url: string | null; label: string; Icon: typeof Youtube }[] = [
    { url: profile.youtube, label: "YouTube", Icon: Youtube },
    { url: profile.instagram, label: "Instagram", Icon: Instagram },
    { url: profile.facebook, label: "Facebook", Icon: Facebook },
    { url: profile.twitter, label: "Twitter", Icon: Twitter },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16">
        <Link to="/dada-reseaux-artist" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour aux artistes
        </Link>

        {privateView && (
          <div className="mb-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-100 px-4 py-3 text-sm">
            Compte privé — non visible publiquement. Vue admin uniquement.
          </div>
        )}

        <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
          <div className="aspect-square w-full max-w-[280px] rounded-2xl overflow-hidden bg-white/5 grid place-items-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.artist_name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-16 h-16 text-white/40" />
            )}
          </div>

          <div>
            <h1 className="font-display text-4xl md:text-6xl tracking-wide">{profile.artist_name}</h1>
            <p className="mt-2 text-white/70">
              {profile.genre || "—"}
              {profile.city ? ` · ${profile.city}` : ""}
            </p>
            {profile.bio && <p className="mt-6 text-white/85 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>}

            {socials.some((s) => s.url) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {socials.map(({ url, label, Icon }) =>
                  url ? (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 text-sm"
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </a>
                  ) : null,
                )}
              </div>
            )}
          </div>
        </div>

        <section className="mt-16">
          <h2 className="font-display text-2xl md:text-3xl tracking-wide mb-6">MUSIQUES</h2>
          {tracks.length === 0 ? (
            <p className="text-white/60 text-sm">Aucun morceau publié.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {tracks.map((t) => (
                <div key={t.id} className="rounded-xl bg-white/5 p-4 flex gap-4 items-center">
                  <div className="w-20 h-20 rounded-lg bg-white/10 overflow-hidden shrink-0 grid place-items-center">
                    {t.cover_url ? (
                      <img src={t.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <MusicIcon className="w-8 h-8 text-white/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{t.title}</p>
                    {t.genre && <p className="text-xs text-white/60">{t.genre}</p>}
                    {t.audio_url && <audio controls src={t.audio_url} preload="none" className="mt-2 w-full h-9" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
