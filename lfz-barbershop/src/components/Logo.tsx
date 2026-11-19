import Link from "next/link";
export function Logo({ href = "/", small = false }: { href?: string; small?: boolean }) {
  return (
    <Link href={href} className="inline-flex flex-col items-center leading-none" aria-label="LFZ BarberShop">
      <span className={`neon font-display font-black ${small ? "text-3xl" : "text-5xl"}`}>LFZ</span>
      <span className={`font-display font-bold uppercase text-bone neon-soft ${small ? "text-[8px] tracking-[0.34em]" : "text-[10px] tracking-[0.4em]"}`}>BarberShop</span>
    </Link>
  );
}
