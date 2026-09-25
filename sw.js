// Minimal Service Worker required to satisfy mobile PWA installation criteria
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Directly passes through network requests to ensure live Shopify stock checks work perfectly
  e.respondWith(fetch(e.request));
});
