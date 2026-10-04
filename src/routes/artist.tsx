import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/artist")({
  component: ArtistGate,
});

/** Dashboard routes stay behind sign-in. Public share URLs are /artist/:slug and /artist/:slug/music. */
const DASHBOARD_SEGMENTS = new Set(["", "edit", "music", "my-music"]);

function isArtistDashboard(pathname: string) {
  const first =
    pathname
      .replace(/^\/artist\/?/, "")
      .split("/")
      .filter(Boolean)[0] ?? "";
  return DASHBOARD_SEGMENTS.has(first);
}

function PrivateAccountNotice() {
  const { profile } = useAuth();
  if (!profile || profile.status === "approved") return null;
  return (
    <div className="bg-secondary/10 border border-secondary/30 text-secondary-foreground rounded-xl px-4 py-3 text-sm max-w-6xl mx-auto mt-4 mb-2">
      <p className="font-semibold">Votre compte est actuellement privé.</p>
      <p className="opacity-90 mt-1">
        Vous pouvez gérer votre profil et votre musique, mais seuls vous et l'administrateur pouvez
        le voir pour l'instant. Il deviendra public après validation par l'administrateur.
      </p>
    </div>
  );
}

function ArtistGate() {
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loading, session } = useAuth();
  const dashboard = isArtistDashboard(pathname);

  useEffect(() => {
    if (!dashboard || loading) return;
    if (!session) {
      nav({ to: "/sign-in", replace: true });
    }
  }, [dashboard, loading, session, nav]);

  if (!dashboard) {
    return <Outlet key={pathname} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#393939] text-white grid place-items-center">
        Chargement…
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="bg-[#393939]">
      <PrivateAccountNotice />
      <Outlet key={pathname} />
    </div>
  );
}
