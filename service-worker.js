const CACHE_NAME = 'diary-app-cache-v2'; // Increment version number for changes

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
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
  'https://cdn.quilljs.com/1.3.6/quill.snow.css',
  'https://cdn.quilljs.com/1.3.6/quill.js',
  'https://cdn.jsdelivr.net/npm/fullcalendar@5.10.1/main.min.css',
  'https://cdn.jsdelivr.net/npm/fullcalendar@5.10.1/main.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

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

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        let fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(
          (response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            let responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        ).catch(() => {
          if (event.request.url.includes('/data/2.5/weather')) {
            return new Response(JSON.stringify({ temp: 22, description: 'sunny' }), { headers: { 'Content-Type': 'application/json' } });
          }
        });
      })
  );
});
