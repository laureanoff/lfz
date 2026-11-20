import Image from "next/image";
export function LeafDivider() {
  return (
    <div className="mx-auto flex max-w-sm items-center gap-4 py-3" aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/60" />
      <Image src="/leaf.png" alt="" width={160} height={122} className="h-7 w-auto opacity-90" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/60" />
    </div>
  );
}
