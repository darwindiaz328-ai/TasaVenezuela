const CACHE_NAME = 'tasavenezuela-cache-v27';

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css?v=27',
  './app.js?v=27',
  './historial.json',
  './manifest.json',
  './favicon.png',
  './apple-touch-icon.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalación: Precargar recursos críticos saltándose la caché HTTP obsoleta
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        STATIC_ASSETS.map(async (asset) => {
          try {
            const isLocal = asset.startsWith('./');
            const req = isLocal ? new Request(asset, { cache: 'reload' }) : asset;
            const res = await fetch(req);
            if (res && res.ok) {
              await cache.put(asset, res);
            }
          } catch (err) {
            console.warn('No se pudo precargar:', asset, err);
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpiar cachés antiguas y tomar control inmediato
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
    }).then(() => self.clients.claim())
  );
});

// Fetch: Estrategia diferenciada
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Navegación / HTML: Network-first sin caché HTTP con fallback a caché
  if (event.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html').then((res) => res || caches.match('./')))
    );
    return;
  }

  // 2. CSS y JS propios: Network-first sin caché HTTP con fallback a caché (refleja cambios de diseño al instante en móviles)
  if (
    url.origin === self.location.origin &&
    (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) &&
    !url.pathname.endsWith('sw.js')
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  // 3. Datos dinámicos (rates.json / historial.json): Network-first con fallback a caché
  if (url.pathname.includes('rates.json') || url.pathname.includes('historial.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
              const cleanUrl = event.request.url.split('?')[0];
              cache.put(cleanUrl, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request, { ignoreSearch: true }).then((cached) => {
            return cached || caches.match('./historial.json');
          });
        })
    );
    return;
  }

  // 4. Otros recursos estáticos (iconos, fuentes): Cache-first con fallback a red
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.startsWith(self.location.origin) || event.request.url.includes('fonts.gstatic.com'))
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});
