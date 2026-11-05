// Holo image cache: images are stored on the device after the first load, so the game opens instantly next time.
const CACHE = "holo-img-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isImg = req.destination === "image" || /\.(webp|png|jpe?g|svg|gif|avif)$/i.test(url.pathname);
  if (!isImg) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok || res.type === "opaque") cache.put(req, res.clone());
    return res;
  }));
});
