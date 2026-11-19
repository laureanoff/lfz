import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { BookingFlow } from "./BookingFlow";

export const dynamic = "force-dynamic";
export default async function Reservar({ searchParams }: { searchParams: Promise<{ servicio?: string }> }) {
  const { servicio } = await searchParams;
  const sb = await createClient();
  const [{ data: services }, { data: s }] = await Promise.all([
    sb.from("services").select("id,name,description,price,duration_minutes").order("display_order"),
    sb.from("settings").select("max_advance_days,whatsapp").eq("id", 1).single(),
  ]);
  return (
    <main className="mx-auto max-w-xl px-5 py-6">
      <Logo small />
      <h1 className="mt-8 font-display text-4xl font-black uppercase">Reservá tu turno</h1>
      <BookingFlow services={services ?? []} maxDays={s?.max_advance_days ?? 30} initialService={servicio} />
    </main>
  );
}
