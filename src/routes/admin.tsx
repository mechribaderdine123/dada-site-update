import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Home as HomeIcon } from "lucide-react";
import logo from "@/assets/dada-logo.png.asset.json";
import { adminLogout, isAdmin } from "@/lib/site-content";
import { PAGE_SCHEMAS } from "@/lib/content-schema";

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/sign-in") {
      setReady(true);
      return;
    }
    if (!isAdmin()) {
      navigate({ to: "/admin/sign-in", replace: true });
    } else {
      setReady(true);
    }
  }, [pathname, navigate]);

  if (pathname === "/admin/sign-in") {
    return <Outlet />;
  }
  if (!ready) return null;

  const activeId = pathname === "/admin" ? "home" : pathname.replace("/admin/", "");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo.url} alt="" className="h-9 w-auto" />
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
              onClick={() => {
                adminLogout();
                navigate({ to: "/admin/sign-in", replace: true });
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm hover:opacity-90"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-border bg-card p-3 h-fit md:sticky md:top-24">
          <p className="px-3 pt-2 pb-3 text-xs uppercase tracking-wider text-muted-foreground">Pages</p>
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
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
