"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtDate, hhmm, money, todayISO } from "@/lib/utils";

type Service = { id: string; name: string; price: number; duration_minutes: number };
type Slot = { slot_time: string; state: "available" | "pending" | "confirmed" | "blocked" };
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const WD = ["L", "M", "M", "J", "V", "S", "D"];
const LABEL = { pending: "Pendiente", confirmed: "Ocupado", blocked: "No disp." } as const;
const pad = (n: number) => String(n).padStart(2, "0");
const addDays = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-CA"); };

export function BookingCalendar({ service, maxDays, openWeekdays }: { service: Service; maxDays: number; openWeekdays: number[] }) {
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);
  const today = todayISO(); const max = addDays(today, maxDays);
  const t0 = new Date(today + "T12:00:00"), t1 = new Date(max + "T12:00:00");
  const [cur, setCur] = useState({ y: t0.getFullYear(), m: t0.getMonth() });
  const [date, setDate] = useState(""); const [slots, setSlots] = useState<Slot[] | null>(null); const [time, setTime] = useState("");
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");

  const idx = cur.y * 12 + cur.m;
  const first = (new Date(cur.y, cur.m, 1).getDay() + 6) % 7;
  const total = new Date(cur.y, cur.m + 1, 0).getDate();

  async function loadSlots(d = date) {
    if (!d) return;
    setSlots(null); setTime("");
    const { data } = await sb.rpc("get_availability", { p_date: d, p_service_id: service.id });
    setSlots((data as Slot[]) ?? []);
  }
  useEffect(() => { loadSlots(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [date]);

  async function submit() {
    setBusy(true); setError("");
    const { data, error: err } = await sb.rpc("create_appointment_request", { p_service_id: service.id, p_date: date, p_start: time, p_name: name, p_phone: phone, p_notes: notes || null });
    setBusy(false);
    if (err) {
      if (err.message.includes("slot_taken") || err.message.includes("slot_blocked")) { setError("Ese horario se acaba de ocupar. Elegí otro."); loadSlots(); }
      else if (err.message.includes("invalid_phone")) setError("Revisá el número de WhatsApp (con código de área, sin 0 ni 15).");
      else setError("No pudimos enviar la solicitud. Probá de nuevo.");
      return;
    }
    router.push(`/reserva-exitosa?code=${data}`);
  }

  return (
    <div className="glass p-5 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-mute">Servicio</p>
          <h3 className="font-display text-3xl font-black uppercase">{service.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-mute"><Clock size={14} /> {service.duration_minutes} min</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-mute">Valor</p>
          <p className="price font-display text-5xl font-black text-gold md:text-6xl">{money(Number(service.price))}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="glass-soft p-4">
          <div className="flex items-center justify-between">
            <button aria-label="Mes anterior" disabled={idx <= t0.getFullYear() * 12 + t0.getMonth()} onClick={() => setCur(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))} className="nav-btn"><ChevronLeft size={18} /></button>
            <p className="font-display text-2xl font-bold uppercase tracking-wide">{MONTHS[cur.m]} {cur.y}</p>
            <button aria-label="Mes siguiente" disabled={idx >= t1.getFullYear() * 12 + t1.getMonth()} onClick={() => setCur(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))} className="nav-btn"><ChevronRight size={18} /></button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-xs text-mute">{WD.map((w, i) => <span key={i}>{w}</span>)}</div>
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {Array.from({ length: first }, (_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: total }, (_, i) => {
              const d = i + 1; const iso = `${cur.y}-${pad(cur.m + 1)}-${pad(d)}`;
              const off = iso < today || iso > max || !openWeekdays.includes(new Date(cur.y, cur.m, d).getDay());
              return <button key={iso} disabled={off} aria-pressed={date === iso} onClick={() => setDate(iso)} className={`day ${iso === today ? "day-today" : ""}`}>{d}</button>;
            })}
          </div>
          <p className="mt-3 text-center text-[11px] text-mute">Los días apagados son de descanso o ya pasaron.</p>
        </div>

        <div className="glass-soft p-4">
          {!date ? (
            <div className="grid h-full min-h-48 place-items-center text-center text-sm text-mute">Elegí un día en el calendario para ver los horarios disponibles.</div>
          ) : (
            <div key={date} className="fade-up">
              <p className="font-display text-xl font-bold uppercase">{fmtDate(date)}</p>
              {slots === null ? (
                <div className="mt-3 grid grid-cols-3 gap-2">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-11 animate-pulse rounded-xl bg-white/10" />)}</div>
              ) : slots.length === 0 ? (
                <p className="mt-3 text-sm text-mute">No quedan horarios para este día. Probá con otro.</p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {slots.map((sl, i) => {
                    const ok = sl.state === "available";
                    return (
                      <button key={sl.slot_time} disabled={!ok} aria-pressed={time === sl.slot_time} onClick={() => setTime(sl.slot_time)} style={{ animationDelay: `${i * 35}ms` }} className={`slot fade-up ${sl.state === "confirmed" ? "line-through" : ""}`}>
                        {hhmm(sl.slot_time)}{!ok && <span className="block text-[9px]">{LABEL[sl.state as keyof typeof LABEL]}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {time && (
        <div className="fade-up glass-soft mt-5 grid gap-3 p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="text-sm text-mute">Tu turno: <span className="font-bold text-bone">{fmtDate(date)} a las {hhmm(time)}</span> · <span className="font-bold text-gold">{money(Number(service.price))}</span></p>
          </div>
          <input className="input" placeholder="Nombre y apellido" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
          <input className="input" placeholder="WhatsApp (ej: 3537 123456)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
          <textarea className="input md:col-span-2" placeholder="Comentario (opcional)" rows={2} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} />
          {error && <p role="alert" className="text-sm text-red-300 md:col-span-2">{error}</p>}
          <button className="btn btn-primary md:col-span-2" disabled={busy || name.trim().length < 2 || phone.replace(/\D/g, "").length < 8} onClick={submit}>{busy ? "ENVIANDO…" : "SOLICITAR TURNO"}</button>
          <p className="text-center text-xs text-mute md:col-span-2">Tu turno queda pendiente hasta que lo confirmemos por WhatsApp.</p>
        </div>
      )}
    </div>
  );
}
