const CACHE_NAME = 'lens-craft-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/icon.svg',
  '/manifest.json',
  '/vite.svg',
  'https://esm.sh/react@^19.1.0',
  'https://esm.sh/react-dom@^19.1.0/client',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;500;700&display=swap',
  'https://font-face.ir/css/iransans/iransans.css'
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        // AddAll can fail if one of the resources fails to be fetched.
        // For robustness, you might want to cache them individually.
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
            });
          })
        );
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // We only want to cache GET requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If we got a valid response, clone it and cache it.
          if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              cache.put(event.request, responseToCache);
          }
          return networkResponse;
        }).catch(error => {
          console.error('Fetching failed:', error);
          throw error;
        });
        // Serve from cache first, with a network fallback.
        return response || fetchPromise;
      });
    })
  );
});


// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});