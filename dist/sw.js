/* IPPOO Market — minimal service worker.
   Required so Chrome will fire `beforeinstallprompt`. */

const CACHE = "ippoo-v1";
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try { await cache.add(new Request(OFFLINE_URL, { cache: "reload" })); } catch (_) {}
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

const ICON = "/icons/ippoo-logo.png";
const VIBRATE_PATTERNS = {
  normal: [80, 50, 160],
  high:   [100, 50, 100, 50, 250, 80, 300],
  win:    [60, 40, 60, 40, 60, 40, 280, 90, 380],
  promo:  [40, 30, 40, 30, 40, 30, 40, 30, 220, 80, 220],
  gift:   [120, 60, 80, 40, 200, 80, 280],
};

function pickFlavor(data, highPriority) {
  if (data.flavor && VIBRATE_PATTERNS[data.flavor]) return data.flavor;
  const t = data.type;
  if (highPriority) return "high";
  if (t === "win" || t === "bonus") return "win";
  if (t === "promo") return "promo";
  if (t === "gift" || t === "welcome" || t === "vip") return "gift";
  return "normal";
}

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "IPPOO", body: event.data?.text() ?? "" }; }
  const title = data.title || "IPPOO Market";
  const highPriority = data.priority === "high";
  const flavor = pickFlavor(data, highPriority);
  const options = {
    body: data.body || "",
    icon: data.icon || ICON,
    badge: data.badge || ICON,
    tag: data.tag,
    renotify: !!data.tag,
    data: { url: data.link || data.url || "/", flavor },
    requireInteraction: highPriority || flavor === "win",
    silent: false,
    vibrate: data.vibrate || VIBRATE_PATTERNS[flavor] || VIBRATE_PATTERNS.normal,
    timestamp: Date.now(),
  };
  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of all) {
      try { client.postMessage({ type: "ippoo:push-sound", flavor, priority: highPriority ? "high" : "normal" }); } catch (_) {}
    }
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of all) {
      if ("focus" in client) {
        client.focus();
        client.postMessage({ type: "ippoo:navigate", url });
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(OFFLINE_URL, fresh.clone()).catch(() => {});
        return fresh;
      } catch (_) {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(OFFLINE_URL);
        return cached || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.status === 200 && fresh.type === "basic") {
        cache.put(req, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch (_) {
      return cached || Response.error();
    }
  })());
});
