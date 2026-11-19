import Link from "next/link";
const LINKS = [["/admin", "Turnos"], ["/admin/servicios", "Servicios"], ["/admin/horarios", "Horarios"], ["/admin/ajustes", "Ajustes"]];
export function AdminNav() {
  return (
    <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-white/10 pb-3 text-sm">
      {LINKS.map(([href, label]) => <Link key={href} href={href} className="rounded-lg px-3 py-1.5 text-bone/80 hover:bg-white/10 hover:text-gold">{label}</Link>)}
    </nav>
  );
}
