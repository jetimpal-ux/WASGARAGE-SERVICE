// ============================================================
// SERVICE WORKER — WAS Garage PWA
// Mengizinkan aplikasi berjalan offline & bisa diinstall
// ============================================================

var CACHE_NAME = 'wasgarage-v1';
var URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/admin.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// ── INSTALL: Simpan file ke cache ────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('WAS Garage: Cache dibuat');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: Hapus cache lama ───────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          console.log('WAS Garage: Hapus cache lama:', name);
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// ── FETCH: Network first, fallback ke cache ──────────────────
self.addEventListener('fetch', function(event) {
  // Lewati request ke Google APIs (Apps Script) — harus online
  if (event.request.url.includes('script.google.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Simpan response terbaru ke cache
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Jika offline, ambil dari cache
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          // Fallback ke index.html jika halaman tidak ada di cache
          return caches.match('/index.html');
        });
      })
  );
});
