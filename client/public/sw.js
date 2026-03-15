const CACHE_NAME = "oss-pwa-v1";
const PRECACHE_URLS = ["/", "/manifest.json", "/favicon.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/ws")) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          if (url !== "/") {
            client.navigate(url);
          }
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, url } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: "/favicon.png",
        badge: "/favicon.png",
        tag: "oss-msg-" + Date.now(),
        renotify: true,
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: { url: url || "/" },
        actions: [
          { action: "open", title: "Open" },
          { action: "dismiss", title: "Dismiss" }
        ]
      })
    );
  }
});
