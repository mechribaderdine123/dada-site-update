import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, User as UserIcon, Clock, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import heroAsset from "@/assets/dada-hero-new.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { signedMusicUrl } from "@/lib/music-url";
import { useAuth } from "@/lib/auth";
import { useContent } from "@/lib/site-content";
import { deleteArtistAccount } from "@/lib/api/admin-users.functions";

export const Route = createFileRoute("/dada-reseaux-artist")({
  head: () => ({
    meta: [
      { title: "Dada Réseaux Artist — Dada Hip Hop Academy" },
      { name: "description", content: "Espace dédié aux artistes de Dada Hip Hop Academy. Découvrez, partagez et mettez en lumière votre talent." },
    ],
  }),
  component: DadaReseauxArtistPage,
});

type PublicArtist = {
  id: string;
  artist_name: string;
  genre: string | null;
  city: string | null;
  avatar_url: string | null;
};

function DadaReseauxArtistPage() {
  const [search, setSearch] = useState("");
  const [artists, setArtists] = useState<PublicArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: authLoading } = useAuth();
  const canManage = !authLoading && isAdmin;
  const [busy, setBusy] = useState<string | null>(null);
  const removeUser = useServerFn(deleteArtistAccount);

  const heroImage = useContent("reseaux.hero.image", heroAsset.url);
  const heroTitle = useContent("reseaux.hero.title", "DADA RESEAUX ARTIST");
  const heroSubtitle = useContent("reseaux.hero.subtitle", "Un espace conçu pour vous mettre en lumière");
  const cta1 = useContent("reseaux.hero.cta1", "Se connecter");
  const cta2 = useContent("reseaux.hero.cta2", "Créer un compte");
  const secTitle1 = useContent("reseaux.section.title1", "DECOUVRIR");
  const secTitle2 = useContent("reseaux.section.title2", "NOS ARTISTES");
  const searchPh = useContent("reseaux.search.placeholder", "Rechercher un artiste");

  const loadArtists = async () => {
    const { data } = await supabase
      .from("public_profiles")
      .select("id, artist_name, genre, city, avatar_url")
      .order("created_at", { ascending: false });
    const list = (data as PublicArtist[]) ?? [];
    const resolved = await Promise.all(
      list.map(async (a) => ({ ...a, avatar_url: await signedMusicUrl(a.avatar_url) })),
    );
    setArtists(resolved);
    setLoading(false);
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const onUnpublish = async (a: PublicArtist) => {
    if (!confirm(`Retirer ${a.artist_name} de la vitrine (remettre en attente) ?`)) return;
    setBusy(a.id);
    await supabase.from("profiles").update({ status: "pending" }).eq("id", a.id);
    setArtists((prev) => prev.filter((x) => x.id !== a.id));
    setBusy(null);
  };

  const onDelete = async (a: PublicArtist) => {
    if (!confirm(`Supprimer définitivement le compte de ${a.artist_name} ? Cette action est irréversible.`)) return;
    setBusy(a.id);
    try {
      await removeUser({ data: { userId: a.id } });
      setArtists((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e) {
      alert(`Erreur: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const q = search.toLowerCase();
  const filtered = artists.filter(
    (a) =>
      a.artist_name.toLowerCase().includes(q) ||
      (a.genre ?? "").toLowerCase().includes(q) ||
      (a.city ?? "").toLowerCase().includes(q),
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <section className="relative h-[75vh] min-h-[520px] w-full overflow-hidden">
        <img src={heroImage} alt="Danseurs Dada Hip Hop Academy" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#1a1a1a]" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 pt-24">
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-wide text-white drop-shadow-2xl">
            {heroTitle}
          </h1>
          <p className="mt-6 text-lg md:text-2xl font-medium text-white/90 max-w-2xl">
            {heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/sign-in" className="rounded-md bg-primary text-primary-foreground px-8 py-3 text-sm font-semibold hover:opacity-90 transition">
              {cta1}
            </Link>
            <Link to="/sign-up" className="rounded-md bg-white/10 border border-white/20 text-white px-8 py-3 text-sm font-semibold hover:bg-white/20 transition">
              {cta2}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center font-display text-4xl md:text-6xl tracking-wide">
            {secTitle1} <span className="text-primary">{secTitle2}</span>
          </h2>

          <div className="mt-10 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPh}
                className="w-full h-14 pl-12 pr-4 rounded-full bg-transparent border border-white/30 text-white placeholder:text-white/50 outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {loading ? (
            <p className="mt-16 text-center text-white/70">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="mt-16 text-center text-white/70">
              {artists.length === 0 ? "Aucun artiste approuvé pour le moment." : "Aucun résultat."}
            </p>
          ) : (
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {filtered.map((a) => (
                <div key={a.id} className="group block text-left relative">
                  <Link to="/artists/$id" params={{ id: a.id }} state={isAdmin ? ({ backTo: "/dada-reseaux-artist" } as any) : undefined} className="block">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 grid place-items-center">
                      {a.avatar_url ? (
                        <img src={a.avatar_url} alt={a.artist_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <UserIcon className="w-12 h-12 text-white/40" />
                      )}
                    </div>
                    <p className="mt-3 font-bold group-hover:text-primary transition-colors">{a.artist_name}</p>
                    <p className="text-sm text-white/60">{a.genre || "—"}{a.city ? ` · ${a.city}` : ""}</p>
                  </Link>
                  {isAdmin && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy === a.id}
                        onClick={() => onUnpublish(a)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/10 border border-white/20 text-xs font-semibold hover:bg-white/20 disabled:opacity-60"
                        title="Retirer de la vitrine"
                      >
                        <Clock className="w-3.5 h-3.5" /> Retirer
                      </button>
                      <button
                        type="button"
                        disabled={busy === a.id}
                        onClick={() => onDelete(a)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
