"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hhmm, money, TZ } from "@/lib/utils";

type Service = { id: string; name: string; description: string | null; price: number; duration_minutes: number };
type Slot = { slot_time: string; state: "available" | "pending" | "confirmed" | "blocked" };
const LABEL = { pending: "Pendiente", confirmed: "Ocupado", blocked: "No disponible" } as const;

export function BookingFlow({ services, maxDays, initialService }: { services: Service[]; maxDays: number; initialService?: string }) {
  const router = useRouter();
  const sb = createClient();
  const [service, setService] = useState<Service | undefined>(services.find((s) => s.id === initialService));
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const days = Array.from({ length: maxDays + 1 }, (_, i) => new Date(Date.now() + i * 864e5).toLocaleDateString("en-CA", { timeZone: TZ }));

  async function loadSlots(d = date, s = service) {
    if (!d || !s) return;
    setSlots(null); setTime("");
    const { data } = await sb.rpc("get_availability", { p_date: d, p_service_id: s.id });
    setSlots((data as Slot[]) ?? []);
  }
  useEffect(() => { loadSlots(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [date, service?.id]);

  async function submit() {
    if (!service || !date || !time) return;
    setBusy(true); setError("");
    const { data, error: err } = await sb.rpc("create_appointment_request", {
      p_service_id: service.id, p_date: date, p_start: time, p_name: name, p_phone: phone, p_notes: notes || null,
    });
    setBusy(false);
    if (err) {
      if (err.message.includes("slot_taken") || err.message.includes("slot_blocked")) { setError("Ese horario se acaba de ocupar. Elegí otro."); loadSlots(); }
      else if (err.message.includes("invalid_phone")) setError("Revisá el número de WhatsApp (con código de área, sin 0 ni 15).");
      else setError("No pudimos enviar la solicitud. Probá de nuevo.");
      return;
    }
    router.push(`/reserva-exitosa?code=${data}`);
  }

  const h = "mt-10 text-sm font-bold text-mute";
  return (
    <div>
      <p className={h}>1. Servicio</p>
      <div className="mt-3 grid gap-2">
        {services.map((s) => (
          <button key={s.id} onClick={() => { setService(s); setTime(""); }} aria-pressed={service?.id === s.id}
            className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${service?.id === s.id ? "border-gold bg-gold/10" : "border-line bg-coal hover:border-mute"}`}>
            <span><span className="block font-bold">{s.name}</span><span className="text-xs text-mute">{s.duration_minutes} min</span></span>
            <span className="font-display text-xl font-bold text-gold">{money(Number(s.price))}</span>
          </button>
        ))}
      </div>

      {service && (<>
        <p className={h}>2. Día</p>
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-2">
          {days.map((d) => {
            const dt = new Date(d + "T12:00:00");
            return (
              <button key={d} onClick={() => setDate(d)} aria-pressed={date === d}
                className={`min-w-16 shrink-0 rounded-xl border px-3 py-3 text-center ${date === d ? "border-gold bg-gold/10" : "border-line bg-coal"}`}>
                <span className="block text-xs text-mute">{dt.toLocaleDateString("es-AR", { weekday: "short" })}</span>
                <span className="font-display text-2xl font-bold">{dt.getDate()}</span>
                <span className="block text-xs text-mute">{dt.toLocaleDateString("es-AR", { month: "short" })}</span>
              </button>
            );
          })}
        </div>
      </>)}

      {service && date && (<>
        <p className={h}>3. Horario</p>
        {slots === null ? (
          <div className="mt-3 grid grid-cols-4 gap-2">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-11 animate-pulse rounded-lg bg-coal" />)}</div>
        ) : slots.length === 0 ? (
          <p className="mt-3 rounded-xl border border-line bg-coal p-4 text-sm text-mute">No hay turnos para este día. Probá con otro.</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((sl) => {
              const t = hhmm(sl.slot_time); const ok = sl.state === "available";
              return (
                <button key={sl.slot_time} disabled={!ok} onClick={() => setTime(sl.slot_time)} aria-pressed={time === sl.slot_time}
                  className={`rounded-lg border py-2 text-sm transition ${time === sl.slot_time ? "border-gold bg-gold text-ink font-bold" : ok ? "border-line bg-coal hover:border-gold" : "border-line/50 bg-transparent text-mute/50"} ${sl.state === "confirmed" ? "line-through" : ""}`}>
                  {t}{!ok && <span className="block text-[10px] no-underline">{LABEL[sl.state as keyof typeof LABEL]}</span>}
                </button>
              );
            })}
          </div>
        )}
      </>)}

      {time && (<>
        <p className={h}>4. Tus datos</p>
        <div className="mt-3 grid gap-3">
          <input className="input" placeholder="Nombre y apellido" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
          <input className="input" placeholder="WhatsApp (ej: 3537 123456)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
          <textarea className="input" placeholder="Comentario (opcional)" rows={2} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        <button className="btn btn-primary mt-5 w-full" disabled={busy || name.trim().length < 2 || phone.replace(/\D/g, "").length < 8} onClick={submit}>
          {busy ? "ENVIANDO…" : "SOLICITAR TURNO"}
        </button>
        <p className="mt-3 text-center text-xs text-mute">Tu turno queda pendiente hasta que lo confirmemos.</p>
      </>)}
    </div>
  );
}
