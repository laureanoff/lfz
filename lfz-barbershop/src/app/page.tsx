import Image from "next/image";
import { CalendarCheck, Clock, MapPin, MessageCircle, Navigation } from "lucide-react";
import { BookingCalendar } from "@/components/BookingCalendar";
import { LeafDivider } from "@/components/LeafDivider";
import { Logo } from "@/components/Logo";
import { Media, type MediaItem } from "@/components/Media";
import { Reveal } from "@/components/Reveal";
import { getBookingData } from "@/lib/booking";
import { createClient } from "@/lib/supabase/server";
import { hhmm, money } from "@/lib/utils";

export const revalidate = 60;
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
// Si todavía no cargaste fotos desde el panel, se usan estas de /public/gallery.
const FALLBACK: MediaItem[] = Array.from({ length: 8 }, (_, i) => ({ kind: "image", url: `/gallery/g${i + 1}.jpg`, fit: "cover", focus_x: 50, focus_y: 50, zoom: 1 }));
const TITLE = "Tu próximo corte, reservado en minutos.".split(" ");

function Row({ items, reverse = false }: { items: MediaItem[]; reverse?: boolean }) {
  return (
    <div className="marquee">
      <div className={`marquee-track ${reverse ? "rev" : ""}`}>
        {[...items, ...items].map((m, i) => (
          <div key={i} className="shot glass w-48 md:w-60">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.05rem] bg-black/40"><Media m={m} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function Home() {
  const { service, settings: s, hours, openWeekdays } = await getBookingData();
  const sb = await createClient();
  const { data: gal } = await sb.from("gallery_items").select("kind,url,fit,focus_x,focus_y,zoom").eq("is_active", true).order("display_order");
  let items: MediaItem[] = (gal as MediaItem[] | null)?.length ? (gal as MediaItem[]) : FALLBACK;
  while (items.length < 8) items = [...items, ...items];
  const half = Math.ceil(items.length / 2);
  const rowA = items, rowB = [...items.slice(half), ...items.slice(0, half)].reverse();
  const addr = String(s?.address ?? "");
  const mapQ = encodeURIComponent(!addr || /completar/i.test(addr) ? "Justiniano Posse, Córdoba, Argentina" : /posse/i.test(addr) ? addr : `${addr}, Justiniano Posse, Córdoba, Argentina`);

  return (
    <main className="pb-24 md:pb-0">
      <header className="fixed left-1/2 top-4 z-50 w-[min(94vw,1080px)] -translate-x-1/2">
        <div className="glass !rounded-full flex items-center justify-between px-5 py-2.5">
          <Logo small />
          <a href="#reservar" className="btn btn-primary !py-2 text-sm">RESERVAR TURNO</a>
        </div>
      </header>

      <section className="g-hero relative overflow-hidden">
        <div className="aurora" aria-hidden><i className="blob b1" /><i className="blob b2" /><i className="blob b3" /></div>
        <span aria-hidden className="pointer-events-none absolute -left-6 top-24 select-none font-display text-[20rem] font-black leading-none text-transparent [-webkit-text-stroke:1px_rgba(201,162,77,.16)] md:text-[32rem]">LFZ</span>
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-28 pt-36 md:grid-cols-[1.15fr_.85fr] md:pt-44">
          <div>
            <div className="word mb-6" style={{ animationDelay: "100ms" }}><Logo /></div>
            <h1 className="font-display text-6xl font-black uppercase leading-[0.92] md:text-8xl">
              {TITLE.map((w, i) => <span key={i} className="word" style={{ animationDelay: `${300 + i * 110}ms` }}>{w}</span>)}
            </h1>
            <p className="word mt-6 block max-w-md text-lg text-bone/70" style={{ animationDelay: "1.2s" }}>Elegí tu día y tu horario, y reservá en menos de un minuto.</p>
            <div className="word mt-8 flex flex-wrap gap-3" style={{ animationDelay: "1.4s" }}>
              <a href="#reservar" className="btn btn-primary">RESERVAR TURNO</a>
              <a href="#trabajos" className="btn btn-line">VER TRABAJOS</a>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="float glass p-2.5">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[1.3rem]">
                <Image src="/gallery/g2.jpg" alt="Degradé realizado en LFZ BarberShop" fill priority sizes="40vw" className="object-cover" />
              </div>
            </div>
            <div className="absolute -left-10 top-14"><div className="glass float flex items-center gap-2 !rounded-2xl px-4 py-3 text-sm [animation-delay:-2s]"><CalendarCheck size={16} className="text-gold" /> Turno online en 1 minuto</div></div>
            {service && <div className="absolute -right-4 bottom-12"><div className="glass float !rounded-2xl px-5 py-3 [animation-delay:-4s]"><p className="text-[10px] uppercase tracking-widest text-mute">Corte</p><p className="font-display text-3xl font-black text-gold">{money(Number(service.price))}</p></div></div>}
          </div>
        </div>
        <div className="pole-gold" />
      </section>

      <section id="reservar" className="g-book relative overflow-hidden">
        <div className="aurora" aria-hidden><i className="blob b1" /><i className="blob b2" /><i className="blob b3" /></div>
        <div className="relative mx-auto max-w-5xl px-5 py-24">
          <Reveal>
            <h2 className="font-display text-4xl font-black uppercase md:text-6xl">Sacá tu turno</h2>
            <p className="mt-3 max-w-lg text-bone/65">Elegí el día, elegí el horario y listo. Te confirmamos por WhatsApp.</p>
          </Reveal>
          <Reveal delay={120} className="mt-10">
            {service ? <BookingCalendar service={service} maxDays={s?.max_advance_days ?? 30} openWeekdays={openWeekdays} /> : <p className="text-mute">Por el momento no hay turnos disponibles.</p>}
          </Reveal>
        </div>
      </section>

      <section id="trabajos" className="g-gallery relative overflow-hidden py-24">
        <div className="aurora" aria-hidden><i className="blob b2" /><i className="blob b3" /></div>
        <div className="relative">
          <Reveal className="mx-auto max-w-6xl px-5"><h2 className="font-display text-4xl font-black uppercase md:text-6xl">Trabajos</h2></Reveal>
          <div className="mt-12 grid gap-5">
            <Row items={rowA} />
            <Row items={rowB} reverse />
          </div>
        </div>
      </section>

      <section className="g-info relative overflow-hidden">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-24 md:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Dónde y cuándo</h2>
            <p className="mt-6 flex items-center gap-2 text-bone/75"><MapPin size={16} className="text-gold" /> {s?.address}</p>
            <a href={`https://wa.me/${s?.whatsapp ?? ""}`} className="mt-3 flex items-center gap-2 text-bone/75 hover:text-bone"><MessageCircle size={16} className="text-gold" /> WhatsApp</a>
            <a href={`https://instagram.com/${s?.instagram}`} className="mt-3 block text-bone/75 hover:text-bone">@{s?.instagram}</a>
          </Reveal>
          <Reveal delay={120}>
            <ul className="glass divide-y divide-white/10 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const r = hours.filter((h) => h.weekday === d);
                return (
                  <li key={d} className="flex justify-between gap-4 px-6 py-3.5 text-sm">
                    <span className="flex items-center gap-2 font-medium"><Clock size={13} className="text-gold" /> {DAYS[d]}</span>
                    <span className="text-bone/65">{r.length ? r.map((h) => `${hhmm(h.open_time)}–${hhmm(h.close_time)}`).join("  ·  ") : "Cerrado"}</span>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </section>

      <section id="ubicacion" className="g-info relative overflow-hidden pb-24">
        <div className="relative mx-auto max-w-6xl px-5">
          <LeafDivider />
          <Reveal className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Cómo llegar</h2>
            <a href={`https://www.google.com/maps/search/?api=1&query=${mapQ}`} target="_blank" rel="noreferrer" className="btn btn-line text-sm"><Navigation size={15} /> ABRIR EN GOOGLE MAPS</a>
          </Reveal>
          <Reveal delay={120} className="mt-8">
            <div className="glass overflow-hidden p-2">
              <iframe title="Ubicación de LFZ BarberShop" src={`https://www.google.com/maps?q=${mapQ}&z=16&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="map-dark h-[22rem] w-full rounded-[1.4rem] border-0 md:h-[26rem]" />
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="g-foot">
        <div className="pole-gold" />
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
          <div><Logo small /><p className="mt-3 text-xs text-mute">© {new Date().getFullYear()} LFZ BarberShop · {s?.address}</p></div>
          <a href="#reservar" className="btn btn-primary">RESERVAR TURNO</a>
        </div>
      </footer>

      <div className="fixed inset-x-3 bottom-3 z-50 md:hidden">
        <div className="glass !rounded-2xl p-2"><a href="#reservar" className="btn btn-primary w-full">RESERVAR TURNO</a></div>
      </div>
    </main>
  );
}
