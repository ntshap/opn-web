// Service Worker for caching and offline support
const CACHE_NAME = 'opn-cache-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard/members',
  '/dashboard/events',
  '/dashboard/finance',
  '/dashboard/news',
  '/api/v1/members/',
  '/api/v1/events/',
  '/api/v1/finance/summary',
  '/api/v1/news/',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip browser-sync and socket.io requests
  if (event.request.url.includes('browser-sync') || 
      event.request.url.includes('socket.io')) return;
  
  // For API requests, use network first, then cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Open cache and store response
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request);
        })
    );
  } else {
    // For non-API requests, use cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          
          // Clone the request
          const fetchRequest = event.request.clone();
          
          return fetch(fetchRequest)
            .then((response) => {
              // Check if valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response
              const responseToCache = response.clone();
              
              // Open cache and store response
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            });
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
