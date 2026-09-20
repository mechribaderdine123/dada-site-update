import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function ArtistSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const { profile, signOut } = useAuth();
  const isProfil = pathname === "/artist/edit";
  const isMusic =
    pathname === "/artist/edit" &&
    typeof window !== "undefined" &&
    window.location.hash === "#music";

  const base = "text-left px-4 py-2 rounded-lg font-semibold text-sm transition block text-white";
  const active = "bg-secondary text-secondary-foreground";
  const inactive = "hover:bg-white/10";

  return (
    <aside className="w-full md:w-64 shrink-0 bg-[#2d2d2d] p-4 md:p-6 flex flex-row md:flex-col items-center md:items-stretch gap-2 border-b md:border-b-0 md:border-r border-white/10 md:min-h-screen">
      <Link
        to="/artist"
        className="font-bold text-lg md:mb-8 hover:text-secondary transition text-white truncate mr-auto md:mr-0"
      >
        {profile?.artist_name || "Mon profil"}
      </Link>
      <Link to="/artist/edit" className={`${base} ${isProfil ? active : inactive}`}>
        Profil
      </Link>
      <Link to="/artist/edit" hash="music" className={`${base} ${isMusic ? active : inactive}`}>
        Music & clips
      </Link>
      <button
        onClick={async () => {
          await signOut();
          nav({ to: "/" });
        }}
        className="md:mt-4 flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-bold text-sm bg-white/10 border border-white/10 hover:bg-white/20 transition text-white"
      >
        <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Logout</span>
      </button>
    </aside>
  );
}
