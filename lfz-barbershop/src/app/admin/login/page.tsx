"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

// Supabase Auth necesita un email: el usuario "lfz" se convierte en lfz@lfzbarbershop.app (no se envían mails).
const DOMAIN = "lfzbarbershop.app";
const toEmail = (u: string) => (u.includes("@") ? u.trim().toLowerCase() : `${u.trim().toLowerCase()}@${DOMAIN}`);

export default function Login() {
  const router = useRouter();
  const [user, setUser] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const { error: err } = await createClient().auth.signInWithPassword({ email: toEmail(user), password });
    setBusy(false);
    if (err) {
      return setError(err.message.toLowerCase().includes("invalid login credentials")
        ? "Usuario o contraseña incorrectos."
        : `No se pudo iniciar sesión: ${err.message}`);
    }
    router.replace("/admin"); router.refresh();
  }
  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <Logo />
      <form onSubmit={go} className="mt-10 grid gap-3">
        <input className="input" placeholder="Usuario" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" required />
        <input className="input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "ENTRANDO…" : "ENTRAR"}</button>
      </form>
    </main>
  );
}
