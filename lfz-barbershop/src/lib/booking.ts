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
  return { service: services?.[0] ?? null, settings, hours: h, openWeekdays: Array.from(new Set(h.map((x) => x.weekday as number))) };
}
