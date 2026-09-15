// Service worker for the Balloon Burst web build (audit tasks 21+27).
//
// The app shell is the built index.html plus its hashed assets — the precache
// list is stamped post-build by scripts/stamp_sw.mjs (public/ files are
// copied verbatim, so Vite's define can't reach this file). Strategy:
//   - Install: precache the shell atomically (addAll).
//   - Activate: delete every other cache, claim clients.
//   - Fetch: GET + same-origin only, cache-first with background revalidate.
//   - Updates are player-controlled: SKIP_WAITING is sent only when the
//     player taps Reload in the localized toast (src/serviceWorker.ts).
//
// Matching/putting is done by URL STRING, never by the live request object:
// static hosts (vite preview, GitHub Pages) send "Vary: Origin", and module
// scripts fetch with an Origin header the SW's precached entries don't
// have — matching by request object would miss on exactly those entries.
// Both sides go through string-constructed requests, so the Vary comparison
// always succeeds.
//
// Registered web-only (never inside the native WKWebView) and only in
// production; src/serviceWorker.ts guards both.

const VERSION = "2.1.0+973d345e";
const CACHE = `balloon-burst-v${VERSION}`;

const APP_SHELL = ["./","./index.html","./manifest.webmanifest","./privacy.html","./icon-180.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./assets/fredoka-var-DOQG_Jwn.woff2","./assets/index-CsZeOaVw.js","./assets/index-Dpa-5W2D.css","./assets/index-FetVsZfH.js","./assets/nunito-var-CjueodBP.woff2","./assets/web-DQj5By8C.js"];

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

async function cachePut(cache, url, response) {
  // Only same-origin basic 200s belong in the cache; redirects and errors
  // would poison offline launches.
  try {
    if (response && response.status === 200 && response.type === "basic") {
      await cache.put(url, response.clone());
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
      const cached = await cache.match(req.url, { ignoreSearch: true });
      if (cached) {
        // Refresh in the background so a deploy lands on the next launch.
        fetch(req)
          .then((res) => cachePut(cache, req.url, res))
          .catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(req);
        return await cachePut(cache, req.url, res);
      } catch {
        // Offline and never cached (e.g. ?plain=1 variant): fall back to
        // the shell so the game still boots.
        return (await cache.match("./", { ignoreSearch: true })) ?? Response.error();
      }
    })()
  );
});
