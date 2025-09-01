console.log('[SW] Service worker loaded');
self.addEventListener('error', e => console.error('[SW] error:', e.message));
self.addEventListener('unhandledrejection', e => console.error('[SW] rejection:', e.reason));

self.addEventListener('push', (event) => {
  event.stopImmediatePropagation?.();

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.warn('[SW] push JSON parse failed, fallback to text()', e);
    try { data = { title: 'Notification', body: event.data?.text?.() || '' }; } catch {}
  }

  const title = data.title || 'Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/icons/icon-192x192.png',
    badge: data.badge || '/assets/icons/badge-72x72.png',
    data: data.data || {}, // { url, reminderId, ... }
    actions: data.actions || [
      { action: 'open',   title: 'Ouvrir' },
      { action: 'done',   title: 'Fait' },
      { action: 'snooze', title: 'Plus tard' }
    ],
    tag: data.tag || 'default'
  };

  console.log('[SW] push payload:', data);
  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch(err => console.error('[SW] showNotification error:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.stopImmediatePropagation?.();

  const action = event.action;
  const ndata  = event.notification?.data || {};
  event.notification.close();

  console.log('[SW] notificationclick:', action, ndata);

  const relay = self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientsArr) => {
      const client = clientsArr.find(c => c.visibilityState === 'visible') || clientsArr[0];
      if (client) {
        client.postMessage({
          type: 'REMINDER_ACTION',
          action,                  // 'done' | 'snooze' | 'open' | 'reload'
          reminderId: ndata.reminderId,
          url: ndata.url || '/'
        });
        return client.focus();
      }
      return self.clients.openWindow(ndata.url || '/');
    });

  event.waitUntil(relay);
});

importScripts('./ngsw-worker.js');
