import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { NeonSign } from "@/components/NeonSign";
import { createClient } from "@/lib/supabase/server";
import { hhmm, money } from "@/lib/utils";

export const revalidate = 60;
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
// Fotos reales en /public/gallery (g1.jpg a g8.jpg). Reemplazalas por originales con el mismo nombre.
const GALLERY = Array.from({ length: 8 }, (_, i) => `/gallery/g${i + 1}.jpg`);
const TILT = ["-rotate-[1.6deg]", "rotate-[1.2deg]", "rotate-[0.8deg]", "-rotate-[1.1deg]"];

function Hung({ src, className = "", ratio = "aspect-[4/5]" }: { src: string; className?: string; ratio?: string }) {
  return (
    <div className={`hang ${className}`}>
      <div className="mat"><div className={`relative ${ratio}`}>
        <Image src={src} alt="Corte realizado en LFZ BarberShop" fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover" />
      </div></div>
    </div>
  );
}

export default async function Home() {
  const sb = await createClient();
  const [{ data: services }, { data: s }, { data: hours }] = await Promise.all([
    sb.from("services").select("*").order("display_order"),
    sb.from("settings").select("*").eq("id", 1).single(),
    sb.from("business_hours").select("*").order("open_time"),
  ]);

  return (
    <main className="pb-24 md:pb-0">
      {/* PARED DE LADRILLO + LETRERO */}
      <section className="brick relative isolate overflow-hidden">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Logo small />
          <Link href="/reservar" className="btn btn-primary !py-2.5 text-sm">RESERVAR TURNO</Link>
        </header>
        <div className="mx-auto max-w-4xl px-5 pb-20 pt-2 text-center">
          <NeonSign className="flicker mx-auto w-[min(92vw,620px)]" />
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl uppercase leading-[1.02] md:text-6xl">Tu próximo corte, reservado en minutos.</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-bone/75">Elegí tu horario, reservá tu turno y dejá el resto en nuestras manos.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/reservar" className="btn btn-primary">RESERVAR TURNO</Link>
            <a href="#servicios" className="btn btn-line">VER SERVICIOS</a>
          </div>
        </div>
        <div className="pole" />
      </section>

      {/* PARED AMARILLA: servicios y cuadros */}
      <section id="servicios" className="wall relative">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-20">
          <div className="grid items-start gap-12 lg:grid-cols-[1.25fr_.75fr]">
            <div className="board plaster p-6 text-bone md:p-10">
              <h2 className="font-display text-4xl uppercase md:text-5xl">Servicios</h2>
              <ul className="mt-6 divide-y divide-white/10">
                {services?.map((sv) => (
                  <li key={sv.id} className="py-5">
                    <div className="flex items-baseline gap-3">
                      <h3 className="font-display text-2xl uppercase md:text-3xl">{sv.name}</h3>
                      <span className="leader flex-1" />
                      <span className="font-display text-3xl text-gold">{money(Number(sv.price))}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-4">
                      <p className="text-sm text-mute">{sv.description} <span className="whitespace-nowrap">· <Clock size={12} className="mb-0.5 inline" /> {sv.duration_minutes} min</span></p>
                      <Link href={`/reservar?servicio=${sv.id}`} className="shrink-0 text-sm font-bold text-neon hover:underline">Reservar</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden grid-cols-2 gap-6 lg:grid">
              <Hung src={GALLERY[1]} className="-rotate-[2deg]" ratio="aspect-[3/5]" />
              <Hung src={GALLERY[2]} className="mt-10 rotate-[1.5deg]" ratio="aspect-[3/5]" />
            </div>
          </div>

          <h2 className="mt-24 font-display text-4xl uppercase md:text-5xl">Trabajos</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-x-8">
            {GALLERY.map((src, i) => <Hung key={src} src={src} className={TILT[i % 4]} />)}
          </div>
        </div>
        <div className="baseboard" />
      </section>

      {/* PISO A CUADROS: dónde y cuándo */}
      <section className="floor">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
          <div className="board plaster p-6 text-bone md:p-10">
            <h2 className="font-display text-4xl uppercase md:text-5xl">Dónde y cuándo</h2>
            <p className="mt-6 flex items-center gap-2 text-bone/80"><MapPin size={16} className="text-neon" /> {s?.address}</p>
            <a href={`https://wa.me/${s?.whatsapp ?? ""}`} className="mt-3 flex items-center gap-2 text-bone/80 hover:text-bone"><MessageCircle size={16} className="text-neon" /> WhatsApp</a>
            <a href={`https://instagram.com/${s?.instagram}`} className="mt-3 block text-bone/80 hover:text-bone">@{s?.instagram}</a>
          </div>
          <ul className="board plaster divide-y divide-white/10 text-bone">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const r = hours?.filter((h) => h.weekday === d);
              return (
                <li key={d} className="flex justify-between gap-4 px-6 py-3 text-sm">
                  <span className="font-bold">{DAYS[d]}</span>
                  <span className="text-bone/70">{r?.length ? r.map((h) => `${hhmm(h.open_time)}–${hhmm(h.close_time)}`).join("  ·  ") : "Cerrado"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <footer>
        <div className="pole" />
        <div className="brick">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
            <div><Logo small /><p className="mt-3 text-xs text-bone/60">© {new Date().getFullYear()} LFZ BarberShop · {s?.address}</p></div>
            <Link href="/reservar" className="btn btn-primary">RESERVAR TURNO</Link>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink/90 p-3 backdrop-blur md:hidden">
        <Link href="/reservar" className="btn btn-primary w-full">RESERVAR TURNO</Link>
      </div>
    </main>
  );
}
