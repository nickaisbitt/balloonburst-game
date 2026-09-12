// Service worker for the Balloon Burst web build (audit task 27).
//
// The single-file architecture makes offline simple: the whole game is one
// index.html plus a handful of sibling assets. Strategy:
//   - Install: precache the app shell. The cache name carries the release
//     version (stamped by scripts/stamp_sw.mjs — public/ files are copied
//     verbatim, so Vite's define can't reach this file).
//   - Activate: delete every cache that isn't this release's, claim clients.
//   - Fetch: GET + same-origin only, cache-first with background
//     revalidate, so cached hits stay instant while a deploy is picked up.
//   - Updates are player-controlled: this SW does NOT skipWaiting on
//     install. The page shows an "update available" toast and sends
//     SKIP_WAITING only when the player taps it (src/serviceWorker.ts).
//
// Registered web-only (never inside the native WKWebView) and only in
// production; src/serviceWorker.ts guards both.

const VERSION = "2.1.0";
const CACHE = `balloon-burst-v${VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./privacy.html",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll is atomic: a failed precache fails install, so the previous
      // service worker stays in control.
      await cache.addAll(APP_SHELL);
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function cachePut(cache, request, response) {
  // Only same-origin basic 200s belong in the cache; redirects and errors
  // would poison offline launches.
  try {
    if (response && response.status === 200 && response.type === "basic") {
      await cache.put(request, response.clone());
    }
  } catch {
    /* non-cacheable response — leave the cache untouched */
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) {
        // Refresh in the background so a deploy lands on the next launch.
        fetch(req)
          .then((res) => cachePut(cache, req, res))
          .catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(req);
        return await cachePut(cache, req, res);
      } catch {
        // Offline and never cached (e.g. ?plain=1 variant): fall back to
        // the shell so the game still boots.
        return (await cache.match("./", { ignoreSearch: true })) ?? Response.error();
      }
    })()
  );
});
