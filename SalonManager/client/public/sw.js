const CACHE_NAME = 'salonmanager-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              // Only cache GET requests and exclude API calls for dynamic content
              if (event.request.method === 'GET' && !event.request.url.includes('/api/')) {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline page or basic offline response
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline booking
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-booking') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Retrieve pending bookings from IndexedDB or localStorage
    const pendingBookings = await getPendingBookings();
    
    for (const booking of pendingBookings) {
      try {
        const response = await fetch('/api/v1/salons/' + booking.salonId + '/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(booking.data)
        });

        if (response.ok) {
          await removePendingBooking(booking.id);
          console.log('Booking synced successfully:', booking.id);
        }
      } catch (error) {
        console.log('Failed to sync booking:', booking.id, error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

async function getPendingBookings() {
  // This would typically use IndexedDB
  // For simplicity, using localStorage here
  try {
    const pending = localStorage.getItem('pendingBookings');
    return pending ? JSON.parse(pending) : [];
  } catch {
    return [];
  }
}

async function removePendingBooking(bookingId) {
  try {
    const pending = await getPendingBookings();
    const updated = pending.filter(b => b.id !== bookingId);
    localStorage.setItem('pendingBookings', JSON.stringify(updated));
  } catch (error) {
    console.log('Failed to remove pending booking:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Neue Nachricht von SalonManager',
    icon: '/manifest-icon-192.png',
    badge: '/manifest-icon-96.png',
    tag: 'salonmanager-notification',
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('SalonManager', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Handle app installation prompt
self.addEventListener('beforeinstallprompt', (event) => {
  // Prevent the mini-infobar from appearing
  event.preventDefault();
  
  // Store the event for later use
  self.deferredPrompt = event;
  
  // Show custom install prompt
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SHOW_INSTALL_PROMPT'
      });
    });
  });
});

// Handle app installation
self.addEventListener('appinstalled', (event) => {
  console.log('SalonManager PWA was installed');
  
  // Send analytics or perform post-install tasks
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'APP_INSTALLED'
      });
    });
  });
});
