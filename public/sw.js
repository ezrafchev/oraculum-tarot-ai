const CACHE_NAME = "oraculum-ai-v1";

self.addEventListener("install", (event) => {
  const scope = self.registration.scope;
  const core = [
    scope,
    new URL("manifest.webmanifest", scope).href,
    new URL("favicon.svg", scope).href,
    new URL("icon-192.svg", scope).href,
    new URL("icon-512.svg", scope).href,
  ];
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(core))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached =
            (await caches.match(request)) ??
            (await caches.match(self.registration.scope));
          return (
            cached ??
            new Response(
              "<!doctype html><html lang='pt-BR'><meta charset='utf-8'><meta name='viewport' content='width=device-width'><title>ORACULUM AI offline</title><style>body{margin:0;display:grid;min-height:100vh;place-items:center;background:#07070c;color:#f5f1e9;font-family:system-ui;text-align:center;padding:24px}main{max-width:480px}b{color:#d7b66c;letter-spacing:.15em}p{color:#aaa5b1;line-height:1.7}</style><main><b>ORACULUM AI</b><h1>Você está offline.</h1><p>Abra o aplicativo uma vez com conexão para armazenar a experiência completa neste dispositivo.</p></main></html>",
              { headers: { "Content-Type": "text/html; charset=utf-8" } },
            )
          );
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
