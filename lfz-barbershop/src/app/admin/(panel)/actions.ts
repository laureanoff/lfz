"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = ["confirmed", "rejected", "cancelled", "completed", "no_show"];
export async function setStatus(formData: FormData) {
  const id = String(formData.get("id")); const status = String(formData.get("status"));
  if (!ALLOWED.includes(status)) return;
  const sb = await createClient(); // RLS: solo un admin autenticado puede actualizar
  await sb.from("appointments").update({ status }).eq("id", id);
  revalidatePath("/admin");
}
export async function signOut() {
  const sb = await createClient(); await sb.auth.signOut(); redirect("/admin/login");
}

// ===== Gestión: servicios, horarios, bloqueos y ajustes (RLS: solo admin) =====
const refresh = () => ["/", "/reservar", "/admin/servicios", "/admin/horarios", "/admin/ajustes"].forEach((p) => revalidatePath(p));
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function saveService(f: FormData) {
  const id = str(f, "id");
  const row = { name: str(f, "name"), description: str(f, "description") || null, price: Number(f.get("price")),
    duration_minutes: Number(f.get("duration")), display_order: Number(f.get("order") || 0), is_active: f.get("active") === "on" };
  if (!row.name || !(row.price >= 0) || !(row.duration_minutes >= 5)) return;
  const sb = await createClient();
  if (id) await sb.from("services").update(row).eq("id", id); else await sb.from("services").insert(row);
  refresh();
}
export async function addHours(f: FormData) {
  const weekday = Number(f.get("weekday")), open = str(f, "open"), close = str(f, "close");
  if (!(weekday >= 0 && weekday <= 6) || !open || !close || close <= open) return;
  const sb = await createClient();
  await sb.from("business_hours").insert({ weekday, open_time: open, close_time: close });
  refresh();
}
export async function deleteHours(f: FormData) {
  const sb = await createClient(); await sb.from("business_hours").delete().eq("id", str(f, "id")); refresh();
}
export async function addBlock(f: FormData) {
  const start = str(f, "start"), end = str(f, "end");
  if (!start || !end || end <= start) return;
  const sb = await createClient();
  await sb.from("time_blocks").insert({ start_datetime: start, end_datetime: end, reason: str(f, "reason") || null });
  refresh();
}
export async function deleteBlock(f: FormData) {
  const sb = await createClient(); await sb.from("time_blocks").delete().eq("id", str(f, "id")); refresh();
}
export async function saveSettings(f: FormData) {
  const n = (k: string, min: number) => Math.max(min, Math.round(Number(f.get(k)) || 0));
  const sb = await createClient();
  await sb.from("settings").update({
    shop_name: str(f, "shop_name") || "LFZ BarberShop", address: str(f, "address"),
    instagram: str(f, "instagram").replace(/^@/, ""), whatsapp: str(f, "whatsapp").replace(/\D/g, ""),
    slot_step_minutes: Math.min(120, n("slot_step_minutes", 5)), min_notice_minutes: n("min_notice_minutes", 0),
    max_advance_days: n("max_advance_days", 1), pending_expiry_hours: n("pending_expiry_hours", 0),
    cancellation_policy: str(f, "cancellation_policy"),
  }).eq("id", 1);
  refresh();
}
