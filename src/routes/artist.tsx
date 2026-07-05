import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/artist")({
  component: ArtistGate,
});

function ArtistGate() {
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loading, session } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      nav({ to: "/sign-in", replace: true });
    }
  }, [loading, session, nav]);

  if (loading) {
    return <div className="min-h-screen bg-[#393939] text-white grid place-items-center">Chargement…</div>;
  }
  if (!session) return null;

  return <Outlet key={pathname} />;
}
