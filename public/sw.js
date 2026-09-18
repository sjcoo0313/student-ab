// PWA Web Push Service Worker for Smart Absence Management
const CACHE_NAME = 'absence-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 백그라운드 푸시 수신 이벤트 (앱/브라우저가 닫혀 있어도 스마트폰 OS가 직접 실행)
self.addEventListener('push', (event) => {
  let data = {
    title: '스마트 출결 알림',
    body: '새로운 출결 알림이 도착했습니다.',
    url: '/',
    tag: 'absence-notification',
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'absence-notification',
    renotify: true,
    requireInteraction: true, // 사용자가 확인할 때까지 알림 유지
    vibrate: [200, 100, 200, 100, 200], // 진동 패턴
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: '확인하기',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 알림 탭(클릭) 시 해당 페이지로 자동 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열려있는 창이 있으면 포커스 후 이동
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      // 열린 창이 없으면 백그라운드에서 새 창으로 실행
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
