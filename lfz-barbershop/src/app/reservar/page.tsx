import { BookingCalendar } from "@/components/BookingCalendar";
import { Logo } from "@/components/Logo";
import { getBookingData } from "@/lib/booking";

export const dynamic = "force-dynamic";
export default async function Reservar() {
  const { service, settings, openWeekdays, availability } = await getBookingData();
  return (
    <main className="g-hero min-h-dvh px-5 py-6">
      <div className="mx-auto max-w-3xl">
        <Logo small />
        <h1 className="mb-6 mt-8 font-display text-4xl font-black uppercase">Reservá tu turno</h1>
        {service ? <BookingCalendar service={service} maxDays={settings?.max_advance_days ?? 30} openWeekdays={openWeekdays} availability={availability} /> : <p className="text-mute">Por el momento no hay turnos disponibles.</p>}
      </div>
    </main>
  );
}
