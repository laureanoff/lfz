import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { hhmm, money } from "@/lib/utils";

export const revalidate = 60;
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
// Fotos reales en /public/gallery. Para reemplazarlas por originales, subí archivos con el mismo nombre.
const GALLERY = Array.from({ length: 8 }, (_, i) => `/gallery/g${i + 1}.jpg`);

export default async function Home() {
  const sb = await createClient();
  const [{ data: services }, { data: s }, { data: hours }] = await Promise.all([
    sb.from("services").select("*").order("display_order"),
    sb.from("settings").select("*").eq("id", 1).single(),
    sb.from("business_hours").select("*").order("open_time"),
  ]);

  return (
    <main className="pb-24 md:pb-0">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src="/gallery/hero.jpg" alt="" fill priority sizes="100vw" className="hero-photo object-cover object-[50%_30%]" />
          <div className="hero-shade absolute inset-0" />
        </div>
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Logo />
          <Link href="/reservar" className="btn btn-primary !py-2.5 text-sm">RESERVAR TURNO</Link>
        </header>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-10 md:grid-cols-[1.15fr_.85fr] md:pb-32 md:pt-16">
          <div>
            <h1 className="font-display text-6xl font-black uppercase leading-[0.9] md:text-8xl">Tu próximo corte, reservado en minutos.</h1>
            <p className="mt-6 max-w-md text-lg text-bone/70">Elegí tu horario, reservá tu turno y dejá el resto en nuestras manos.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/reservar" className="btn btn-primary">RESERVAR TURNO</Link>
              <a href="#servicios" className="btn btn-line">VER SERVICIOS</a>
            </div>
          </div>
          <div aria-hidden className="flicker select-none text-center">
            <div className="neon font-display text-[9rem] font-black leading-[0.8] md:text-[14rem]">LFZ</div>
            <div className="neon-soft mt-3 font-display text-2xl font-bold uppercase tracking-[0.45em] text-bone md:text-4xl">Barbershop</div>
          </div>
        </div>
        <div className="pole" />
      </section>

      <section id="servicios" className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1.3fr_.7fr]">
        <div className="board plaster p-6 md:p-10">
          <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Servicios</h2>
          <ul className="mt-6 divide-y divide-white/10">
            {services?.map((sv) => (
              <li key={sv.id} className="py-5">
                <div className="flex items-baseline gap-3">
                  <h3 className="font-display text-2xl font-bold uppercase md:text-3xl">{sv.name}</h3>
                  <span className="leader flex-1" />
                  <span className="font-display text-3xl font-bold text-gold">{money(Number(sv.price))}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-4">
                  <p className="text-sm text-mute">{sv.description} <span className="whitespace-nowrap">· <Clock size={12} className="mb-0.5 inline" /> {sv.duration_minutes} min</span></p>
                  <Link href={`/reservar?servicio=${sv.id}`} className="shrink-0 text-sm font-bold text-neon hover:underline">Reservar</Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="frame hidden self-start lg:block">
          <div className="relative aspect-[3/4]"><Image src="/gallery/g6.jpg" alt="Corte con degradé en LFZ BarberShop" fill sizes="30vw" className="object-cover" /></div>
        </div>
      </section>

      <section className="plaster border-y border-white/10 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Trabajos</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {GALLERY.map((src, i) => (
              <div key={src} className={`frame ${i % 2 ? "md:translate-y-6" : ""}`}>
                <div className="relative aspect-[4/5]"><Image src={src} alt="Corte realizado en LFZ BarberShop" fill sizes="(min-width:768px) 25vw, 50vw" loading="lazy" className="object-cover" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Dónde y cuándo</h2>
          <p className="mt-6 flex items-center gap-2 text-bone/75"><MapPin size={16} className="text-neon" /> {s?.address}</p>
          <a href={`https://wa.me/${s?.whatsapp ?? ""}`} className="mt-3 flex items-center gap-2 text-bone/75 hover:text-bone"><MessageCircle size={16} className="text-neon" /> WhatsApp</a>
          <a href={`https://instagram.com/${s?.instagram}`} className="mt-3 block text-bone/75 hover:text-bone">@{s?.instagram}</a>
        </div>
        <ul className="tile divide-y divide-white/10 border border-white/10 shadow-[0_24px_50px_-20px_#000]">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const r = hours?.filter((h) => h.weekday === d);
            return (
              <li key={d} className="flex justify-between gap-4 bg-black/35 px-5 py-3 text-sm">
                <span className="font-bold">{DAYS[d]}</span>
                <span className="text-bone/70">{r?.length ? r.map((h) => `${hhmm(h.open_time)}–${hhmm(h.close_time)}`).join("  ·  ") : "Cerrado"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <footer>
        <div className="pole" />
        <div className="plaster mx-auto flex max-w-none flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center md:px-[max(1.25rem,calc((100vw-72rem)/2))]">
          <div><Logo small /><p className="mt-3 text-xs text-mute">© {new Date().getFullYear()} LFZ BarberShop · {s?.address}</p></div>
          <Link href="/reservar" className="btn btn-primary">RESERVAR TURNO</Link>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink/90 p-3 backdrop-blur md:hidden">
        <Link href="/reservar" className="btn btn-primary w-full">RESERVAR TURNO</Link>
      </div>
    </main>
  );
}
