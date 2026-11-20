import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { pushReady, sendToSubs } from "@/lib/push";
import { fmtDate, hhmm } from "@/lib/utils";

export const runtime = "nodejs";

// Se llama desde la web justo después de que un cliente solicita un turno.
// Solo notifica si el turno existe, está pendiente, es reciente y no se avisó antes (no se puede usar para spam).
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pushReady() || !url || !key) return NextResponse.json({ skipped: true });
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (!code || !/^[A-Z0-9]{8}$/.test(code)) return NextResponse.json({ error: "bad code" }, { status: 400 });
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const since = new Date(Date.now() - 10 * 60e3).toISOString();
  const { data: apt } = await sb.from("appointments").update({ push_sent_at: new Date().toISOString() })
    .eq("booking_code", code).eq("status", "pending").is("push_sent_at", null).gte("created_at", since)
    .select("appointment_date,start_time,customers(full_name)").maybeSingle();
  if (!apt) return NextResponse.json({ skipped: true });
  const { data: subs } = await sb.from("push_subscriptions").select("endpoint,p256dh,auth");
  const name = (apt.customers as unknown as { full_name: string } | null)?.full_name ?? "Un cliente";
  const { sent, gone } = await sendToSubs(subs ?? [], { title: "Nueva solicitud de turno", body: `${name} · ${fmtDate(apt.appointment_date)} ${hhmm(apt.start_time)}`, url: "/admin", tag: "nuevo-turno" });
  if (gone.length) await sb.from("push_subscriptions").delete().in("endpoint", gone);
  return NextResponse.json({ sent });
}
