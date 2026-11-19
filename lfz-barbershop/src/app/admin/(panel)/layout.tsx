import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { Realtime } from "./Realtime";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: ok } = await sb.rpc("is_admin");
  if (!ok) redirect("/admin/login");
  return (
    <div className="mx-auto max-w-3xl px-5 py-5">
      <Realtime />
      <header className="flex items-center justify-between"><Logo href="/admin" small />
        <form action={signOut}><button className="text-sm text-mute hover:text-bone">Salir</button></form></header>
      {children}
    </div>
  );
}
