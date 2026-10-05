/* Service worker de El Horno.
   Guarda la app en el dispositivo para que abra sin conexión.
   Cuando publiques una versión nueva, subí el número de VERSION. */
var VERSION = 'v1';
var CACHE = 'el-horno-' + VERSION;
var ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.filter(function (k) {
        return k.indexOf('el-horno-') === 0 && k !== CACHE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Responde desde el dispositivo y, si hay internet, actualiza en segundo plano. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var propio = url.origin === self.location.origin;
  var fuentes = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!propio && !fuentes) return;

  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(e.request, { ignoreSearch: true }).then(function (guardado) {
        var red = fetch(e.request).then(function (r) {
          if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone());
          return r;
        }).catch(function () {
          return guardado || (e.request.mode === 'navigate' ? c.match('./index.html') : undefined);
        });
        return guardado || red;
      });
    })
  );
});
