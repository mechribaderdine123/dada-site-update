import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/a-propos", label: "À propos" },
  { to: "/cours-activites", label: "Cours & Activités" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";

  return (
    <header
      className={`${isHome ? "absolute" : "sticky"} top-0 inset-x-0 z-40 ${
        isHome ? "bg-transparent" : "bg-background/85 backdrop-blur border-b border-border/60"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display tracking-widest text-xl">
          <span className="w-8 h-8 grid place-items-center rounded-md bg-primary text-primary-foreground font-black">D</span>
          DADA HIP HOP
        </Link>

        <ul className="hidden md:flex items-center gap-8 text-sm font-medium">
          {NAV.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`transition-colors hover:text-primary ${
                  pathname === l.to ? "text-primary" : "text-foreground/85"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/sign-in"
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 transition"
          >
            Se connecter
          </Link>
        </div>

        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur border-t border-border">
          <ul className="flex flex-col p-4 gap-1">
            {NAV.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-md hover:bg-muted"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/sign-in"
                onClick={() => setOpen(false)}
                className="block mt-2 text-center rounded-md bg-primary text-primary-foreground px-4 py-2 font-bold"
              >
                Se connecter
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
