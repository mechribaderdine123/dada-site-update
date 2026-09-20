import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ExternalLink,
  ImagePlus,
  Link2,
  Music2,
  Palette,
  Save,
  Upload,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { signedMusicUrl } from "@/lib/music-url";
import { MusicManager } from "@/components/artist/MusicManager";

export const Route = createFileRoute("/artist/edit")({ component: EditProfilePage });
const colors = [
  { name: "Neon teal", value: "#00e5bf" },
  { name: "Magenta", value: "#ef007f" },
  { name: "Amber", value: "#ffb703" },
  { name: "Acid green", value: "#39ff14" },
  { name: "Crimson", value: "#ff3344" },
];

function EditProfilePage() {
  const { profile, refresh } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null),
    coverRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false),
    [avatar, setAvatar] = useState<string | null>(null),
    [cover, setCover] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [activePanel, setActivePanel] = useState<"profile" | "music">(() =>
    typeof window !== "undefined" && window.location.hash === "#music" ? "music" : "profile",
  );
  const [f, setF] = useState({
    artist_name: "",
    slug: "",
    genre: "",
    city: "",
    bio: "",
    phone: "",
    youtube: "",
    spotify: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    twitter: "",
    avatar_url: "",
    cover_url: "",
    accent_color: "#00e5bf",
  });
  const set = (key: keyof typeof f, value: string) => setF((old) => ({ ...old, [key]: value }));
  const showProfile = (section?: string) => {
    setActivePanel("profile");
    if (section)
      window.setTimeout(
        () => document.getElementById(section)?.scrollIntoView({ behavior: "smooth" }),
        0,
      );
  };
  useEffect(() => {
    if (!profile) return;
    setF({
      artist_name: profile.artist_name || "",
      slug: profile.slug || "",
      genre: profile.genre || "",
      city: profile.city || "",
      bio: profile.bio || "",
      phone: profile.phone || "",
      youtube: profile.youtube || "",
      spotify: profile.spotify || "",
      facebook: profile.facebook || "",
      instagram: profile.instagram || "",
      tiktok: profile.tiktok || "",
      twitter: profile.twitter || "",
      avatar_url: profile.avatar_url || "",
      cover_url: profile.cover_url || "",
      accent_color: profile.accent_color || "#00e5bf",
    });
    signedMusicUrl(profile.avatar_url).then(setAvatar);
    signedMusicUrl(profile.cover_url).then(setCover);
  }, [profile]);
  if (!profile) return null;
  const upload = async (file: File | undefined, kind: "avatar" | "cover") => {
    if (!file) return;
    try {
      const path =
        profile.id +
        "/" +
        kind +
        "-" +
        crypto.randomUUID() +
        "." +
        (file.name.split(".").pop() || "jpg");
      // Avatars and covers are stored in their own folders on the server.
      const { error } = await supabase.storage
        .from(kind === "avatar" ? "avatars" : "covers")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      set((kind + "_url") as keyof typeof f, path);
      const url = await signedMusicUrl(path);
      if (kind === "avatar") setAvatar(url);
      else setCover(url);
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : "Upload failed." });
    }
  };
  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        ...f,
        artist_name: f.artist_name.trim(),
        slug: f.slug.trim() || undefined,
        genre: f.genre || null,
        city: f.city || null,
        bio: f.bio || null,
        phone: f.phone || null,
        youtube: f.youtube || null,
        spotify: f.spotify || null,
        facebook: f.facebook || null,
        instagram: f.instagram || null,
        tiktok: f.tiktok || null,
        twitter: f.twitter || null,
        avatar_url: f.avatar_url || null,
        cover_url: f.cover_url || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) setNotice({ ok: false, text: error.message });
    else {
      setNotice({ ok: true, text: "Profile saved." });
      refresh();
    }
  };
  const complete = Math.min(
    100,
    [f.artist_name, f.genre, f.city, f.bio, f.avatar_url, f.cover_url].filter(Boolean).length * 16,
  );
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#e5e2e1]">
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/5 bg-[#111]/95 px-5 backdrop-blur md:px-8">
        <Link
          to="/artist"
          className="font-display text-2xl tracking-wide"
          style={{ color: f.accent_color }}
        >
          DADAHIPHOP
        </Link>
        <nav className="hidden gap-7 text-xs font-bold uppercase tracking-wider text-white/55 md:flex">
          <Link to="/dada-reseaux-artist">Artistes</Link>
          <button type="button" onClick={() => showProfile("visuals")}>
            Profile settings
          </button>
          <button type="button" onClick={() => setActivePanel("music")}>
            Music & clips
          </button>
        </nav>
        <div className="flex gap-2">
          <a
            href={"/artist/" + f.slug}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded bg-white/10 px-4 py-2 text-xs font-bold uppercase sm:inline-flex"
          >
            Public profile <ExternalLink className="w-3.5" />
          </a>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded px-4 py-2 text-xs font-bold uppercase text-[#00382d]"
            style={{ backgroundColor: f.accent_color }}
          >
            <Save className="w-3.5" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1400px] gap-5 px-5 py-6 lg:grid-cols-[215px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-lg bg-[#1c1c1c] p-3">
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Studio navigation
            </p>
            <button
              type="button"
              onClick={() => showProfile("visuals")}
              className="flex w-full items-center gap-2 rounded px-3 py-2.5 text-left text-sm font-bold text-[#00382d]"
              style={{ backgroundColor: f.accent_color }}
            >
              <ImagePlus className="w-4" />
              Info & media
            </button>
            <button
              type="button"
              onClick={() => showProfile("theme")}
              className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2.5 text-left text-sm font-bold text-white/65"
            >
              <Palette className="w-4" />
              Color & theme
            </button>
            <button
              type="button"
              onClick={() => showProfile("information")}
              className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2.5 text-left text-sm font-bold text-white/65"
            >
              <UserRound className="w-4" />
              Profile information
            </button>
            <button
              type="button"
              onClick={() => showProfile("socials")}
              className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2.5 text-left text-sm font-bold text-white/65"
            >
              <Link2 className="w-4" />
              Social links
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("music")}
              className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2.5 text-left text-sm font-bold text-white/65"
            >
              <Music2 className="w-4" />
              Music & clips
            </button>
          </div>
          <div className="mt-4 rounded-lg bg-[#1c1c1c] p-4">
            <p className="text-[10px] font-bold uppercase text-white/45">Public status</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded bg-[#333]">
                {avatar ? (
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="m-auto h-full text-white/35" />
                )}
              </div>
              <div>
                <p className="font-display text-lg uppercase">{f.artist_name || "Artist"}</p>
                <p className="text-xs text-white/50">{f.city || "Your city"}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-xs text-white/50">
              <span>Profile complete</span>
              <span style={{ color: f.accent_color }}>{complete}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-white/10">
              <div
                className="h-full rounded"
                style={{ width: complete + "%", backgroundColor: f.accent_color }}
              />
            </div>
          </div>
        </aside>
        <main className="min-w-0">
          <div className="mb-7">
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: f.accent_color }}
            >
              Artist studio · public profile
            </p>
            <h1 className="mt-1 font-display text-4xl uppercase tracking-wide md:text-5xl">
              Profile management
            </h1>
            <p className="mt-1 text-sm text-white/55">
              Customize your artist image, banner, color and public information.
            </p>
          </div>
          {notice && (
            <p
              className={
                "mb-5 rounded px-4 py-3 text-sm " +
                (notice.ok ? "bg-emerald-400/10 text-emerald-200" : "bg-red-400/10 text-red-200")
              }
            >
              {notice.text}
            </p>
          )}
          {activePanel === "music" ? (
            <MusicManager userId={profile.id} accent={f.accent_color} surface="#1c1c1c" />
          ) : (
            <>
              <section id="visuals" className="rounded-xl bg-[#1c1c1c] p-5 md:p-6">
                <Section icon={<ImagePlus />} title="Visuals & brand image" />
                <div className="mt-5">
                  <p className="mb-2 text-xs font-bold uppercase text-white/55">Cover image</p>
                  <button
                    onClick={() => coverRef.current?.click()}
                    className="relative block aspect-[16/6] w-full overflow-hidden rounded-lg bg-[#111]"
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt="Cover preview"
                        className="h-full w-full object-cover opacity-75"
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-white/45">
                        <span>
                          <Upload className="mx-auto mb-2" />
                          Add cover image
                        </span>
                      </span>
                    )}
                    <span
                      className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-[10px] font-bold uppercase"
                      style={{ color: f.accent_color }}
                    >
                      Live preview
                    </span>
                  </button>
                </div>
                <div className="mt-5 grid gap-5 rounded-lg bg-[#222] p-4 sm:grid-cols-[100px_1fr]">
                  <button
                    onClick={() => avatarRef.current?.click()}
                    className="aspect-square overflow-hidden rounded bg-[#111]"
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="m-auto h-full w-10 text-white/35" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-display text-xl uppercase">Profile avatar</h3>
                    <p className="mt-1 text-sm text-white/50">
                      Use a square JPG, PNG or WebP portrait for your public profile.
                    </p>
                    <button
                      onClick={() => avatarRef.current?.click()}
                      className="mt-3 rounded px-3 py-1.5 text-xs font-bold uppercase text-[#00382d]"
                      style={{ backgroundColor: f.accent_color }}
                    >
                      Change image
                    </button>
                  </div>
                </div>
                <input
                  ref={coverRef}
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => upload(e.target.files?.[0], "cover")}
                />
                <input
                  ref={avatarRef}
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => upload(e.target.files?.[0], "avatar")}
                />
              </section>
              <section id="theme" className="mt-6 rounded-xl bg-[#1c1c1c] p-5 md:p-6">
                <Section icon={<Palette />} title="Button color" />
                <p className="mt-2 text-sm text-white/55">
                  Choose the accent color used for your buttons and action details.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => set("accent_color", color.value)}
                      className="rounded-lg bg-[#222] p-3 text-left"
                    >
                      <span
                        className="grid h-9 w-9 place-items-center rounded-lg text-[#00382d]"
                        style={{ backgroundColor: color.value }}
                      >
                        {f.accent_color.toLowerCase() === color.value && <Check className="w-5" />}
                      </span>
                      <span className="mt-2 block text-[10px] font-bold uppercase">
                        {color.name}
                      </span>
                      <span className="block text-[10px] text-white/45">{color.value}</span>
                    </button>
                  ))}
                  <label className="rounded-lg bg-[#222] p-3 text-[10px] font-bold uppercase">
                    Accent
                    <input
                      type="color"
                      value={f.accent_color}
                      onChange={(e) => set("accent_color", e.target.value)}
                      className="mt-2 h-9 w-full rounded bg-transparent"
                    />
                  </label>
                </div>
              </section>
              <section id="information" className="mt-6 rounded-xl bg-[#1c1c1c] p-5 md:p-6">
                <Section icon={<UserRound />} title="General information & biography" />
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field
                    label="Artist / stage name"
                    value={f.artist_name}
                    onChange={(v) => set("artist_name", v)}
                  />
                  <Field
                    label="Main musical genre"
                    value={f.genre}
                    onChange={(v) => set("genre", v)}
                  />
                  <Field label="City" value={f.city} onChange={(v) => set("city", v)} />
                  <Field
                    label="Phone (booking / management)"
                    value={f.phone}
                    onChange={(v) => set("phone", v)}
                  />
                  <Field
                    label="Public profile link"
                    prefix="dadahiphop.com/artist/"
                    value={f.slug}
                    onChange={(v) => set("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  />
                </div>
                <label className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-white/60">
                  Artist biography
                  <textarea
                    rows={6}
                    maxLength={500}
                    value={f.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    className="mt-2 w-full rounded bg-[#222] p-3 text-sm font-normal normal-case tracking-normal text-white outline-none"
                  />
                </label>
                <p className="mt-1 text-right text-[10px] text-white/35">
                  {f.bio.length} / 500 characters
                </p>
              </section>
              <section id="socials" className="mt-6 rounded-xl bg-[#1c1c1c] p-5 md:p-6">
                <Section icon={<Link2 />} title="Social links & streaming" />
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="YouTube" value={f.youtube} onChange={(v) => set("youtube", v)} />
                  <Field label="Spotify" value={f.spotify} onChange={(v) => set("spotify", v)} />
                  <Field
                    label="Instagram"
                    value={f.instagram}
                    onChange={(v) => set("instagram", v)}
                  />
                  <Field label="TikTok" value={f.tiktok} onChange={(v) => set("tiktok", v)} />
                  <Field label="Facebook" value={f.facebook} onChange={(v) => set("facebook", v)} />
                  <Field
                    label="X / Twitter"
                    value={f.twitter}
                    onChange={(v) => set("twitter", v)}
                  />
                </div>
              </section>
              <div className="sticky bottom-4 z-20 mt-6 flex flex-col gap-3 rounded-lg border border-white/10 bg-[#252525]/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/50">Your profile changes are ready to save.</p>
                <div className="flex gap-2">
                  <Link
                    to="/artist"
                    className="rounded bg-white/10 px-4 py-2 text-xs font-bold uppercase"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded px-4 py-2 text-xs font-bold uppercase text-[#00382d]"
                    style={{ backgroundColor: f.accent_color }}
                  >
                    <Save className="w-4" />
                    {saving ? "Saving…" : "Save profile"}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
function Section({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: "var(--artist-accent)" }}>
      {icon}
      <h2 className="font-display text-2xl uppercase tracking-wide text-[#e5e2e1]">{title}</h2>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
}) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60">
      {label}
      {prefix && (
        <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-white/35">
          {prefix}
        </span>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded bg-[#222] px-3 text-sm font-normal normal-case tracking-normal text-white outline-none"
      />
    </label>
  );
}
