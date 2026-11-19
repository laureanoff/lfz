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
