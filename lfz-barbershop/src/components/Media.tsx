export type MediaItem = { kind: "image" | "video"; url: string; fit: "cover" | "contain"; focus_x: number; focus_y: number; zoom: number };
// Foto o video ajustado a su recuadro. "contain" muestra todo el contenido sobre un fondo desenfocado.
export function Media({ m, eager = false }: { m: MediaItem; eager?: boolean }) {
  const pos = `${m.focus_x}% ${m.focus_y}%`;
  const style: React.CSSProperties = { objectFit: m.fit, objectPosition: pos, transform: m.zoom !== 1 ? `scale(${m.zoom})` : undefined, transformOrigin: pos };
  const base = "absolute inset-0 h-full w-full";
  return (
    <>
      {m.fit === "contain" && m.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img aria-hidden alt="" src={m.url} className={`${base} scale-125 object-cover opacity-50 blur-2xl`} />
      )}
      {m.kind === "video" ? (
        <video src={m.url} muted loop playsInline autoPlay preload="metadata" className={base} style={style} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.url} alt="Trabajo realizado en LFZ BarberShop" loading={eager ? "eager" : "lazy"} decoding="async" className={base} style={style} />
      )}
    </>
  );
}
