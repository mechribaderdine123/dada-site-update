import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Upload, Mail, Phone, Youtube, Facebook, Instagram, Music2 } from "lucide-react";
import { ArtistSidebar } from "@/components/ArtistSidebar";

export const Route = createFileRoute("/artist/edit")({
  head: () => ({
    meta: [{ title: "Profil Management — Dada Réseaux Artist" }],
  }),
  component: EditProfilePage,
});

function EditProfilePage() {
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <ArtistSidebar />


      {/* Content */}
      <main className="flex-1 p-8 md:p-12 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-secondary">Profil management</h1>
            <p className="mt-2 text-foreground/80">Update Your biography profile picture and contact information</p>
          </div>
          <button className="rounded-lg bg-muted hover:bg-muted/70 px-5 py-2.5 text-sm font-semibold border border-border transition">
            Save changes
          </button>
        </div>

        {/* Profile image */}
        <section className="mt-8 bg-muted/30 rounded-2xl p-6 border border-border/50">
          <h2 className="text-xl font-bold">Profile and header image</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload your image to personalize your profile</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-5 w-full h-56 rounded-xl border-2 border-dashed border-border/70 hover:border-secondary transition flex flex-col items-center justify-center bg-background/50 overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full border-2 border-foreground/70 flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground mt-1">PNG, JPG max (800, 400 px)</p>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </section>

        {/* Biography */}
        <section className="mt-6 bg-muted/30 rounded-2xl p-6 border border-border/50">
          <h2 className="text-xl font-bold">Biography</h2>
          <textarea
            placeholder="Tell your story...."
            rows={8}
            className="mt-4 w-full rounded-xl border-2 border-dashed border-border/70 bg-background/50 p-4 outline-none focus:border-secondary transition resize-none"
          />
        </section>

        {/* Socials */}
        <section className="mt-6 bg-muted/30 rounded-2xl p-6 border border-border/50">
          <h2 className="text-xl font-bold">Social media links</h2>
          <p className="text-sm text-muted-foreground mt-1">Add links to your social media profiles to connect with your fans</p>
          <div className="mt-5 grid md:grid-cols-2 gap-5">
            <SocialInput icon={<Youtube className="w-4 h-4 text-primary" />} label="YouTube" />
            <SocialInput icon={<Facebook className="w-4 h-4 text-secondary" />} label="Facebook" />
            <SocialInput icon={<Music2 className="w-4 h-4 text-green-500" />} label="Spotify" />
            <SocialInput icon={<span>🎵</span>} label="Tiktok" />
            <SocialInput icon={<Instagram className="w-4 h-4 text-primary" />} label="Instagram" />
          </div>
        </section>

        {/* Contact */}
        <section className="mt-6 bg-muted/30 rounded-2xl p-6 border border-border/50 mb-12">
          <h2 className="text-xl font-bold">Contact Information</h2>
          <p className="text-sm text-muted-foreground mt-1">Provide contact details for booking and inquiries</p>
          <div className="mt-5 grid md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Mail className="w-4 h-4 text-primary" /> Management Email
              </label>
              <input
                type="email"
                placeholder="gmail.com"
                className="w-full rounded-lg bg-background/70 border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary transition"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Phone className="w-4 h-4 text-secondary" /> Phone
              </label>
              <input
                type="tel"
                placeholder="22 222 222"
                className="w-full rounded-lg bg-background/70 border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary transition"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SocialInput({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold mb-2">
        {icon} {label}
      </label>
      <input
        type="url"
        placeholder="https://www.youtube.com/@your artist"
        className="w-full rounded-lg bg-background/70 border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary transition"
      />
    </div>
  );
}
