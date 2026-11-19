import { fmtDate, hhmm, money, STATUS } from "@/lib/utils";
export type Turno = { booking_code: string; status: string; appointment_date: string; start_time: string; service_name: string; price: number; customer_name: string };
export function TurnoCard({ t }: { t: Turno }) {
  const st = STATUS[t.status] ?? STATUS.pending;
  return (
    <div className="rounded-2xl border border-line bg-coal p-6">
      <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
      <dl className="mt-5 grid gap-3 text-sm">
        {[["Nombre", t.customer_name], ["Servicio", `${t.service_name} · ${money(Number(t.price))}`], ["Día", fmtDate(t.appointment_date)], ["Hora", hhmm(t.start_time)], ["Código", t.booking_code]].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4"><dt className="text-mute">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}
