import { Field } from "@/components/admin/Field";
import { PushCard } from "@/components/admin/PushCard";
import { createClient } from "@/lib/supabase/server";
import { saveSettings } from "../actions";

export const dynamic = "force-dynamic";
export default async function Ajustes() {
  const sb = await createClient();
  const { data: s } = await sb.from("settings").select("*").eq("id", 1).single();
  return (
    <main className="mt-8">
      <h1 className="font-display text-4xl font-black uppercase">Ajustes</h1>
      <PushCard />
      <form action={saveSettings} className="card mt-6 grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Nombre de la barbería"><input className="input" name="shop_name" defaultValue={s?.shop_name} /></Field>
        <Field label="Dirección"><input className="input" name="address" defaultValue={s?.address} /></Field>
        <Field label="Instagram (sin @)"><input className="input" name="instagram" defaultValue={s?.instagram} /></Field>
        <Field label="WhatsApp con código de país (ej: 5493537123456)"><input className="input" name="whatsapp" inputMode="numeric" defaultValue={s?.whatsapp} /></Field>
        <Field label="Anticipación mínima para reservar (min)"><input className="input" type="number" min={0} name="min_notice_minutes" defaultValue={s?.min_notice_minutes} /></Field>
        <Field label="Reservas hasta (días adelante)"><input className="input" type="number" min={1} name="max_advance_days" defaultValue={s?.max_advance_days} /></Field>
        <Field label="Intervalo mínimo entre horarios (min) · si el corte dura más, se usa su duración"><input className="input" type="number" min={5} max={120} step={5} name="slot_step_minutes" defaultValue={s?.slot_step_minutes} /></Field>
        <Field label="Horas para liberar una solicitud pendiente (0 = nunca)"><input className="input" type="number" min={0} name="pending_expiry_hours" defaultValue={s?.pending_expiry_hours} /></Field>
        <Field label="Política de cancelación" className="sm:col-span-2"><textarea className="input" rows={2} name="cancellation_policy" defaultValue={s?.cancellation_policy} /></Field>
        <button className="btn btn-primary sm:col-span-2">GUARDAR AJUSTES</button>
      </form>
    </main>
  );
}
