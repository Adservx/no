// Service Worker for Electrical Engineering PDF Store PWA

const CACHE_NAME = 'ee-pdf-store-v1';

// Assets to cache immediately when the service worker is installed
const APP_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Install event - cache basic app assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(APP_ASSETS);
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
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
  
  // Claim clients to ensure the new service worker controls all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Special handling for PDF downloads
  if (event.request.url.endsWith('.pdf') || 
      event.request.url.includes('/pdf-files/') ||
      event.request.url.endsWith('.jpg') ||
      event.request.url.endsWith('.jpeg') ||
      event.request.url.endsWith('.png')) {
    
    // For PDF/image downloads, we don't want to cache but we want to track progress
    // We'll let the browser handle it normally
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();
            
            // Don't cache PDF files as they could be large
            if (!event.request.url.endsWith('.pdf') && !event.request.url.includes('/pdf-files/')) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          }
        );
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  // Handle download notification messages
  if (event.data && event.data.type === 'DOWNLOAD_NOTIFICATION') {
    const { title, message, tag, icon } = event.data;
    
    self.registration.showNotification(title, {
      body: message,
      icon: icon || '/favicon.svg',
      tag: tag || 'download',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
      renotify: true
    });
  }
  
  // Handle download progress updates
  if (event.data && event.data.type === 'DOWNLOAD_PROGRESS') {
    const { progress, title, message, tag } = event.data;
    
    // Get all notifications with the given tag
    self.registration.getNotifications({ tag: tag }).then(notifications => {
      // Close existing notifications with this tag
      notifications.forEach(notification => notification.close());
      
      // Show a new notification with the updated progress
      self.registration.showNotification(title, {
        body: message,
        icon: '/favicon.svg',
        tag: tag,
        badge: '/favicon.svg',
        vibrate: [100],
        renotify: false,
        data: { progress }
      });
    });
  }
  
  // Handle download completion
  if (event.data && event.data.type === 'DOWNLOAD_COMPLETE') {
    const { title, message, tag } = event.data;
    
    // Get all notifications with the given tag
    self.registration.getNotifications({ tag: tag }).then(notifications => {
      // Close existing notifications with this tag
      notifications.forEach(notification => notification.close());
      
      // Show a completion notification
      self.registration.showNotification(title, {
        body: message,
        icon: '/favicon.svg',
        tag: tag + '-complete',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        renotify: true
      });
    });
  }
}); 