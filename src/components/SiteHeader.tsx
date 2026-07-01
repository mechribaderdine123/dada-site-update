import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/dada-logo.png.asset.json";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/a-propos", label: "À propos" },
  { to: "/cours-activites", label: "Cours & Activités" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute top-0 inset-x-0 z-40 pt-4 px-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between gap-4 rounded-full bg-background/85 backdrop-blur-md border border-border/60 pl-3 pr-3 py-2 shadow-xl">
        <Link to="/" className="flex items-center">
          <img src={logo.url} alt="Dada Hip Hop Academy" className="h-12 w-auto" />
        </Link>

        <ul className="hidden lg:flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
          {NAV.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`px-4 py-2 rounded-full transition-colors ${
                  pathname === l.to ? "text-primary" : "text-foreground/85 hover:text-primary"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/dada-reseaux-artist"
              className="px-4 py-2 rounded-full text-secondary hover:text-secondary/80 transition"
            >
              Studio Musique
            </Link>
          </li>
        </ul>

        <Link
          to="/sign-in"
          className="hidden md:inline-flex items-center rounded-full border-2 border-primary text-primary px-5 py-2 text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition"
        >
          Dada Réseaux Artiste
        </Link>

        <button
          className="lg:hidden text-foreground p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden mt-2 mx-2 rounded-2xl bg-background/95 backdrop-blur border border-border shadow-xl">
          <ul className="flex flex-col p-3 gap-1">
            {NAV.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-muted"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/sign-in"
                onClick={() => setOpen(false)}
                className="block mt-2 text-center rounded-lg bg-primary text-primary-foreground px-4 py-2 font-bold uppercase tracking-widest text-sm"
              >
                Dada Réseaux Artiste
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
