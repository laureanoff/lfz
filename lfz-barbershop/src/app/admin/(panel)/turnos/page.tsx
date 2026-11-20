import { Plus } from "lucide-react";
import { AptCard, type Apt } from "@/components/admin/AptCard";
import { Field } from "@/components/admin/Field";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";
import { createManual } from "../actions";

export const dynamic = "force-dynamic";
const SEL = "id,booking_code,appointment_date,start_time,status,customer_notes,created_at,services(name,duration_minutes)";
const ERR: Record<string, string> = { slot: "Ese horario ya está ocupado o bloqueado.", phone: "Revisá el número de WhatsApp.", service: "No hay un servicio activo.", error: "No se pudo crear el turno." };

export default async function Turnos({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; desde?: string; hasta?: string; ok?: string; err?: string }> }) {
  const sp = await searchParams; const today = todayISO();
  const desde = sp.desde ?? today;
  const sb = await createClient();
  const q = (sp.q ?? "").replace(/[%,()]/g, "").trim();
  let query = sb.from("appointments").select(`${SEL},customers!inner(full_name,phone)`).order("appointment_date").order("start_time").limit(150);
  if (desde) query = query.gte("appointment_date", desde);
  if (sp.hasta) query = query.lte("appointment_date", sp.hasta);
  if (sp.estado) query = query.eq("status", sp.estado);
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`, { referencedTable: "customers" });
  const { data } = await query;
  const rows = (data ?? []) as unknown as Apt[];

  return (
    <main className="mt-6">
      <h1 className="font-display text-4xl font-black uppercase">Turnos</h1>
      {sp.ok && <p className="card mt-4 !border-emerald-400/40 p-3 text-sm text-emerald-200">Turno creado y confirmado.</p>}
      {sp.err && <p role="alert" className="card mt-4 !border-red-400/40 p-3 text-sm text-red-200">{ERR[sp.err] ?? ERR.error}</p>}

      <details className="card mt-4 p-4">
        <summary className="flex cursor-pointer items-center gap-2 font-bold text-gold"><Plus size={16} /> Cargar turno manual (queda confirmado)</summary>
        <form action={createManual} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Nombre y apellido"><input className="input" name="name" required maxLength={80} /></Field>
          <Field label="WhatsApp"><input className="input" name="phone" inputMode="tel" required /></Field>
          <Field label="Fecha"><input className="input" type="date" name="date" min={today} required /></Field>
          <Field label="Hora"><input className="input" type="time" name="time" step={900} required /></Field>
          <Field label="Observaciones (opcional)" className="sm:col-span-2"><input className="input" name="notes" maxLength={300} /></Field>
          <button className="btn btn-primary sm:col-span-2">CREAR TURNO</button>
        </form>
      </details>

      <form className="card mt-4 grid gap-3 p-4 sm:grid-cols-5" method="get">
        <Field label="Buscar nombre o teléfono" className="sm:col-span-2"><input className="input" name="q" defaultValue={q} placeholder="Ej: Juan o 3537…" /></Field>
        <Field label="Estado"><select className="input" name="estado" defaultValue={sp.estado ?? ""}><option value="">Todos</option>{[["pending", "Pendiente"], ["confirmed", "Confirmado"], ["completed", "Realizado"], ["no_show", "No asistió"], ["cancelled", "Cancelado"], ["rejected", "Rechazado"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Desde"><input className="input" type="date" name="desde" defaultValue={desde} /></Field>
        <Field label="Hasta"><input className="input" type="date" name="hasta" defaultValue={sp.hasta ?? ""} /></Field>
        <button className="btn btn-line sm:col-span-5">FILTRAR</button>
      </form>

      <div className="mt-5 grid gap-3">
        {rows.length === 0 && <p className="card p-4 text-sm text-mute">No hay turnos con esos filtros.</p>}
        {rows.map((a) => <AptCard key={a.id} a={a} />)}
      </div>
    </main>
  );
}
