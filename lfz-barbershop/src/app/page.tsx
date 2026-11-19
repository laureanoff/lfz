import Link from "next/link";
import { Clock, MapPin, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { hhmm, money } from "@/lib/utils";

export const revalidate = 60;
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
// Fotos reales: copiá las imágenes a /public/gallery y agregalas acá (ej: "/gallery/corte1.jpg")
const GALLERY: string[] = [];

export default async function Home() {
  const sb = await createClient();
  const [{ data: services }, { data: s }, { data: hours }] = await Promise.all([
    sb.from("services").select("*").order("display_order"),
    sb.from("settings").select("*").eq("id", 1).single(),
    sb.from("business_hours").select("*").order("open_time"),
  ]);
  const wa = `https://wa.me/${s?.whatsapp ?? ""}`;

  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Link href="/reservar" className="btn btn-gold !py-2.5 text-sm">RESERVAR TURNO</Link>
      </header>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-5 pb-20 pt-14 md:pt-24">
        <span aria-hidden className="pointer-events-none absolute -right-6 top-0 select-none font-display text-[22rem] font-black leading-none text-transparent [-webkit-text-stroke:1px_var(--color-line)] md:text-[34rem]">LFZ</span>
        <div className="hero-in relative max-w-2xl">
          <h1 className="font-display text-6xl font-black uppercase leading-[0.92] md:text-8xl">Tu próximo corte, reservado en minutos.</h1>
          <p className="mt-6 max-w-md text-lg text-mute">Elegí tu horario, reservá tu turno y dejá el resto en nuestras manos.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/reservar" className="btn btn-gold">RESERVAR TURNO</Link>
            <a href="#servicios" className="btn btn-line">VER SERVICIOS</a>
          </div>
        </div>
      </section>

      <section id="servicios" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Servicios</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services?.map((sv) => (
            <article key={sv.id} className="flex flex-col rounded-2xl border border-line bg-coal p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold">{sv.name}</h3>
                <span className="font-display text-2xl font-bold text-gold">{money(Number(sv.price))}</span>
              </div>
              <p className="mt-2 flex-1 text-sm text-mute">{sv.description}</p>
              <p className="mt-4 flex items-center gap-2 text-sm text-mute"><Clock size={14} /> {sv.duration_minutes} min</p>
              <Link href={`/reservar?servicio=${sv.id}`} className="btn btn-line mt-5 text-sm">Reservar este servicio</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Trabajos</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(GALLERY.length ? GALLERY : Array.from({ length: 8 }, () => "")).map((src, i) => (
            <div key={i} className={`overflow-hidden rounded-xl border border-line bg-coal ${i % 5 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {src ? <img src={src} alt="Corte realizado en LFZ BarberShop" loading="lazy" className="h-full w-full object-cover" /> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Dónde y cuándo</h2>
          <p className="mt-6 flex items-center gap-2 text-mute"><MapPin size={16} className="text-gold" /> {s?.address}</p>
          <a href={wa} className="mt-3 flex items-center gap-2 text-mute hover:text-bone"><MessageCircle size={16} className="text-gold" /> WhatsApp</a>
          <a href={`https://instagram.com/${s?.instagram}`} className="mt-3 block text-mute hover:text-bone">@{s?.instagram}</a>
        </div>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-coal">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const r = hours?.filter((h) => h.weekday === d);
            return (
              <li key={d} className="flex justify-between gap-4 px-5 py-3 text-sm">
                <span>{DAYS[d]}</span>
                <span className="text-mute">{r?.length ? r.map((h) => `${hhmm(h.open_time)}–${hhmm(h.close_time)}`).join("  ·  ") : "Cerrado"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
          <div><Logo small /><p className="mt-3 text-xs text-mute">© {new Date().getFullYear()} LFZ BarberShop · {s?.address}</p></div>
          <Link href="/reservar" className="btn btn-gold">RESERVAR TURNO</Link>
        </div>
      </footer>
    </main>
  );
}
