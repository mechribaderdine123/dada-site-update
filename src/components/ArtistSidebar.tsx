import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function ArtistSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const { profile, signOut } = useAuth();
  const isProfil = pathname === "/artist/edit";
  const isMusic = pathname === "/artist/music";

  const base = "text-left px-4 py-2 rounded-lg font-semibold text-sm transition block text-white";
  const active = "bg-secondary text-secondary-foreground";
  const inactive = "hover:bg-white/10";

  return (
    <aside className="w-64 shrink-0 bg-[#2d2d2d] p-6 flex flex-col gap-2 border-r border-white/10 min-h-screen">
      <Link to="/artist" className="font-bold text-lg mb-8 hover:text-secondary transition text-white truncate">
        {profile?.artist_name || "Mon profil"}
      </Link>
      <Link to="/artist/edit" className={`${base} ${isProfil ? active : inactive}`}>Profil</Link>
      <Link to="/artist/music" className={`${base} ${isMusic ? active : inactive}`}>Music</Link>
      <button
        onClick={async () => { await signOut(); nav({ to: "/" }); }}
        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-white/10 border border-white/10 hover:bg-white/20 transition text-white"
      >
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </aside>
  );
}
