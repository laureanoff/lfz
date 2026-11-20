import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { Realtime } from "./Realtime";

export const metadata: Metadata = { title: "LFZ · Panel", manifest: "/admin.webmanifest", appleWebApp: { capable: true, title: "LFZ Admin", statusBarStyle: "black-translucent" }, robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: ok } = await sb.rpc("is_admin");
  if (!ok) redirect("/admin/login");
  return (
    <div className="g-hero relative min-h-dvh">
      <div className="aurora aurora-fixed" aria-hidden><i className="blob b1" /><i className="blob b2" /><i className="blob b3" /></div>
      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-4">
        <Realtime />
        <header className="glass !rounded-2xl flex items-center justify-between px-4 py-2">
          <Logo href="/admin" small />
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" className="hidden text-xs text-mute hover:text-bone sm:block">Ver web</a>
            <form action={signOut}><button className="btn btn-line !px-3 !py-1.5 text-xs"><LogOut size={14} /> Salir</button></form>
          </div>
        </header>
        <AdminNav />
        {children}
      </div>
    </div>
  );
}
