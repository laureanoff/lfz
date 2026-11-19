import { createClient } from "@/lib/supabase/server";
import { fmtDate, hhmm, STATUS, todayISO, waLink } from "@/lib/utils";
import { setStatus } from "./actions";

export const dynamic = "force-dynamic";
type Row = { id: string; appointment_date: string; start_time: string; status: string; customer_notes: string | null; created_at: string;
  customers: { full_name: string; phone: string }; services: { name: string; duration_minutes: number } };

function Btn({ id, status, children, cls = "btn-line" }: { id: string; status: string; children: React.ReactNode; cls?: string }) {
  return <form action={setStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} />
    <button className={`btn ${cls} !px-4 !py-2 text-xs`}>{children}</button></form>;
}

export default async function Dashboard() {
  const sb = await createClient();
  const today = todayISO();
  const sel = "id,appointment_date,start_time,status,customer_notes,created_at,customers(full_name,phone),services(name,duration_minutes)";
  const [{ data: pending }, { data: upcoming }, { count: todayCount }, { count: monthCount }] = await Promise.all([
    sb.from("appointments").select(sel).eq("status", "pending").order("appointment_date").order("start_time"),
    sb.from("appointments").select(sel).eq("status", "confirmed").gte("appointment_date", today).order("appointment_date").order("start_time").limit(30),
    sb.from("appointments").select("id", { count: "exact", head: true }).eq("appointment_date", today).in("status", ["pending", "confirmed", "completed"]),
    sb.from("appointments").select("id", { count: "exact", head: true }).gte("appointment_date", today.slice(0, 8) + "01").neq("status", "rejected"),
  ]);
  const P = (pending ?? []) as unknown as Row[]; const U = (upcoming ?? []) as unknown as Row[];

  return (
    <main className="mt-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Hoy", todayCount ?? 0], ["Pendientes", P.length], ["Confirmados", U.length], ["Reservas del mes", monthCount ?? 0]].map(([k, v]) => (
          <div key={k as string} className="rounded-xl border border-line bg-coal p-4"><p className="text-xs text-mute">{k}</p><p className="font-display text-4xl font-black text-gold">{v}</p></div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-3xl font-black uppercase">Solicitudes pendientes</h2>
      <div className="mt-4 grid gap-3">
        {P.length === 0 && <p className="rounded-xl border border-line bg-coal p-4 text-sm text-mute">No hay solicitudes pendientes.</p>}
        {P.map((a) => {
          const when = `${fmtDate(a.appointment_date)} a las ${hhmm(a.start_time)}`;
          return (
            <article key={a.id} className="rounded-xl border border-amber-500/30 bg-coal p-4">
              <p className="font-bold">{a.customers.full_name} <span className="font-normal text-mute">· {a.customers.phone}</span></p>
              <p className="mt-1 text-sm">{a.services.name} ({a.services.duration_minutes} min) · {when}</p>
              {a.customer_notes && <p className="mt-1 text-sm text-mute">“{a.customer_notes}”</p>}
              <p className="mt-1 text-xs text-mute">Solicitado el {new Date(a.created_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Cordoba" })}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn id={a.id} status="confirmed" cls="btn-primary">CONFIRMAR TURNO</Btn>
                <Btn id={a.id} status="rejected">RECHAZAR</Btn>
                <a className="btn btn-line !px-4 !py-2 text-xs" target="_blank" href={waLink(a.customers.phone, `Hola ${a.customers.full_name}, soy de LFZ BarberShop. Te escribo por tu solicitud de turno para el ${when}.`)}>CONTACTAR POR WHATSAPP</a>
              </div>
            </article>
          );
        })}
      </div>

      <h2 className="mt-10 font-display text-3xl font-black uppercase">Próximos turnos</h2>
      <div className="mt-4 grid gap-3">
        {U.length === 0 && <p className="rounded-xl border border-line bg-coal p-4 text-sm text-mute">No hay turnos confirmados próximos.</p>}
        {U.map((a) => {
          const when = `${fmtDate(a.appointment_date)} a las ${hhmm(a.start_time)}`;
          return (
            <article key={a.id} className="rounded-xl border border-line bg-coal p-4">
              <p className="font-bold">{hhmm(a.start_time)} · {a.customers.full_name} <span className={`ml-1 rounded-full border px-2 py-0.5 text-[10px] ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span></p>
              <p className="mt-1 text-sm text-mute">{a.services.name} · {fmtDate(a.appointment_date)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn id={a.id} status="completed">REALIZADO</Btn>
                <Btn id={a.id} status="no_show">NO VINO</Btn>
                <Btn id={a.id} status="cancelled">CANCELAR</Btn>
                <a className="btn btn-line !px-4 !py-2 text-xs" target="_blank" href={waLink(a.customers.phone, `Hola ${a.customers.full_name}, te recordamos tu turno en LFZ BarberShop el ${when}. ¡Te esperamos!`)}>RECORDATORIO</a>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
