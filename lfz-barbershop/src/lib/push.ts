import webpush from "web-push";

export type Sub = { endpoint: string; p256dh: string; auth: string };
export const pushReady = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

// Envía una notificación a todas las suscripciones. Devuelve los endpoints que ya no existen (para borrarlos).
export async function sendToSubs(subs: Sub[], payload: { title: string; body: string; url?: string; tag?: string }) {
  if (!pushReady()) return { sent: 0, gone: [] as string[] };
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@lfzbarbershop.app", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  const gone: string[] = []; let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload)); sent++; }
    catch (e) { const code = (e as { statusCode?: number }).statusCode; if (code === 404 || code === 410) gone.push(s.endpoint); }
  }));
  return { sent, gone };
}
