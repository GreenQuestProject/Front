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
    try {
      data = {title: 'Notification', body: event.data?.text?.() || ''};
    } catch {
    }
  }

  const title = data.title || 'Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/icons/icon-192x192.png',
    badge: data.badge || '/assets/icons/badge-72x72.png',
    data: data.data || {},
    actions: data.actions || [
      {action: 'open', title: 'Ouvrir'},
      {action: 'done', title: 'Fait'},
      {action: 'snooze', title: 'Plus tard'}
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
  event.notification.close();

  const action = event.action || 'open';
  const ndata = event.notification?.data || {};

  const base = (self.FRONTEND_BASE_URL || self.location.origin).replace(/\/+$/, '');
  const path = (ndata.url || '/').toString();
  let targetUrl;
  try {
    targetUrl = new URL(path, base).href;
  } catch {
    targetUrl = base + '/';
  }

  const relay = (async () => {
    const all = await self.clients.matchAll({type: 'window', includeUncontrolled: true});

    let targetClient = all.find(c => {
      try {
        return new URL(c.url).href === targetUrl;
      } catch {
        return false;
      }
    });

    if (!targetClient) {
      targetClient = all.find(c => c.visibilityState === 'visible') || all[0] || null;
    }

    if (!targetClient) {
      if ('openWindow' in self.clients) {
        const opened = await self.clients.openWindow(targetUrl);
        if (opened) {
          opened.postMessage({
            type: 'REMINDER_ACTION',
            action,
            reminderId: ndata.reminderId ?? null,
            url: targetUrl
          });
          return opened.focus?.();
        }
      }
      return;
    }

    if (new URL(targetClient.url).href !== targetUrl && (action === 'open' || action === 'reload')) {
      if ('navigate' in targetClient) {
        try {
          await targetClient.navigate(targetUrl);
        } catch {
        }
      } else if ('openWindow' in self.clients) {
        const opened = await self.clients.openWindow(targetUrl);
        opened?.postMessage({
          type: 'REMINDER_ACTION',
          action,
          reminderId: ndata.reminderId ?? null,
          url: targetUrl
        });
        return opened?.focus?.();
      }
    }

    targetClient.postMessage({
      type: 'REMINDER_ACTION',
      action,
      reminderId: ndata.reminderId ?? null,
      url: targetUrl
    });

    return targetClient.focus?.();
  })();

  event.waitUntil(relay);
});

importScripts('./ngsw-worker.js');
