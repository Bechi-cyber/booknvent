/**
 * LESAVOT Service Worker
 *
 * This service worker provides caching and offline support for the LESAVOT application.
 * It implements a cache-first strategy for static assets and a network-first strategy for API requests.
 */

// Cache names
const STATIC_CACHE_NAME = 'lesavot-static-v1';
const DYNAMIC_CACHE_NAME = 'lesavot-dynamic-v1';
const API_CACHE_NAME = 'lesavot-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './auth.html',
  './text_stego.html',
  './image_stego.html',
  './audio_stego.html',
  './profile.html',
  './offline.html',
  './styles.css',
  './welcome.css',
  './auth.css',
  './index.js',
  './user-auth.js',
  './text-stego.js',
  './image-stego.js',
  './audio-stego.js',
  './profile.js',
  './error-tracking.js',
  './favicon.svg',
  './manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...');

  // Skip waiting to activate immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching App Shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...');

  // Claim clients to control all open tabs
  self.clients.claim();

  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (
            key !== STATIC_CACHE_NAME &&
            key !== DYNAMIC_CACHE_NAME &&
            key !== API_CACHE_NAME
          ) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        }));
      })
  );

  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin && !url.origin.includes('supabase.co')) {
    return;
  }

  // Handle API requests (network-first strategy)
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // Handle Supabase API requests (network-first strategy)
  if (url.origin.includes('supabase.co')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // Handle static assets (cache-first strategy)
  event.respondWith(cacheFirstStrategy(event.request));
});

/**
 * Cache-first strategy
 * Try to serve from cache first, then network
 * @param {Request} request - The request to handle
 * @returns {Promise<Response>} - The response
 */
async function cacheFirstStrategy(request) {
  try {
    // Try to get from cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, get from network
    const networkResponse = await fetch(request);

    // Cache the response if it's valid
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache first strategy failed:', error);

    // If it's an HTML request, return the offline page
    if (request.headers.get('accept').includes('text/html')) {
      return caches.match('/offline.html');
    }

    // Otherwise, return a generic error response
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Network-first strategy
 * Try to serve from network first, then cache
 * @param {Request} request - The request to handle
 * @returns {Promise<Response>} - The response
 */
async function networkFirstStrategy(request) {
  const cacheName = request.url.includes('/api/') ? API_CACHE_NAME : DYNAMIC_CACHE_NAME;

  try {
    // Try to get from network
    const networkResponse = await fetch(request);

    // Cache the response if it's valid
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);

      // Only cache GET requests
      if (request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network request failed, getting from cache:', request.url);

    // If network fails, try to get from cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, return a generic error response
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Background sync for offline operations
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background Sync:', event.tag);

  if (event.tag === 'sync-history') {
    event.waitUntil(syncHistory());
  } else if (event.tag === 'sync-content') {
    event.waitUntil(syncContent());
  }
});

/**
 * Sync history data with the server
 * @returns {Promise<void>}
 */
async function syncHistory() {
  try {
    // Get offline queue from IndexedDB
    const offlineQueue = await getOfflineQueue('history');

    if (!offlineQueue || offlineQueue.length === 0) {
      console.log('[Service Worker] No history to sync');
      return;
    }

    console.log('[Service Worker] Syncing history:', offlineQueue.length, 'items');

    // Process each item in the queue
    for (const item of offlineQueue) {
      try {
        const response = await fetch('/api/v1/steganography/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${item.token}`
          },
          body: JSON.stringify(item.data)
        });

        if (response.ok) {
          // Remove from queue if successful
          await removeFromOfflineQueue('history', item.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync history item:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] History sync failed:', error);
  }
}

/**
 * Sync content data with the server
 * @returns {Promise<void>}
 */
async function syncContent() {
  // Similar to syncHistory but for content
  console.log('[Service Worker] Content sync not implemented yet');
}

/**
 * Get offline queue from IndexedDB
 * @param {string} queueName - Name of the queue
 * @returns {Promise<Array>} - Array of queue items
 */
async function getOfflineQueue(queueName) {
  // This is a placeholder - in a real implementation, you would use IndexedDB
  return JSON.parse(localStorage.getItem(`offline_${queueName}_queue`) || '[]');
}

/**
 * Remove item from offline queue
 * @param {string} queueName - Name of the queue
 * @param {string} itemId - ID of the item to remove
 * @returns {Promise<void>}
 */
async function removeFromOfflineQueue(queueName, itemId) {
  // This is a placeholder - in a real implementation, you would use IndexedDB
  const queue = JSON.parse(localStorage.getItem(`offline_${queueName}_queue`) || '[]');
  const updatedQueue = queue.filter(item => item.id !== itemId);
  localStorage.setItem(`offline_${queueName}_queue`, JSON.stringify(updatedQueue));
}
