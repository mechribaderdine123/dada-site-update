import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

export function ArtistSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isProfil = pathname === "/artist/edit";
  const isMusic = pathname === "/artist/music";

  const base = "text-left px-4 py-2 rounded-lg font-semibold text-sm transition block";
  const active = "bg-secondary text-secondary-foreground";
  const inactive = "hover:bg-muted";

  return (
    <aside className="w-64 shrink-0 bg-muted/40 p-6 flex flex-col gap-2 border-r border-border/50 min-h-screen">
      <Link to="/artist" className="font-bold text-lg mb-8 hover:text-secondary transition">
        artist name
      </Link>
      <Link to="/artist/edit" className={`${base} ${isProfil ? active : inactive}`}>
        Profil
      </Link>
      <Link to="/artist/music" className={`${base} ${isMusic ? active : inactive}`}>
        Music
      </Link>
      <Link
        to="/"
        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-background border border-border hover:bg-muted transition"
      >
        <LogOut className="w-4 h-4" /> Logout
      </Link>
    </aside>
  );
}
