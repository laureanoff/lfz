import Link from "next/link";
export function Logo({ href = "/", small = false }: { href?: string; small?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-baseline gap-2 leading-none" aria-label="LFZ BarberShop">
      <span className={`font-display font-black tracking-tight text-gold ${small ? "text-2xl" : "text-4xl"}`}>LFZ</span>
      <span className={`font-display uppercase tracking-[0.25em] text-bone ${small ? "text-[10px]" : "text-xs"}`}>BarberShop</span>
    </Link>
  );
}
