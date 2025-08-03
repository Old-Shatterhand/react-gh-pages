/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching';
const CACHE_NAME = 'swiss-chess-cache-v7';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/components/PlayerSetup.tsx',
  '/components/TournamentDashboard.tsx',
  '/components/FinalReport.tsx',
  '/icon.svg'
  // External URLs are no longer pre-cached.
  // They will be cached by the 'fetch' event handler upon first request.
];

precacheAndRoute(self.__WB_MANIFEST)

// Install event: pre-caches the application shell.
self.addEventListener('install', event => {
  // Prevent the old service worker from running until the new one is ready.
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
          console.error('Failed to cache files during install:', error);
      })
  );
});

// Fetch event: Serves assets from cache first, falls back to network, and caches new assets.
self.addEventListener('fetch', event => {
  // We only want to handle GET requests and ignore browser extension requests.
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If the resource is in the cache, serve it.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, fetch from network.
        return fetch(event.request).then(networkResponse => {
          // If the fetch was successful, clone it and cache it for future use.
          // The strict `.ok` check is removed to allow caching of opaque responses from CDNs,
          // which is a critical fix for installability on some mobile browsers.
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          // Return the network response.
          return networkResponse;
        }).catch(error => {
            console.error('Fetch failed; user is likely offline and asset was not in cache.', error);
            // For a single page app, returning the main index.html for navigation requests 
            // is a good fallback when the user is offline.
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            // For other assets, we must let the error propagate.
            throw error;
        });
      })
  );
});

// Activate event: removes old caches to ensure the app uses the latest assets.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients immediately.
  );
});
