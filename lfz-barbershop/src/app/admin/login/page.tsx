"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const { error: err } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) return setError("Email o contraseña incorrectos.");
    router.replace("/admin"); router.refresh();
  }
  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <Logo />
      <form onSubmit={go} className="mt-10 grid gap-3">
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <input className="input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <button className="btn btn-gold" disabled={busy}>{busy ? "ENTRANDO…" : "ENTRAR"}</button>
      </form>
    </main>
  );
}
