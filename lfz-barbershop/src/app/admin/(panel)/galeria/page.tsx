import { createClient } from "@/lib/supabase/server";
import { GalleryManager, type Hero, type Item } from "./GalleryManager";

export const dynamic = "force-dynamic";
export default async function Galeria() {
  const sb = await createClient();
  const [{ data }, { data: st }] = await Promise.all([
    sb.from("gallery_items").select("*").order("display_order"),
    sb.from("settings").select("hero_url,hero_kind,hero_fit,hero_focus_x,hero_focus_y,hero_zoom").eq("id", 1).single(),
  ]);
  const hero: Hero = { url: st?.hero_url ?? null, kind: st?.hero_kind ?? "image", fit: st?.hero_fit ?? "cover", focus_x: st?.hero_focus_x ?? 50, focus_y: st?.hero_focus_y ?? 50, zoom: Number(st?.hero_zoom ?? 1) };
  return (
    <main className="mt-6">
      <h1 className="font-display text-4xl font-black uppercase">Galería</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">Subí fotos o videos y aparecen en el carrusel de “Trabajos” de la web. Ajustá cada uno al recuadro con el encuadre y el zoom. Si no hay ninguno cargado, la web muestra las fotos de ejemplo.</p>
      <GalleryManager initial={(data ?? []) as Item[]} initialHero={hero} />
    </main>
  );
}
