import Link from "next/link";
import { Logo } from "@/components/Logo";
import { TurnoLive, type Turno } from "@/components/TurnoLive";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo: code } = await params;
  const sb = await createClient();
  const [{ data }, { data: s }] = await Promise.all([
    code ? sb.rpc("get_my_appointment", { p_code: code }) : Promise.resolve({ data: null }),
    sb.from("settings").select("whatsapp").eq("id", 1).single(),
  ]);
  const t = (data as Turno[] | null)?.[0];
  return (
    <main className="g-hero relative min-h-dvh overflow-hidden px-5 py-6">
      <div className="aurora" aria-hidden><i className="blob b1" /><i className="blob b2" /><i className="blob b3" /></div>
      <div className="relative mx-auto max-w-2xl">
        <div className="flex justify-center"><Logo /></div>
        {t ? <TurnoLive initial={t} shopWhatsapp={s?.whatsapp} /> : (
          <div className="glass mx-auto mt-10 max-w-md p-8 text-center">
            <p className="text-bone/80">No encontramos un turno con ese código. Revisá el link.</p>
            <Link href="/#reservar" className="btn btn-primary mt-6">RESERVAR UN TURNO</Link>
          </div>
        )}
      </div>
    </main>
  );
}
