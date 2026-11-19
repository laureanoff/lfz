import Link from "next/link";
import { Logo } from "@/components/Logo";
import { TurnoCard, type Turno } from "@/components/TurnoCard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function MiTurno({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc("get_my_appointment", { p_code: codigo });
  const t = (data as Turno[] | null)?.[0];
  return (
    <main className="mx-auto max-w-xl px-5 py-6">
      <Logo small />
      <h1 className="mt-8 font-display text-4xl font-black uppercase">Tu turno</h1>
      <div className="mt-6">{t ? <TurnoCard t={t} /> : <p className="rounded-xl border border-line bg-coal p-5 text-mute">No encontramos un turno con ese código. Revisá el link.</p>}</div>
      <Link href="/reservar" className="btn btn-gold mt-8">Reservar otro turno</Link>
    </main>
  );
}
