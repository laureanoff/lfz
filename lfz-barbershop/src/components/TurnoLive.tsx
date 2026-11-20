"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Hourglass, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtDate, hhmm, money, waLink } from "@/lib/utils";

export type Turno = { booking_code: string; status: string; appointment_date: string; start_time: string; service_name: string; price: number; customer_name: string };
const COLORS = ["#e3b341", "#f3efe6", "#d9202e", "#e3b341"];
const SPARKS = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return { x: Math.cos(a) * 105, y: Math.sin(a) * 105, r: (i * 47) % 360, c: COLORS[i % 4] }; });

function Badge({ status }: { status: string }) {
  if (status === "confirmed" || status === "completed")
    return (
      <div className="relative grid h-32 w-32 place-items-center">
        {SPARKS.map((s, i) => <span key={i} className="spark" style={{ "--x": `${s.x}px`, "--y": `${s.y}px`, "--r": `${s.r}deg`, "--c": s.c } as React.CSSProperties} />)}
        <svg viewBox="0 0 80 80" className="pop h-28 w-28"><circle cx="40" cy="40" r="36" fill="rgba(201,162,77,.15)" stroke="#e3b341" strokeWidth="3" /><path className="draw" d="M24 41 l11 11 l21 -24" fill="none" stroke="#e3b341" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <Image src="/hat.png" alt="" width={420} height={311} className="hat-drop absolute -right-12 -top-6 w-24" />
      </div>
    );
  if (status === "rejected" || status === "cancelled" || status === "no_show")
    return (
      <div className="shake grid h-32 w-32 place-items-center">
        <svg viewBox="0 0 80 80" className="pop h-28 w-28"><circle cx="40" cy="40" r="36" fill="rgba(217,32,46,.14)" stroke="#e5546a" strokeWidth="3" /><path className="draw" d="M28 28 L52 52 M52 28 L28 52" fill="none" stroke="#e5546a" strokeWidth="6" strokeLinecap="round" /></svg>
      </div>
    );
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      <span className="ring-pulse" /><span className="ring-pulse d" />
      <Hourglass size={38} className="text-gold" />
    </div>
  );
}

const COPY: Record<string, [string, string]> = {
  pending: ["¡Listo!", "Recibimos tu solicitud. Tu horario todavía está pendiente de confirmación. Esta pantalla se actualiza sola cuando respondamos."],
  confirmed: ["¡Turno confirmado!", "Tu turno quedó confirmado. Te esperamos en LFZ BarberShop."],
  completed: ["¡Gracias por venir!", "Tu turno ya fue realizado. ¡Nos vemos en el próximo corte!"],
  rejected: ["No pudimos tomar este turno", "Ese horario no está disponible. Podés elegir otro día u horario en un minuto."],
  cancelled: ["Turno cancelado", "Este turno fue cancelado. Si querés, reservá uno nuevo."],
  no_show: ["Turno no asistido", "Este turno figura como no asistido. Podés reservar uno nuevo cuando quieras."],
};

export function TurnoLive({ initial, shopWhatsapp }: { initial: Turno; shopWhatsapp?: string }) {
  const [t, setT] = useState(initial);
  useEffect(() => {
    if (t.status !== "pending") return;
    const sb = createClient();
    const id = setInterval(async () => {
      const { data } = await sb.rpc("get_my_appointment", { p_code: t.booking_code });
      const n = (data as Turno[] | null)?.[0];
      if (n && n.status !== t.status) setT(n);
    }, 7000);
    return () => clearInterval(id);
  }, [t.status, t.booking_code]);

  const [title, text] = COPY[t.status] ?? COPY.pending;
  const rows: [string, string][] = [["Nombre", t.customer_name], ["Servicio", t.service_name], ["Valor", money(Number(t.price))], ["Día", fmtDate(t.appointment_date)], ["Hora", `${hhmm(t.start_time)} hs`], ["Código", t.booking_code]];
  const ok = t.status === "confirmed" || t.status === "completed";

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mt-10 flex justify-center"><Badge key={t.status} status={t.status} /></div>
      <h1 key={t.status + "h"} className="fade-up mt-6 font-display text-5xl font-black uppercase">{title}</h1>
      <p key={t.status + "p"} className="fade-up mx-auto mt-3 max-w-sm text-bone/70" style={{ animationDelay: ".15s" }}>{text}</p>

      <div className="glass ticket mt-8 overflow-hidden text-left">
        <div className="pole-gold" />
        <dl className="grid gap-3 px-6 pb-4 pt-5 text-sm">
          {rows.slice(0, 3).map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-mute">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
        </dl>
        <div className="mx-5 border-t-2 border-dashed border-white/20" />
        <dl className="grid gap-3 px-6 pb-6 pt-4 text-sm">
          {rows.slice(3).map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-mute">{k}</dt><dd className={`text-right font-semibold ${k === "Código" ? "font-mono tracking-widest text-gold" : ""}`}>{v}</dd></div>)}
        </dl>
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-xs">
          <span className={`rounded-full border px-3 py-1 font-bold ${ok ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" : t.status === "pending" ? "border-amber-400/40 bg-amber-500/15 text-amber-200" : "border-red-400/40 bg-red-500/15 text-red-200"}`}>
            {ok ? (t.status === "completed" ? "Realizado" : "Confirmado") : t.status === "pending" ? "Pendiente" : t.status === "rejected" ? "Rechazado" : t.status === "cancelled" ? "Cancelado" : "No asistió"}
          </span>
          <span className="text-mute">Guardá este link para ver el estado</span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {shopWhatsapp && <a className="btn btn-wa" target="_blank" href={waLink(shopWhatsapp, `Hola, consulto por mi turno ${t.booking_code} (${fmtDate(t.appointment_date)} ${hhmm(t.start_time)}).`)}><MessageCircle size={16} /> CONSULTAR POR WHATSAPP</a>}
        {!ok && t.status !== "pending" && <Link href="/#reservar" className="btn btn-primary">ELEGIR OTRO HORARIO</Link>}
        <Link href="/" className="btn btn-line">VOLVER AL INICIO</Link>
      </div>
    </div>
  );
}
