self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
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
