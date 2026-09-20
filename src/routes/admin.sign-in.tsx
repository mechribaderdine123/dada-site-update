import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import adminBg from "@/assets/auth-boombox.jpg";
import logo from "@/assets/dada-logo.png";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/sign-in")({
  head: () => ({
    meta: [
      { title: "Admin — Dada Hip Hop Academy" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminSignIn,
});

function AdminSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err || !data.user) {
      setLoading(false);
      setError("E-mail ou mot de passe incorrect.");
      return;
    }
    // Verify admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin");
    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Ce compte n'est pas administrateur.");
      return;
    }
    setLoading(false);
    navigate({ to: "/admin" });
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full">
      <img src={adminBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 min-h-screen w-full grid place-items-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-black/40 backdrop-blur-md p-8 md:p-10 shadow-2xl">
          <div className="flex justify-center">
            <img src={logo} alt="Dada Hip Hop Academy" className="h-20 w-auto" fetchPriority="high" />
          </div>
          <h1 className="mt-6 text-center font-display tracking-wide text-4xl text-white">Admin</h1>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@…"
                className="w-full rounded-xl bg-white text-black px-4 py-3 outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="************"
                className="w-full rounded-xl bg-white text-black px-4 py-3 outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-secondary hover:opacity-90 disabled:opacity-60 transition text-secondary-foreground font-semibold py-4 text-lg"
            >
              {loading ? "Connexion…" : "Connexion"}
            </button>

            <p className="text-center text-xs text-white/60">
              <Link to="/" className="hover:text-white">← Retour au site</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
