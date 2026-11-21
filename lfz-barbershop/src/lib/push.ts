import webpush from "web-push";

export type Sub = { endpoint: string; p256dh: string; auth: string };

// Tolera errores comunes al pegar las claves en Vercel: espacios, comillas, "NOMBRE=" delante o "=" al final.
export const cleanKey = (v?: string) => (v ?? "").trim().replace(/^["']+|["']+$/g, "").replace(/^[A-Za-z_]+=/, "").replace(/=+$/, "").trim();
export const vapidPublic = () => cleanKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
const vapidPrivate = () => cleanKey(process.env.VAPID_PRIVATE_KEY);
export const pushReady = () => !!(vapidPublic() && vapidPrivate());
const subject = () => { const s = (process.env.VAPID_SUBJECT ?? "").trim().replace(/^["']+|["']+$/g, ""); return /^(mailto:[^@\s]+@[^@\s]+\.[^@\s]+|https:\/\/\S+)$/.test(s) ? s : "mailto:admin@lfzbarbershop.app"; };

// Envía una notificación a todas las suscripciones. Devuelve los endpoints que ya no existen y el último error (si hubo).
export async function sendToSubs(subs: Sub[], payload: { title: string; body: string; url?: string; tag?: string }) {
  const out = { sent: 0, gone: [] as string[], error: "" };
  if (!pushReady()) { out.error = "Faltan las claves de notificaciones en Vercel."; return out; }
  try { webpush.setVapidDetails(subject(), vapidPublic(), vapidPrivate()); }
  catch (e) { out.error = `Las claves de Vercel no son válidas (${(e as Error).message}). Revisá NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.`; return out; }
  await Promise.all(subs.map(async (s) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload)); out.sent++; }
    catch (e) {
      const err = e as { statusCode?: number; body?: string };
      if (err.statusCode === 404 || err.statusCode === 410) out.gone.push(s.endpoint);
      else out.error = `El servicio de avisos respondió ${err.statusCode ?? "error"}${err.body ? `: ${String(err.body).slice(0, 120)}` : ""}`;
    }
  }));
  return out;
}
