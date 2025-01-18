// service-worker.js

// Define the cache name
const CACHE_NAME = 'diary-app-cache-v1';

// List of files to cache (update this list with your actual files)
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/diary-entry.js',
    '/security.js',
    '/weather.js',
    'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve cached files when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if available
                if (response) {
                    return response;
                }

                // Clone the request to make another fetch call
                let fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    (response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response to store in the cache
                        let responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                ).catch(() => {
                    // Fallback for non-cached resources
                    if (event.request.url.includes('/data/2.5/weather')) {
                        return new Response(JSON.stringify({ temp: 22, description: 'sunny' }), { headers: { 'Content-Type': 'application/json' } });
                    }
                });
            })
    );
});