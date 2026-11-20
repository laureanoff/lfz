import { createClient } from "@/lib/supabase/server";

// Un único servicio: se toma el primero activo (precio y duración se editan en /admin/servicios).
export async function getBookingData() {
  const sb = await createClient();
  const [{ data: services }, { data: settings }, { data: hours }] = await Promise.all([
    sb.from("services").select("id,name,description,price,duration_minutes").eq("is_active", true).order("display_order").limit(1),
    sb.from("settings").select("*").eq("id", 1).single(),
    sb.from("business_hours").select("*").order("open_time"),
  ]);
  const h = hours ?? [];
  const service = services?.[0] ?? null;
  // Turnos libres por día (si la migración 3 todavía no está aplicada, queda vacío y no se muestra urgencia).
  const availability: Record<string, number> = {};
  if (service) {
    const { data } = await sb.rpc("get_availability_summary", { p_service_id: service.id });
    (data as { day: string; free: number }[] | null)?.forEach((r) => { availability[r.day] = r.free; });
  }
  return { service, availability, settings, hours: h, openWeekdays: Array.from(new Set(h.map((x) => x.weekday as number))) };
}
