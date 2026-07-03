import { createFileRoute, Outlet, useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/artist")({
  component: ArtistGate,
});

function ArtistGate() {
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loading, session, profile, isAdmin } = useAuth();

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

  // Admins bypass approval gate
  if (!isAdmin && profile && profile.status !== "approved") {
    return <PendingScreen status={profile.status} />;
  }

  // If a signed-in admin lands on /artist, keep them here (they can still browse)
  return <Outlet key={pathname} />;
}

function PendingScreen({ status }: { status: "pending" | "rejected" }) {
  const { signOut } = useAuth();
  const nav = useNavigate();
  const isPending = status === "pending";
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white grid place-items-center px-4">
      <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-8 text-center">
        {isPending ? (
          <Clock className="w-14 h-14 mx-auto text-secondary" />
        ) : (
          <XCircle className="w-14 h-14 mx-auto text-red-400" />
        )}
        <h1 className="mt-4 font-display text-3xl md:text-4xl tracking-wide">
          {isPending ? "Compte en attente de validation" : "Compte refusé"}
        </h1>
        <p className="mt-3 text-white/80">
          {isPending
            ? "Votre inscription a bien été reçue. Un administrateur doit valider votre compte avant que vous puissiez accéder à votre espace artiste."
            : "Votre compte n'a pas été approuvé par l'administrateur. Contactez-nous pour plus d'informations."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="rounded-lg bg-white/10 border border-white/15 hover:bg-white/20 px-4 py-2.5 text-sm font-semibold">
            Retour au site
          </Link>
          <button
            onClick={async () => { await signOut(); nav({ to: "/" }); }}
            className="rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 px-4 py-2.5 text-sm font-semibold"
          >
            Se déconnecter
          </button>
        </div>
        <p className="mt-6 text-xs text-white/50 inline-flex items-center gap-1 justify-center">
          <CheckCircle2 className="w-3.5 h-3.5" /> Vous recevrez l'accès dès la validation.
        </p>
      </div>
    </div>
  );
}
