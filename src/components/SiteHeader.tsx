import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import logo from "@/assets/dada-logo.png";

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [aproposOpen, setAproposOpen] = useState(false);

  const isApropos = pathname === "/a-propos" || pathname === "/contact";

  const linkBase =
    "px-4 py-2 rounded-full font-display tracking-widest text-base transition-colors";
  const linkPlain = "text-foreground hover:text-primary";
  const activePill = "border border-primary text-primary";

  return (
    <header className="absolute top-0 inset-x-0 z-40 pt-4 px-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between gap-4 rounded-full bg-background/90 backdrop-blur-md border border-border/60 pl-4 pr-3 py-2 shadow-xl">
        <Link to="/" className="flex items-center shrink-0">
          <img src={logo} alt="Dada Hip Hop Academy" className="h-12 w-auto" fetchPriority="high" />
        </Link>

        <ul className="hidden lg:flex items-center gap-2">
          <li>
            <Link to="/" className={`${linkBase} ${pathname === "/" ? activePill : linkPlain}`}>
              Accueil
            </Link>
          </li>

          <li
            className="relative"
            onMouseEnter={() => setAproposOpen(true)}
            onMouseLeave={() => setAproposOpen(false)}
          >
            <button
              className={`${linkBase} inline-flex items-center gap-1 ${
                isApropos ? activePill : linkPlain
              }`}
            >
              À propos
              <ChevronDown className="w-4 h-4" />
            </button>
            {aproposOpen && (
              <div className="absolute left-0 top-full pt-2 min-w-[220px]">
                <div className="rounded-2xl bg-background border border-border shadow-xl p-2">
                  <Link
                    to="/a-propos"
                    className="block px-4 py-2 rounded-lg font-display tracking-widest text-sm hover:bg-muted"
                  >
                    Qui sommes-nous
                  </Link>
                  <Link
                    to="/contact"
                    className="block px-4 py-2 rounded-lg font-display tracking-widest text-sm hover:bg-muted"
                  >
                    Contact
                  </Link>
                </div>
              </div>
            )}
          </li>

          <li>
            <Link
              to="/cours-activites"
              className={`${linkBase} ${pathname === "/cours-activites" ? activePill : linkPlain}`}
            >
              Cours & Activités
            </Link>
          </li>

          <li>
            <Link
              to="/studio-musique"
              className={`${linkBase} ${pathname === "/studio-musique" ? activePill : linkPlain}`}
            >
              Studio Musique
            </Link>
          </li>

          <li>
            <Link
              to="/workshops"
              className={`${linkBase} ${pathname === "/workshops" ? activePill : linkPlain}`}
            >
              Workshops & Événements
            </Link>
          </li>
        </ul>

        <Link
          to="/dada-reseaux-artist"
          className="hidden md:inline-flex items-center rounded-full border-2 border-primary text-primary px-5 py-2 font-display tracking-widest text-base hover:bg-primary hover:text-primary-foreground transition"
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
          <ul className="flex flex-col p-3 gap-1 font-display tracking-widest">
            <li>
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-muted"
              >
                Accueil
              </Link>
            </li>
            <li>
              <Link
                to="/a-propos"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-muted"
              >
                Qui sommes-nous
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-muted"
              >
                Contact
              </Link>
            </li>
            <li>
              <Link
                to="/cours-activites"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-muted"
              >
                Cours & Activités
              </Link>
            </li>
            <li>
              <Link
                to="/studio-musique"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-muted"
              >
                Studio Musique
              </Link>
            </li>
            <li>
              <Link
                to="/workshops"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-muted"
              >
                Workshops & Événements
              </Link>
            </li>
            <li>
              <Link
                to="/dada-reseaux-artist"
                onClick={() => setOpen(false)}
                className="block mt-2 text-center rounded-lg border-2 border-primary text-primary px-4 py-2"
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
