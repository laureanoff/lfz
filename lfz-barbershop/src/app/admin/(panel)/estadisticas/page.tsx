import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { money, todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";
type Vista = "dia" | "semana" | "mes" | "anio";
const VISTAS: [Vista, string][] = [["dia", "Día"], ["semana", "Semana"], ["mes", "Mes"], ["anio", "Año"]];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const d = (s: string) => new Date(s + "T12:00:00Z");
const iso = (x: Date) => x.toISOString().slice(0, 10);
const add = (s: string, n: number) => { const x = d(s); x.setUTCDate(x.getUTCDate() + n); return iso(x); };
const addMonths = (s: string, n: number) => { const x = d(s); x.setUTCDate(1); x.setUTCMonth(x.getUTCMonth() + n); return iso(x); };

function plan(v: Vista, a: string) {
  const x = d(a);
  if (v === "dia") return { from: a, to: a, prev: add(a, -1), next: add(a, 1), label: x.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
    buckets: Array.from({ length: 14 }, (_, i) => ({ key: String(i + 8).padStart(2, "0"), label: `${i + 8}h` })), keyOf: (date: string, t: string) => t.slice(0, 2) };
  if (v === "semana") { const mon = add(a, -((x.getUTCDay() + 6) % 7)); const sun = add(mon, 6);
    return { from: mon, to: sun, prev: add(a, -7), next: add(a, 7), label: `Semana del ${d(mon).getUTCDate()} de ${MESES[d(mon).getUTCMonth()].toLowerCase()} al ${d(sun).getUTCDate()} de ${MESES[d(sun).getUTCMonth()].toLowerCase()}`,
      buckets: Array.from({ length: 7 }, (_, i) => { const k = add(mon, i); return { key: k, label: `${DIAS[d(k).getUTCDay()]} ${d(k).getUTCDate()}` }; }), keyOf: (date: string) => date }; }
  if (v === "mes") { const first = iso(new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), 1, 12))); const last = iso(new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0, 12)));
    const n = d(last).getUTCDate();
    return { from: first, to: last, prev: addMonths(first, -1), next: addMonths(first, 1), label: `${MESES[x.getUTCMonth()]} ${x.getUTCFullYear()}`,
      buckets: Array.from({ length: n }, (_, i) => ({ key: add(first, i), label: String(i + 1) })), keyOf: (date: string) => date }; }
  const y = x.getUTCFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31`, prev: `${y - 1}-06-15`, next: `${y + 1}-06-15`, label: `Año ${y}`,
    buckets: MESES.map((m, i) => ({ key: `${y}-${String(i + 1).padStart(2, "0")}`, label: m.slice(0, 3) })), keyOf: (date: string) => date.slice(0, 7) };
}

export default async function Estadisticas({ searchParams }: { searchParams: Promise<{ vista?: string; fecha?: string }> }) {
  const sp = await searchParams; const today = todayISO();
  const v: Vista = (VISTAS.map(([k]) => k) as string[]).includes(sp.vista ?? "") ? (sp.vista as Vista) : "mes";
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha ?? "") ? sp.fecha! : today;
  const r = plan(v, anchor);
  const sb = await createClient();
  const { data } = await sb.from("appointments").select("appointment_date,start_time,status,price").gte("appointment_date", r.from).lte("appointment_date", r.to).in("status", ["completed", "confirmed", "no_show", "cancelled"]);
  const rows = (data ?? []) as { appointment_date: string; start_time: string; status: string; price: number | null }[];

  const sum = (st: string) => rows.filter((x) => x.status === st).reduce((m, x) => m + Number(x.price ?? 0), 0);
  const cnt = (st: string) => rows.filter((x) => x.status === st).length;
  const cobrado = sum("completed"), porCobrar = sum("confirmed"), hechos = cnt("completed");
  const bars = r.buckets.map((b) => {
    const inB = rows.filter((x) => r.keyOf(x.appointment_date, x.start_time) === b.key);
    return { ...b, done: inB.filter((x) => x.status === "completed").reduce((m, x) => m + Number(x.price ?? 0), 0), pend: inB.filter((x) => x.status === "confirmed").reduce((m, x) => m + Number(x.price ?? 0), 0), n: inB.filter((x) => x.status === "completed").length };
  });
  const max = Math.max(1, ...bars.map((b) => b.done + b.pend));
  const href = (vista: Vista, fecha: string) => `/admin/estadisticas?vista=${vista}&fecha=${fecha}`;

  return (
    <main className="mt-6">
      <h1 className="font-display text-4xl font-black uppercase">Cobros</h1>
      <p className="mt-1 text-sm text-mute">Se cuenta como cobrado cada turno que marcás como “Realizado · cobrado”. Usa el precio que tenía el corte al reservar.</p>

      <div className="glass-soft mt-4 flex flex-wrap items-center justify-between gap-3 p-2">
        <div className="flex gap-1">{VISTAS.map(([k, l]) => <Link key={k} href={href(k, anchor)} className="tab" aria-current={v === k ? "page" : undefined}>{l}</Link>)}</div>
        <div className="flex items-center gap-1">
          <Link href={href(v, r.prev)} className="nav-btn" aria-label="Anterior"><ChevronLeft size={16} /></Link>
          <Link href={href(v, today)} className="tab">Hoy</Link>
          <Link href={href(v, r.next)} className="nav-btn" aria-label="Siguiente"><ChevronRight size={16} /></Link>
        </div>
      </div>
      <p className="mt-4 font-display text-2xl font-bold uppercase text-bone/90">{r.label}</p>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4"><p className="text-xs uppercase tracking-widest text-mute">Cobrado</p><p className="mt-1 font-display text-4xl font-black text-gold">{money(cobrado)}</p></div>
        <div className="card p-4"><p className="text-xs uppercase tracking-widest text-mute">Cortes realizados</p><p className="mt-1 font-display text-4xl font-black">{hechos}</p></div>
        <div className="card p-4"><p className="text-xs uppercase tracking-widest text-mute">Promedio por corte</p><p className="mt-1 font-display text-4xl font-black">{money(hechos ? cobrado / hechos : 0)}</p></div>
        <div className="card p-4"><p className="text-xs uppercase tracking-widest text-mute">Por cobrar</p><p className="mt-1 font-display text-4xl font-black text-amber-300">{money(porCobrar)}</p><p className="text-[11px] text-mute">{cnt("confirmed")} confirmados sin marcar</p></div>
      </div>

      <div className="card mt-4 p-4">
        <div className="flex items-center justify-between text-xs text-mute"><span>Ingresos por {v === "dia" ? "hora" : v === "anio" ? "mes" : "día"}</span>
          <span className="flex items-center gap-3"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-gold" /> Cobrado <i className="inline-block h-2.5 w-2.5 rounded-sm bg-gold/30" /> Por cobrar</span></div>
        <div className="mt-4 overflow-x-auto"><div className="flex h-56 items-end gap-1.5" style={{ minWidth: bars.length > 14 ? bars.length * 22 : undefined }}>
          {bars.map((b) => (
            <div key={b.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${b.label}: ${money(b.done)} cobrado · ${b.n} corte${b.n === 1 ? "" : "s"}${b.pend ? ` · ${money(b.pend)} por cobrar` : ""}`}>
              {b.done > 0 && bars.length <= 14 && <span className="text-[10px] text-gold">{money(b.done).replace("$", "").trim()}</span>}
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-md" style={{ height: `${((b.done + b.pend) / max) * 85}%`, minHeight: b.done + b.pend > 0 ? 4 : 0 }}>
                <div className="bg-gold/30" style={{ height: `${b.done + b.pend ? (b.pend / (b.done + b.pend)) * 100 : 0}%` }} />
                <div className="flex-1 bg-gradient-to-t from-[#b78d3a] to-[#e6c36f]" />
              </div>
              <span className="text-[10px] text-mute">{b.label}</span>
            </div>
          ))}
        </div></div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="card p-4"><p className="text-xs uppercase tracking-widest text-mute">No asistieron</p><p className="mt-1 font-display text-3xl font-black">{cnt("no_show")}</p></div>
        <div className="card p-4"><p className="text-xs uppercase tracking-widest text-mute">Cancelados</p><p className="mt-1 font-display text-3xl font-black">{cnt("cancelled")}</p></div>
      </div>
    </main>
  );
}
