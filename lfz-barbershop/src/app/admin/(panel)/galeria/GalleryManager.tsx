"use client";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Save, Trash2, Upload } from "lucide-react";
import { Media } from "@/components/Media";
import { createClient } from "@/lib/supabase/client";
import { refreshSite } from "../actions";

export type Hero = { url: string | null; kind: "image" | "video"; fit: "cover" | "contain"; focus_x: number; focus_y: number; zoom: number };
export type Item = { id: string; kind: "image" | "video"; url: string; storage_path: string; fit: "cover" | "contain"; focus_x: number; focus_y: number; zoom: number; display_order: number; is_active: boolean };
const MAX_VIDEO = 50 * 1024 * 1024;

async function resize(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("resize"))), "image/jpeg", 0.86));
}

export function GalleryManager({ initial, initialHero }: { initial: Item[]; initialHero: Hero }) {
  const sb = useRef(createClient()).current;
  const [items, setItems] = useState<Item[]>(initial);
  const [hero, setHero] = useState<Hero>(initialHero); const [heroSaved, setHeroSaved] = useState(false);
  const [busy, setBusy] = useState(""); const [note, setNote] = useState(""); const [saved, setSaved] = useState("");
  const set = (id: string, patch: Partial<Item>) => { setSaved(""); setItems((l) => l.map((i) => (i.id === id ? { ...i, ...patch } : i))); };

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setNote("");
    let order = items.reduce((m, i) => Math.max(m, i.display_order), 0);
    for (const file of Array.from(files)) {
      const video = file.type.startsWith("video/");
      if (!video && !file.type.startsWith("image/")) { setNote(`“${file.name}” no es una foto ni un video.`); continue; }
      if (video && file.size > MAX_VIDEO) { setNote(`“${file.name}” pesa más de 50 MB. Comprimilo antes de subirlo.`); continue; }
      setBusy(`Subiendo ${file.name}…`);
      try {
        const body: Blob = video ? file : await resize(file);
        const ext = video ? (file.name.split(".").pop() || "mp4").toLowerCase() : "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const up = await sb.storage.from("gallery").upload(path, body, { contentType: video ? file.type : "image/jpeg", cacheControl: "31536000" });
        if (up.error) throw up.error;
        const url = sb.storage.from("gallery").getPublicUrl(path).data.publicUrl;
        const { data, error } = await sb.from("gallery_items").insert({ kind: video ? "video" : "image", url, storage_path: path, display_order: ++order }).select().single();
        if (error) throw error;
        setItems((l) => [...l, data as Item]);
      } catch (e) { setNote(`No se pudo subir “${file.name}”: ${(e as Error).message}`); }
    }
    setBusy(""); await refreshSite();
  }

  const heroMedia = { kind: hero.kind, url: hero.url ?? "/gallery/g2.jpg", fit: hero.fit, focus_x: hero.focus_x, focus_y: hero.focus_y, zoom: hero.zoom };
  const setH = (patch: Partial<Hero>) => { setHeroSaved(false); setHero((h) => ({ ...h, ...patch })); };
  async function uploadHero(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return setNote("Elegí una foto o un video.");
    const video = file.type.startsWith("video/");
    if (video && file.size > MAX_VIDEO) return setNote("El video pesa más de 50 MB.");
    setBusy("Subiendo foto principal…"); setNote("");
    try {
      const body: Blob = video ? file : await resize(file, 1800);
      const path = `hero-${crypto.randomUUID()}.${video ? (file.name.split(".").pop() || "mp4").toLowerCase() : "jpg"}`;
      const up = await sb.storage.from("gallery").upload(path, body, { contentType: video ? file.type : "image/jpeg", cacheControl: "31536000" });
      if (up.error) throw up.error;
      setH({ url: sb.storage.from("gallery").getPublicUrl(path).data.publicUrl, kind: video ? "video" : "image", fit: "cover", focus_x: 50, focus_y: 50, zoom: 1 });
    } catch (e) { setNote(`No se pudo subir: ${(e as Error).message}`); }
    setBusy("");
  }
  async function saveHero() {
    setBusy("Guardando foto principal…");
    const { error } = await sb.from("settings").update({ hero_url: hero.url, hero_kind: hero.kind, hero_fit: hero.fit, hero_focus_x: hero.focus_x, hero_focus_y: hero.focus_y, hero_zoom: hero.zoom }).eq("id", 1);
    setBusy(""); if (error) return setNote(error.message);
    setHeroSaved(true); await refreshSite();
  }
  function useAsHero(i: Item) { setH({ url: i.url, kind: i.kind, fit: "cover", focus_x: i.focus_x, focus_y: i.focus_y, zoom: i.zoom }); window.scrollTo({ top: 0, behavior: "smooth" }); setNote("Ajustala acá arriba y tocá “Guardar foto principal”."); }

  async function save(i: Item) {
    setBusy("Guardando…");
    const { error } = await sb.from("gallery_items").update({ fit: i.fit, focus_x: i.focus_x, focus_y: i.focus_y, zoom: i.zoom, is_active: i.is_active }).eq("id", i.id);
    setBusy(""); if (error) return setNote(error.message);
    setSaved(i.id); await refreshSite();
  }
  async function remove(i: Item) {
    if (!confirm("¿Eliminar este archivo de la galería?")) return;
    setBusy("Eliminando…");
    await sb.storage.from("gallery").remove([i.storage_path]);
    await sb.from("gallery_items").delete().eq("id", i.id);
    setItems((l) => l.filter((x) => x.id !== i.id)); setBusy(""); await refreshSite();
  }
  async function move(idx: number, dir: -1 | 1) {
    const j = idx + dir; if (j < 0 || j >= items.length) return;
    const a = items[idx], b = items[j];
    const next = [...items]; next[idx] = { ...b, display_order: a.display_order }; next[j] = { ...a, display_order: b.display_order };
    setItems(next);
    await Promise.all([sb.from("gallery_items").update({ display_order: b.display_order }).eq("id", a.id), sb.from("gallery_items").update({ display_order: a.display_order }).eq("id", b.id)]);
    await refreshSite();
  }

  return (
    <div className="mt-6">
      <section className="card grid gap-5 p-4 sm:grid-cols-[210px_1fr]">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-black/50"><Media m={heroMedia} /></div>
          <p className="mt-2 text-center text-[11px] text-mute">Así se ve en la portada</p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-black uppercase">Foto principal de la portada</h2>
          <p className="mt-1 text-xs text-mute">Es la imagen grande que aparece al entrar a la web. Subí una nueva o elegí una de la galería con “Usar como principal”.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="btn btn-line cursor-pointer !py-2 text-xs"><Upload size={14} /> SUBIR OTRA<input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(e) => { uploadHero(e.target.files?.[0]); e.target.value = ""; }} /></label>
            {hero.url && <button onClick={() => setH({ url: null, kind: "image", fit: "cover", focus_x: 50, focus_y: 50, zoom: 1 })} className="btn btn-line !py-2 text-xs">VOLVER A LA ORIGINAL</button>}
          </div>
          <div className="mt-3 grid max-w-sm grid-cols-2 gap-2 text-xs">
            {(["cover", "contain"] as const).map((f) => (
              <button key={f} onClick={() => setH({ fit: f })} aria-pressed={hero.fit === f} className={`rounded-lg border py-2 font-semibold ${hero.fit === f ? "border-gold bg-gold/15 text-gold" : "border-white/10 text-mute"}`}>{f === "cover" ? "Llenar recuadro" : "Mostrar completa"}</button>
            ))}
          </div>
          {([["Encuadre horizontal", "focus_x", 0, 100, 1], ["Encuadre vertical", "focus_y", 0, 100, 1], ["Zoom", "zoom", 1, 3, 0.05]] as const).map(([label, key, min, max, step]) => (
            <label key={key} className="mt-2 grid max-w-sm gap-1 text-[11px] text-mute">{label}
              <input type="range" min={min} max={max} step={step} value={hero[key]} onChange={(e) => setH({ [key]: Number(e.target.value) } as Partial<Hero>)} className="accent-[#e3b341]" /></label>
          ))}
          <button onClick={saveHero} className="btn btn-primary mt-4 !py-2.5 text-xs"><Save size={14} /> {heroSaved ? "GUARDADO" : "GUARDAR FOTO PRINCIPAL"}</button>
        </div>
      </section>

      <label className="card mt-6 flex cursor-pointer flex-col items-center gap-2 border-dashed !border-gold/40 p-8 text-center transition hover:!border-gold">
        <Upload className="text-gold" />
        <span className="font-bold">Tocá para subir fotos o videos</span>
        <span className="text-xs text-mute">JPG, PNG, WEBP, MP4, WEBM o MOV · videos de hasta 50 MB · podés elegir varios</span>
        <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
      </label>
      {busy && <p className="mt-3 flex items-center gap-2 text-sm text-gold"><Loader2 size={14} className="animate-spin" /> {busy}</p>}
      {note && <p role="alert" className="mt-3 text-sm text-red-300">{note}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && <p className="card p-5 text-sm text-mute sm:col-span-2 lg:col-span-3">Todavía no cargaste nada. Mientras tanto la web usa fotos de ejemplo.</p>}
        {items.map((i, idx) => (
          <article key={i.id} className={`card p-3 ${i.is_active ? "" : "opacity-60"}`}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-black/50"><Media m={i} /></div>
            <p className="mt-2 text-center text-[11px] text-mute">Así se ve en la web (recuadro 4:5)</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {(["cover", "contain"] as const).map((f) => (
                <button key={f} onClick={() => set(i.id, { fit: f })} aria-pressed={i.fit === f} className={`rounded-lg border py-2 font-semibold ${i.fit === f ? "border-gold bg-gold/15 text-gold" : "border-white/10 text-mute"}`}>{f === "cover" ? "Llenar recuadro" : "Mostrar completa"}</button>
              ))}
            </div>
            {([["Encuadre horizontal", "focus_x", 0, 100, 1], ["Encuadre vertical", "focus_y", 0, 100, 1], ["Zoom", "zoom", 1, 3, 0.05]] as const).map(([label, key, min, max, step]) => (
              <label key={key} className="mt-2 grid gap-1 text-[11px] text-mute">{label}
                <input type="range" min={min} max={max} step={step} value={i[key]} onChange={(e) => set(i.id, { [key]: Number(e.target.value) } as Partial<Item>)} className="accent-[#e3b341]" /></label>
            ))}
            <button onClick={() => useAsHero(i)} className="btn btn-line mt-3 w-full !py-1.5 text-[11px]">USAR COMO PRINCIPAL</button>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex gap-1">
                <button aria-label="Mover antes" disabled={idx === 0} onClick={() => move(idx, -1)} className="nav-btn"><ArrowLeft size={15} /></button>
                <button aria-label="Mover después" disabled={idx === items.length - 1} onClick={() => move(idx, 1)} className="nav-btn"><ArrowRight size={15} /></button>
                <button aria-label={i.is_active ? "Ocultar" : "Mostrar"} onClick={() => set(i.id, { is_active: !i.is_active })} className="nav-btn">{i.is_active ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                <button aria-label="Eliminar" onClick={() => remove(i)} className="nav-btn text-red-300"><Trash2 size={15} /></button>
              </div>
              <button onClick={() => save(i)} className="btn btn-primary !px-4 !py-2 text-xs"><Save size={14} /> {saved === i.id ? "GUARDADO" : "GUARDAR"}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
