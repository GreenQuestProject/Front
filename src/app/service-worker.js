// service-worker.js (à la racine)
importScripts('./ngsw-worker.js');

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const title = data.title || 'Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/icons/icon-192x192.png',
    badge: data.badge || '/assets/icons/badge-72x72.png',
    data: data.data || {},  // ex: { url, reminderId, type:'pwa-update' }
    actions: data.actions || [
      { action: 'open',   title: 'Ouvrir' },
      { action: 'done',   title: 'Fait' },
      { action: 'snooze', title: 'Plus tard' }
    ],
    tag: data.tag || 'default'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const ndata  = event.notification?.data || {};
  event.notification.close();

  // 👉 Relais vers l'app (elle a le JWT)
  const relay = self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientsArr) => {
      const client = clientsArr[0];
      if (client) {
        client.postMessage({
          type: 'REMINDER_ACTION',
          action,                  // 'done' | 'snooze' | 'open' | 'reload'
          reminderId: ndata.reminderId,
          url: ndata.url || '/'
        });
        return client.focus();
      }
      // Pas de fenêtre ouverte → on ouvre l’app
      return self.clients.openWindow(ndata.url || '/');
    });

  event.waitUntil(relay);
});
