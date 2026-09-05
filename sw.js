const CACHE_NAME = 'portfolio-cache-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './404.html',
    './pages/blog.html',
    './pages/acerca-de.html',
    './pages/contacto.html',
    './pages/repositorios.html',
    './css/style.css',
    './js/main.js',
    './icons/favicon.svg',
    './site.webmanifest',
    './data/search_index.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Reducción de estrategia cache-first para activos estáticos
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;
    
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Devolver del caché y actualizar en segundo plano (stale-while-revalidate)
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                }).catch(() => {});
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});
