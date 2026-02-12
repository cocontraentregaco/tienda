const CACHE_NAME = 'contraentrega-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/img/c-index.png',
  '/img/c.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/css/flag-icon.min.css',
  'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Serif+Pro:wght@400;600&display=swap'
];

// Instalación: guarda archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación: limpia cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepción: responde desde caché o red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Desde caché
        }
        return fetch(event.request); // Desde internet
      })
  );
});
