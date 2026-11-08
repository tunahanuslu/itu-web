const CACHE_NAME = 'itu-web-v1';
const ASSETS = [
    './',
    './index.html',
    './404.html',
    './assets/css/style.css',
    './assets/img/favicon.svg',
    './assets/img/itu-bee.svg',
    './assets/js/telemetry.js',
    './assets/js/loom.js',
    './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // HTML Sayfaları -> Network-First (Önce canlı ağ, bağlantı yoksa çevrimdışı disk)
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                    return res;
                })
                .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
        );
        return;
    }

    // Statik Varlıklar (CSS, JS, SVG) -> Cache-First (Işık hızında disk, arka planda tazeleme)
    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) {
                fetch(req).then((res) => {
                    if (res && res.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, res));
                    }
                }).catch(() => {});
                return cached;
            }
            return fetch(req);
        })
    );
});
