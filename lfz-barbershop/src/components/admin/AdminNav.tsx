"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, Images, LayoutDashboard, Scissors, Settings, Users } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Resumen", Icon: LayoutDashboard },
  { href: "/admin/turnos", label: "Turnos", Icon: CalendarDays },
  { href: "/admin/clientes", label: "Clientes", Icon: Users },
  { href: "/admin/servicios", label: "Precio", Icon: Scissors },
  { href: "/admin/galeria", label: "Galería", Icon: Images },
  { href: "/admin/horarios", label: "Horarios", Icon: Clock },
  { href: "/admin/ajustes", label: "Ajustes", Icon: Settings },
];
export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="glass-soft mt-3 flex gap-1 overflow-x-auto p-1.5">
      {LINKS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className="tab" aria-current={path === href ? "page" : undefined}><Icon size={15} />{label}</Link>
      ))}
    </nav>
  );
}
