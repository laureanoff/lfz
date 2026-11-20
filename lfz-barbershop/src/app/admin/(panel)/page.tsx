import { AptCard, type Apt } from "@/components/admin/AptCard";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";
const SEL = "id,booking_code,appointment_date,start_time,status,customer_notes,created_at,customers(full_name,phone),services(name,duration_minutes)";

function Stat({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return <div className="card p-4"><p className="text-xs uppercase tracking-widest text-mute">{label}</p><p className={`mt-1 font-display text-5xl font-black ${tone || "text-gold"}`}>{value}</p></div>;
}

export default async function Dashboard() {
  const sb = await createClient();
  const today = todayISO();
  const since = new Date(Date.now() - 72 * 3600e3).toISOString();
  const [pending, upcoming, recent, todayC, monthC] = await Promise.all([
    sb.from("appointments").select(SEL).eq("status", "pending").order("appointment_date").order("start_time"),
    sb.from("appointments").select(SEL).eq("status", "confirmed").gte("appointment_date", today).order("appointment_date").order("start_time").limit(30),
    sb.from("appointments").select(SEL).in("status", ["rejected", "cancelled"]).gte("updated_at", since).order("updated_at", { ascending: false }).limit(10),
    sb.from("appointments").select("id", { count: "exact", head: true }).eq("appointment_date", today).in("status", ["pending", "confirmed", "completed"]),
    sb.from("appointments").select("id", { count: "exact", head: true }).gte("appointment_date", today.slice(0, 8) + "01").in("status", ["pending", "confirmed", "completed"]),
  ]);
  const P = (pending.data ?? []) as unknown as Apt[], U = (upcoming.data ?? []) as unknown as Apt[], R = (recent.data ?? []) as unknown as Apt[];

  return (
    <main className="mt-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Hoy" value={todayC.count ?? 0} />
        <Stat label="Pendientes" value={P.length} tone={P.length ? "text-amber-300" : ""} />
        <Stat label="Confirmados" value={U.length} />
        <Stat label="Reservas del mes" value={monthC.count ?? 0} />
      </div>

      <h2 className="mt-10 font-display text-3xl font-black uppercase">Solicitudes pendientes</h2>
      <div className="mt-4 grid gap-3">
        {P.length === 0 && <p className="card p-4 text-sm text-mute">No hay solicitudes pendientes.</p>}
        {P.map((a) => <AptCard key={a.id} a={a} />)}
      </div>

      <h2 className="mt-10 font-display text-3xl font-black uppercase">Próximos turnos</h2>
      <div className="mt-4 grid gap-3">
        {U.length === 0 && <p className="card p-4 text-sm text-mute">No hay turnos confirmados próximos.</p>}
        {U.map((a) => <AptCard key={a.id} a={a} />)}
      </div>

      {R.length > 0 && (<>
        <h2 className="mt-10 font-display text-3xl font-black uppercase">Respuestas recientes</h2>
        <p className="mt-1 text-sm text-mute">Rechazados o cancelados en las últimas 72 horas. Avisale al cliente por WhatsApp.</p>
        <div className="mt-4 grid gap-3">{R.map((a) => <AptCard key={a.id} a={a} />)}</div>
      </>)}
    </main>
  );
}
