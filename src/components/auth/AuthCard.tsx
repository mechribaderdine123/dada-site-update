import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import bg from "@/assets/dada-auth.jpg";
import logo from "@/assets/dada-logo.png";

// The dark full-bleed card that every authentication screen shares, so the
// confirmation and password pages look like the sign-in and sign-up ones.

export function AuthCard({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 text-white">
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative w-full max-w-lg rounded-2xl bg-black/55 backdrop-blur-xl border border-white/10 shadow-2xl p-8 md:p-10">
        <div className="flex justify-center">
          <img src={logo} alt="Dada Hip Hop Academy" className="h-16 w-auto" fetchPriority="high" />
        </div>
        <h1 className="mt-4 text-center font-display text-3xl md:text-4xl tracking-wide">
          {title}
        </h1>
        {intro && <p className="mt-3 text-center text-sm text-white/80 leading-relaxed">{intro}</p>}
        {children}
        {footer && <div className="mt-6 text-center text-sm text-white/80">{footer}</div>}
      </div>
    </div>
  );
}

/** Inline message used for errors and confirmations inside an AuthCard. */
export function AuthNotice({
  tone,
  children,
}: {
  tone: "error" | "info" | "success";
  children: ReactNode;
}) {
  const tones = {
    error: "bg-red-900/40 border-red-400/30 text-red-100",
    info: "bg-white/10 border-white/20 text-white",
    success: "bg-emerald-900/40 border-emerald-400/30 text-emerald-100",
  } as const;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`mt-4 text-sm border rounded-lg px-3 py-2 ${tones[tone]}`}
    >
      {children}
    </p>
  );
}

export function AuthInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full h-12 px-4 rounded-lg bg-white text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-secondary"
      />
    </div>
  );
}

export function BackToSignIn() {
  return (
    <Link to="/sign-in" className="text-secondary font-semibold hover:underline">
      Retour à la connexion
    </Link>
  );
}
