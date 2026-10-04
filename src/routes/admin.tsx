import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LogOut,
  Home as HomeIcon,
  Menu,
  Users,
  Music as MusicIcon,
  FileText,
  Award,
  Dumbbell,
  Image as ImageIcon,
} from "lucide-react";
import logo from "@/assets/dada-logo.png";
import { PAGE_SCHEMAS } from "@/lib/content-schema";
import { useAuth } from "@/lib/auth";
import { SideDrawer } from "@/components/SideDrawer";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Dada Hip Hop Academy" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loading, session, isAdmin, signOut } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/sign-in") return;
    if (loading) return;
    if (!session || !isAdmin) {
      navigate({ to: "/admin/sign-in", replace: true });
    }
  }, [pathname, loading, session, isAdmin, navigate]);

  if (pathname === "/admin/sign-in") return <Outlet />;
  if (loading || !session || !isAdmin) return null;

  const activeId =
    pathname === "/admin"
      ? "home"
      : pathname === "/admin/accounts"
        ? "__accounts"
        : pathname === "/admin/tracks"
          ? "__tracks"
          : pathname === "/admin/sponsors"
            ? "__sponsors"
            : pathname === "/admin/gym"
              ? "__gym"
              : pathname === "/admin/posts"
                ? "__posts"
                : pathname.replace("/admin/", "");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Ouvrir le menu"
              title="Menu"
              className="-ml-2 grid h-10 w-10 place-items-center rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground md:hidden"
            >
              <Menu className="w-5" />
            </button>
            <img src={logo} alt="" className="h-9 w-auto" />
            <span className="font-display tracking-wide text-xl">
              ADMIN <span className="text-primary">DASHBOARD</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <HomeIcon className="w-4 h-4" /> Voir le site
            </Link>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/admin/sign-in", replace: true });
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm hover:opacity-90"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <SideDrawer
          open={navOpen}
          onClose={() => setNavOpen(false)}
          label="Menu du dashboard"
          bp="md"
          className="md:sticky md:top-24 md:h-fit"
          panelClassName="bg-card"
        >
          <div>
            <p className="px-3 pt-2 pb-2 text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Modération
            </p>
            <nav className="flex flex-col">
              <Link
                to="/admin/accounts"
                className={`px-3 py-2 rounded-lg text-sm inline-flex items-center gap-2 ${
                  activeId === "__accounts"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Users className="w-4 h-4" /> Comptes artistes
              </Link>
              <Link
                to="/admin/tracks"
                className={`px-3 py-2 rounded-lg text-sm inline-flex items-center gap-2 ${
                  activeId === "__tracks" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <MusicIcon className="w-4 h-4" /> Musiques
              </Link>
              <Link
                to="/admin/sponsors"
                className={`px-3 py-2 rounded-lg text-sm inline-flex items-center gap-2 ${
                  activeId === "__sponsors"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Award className="w-4 h-4" /> Sponsors
              </Link>
              <Link
                to="/admin/gym"
                className={`px-3 py-2 rounded-lg text-sm inline-flex items-center gap-2 ${
                  activeId === "__gym" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <Dumbbell className="w-4 h-4" /> Salle de sport
              </Link>
              <Link
                to="/admin/posts"
                className={`px-3 py-2 rounded-lg text-sm inline-flex items-center gap-2 ${
                  activeId === "__posts" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Posts & images
              </Link>
            </nav>
          </div>

          <div>
            <p className="px-3 pt-2 pb-2 text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Contenu des pages
            </p>
            <nav className="flex flex-col">
              {PAGE_SCHEMAS.map((p) => {
                const to = p.id === "home" ? "/admin" : `/admin/${p.id}`;
                const active = activeId === p.id;
                return (
                  <Link
                    key={p.id}
                    to={to}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {p.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </SideDrawer>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
