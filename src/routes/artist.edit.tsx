import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, Youtube, Facebook, Instagram, Music2, Twitter } from "lucide-react";
import { ArtistSidebar } from "@/components/ArtistSidebar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/artist/edit")({
  head: () => ({ meta: [{ title: "Profil Management — Dada Réseaux Artist" }] }),
  component: EditProfilePage,
});

function EditProfilePage() {
  const { profile, refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [f, setF] = useState({
    artist_name: "", genre: "", city: "", bio: "", phone: "",
    youtube: "", spotify: "", facebook: "", instagram: "", tiktok: "", twitter: "",
    avatar_url: "" as string | null | "",
  });

  useEffect(() => {
    if (!profile) return;
    setF({
      artist_name: profile.artist_name ?? "",
      genre: profile.genre ?? "",
      city: profile.city ?? "",
      bio: profile.bio ?? "",
      phone: profile.phone ?? "",
      youtube: profile.youtube ?? "",
      spotify: profile.spotify ?? "",
      facebook: profile.facebook ?? "",
      instagram: profile.instagram ?? "",
      tiktok: profile.tiktok ?? "",
      twitter: profile.twitter ?? "",
      avatar_url: profile.avatar_url ?? "",
    });
  }, [profile]);

  if (!profile) return null;

  const handleFile = async (file: File | undefined) => {
    if (!file || !profile) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("music").upload(path, file, { upsert: true });
    if (error) {
      setMsg({ ok: false, text: "Échec de l'upload : " + error.message });
      setUploadingAvatar(false);
      return;
    }
    const { data } = supabase.storage.from("music").getPublicUrl(path);
    setF((p) => ({ ...p, avatar_url: data.publicUrl }));
    setUploadingAvatar(false);
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        artist_name: f.artist_name.trim(),
        genre: f.genre.trim() || null,
        city: f.city.trim() || null,
        bio: f.bio.trim() || null,
        phone: f.phone.trim() || null,
        youtube: f.youtube.trim() || null,
        spotify: f.spotify.trim() || null,
        facebook: f.facebook.trim() || null,
        instagram: f.instagram.trim() || null,
        tiktok: f.tiktok.trim() || null,
        twitter: f.twitter.trim() || null,
        avatar_url: f.avatar_url || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
    } else {
      setMsg({ ok: true, text: "Modifications enregistrées." });
      refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#393939] text-white flex">
      <ArtistSidebar />
      <main className="flex-1 p-8 md:p-12 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-secondary">Profil management</h1>
            <p className="mt-2 text-white/80">Modifier votre biographie, photo de profil et informations de contact</p>
          </div>
          <button onClick={save} disabled={saving} className="rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold transition">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
        {msg && (
          <p className={`mt-4 text-sm rounded-lg px-3 py-2 ${msg.ok ? "bg-green-900/30 border border-green-400/30 text-green-200" : "bg-red-900/30 border border-red-400/30 text-red-200"}`}>{msg.text}</p>
        )}

        <section className="mt-8 bg-white/10 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white">Photo de profil</h2>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-5 w-full h-56 rounded-xl border-2 border-dashed border-white/20 hover:border-secondary transition flex flex-col items-center justify-center bg-[#4a4a4a]/50 overflow-hidden"
          >
            {f.avatar_url ? (
              <img src={f.avatar_url} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2" />
                <p className="font-medium">{uploadingAvatar ? "Upload…" : "Cliquer pour choisir une image"}</p>
                <p className="text-sm text-white/60 mt-1">PNG, JPG</p>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
        </section>

        <section className="mt-6 bg-white/10 rounded-2xl p-6 border border-white/10 space-y-4">
          <h2 className="text-xl font-bold">Informations</h2>
          <TextField label="Nom d'artiste" value={f.artist_name} onChange={(v) => setF((p) => ({ ...p, artist_name: v }))} />
          <div className="grid md:grid-cols-2 gap-4">
            <TextField label="Genre" value={f.genre} onChange={(v) => setF((p) => ({ ...p, genre: v }))} />
            <TextField label="Ville" value={f.city} onChange={(v) => setF((p) => ({ ...p, city: v }))} />
          </div>
          <div>
            <label className="text-sm font-semibold">Biographie</label>
            <textarea rows={5} value={f.bio} onChange={(e) => setF((p) => ({ ...p, bio: e.target.value }))} className="mt-2 w-full px-4 py-3 rounded-lg bg-white text-black outline-none focus:ring-2 focus:ring-secondary resize-none" />
          </div>
          <TextField label="Téléphone" value={f.phone} onChange={(v) => setF((p) => ({ ...p, phone: v }))} />
        </section>

        <section className="mt-6 bg-white/10 rounded-2xl p-6 border border-white/10 space-y-4">
          <h2 className="text-xl font-bold">Réseaux sociaux</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <SocialInput icon={<Youtube className="w-4 h-4 text-red-500" />} label="YouTube" value={f.youtube} onChange={(v) => setF((p) => ({ ...p, youtube: v }))} />
            <SocialInput icon={<Music2 className="w-4 h-4 text-green-500" />} label="Spotify" value={f.spotify} onChange={(v) => setF((p) => ({ ...p, spotify: v }))} />
            <SocialInput icon={<Facebook className="w-4 h-4 text-blue-500" />} label="Facebook" value={f.facebook} onChange={(v) => setF((p) => ({ ...p, facebook: v }))} />
            <SocialInput icon={<Instagram className="w-4 h-4 text-pink-500" />} label="Instagram" value={f.instagram} onChange={(v) => setF((p) => ({ ...p, instagram: v }))} />
            <SocialInput icon={<Music2 className="w-4 h-4" />} label="TikTok" value={f.tiktok} onChange={(v) => setF((p) => ({ ...p, tiktok: v }))} />
            <SocialInput icon={<Twitter className="w-4 h-4" />} label="Twitter" value={f.twitter} onChange={(v) => setF((p) => ({ ...p, twitter: v }))} />
          </div>
        </section>
      </main>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full h-12 px-4 rounded-lg bg-white text-black outline-none focus:ring-2 focus:ring-secondary" />
    </div>
  );
}

function SocialInput({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-semibold inline-flex items-center gap-2">{icon} {label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full h-12 px-4 rounded-lg bg-white text-black outline-none focus:ring-2 focus:ring-secondary" />
    </div>
  );
}
