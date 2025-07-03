// Service Worker for Electrical Engineering PDF Store PWA

const CACHE_NAME = 'ee-pdf-store-v3';

// Assets to cache immediately when the service worker is installed
const APP_ASSETS = [
  './',
  './index.html',
  './favicon.svg',
  './manifest.json',
  './src/main.tsx',
  './src/App.css'
];

// Install event - cache basic app assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(APP_ASSETS)
          .catch(error => {
            console.error('Failed to cache some assets:', error);
            // Continue with installation even if some assets fail to cache
            return Promise.resolve();
          });
      })
      .catch(error => {
        console.error('Service worker installation failed:', error);
      })
  );
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
    .then(() => {
      console.log('Service worker activated and controlling clients');
      // Claim clients to ensure the new service worker controls all clients immediately
      return self.clients.claim();
    })
    .catch(error => {
      console.error('Service worker activation error:', error);
    })
  );
});

// Helper function to safely attempt fetching a resource
const safeFetch = async (request) => {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('Fetch error:', error, request.url);
    throw error;
  }
};

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Handle non-GET requests directly
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Parse the URL to handle different resources appropriately
  const url = new URL(event.request.url);
  
  // Special handling for PDF and image files
  const isPDF = url.pathname.endsWith('.pdf') || url.pathname.includes('/pdf-files/');
  const isImage = url.pathname.endsWith('.jpg') || 
                 url.pathname.endsWith('.jpeg') || 
                 url.pathname.endsWith('.png') ||
                 url.pathname.endsWith('.svg');
  
  // Special handling for worker.js files (critical for PDF.js)
  const isPDFWorker = url.pathname.includes('pdf.worker') || 
                     url.pathname.includes('pdfjs-dist');
  
  // For PDF.js worker files, use a network-first approach with long-lived cache
  if (isPDFWorker) {
    event.respondWith(
      safeFetch(event.request)
        .then(response => {
          // Cache the worker file for future use
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache))
            .catch(err => console.error('Failed to cache PDF worker:', err));
          
          return response;
        })
        .catch(() => {
          // If network fails, try the cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, return a generic error
              console.error('Failed to fetch PDF worker and not in cache');
              throw new Error('Failed to load PDF worker');
            });
        })
    );
    return;
  }
  
  // For PDF and image downloads, use a network-first strategy
  if (isPDF || isImage) {
    event.respondWith(
      safeFetch(event.request)
        .then(response => {
          // Don't cache these files to save space, return directly
          return response;
        })
        .catch(() => {
          // If network fails, try the cache as fallback
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              console.warn('Resource not available offline:', event.request.url);
              throw new Error('Resource not available offline');
            });
        })
    );
    return;
  }
  
  // For app shell (HTML, CSS, JS), use a cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return safeFetch(event.request.clone())
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache the response for future use
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(err => console.error('Failed to cache resource:', err));
            
            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // For navigation requests, return the cached index page
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html')
                .then(indexResponse => {
                  if (indexResponse) {
                    return indexResponse;
                  }
                  // If even the index page isn't cached, create a simple response
                  return new Response(
                    '<html><body><h1>App is offline</h1><p>Please check your connection.</p></body></html>',
                    { headers: { 'Content-Type': 'text/html' } }
                  );
                });
            }
            throw error;
          });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  try {
    // Handle download notification messages
    if (event.data && event.data.type === 'DOWNLOAD_NOTIFICATION') {
      const { title, message, tag, icon } = event.data;
      
      self.registration.showNotification(title, {
        body: message,
        icon: icon || './favicon.svg',
        tag: tag || 'download',
        badge: './favicon.svg',
        vibrate: [200, 100, 200],
        renotify: true
      }).catch(err => console.error('Notification error:', err));
    }
    
    // Handle download progress updates
    if (event.data && event.data.type === 'DOWNLOAD_PROGRESS') {
      const { progress, title, message, tag } = event.data;
      
      // Get all notifications with the given tag
      self.registration.getNotifications({ tag: tag })
        .then(notifications => {
          // Close existing notifications with this tag
          notifications.forEach(notification => notification.close());
          
          // Show a new notification with the updated progress
          return self.registration.showNotification(title, {
            body: message,
            icon: './favicon.svg',
            tag: tag,
            badge: './favicon.svg',
            vibrate: [100],
            renotify: false,
            data: { progress }
          });
        })
        .catch(err => console.error('Progress notification error:', err));
    }
    
    // Handle download completion
    if (event.data && event.data.type === 'DOWNLOAD_COMPLETE') {
      const { title, message, tag } = event.data;
      
      // Get all notifications with the given tag
      self.registration.getNotifications({ tag: tag })
        .then(notifications => {
          // Close existing notifications with this tag
          notifications.forEach(notification => notification.close());
          
          // Show a completion notification
          return self.registration.showNotification(title, {
            body: message,
            icon: './favicon.svg',
            tag: tag + '-complete',
            badge: './favicon.svg',
            vibrate: [200, 100, 200],
            renotify: true
          });
        })
        .catch(err => console.error('Completion notification error:', err));
    }
  } catch (error) {
    console.error('Message handling error:', error);
  }
}); 