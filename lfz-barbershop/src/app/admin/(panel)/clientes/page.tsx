import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, hhmm, todayISO, waLink } from "@/lib/utils";

export const dynamic = "force-dynamic";
type Ap = { customer_id: string; status: string; appointment_date: string; start_time: string };

export default async function Clientes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").replace(/[%,()]/g, "").trim();
  const sb = await createClient(); const today = todayISO();
  let cq = sb.from("customers").select("id,full_name,phone").order("created_at", { ascending: false }).limit(200);
  if (q) cq = cq.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data: customers } = await cq;
  const ids = (customers ?? []).map((c) => c.id);
  const { data: apts } = ids.length ? await sb.from("appointments").select("customer_id,status,appointment_date,start_time").in("customer_id", ids) : { data: [] };
  const by = new Map<string, Ap[]>(); (apts as Ap[] | null)?.forEach((a) => by.set(a.customer_id, [...(by.get(a.customer_id) ?? []), a]));

  return (
    <main className="mt-6">
      <h1 className="font-display text-4xl font-black uppercase">Clientes</h1>
      <form className="mt-4 flex gap-2" method="get"><input className="input" name="q" defaultValue={q} placeholder="Buscar por nombre o teléfono" /><button className="btn btn-line">BUSCAR</button></form>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(customers ?? []).length === 0 && <p className="card p-4 text-sm text-mute sm:col-span-2">Todavía no hay clientes.</p>}
        {(customers ?? []).map((c) => {
          const l = (by.get(c.id) ?? []).filter((a) => ["confirmed", "completed", "pending"].includes(a.status)).sort((x, y) => (x.appointment_date + x.start_time).localeCompare(y.appointment_date + y.start_time));
          const last = [...l].reverse().find((a) => a.appointment_date < today), next = l.find((a) => a.appointment_date >= today);
          return (
            <article key={c.id} className="card p-4">
              <p className="font-bold">{c.full_name}</p>
              <p className="text-sm text-mute">{c.phone} · {l.length} turno{l.length === 1 ? "" : "s"}</p>
              <p className="mt-2 text-xs text-bone/70">Último: {last ? fmtDate(last.appointment_date) : "—"}</p>
              <p className="text-xs text-bone/70">Próximo: {next ? `${fmtDate(next.appointment_date)} ${hhmm(next.start_time)}` : "—"}</p>
              <a className="btn btn-wa mt-3 !px-4 !py-2 text-xs" target="_blank" rel="noreferrer" href={waLink(c.phone, `Hola ${c.full_name}, te escribimos de LFZ BarberShop.`)}><MessageCircle size={14} /> WHATSAPP</a>
            </article>
          );
        })}
      </div>
    </main>
  );
}
