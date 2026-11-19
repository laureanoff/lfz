import { Field } from "@/components/admin/Field";
import { createClient } from "@/lib/supabase/server";
import { hhmm } from "@/lib/utils";
import { addBlock, addHours, deleteBlock, deleteHours } from "../actions";

export const dynamic = "force-dynamic";
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function Horarios() {
  const sb = await createClient();
  const [{ data: hours }, { data: blocks }] = await Promise.all([
    sb.from("business_hours").select("*").order("open_time"),
    sb.from("time_blocks").select("*").gte("end_datetime", new Date().toISOString().slice(0, 19)).order("start_datetime"),
  ]);
  return (
    <main className="mt-8">
      <h1 className="font-display text-4xl font-black uppercase">Horarios de atención</h1>
      <p className="mt-2 text-sm text-mute">Podés cargar varios tramos por día (ej: 09:00–13:00 y 16:00–20:00). Un día sin tramos figura como cerrado.</p>
      <div className="mt-6 grid gap-3">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <div key={d} className="card p-4">
            <p className="font-bold">{DAYS[d]}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {hours?.filter((h) => h.weekday === d).map((h) => (
                <form key={h.id} action={deleteHours} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm">
                  <input type="hidden" name="id" value={h.id} />{hhmm(h.open_time)}–{hhmm(h.close_time)}
                  <button className="text-red-300 hover:text-red-200" aria-label="Quitar tramo">×</button>
                </form>
              ))}
              {!hours?.some((h) => h.weekday === d) && <span className="text-sm text-mute">Cerrado</span>}
            </div>
            <form action={addHours} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="weekday" value={d} />
              <Field label="Desde"><input className="input !py-2" type="time" name="open" required /></Field>
              <Field label="Hasta"><input className="input !py-2" type="time" name="close" required /></Field>
              <button className="btn btn-line !py-2 text-xs">AGREGAR TRAMO</button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-display text-3xl font-black uppercase">Bloqueos</h2>
      <p className="mt-2 text-sm text-mute">Vacaciones, feriados o descansos. Para un día completo, de 00:00 a 23:59.</p>
      <form action={addBlock} className="card mt-4 grid gap-3 p-4 sm:grid-cols-4">
        <Field label="Desde"><input className="input" type="datetime-local" name="start" required /></Field>
        <Field label="Hasta"><input className="input" type="datetime-local" name="end" required /></Field>
        <Field label="Motivo (opcional)"><input className="input" name="reason" maxLength={80} /></Field>
        <button className="btn btn-primary self-end !py-3 text-sm">BLOQUEAR</button>
      </form>
      <ul className="mt-4 grid gap-2">
        {blocks?.length === 0 && <li className="text-sm text-mute">No hay bloqueos próximos.</li>}
        {blocks?.map((b) => (
          <li key={b.id} className="card flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>{String(b.start_datetime).slice(0, 16).replace("T", " ")} → {String(b.end_datetime).slice(0, 16).replace("T", " ")}{b.reason ? ` · ${b.reason}` : ""}</span>
            <form action={deleteBlock}><input type="hidden" name="id" value={b.id} /><button className="text-red-300 hover:text-red-200">Quitar</button></form>
          </li>
        ))}
      </ul>
    </main>
  );
}
