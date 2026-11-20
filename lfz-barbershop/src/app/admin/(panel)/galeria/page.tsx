import { createClient } from "@/lib/supabase/server";
import { GalleryManager, type Item } from "./GalleryManager";

export const dynamic = "force-dynamic";
export default async function Galeria() {
  const sb = await createClient();
  const { data } = await sb.from("gallery_items").select("*").order("display_order");
  return (
    <main className="mt-6">
      <h1 className="font-display text-4xl font-black uppercase">Galería</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">Subí fotos o videos y aparecen en el carrusel de “Trabajos” de la web. Ajustá cada uno al recuadro con el encuadre y el zoom. Si no hay ninguno cargado, la web muestra las fotos de ejemplo.</p>
      <GalleryManager initial={(data ?? []) as Item[]} />
    </main>
  );
}
