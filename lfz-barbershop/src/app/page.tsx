import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { hhmm, money } from "@/lib/utils";

export const revalidate = 60;
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
// Fotos en /public/gallery (g1.jpg a g8.jpg). Reemplazalas por originales con el mismo nombre.
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
      <section className="g-hero relative overflow-hidden">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Logo />
          <Link href="/reservar" className="btn btn-primary !py-2.5 text-sm">RESERVAR TURNO</Link>
        </header>
        <span aria-hidden className="pointer-events-none absolute -left-6 top-24 select-none font-display text-[20rem] font-black leading-none text-transparent [-webkit-text-stroke:1px_rgba(201,162,77,.18)] md:text-[32rem]">LFZ</span>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-12 md:grid-cols-[1.15fr_.85fr] md:pb-32 md:pt-20">
          <div>
            <h1 className="font-display text-6xl font-black uppercase leading-[0.92] md:text-8xl">Tu próximo corte, reservado en minutos.</h1>
            <p className="mt-6 max-w-md text-lg text-bone/70">Elegí tu horario, reservá tu turno y dejá el resto en nuestras manos.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/reservar" className="btn btn-primary">RESERVAR TURNO</Link>
              <a href="#servicios" className="btn btn-line">VER SERVICIOS</a>
            </div>
          </div>
          <div className="relative hidden aspect-[3/4] overflow-hidden rounded-2xl border border-gold/30 shadow-[0_40px_90px_-30px_rgba(201,162,77,.45)] md:block">
            <Image src="/gallery/g2.jpg" alt="Degradé realizado en LFZ BarberShop" fill priority sizes="40vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        </div>
        <div className="hairline" />
      </section>

      <section id="servicios" className="g-mid">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Servicios</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services?.map((sv) => (
              <article key={sv.id} className="card flex flex-col p-6">
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
        </div>
      </section>

      <section className="g-gallery">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Trabajos</h2>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {GALLERY.map((src) => (
              <div key={src} className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10">
                <Image src={src} alt="Corte realizado en LFZ BarberShop" fill sizes="(min-width:768px) 25vw, 50vw" loading="lazy" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="g-info">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Dónde y cuándo</h2>
            <p className="mt-6 flex items-center gap-2 text-bone/75"><MapPin size={16} className="text-gold" /> {s?.address}</p>
            <a href={`https://wa.me/${s?.whatsapp ?? ""}`} className="mt-3 flex items-center gap-2 text-bone/75 hover:text-bone"><MessageCircle size={16} className="text-gold" /> WhatsApp</a>
            <a href={`https://instagram.com/${s?.instagram}`} className="mt-3 block text-bone/75 hover:text-bone">@{s?.instagram}</a>
          </div>
          <ul className="card divide-y divide-white/10">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const r = hours?.filter((h) => h.weekday === d);
              return (
                <li key={d} className="flex justify-between gap-4 px-5 py-3 text-sm">
                  <span className="font-medium">{DAYS[d]}</span>
                  <span className="text-bone/65">{r?.length ? r.map((h) => `${hhmm(h.open_time)}–${hhmm(h.close_time)}`).join("  ·  ") : "Cerrado"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <footer className="g-foot">
        <div className="hairline" />
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
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
