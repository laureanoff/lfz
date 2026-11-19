export const TZ = "America/Argentina/Cordoba";
export const hhmm = (t: string) => t.slice(0, 5);
export const money = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
export const todayISO = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
export const waLink = (phone: string, msg: string) => {
  let d = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (d.length <= 11 && !d.startsWith("54")) d = "549" + d.replace(/^15/, "");
  return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`;
};
export const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente de confirmación", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  confirmed: { label: "Confirmado", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  rejected: { label: "Rechazado", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
  cancelled: { label: "Cancelado", cls: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
  completed: { label: "Realizado", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  no_show: { label: "No asistió", cls: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
};
