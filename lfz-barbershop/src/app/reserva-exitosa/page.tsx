import Link from "next/link";
import { Logo } from "@/components/Logo";
import { TurnoCard, type Turno } from "@/components/TurnoCard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function Exitosa({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const sb = await createClient();
  const { data } = code ? await sb.rpc("get_my_appointment", { p_code: code }) : { data: null };
  const t = (data as Turno[] | null)?.[0];
  return (
    <main className="mx-auto max-w-xl px-5 py-6">
      <Logo small />
      <h1 className="mt-8 font-display text-4xl font-black uppercase">¡Listo!</h1>
      <p className="mt-3 text-mute">Recibimos tu solicitud de turno para LFZ BarberShop. Tu horario todavía está pendiente de confirmación. Te avisaremos cuando esté confirmado.</p>
      {t && <div className="mt-6"><TurnoCard t={t} />
        <p className="mt-4 text-sm text-mute">Guardá este link para ver el estado de tu turno: <Link className="text-gold underline" href={`/mi-turno/${t.booking_code}`}>/mi-turno/{t.booking_code}</Link></p></div>}
      <Link href="/" className="btn btn-line mt-8">Volver al inicio</Link>
    </main>
  );
}
