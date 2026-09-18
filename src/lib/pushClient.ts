'use client';

import { PushSubscriptionItem } from '@/types';

// Helper to convert base64 VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('Service Worker registration failed:', err);
    return null;
  }
}

export async function subscribeToPush(params: {
  role: 'STUDENT' | 'TEACHER';
  studentId?: string;
  studentName?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: '이 기기나 브라우저는 웹 푸시 알림을 지원하지 않습니다.' };
  }

  try {
    // 1. Request OS Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: '스마트폰 알림 권한이 허용되지 않았습니다. 브라우저 설정에서 알림을 허용해주세요.' };
    }

    // 2. Fetch VAPID Public Key from Server
    const resKey = await fetch('/api/push/subscribe');
    if (!resKey.ok) {
      throw new Error('VAPID public key fetch failed');
    }
    const { publicKey } = await resKey.json();
    if (!publicKey) {
      throw new Error('Public key missing');
    }

    // 3. Register SW
    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, error: '서비스 워커를 시작할 수 없습니다.' };
    }

    // 4. Subscribe with PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    }

    // 5. Send Subscription to Server
    const subJson = sub.toJSON();
    const item: PushSubscriptionItem = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: params.role,
      studentId: params.studentId,
      studentName: params.studentName,
      subscription: {
        endpoint: subJson.endpoint || '',
        expirationTime: subJson.expirationTime,
        keys: {
          p256dh: subJson.keys?.p256dh || '',
          auth: subJson.keys?.auth || '',
        },
      },
      deviceInfo: navigator.userAgent,
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (!saveRes.ok) {
      throw new Error('서버에 푸시 구독 등록 실패');
    }

    localStorage.setItem('hoengseong_push_subscribed', 'true');
    localStorage.setItem('hoengseong_push_endpoint', sub.endpoint);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    console.error('subscribeToPush error:', err);
    return { success: false, error: message };
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
    }
    localStorage.removeItem('hoengseong_push_subscribed');
    localStorage.removeItem('hoengseong_push_endpoint');
    return true;
  } catch (err) {
    console.error('unsubscribeFromPush error:', err);
    return false;
  }
}

export async function isCurrentDeviceSubscribed(): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}
