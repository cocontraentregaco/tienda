const CACHE_NAME = 'qrp2p-cache-v2';
const OFFLINE_URL = '/offline.html';

// Archivos esenciales para cachear durante la instalación
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-192.png',
  '/icon-384.png',
  '/icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando archivos estáticos');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Instalación completada');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Error en instalación:', error);
      })
  );
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activación completada');
      return self.clients.claim();
    })
  );
});

// Estrategia: Network First con fallback a caché y offline
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Evitar cachear peticiones a APIs externas y analytics
  const excludePatterns = [
    '/api/',
    'analytics',
    'google-analytics',
    'facebook.com',
    'doubleclick.net'
  ];
  
  if (excludePatterns.some(pattern => url.pathname.includes(pattern) || url.hostname.includes(pattern))) {
    return;
  }
  
  // Estrategia para navegaciones (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Guardar en caché la nueva versión
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(async () => {
          // Fallback: buscar en caché primero, luego offline.html
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlineResponse = await caches.match(OFFLINE_URL);
          return offlineResponse || new Response('Offline content not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/html'
            })
          });
        })
    );
    return;
  }
  
  // Estrategia: Cache First con actualización en background (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Actualizar caché si la petición es exitosa
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('[Service Worker] Error en fetch:', error);
            // Para imágenes, podrías retornar un placeholder
            if (event.request.destination === 'image') {
              return caches.match('/icon-192.png');
            }
            return null;
          });
        
        // Retornar caché si existe, sino esperar la red
        return cachedResponse || fetchPromise;
      })
  );
});

// Manejo de notificaciones push
self.addEventListener('push', event => {
  let title = 'QRP2P Real Estate';
  let body = 'Nueva propiedad disponible en tu zona';
  let icon = '/icon-192.png';
  let tag = 'qrp2p-notification';
  
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
      icon = data.icon || icon;
      tag = data.tag || tag;
    } catch (e) {
      body = event.data.text();
    }
  }
  
  const options = {
    body: body,
    icon: icon,
    badge: '/icon-96.png',
    vibrate: [200, 100, 200],
    tag: tag,
    renotify: false,
    requireInteraction: true,
    data: {
      dateOfArrival: Date.now(),
      url: '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // Si ya hay una ventana abierta, enfocarla
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Mensajes desde el cliente (para comunicación)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronización en segundo plano (para cuando vuelve la conexión)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-properties') {
    event.waitUntil(
      // Aquí puedes implementar sincronización de datos pendientes
      console.log('[Service Worker] Sincronizando propiedades pendientes...')
    );
  }
});

// Manejo de errores y logging
self.addEventListener('error', event => {
  console.error('[Service Worker] Error:', event.error);
});

// Precarga de navegación (opcional, mejora rendimiento)
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
        console.log('[Service Worker] Navigation preload habilitado');
      }
    })()
  );
});
