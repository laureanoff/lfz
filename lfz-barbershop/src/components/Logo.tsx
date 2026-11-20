import Image from "next/image";
import Link from "next/link";
export function Logo({ href = "/", small = false }: { href?: string; small?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center" aria-label="LFZ BarberShop">
      <Image src="/logo.png" alt="LFZ BarberShop" width={900} height={600} priority className={small ? "h-11 w-auto" : "h-20 w-auto"} />
    </Link>
  );
}
