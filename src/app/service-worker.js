importScripts('./ngsw-worker.js');

self.addEventListener('push', (event) => {
// Le payload JSON vient du serveur (Symfony)
  const data = event.data ? event.data.json() : {};
// Si le payload contient déjà un objet `notification`, Angular SW saura l’afficher.
// Ici on force l’affichage pour les cas custom.
  const title = data.title || 'Nouveau message';
  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/icons/icon-192x192.png',
    badge: data.badge || '/assets/icons/badge-72x72.png',
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Ouvrir' },
      { action: 'done', title: 'Marquer comme fait' },
      { action: 'snooze', title: 'Plus tard' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const ndata = event.notification.data || {};

  if (action === 'done' && ndata.reminderId) {
// Appeler une URL pour marquer le rappel comme complété
    event.waitUntil(fetch(`/api/reminders/${ndata.reminderId}/complete`, { method: 'POST', credentials: 'include' }));
  }
  if (action === 'snooze' && ndata.reminderId) {
    event.waitUntil(fetch(`/api/reminders/${ndata.reminderId}/snooze`, { method: 'POST', credentials: 'include' }));
  }

// Ouvrir/Focus l’app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const url = ndata.url || '/';
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
