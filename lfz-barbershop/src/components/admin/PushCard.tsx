"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/app/admin/(panel)/actions";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const toBytes = (b64: string) => { const p = "=".repeat((4 - (b64.length % 4)) % 4); const r = atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };

export function PushCard({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<"loading" | "unsupported" | "off" | "on" | "denied">("loading");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      setState(sub && Notification.permission === "granted" ? "on" : "off");
    })();
  }, []);

  async function enable() {
    setBusy(true); setMsg("");
    try {
      if (!KEY) throw new Error("Faltan las claves de notificaciones en Vercel.");
      const reg = await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready;
      if ((await Notification.requestPermission()) !== "granted") { setState("denied"); return; }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(KEY) });
      const r = await savePushSubscription(JSON.parse(JSON.stringify(sub)), navigator.userAgent);
      if (!r.ok) throw new Error(r.error || "No se pudo guardar");
      setState("on"); setMsg("¡Listo! Este dispositivo ya recibe avisos.");
    } catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  }
  async function disable() {
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration("/sw.js"); const sub = await reg?.pushManager.getSubscription();
    if (sub) { await removePushSubscription(sub.endpoint); await sub.unsubscribe(); }
    setState("off"); setBusy(false); setMsg("");
  }
  async function test() { setBusy(true); const r = await sendTestPush(); setMsg(r.ok ? "Te mandamos una notificación de prueba." : r.error || "Error"); setBusy(false); }

  if (state === "loading") return null;
  if (compact && state === "on") return null;
  return (
    <div className="card mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">{state === "on" ? <Bell size={18} /> : <BellOff size={18} />}</span>
        <div>
          <p className="font-bold">{state === "on" ? "Notificaciones activadas en este dispositivo" : "Activá las notificaciones de turnos nuevos"}</p>
          <p className="mt-0.5 text-xs text-mute">
            {state === "unsupported" ? "Este navegador no las soporta. En iPhone: Compartir → Agregar a inicio, y abrí el panel desde ese ícono." :
             state === "denied" ? "Las bloqueaste en el navegador. Habilitalas desde el candado de la barra de direcciones." :
             "Te avisamos al instante cuando alguien pide un turno y, al tocar el aviso, se abre el panel."}
          </p>
          {msg && <p className="mt-1 text-xs text-gold">{msg}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        {state === "off" && <button disabled={busy} onClick={enable} className="btn btn-primary !py-2 text-xs">{busy ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />} ACTIVAR</button>}
        {state === "on" && (<>
          <button disabled={busy} onClick={test} className="btn btn-line !py-2 text-xs"><Send size={14} /> PROBAR</button>
          <button disabled={busy} onClick={disable} className="btn btn-line !py-2 text-xs">DESACTIVAR</button>
        </>)}
      </div>
    </div>
  );
}
