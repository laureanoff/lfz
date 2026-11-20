import { Field } from "@/components/admin/Field";
import { createClient } from "@/lib/supabase/server";
import { saveService } from "../actions";

export const dynamic = "force-dynamic";
type Sv = { id?: string; name?: string; description?: string | null; price?: number; duration_minutes?: number; display_order?: number; is_active?: boolean };

function ServiceForm({ sv, isNew = false }: { sv: Sv; isNew?: boolean }) {
  return (
    <form action={saveService} className="card grid gap-3 p-4 sm:grid-cols-6">
      <input type="hidden" name="id" value={sv.id ?? ""} />
      <Field label="Nombre" className="sm:col-span-3"><input className="input" name="name" defaultValue={sv.name} required /></Field>
      <Field label="Precio ($)" className="sm:col-span-1"><input className="input" name="price" type="number" min={0} step="100" defaultValue={sv.price} required /></Field>
      <Field label="Duración (min)" className="sm:col-span-1"><input className="input" name="duration" type="number" min={5} step={5} defaultValue={sv.duration_minutes ?? 30} required /></Field>
      <Field label="Orden" className="sm:col-span-1"><input className="input" name="order" type="number" defaultValue={sv.display_order ?? 0} /></Field>
      <Field label="Descripción" className="sm:col-span-6"><input className="input" name="description" defaultValue={sv.description ?? ""} /></Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-4"><input type="checkbox" name="active" defaultChecked={isNew ? true : sv.is_active} /> Visible en la web</label>
      <button className="btn btn-primary !py-2.5 text-sm sm:col-span-2">{isNew ? "AGREGAR" : "GUARDAR"}</button>
    </form>
  );
}

export default async function Servicios() {
  const sb = await createClient();
  const { data } = await sb.from("services").select("*").order("display_order");
  return (
    <main className="mt-8">
      <h1 className="font-display text-4xl font-black uppercase">Precio del corte</h1>
      <p className="mt-2 text-sm text-mute">Los cambios se ven en la web pública al guardar. Para ocultar un servicio, destildá “Visible en la web”.</p>
      <div className="mt-6 grid gap-3">{data?.map((sv) => <ServiceForm key={sv.id} sv={sv} />)}</div>
      <h2 className="mt-10 font-display text-2xl font-black uppercase">Nuevo servicio</h2>
      <div className="mt-3"><ServiceForm sv={{}} isNew /></div>
    </main>
  );
}
