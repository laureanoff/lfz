import { MessageCircle } from "lucide-react";
import { setStatus } from "@/app/admin/(panel)/actions";
import { fmtDate, hhmm, msg, STATUS, waLink } from "@/lib/utils";

export type Apt = { id: string; booking_code: string; appointment_date: string; start_time: string; status: string; customer_notes: string | null; created_at: string;
  customers: { full_name: string; phone: string }; services: { name: string; duration_minutes: number } };

function Btn({ id, status, children, cls = "btn-line" }: { id: string; status: string; children: React.ReactNode; cls?: string }) {
  return (
    <form action={setStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} />
      <button className={`btn ${cls} !px-4 !py-2 text-xs`}>{children}</button></form>
  );
}
const Wa = ({ href, children }: { href: string; children: React.ReactNode }) => <a className="btn btn-wa !px-4 !py-2 text-xs" target="_blank" rel="noreferrer" href={href}><MessageCircle size={14} />{children}</a>;

export function AptCard({ a }: { a: Apt }) {
  const when = `${fmtDate(a.appointment_date)} a las ${hhmm(a.start_time)}`;
  const n = a.customers.full_name, p = a.customers.phone, st = STATUS[a.status] ?? STATUS.pending;
  return (
    <article className={`card p-4 ${a.status === "pending" ? "!border-amber-400/40" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold">{n} <span className="font-normal text-mute">· {p}</span></p>
          <p className="mt-0.5 text-sm text-bone/80">{when} · {a.services.duration_minutes} min</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
      </div>
      {a.customer_notes && <p className="mt-2 text-sm text-mute">“{a.customer_notes}”</p>}
      <p className="mt-1 text-[11px] text-mute">Solicitado el {new Date(a.created_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Cordoba" })} · código {a.booking_code}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {a.status === "pending" && (<>
          <Btn id={a.id} status="confirmed" cls="btn-primary">CONFIRMAR TURNO</Btn>
          <Btn id={a.id} status="rejected">RECHAZAR</Btn>
          <Wa href={waLink(p, msg.contact(n, when))}>CONTACTAR</Wa>
        </>)}
        {a.status === "confirmed" && (<>
          <Wa href={waLink(p, msg.confirm(n, when, a.booking_code))}>ENVIAR CONFIRMACIÓN</Wa>
          <Wa href={waLink(p, msg.reminder(n, when))}>RECORDATORIO</Wa>
          <Btn id={a.id} status="completed">REALIZADO</Btn>
          <Btn id={a.id} status="no_show">NO VINO</Btn>
          <Btn id={a.id} status="cancelled">CANCELAR</Btn>
        </>)}
        {a.status === "rejected" && <Wa href={waLink(p, msg.reject(n, when))}>AVISAR RECHAZO</Wa>}
        {a.status === "cancelled" && <Wa href={waLink(p, msg.cancel(n, when))}>AVISAR CANCELACIÓN</Wa>}
      </div>
    </article>
  );
}
