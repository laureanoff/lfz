// Service worker de LFZ BarberShop: recibe notificaciones push y abre el panel al tocarlas.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "LFZ BarberShop", body: event.data ? event.data.text() : "" }; }
  event.waitUntil(self.registration.showNotification(data.title || "LFZ BarberShop", {
    body: data.body || "", icon: "/icon-192.png", badge: "/icon-192.png", tag: data.tag || "lfz", renotify: true,
    vibrate: [120, 60, 120], data: { url: data.url || "/admin" },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUninstalled: true }).then((list) => {
    for (const c of list) if ("focus" in c) { c.navigate(url); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
