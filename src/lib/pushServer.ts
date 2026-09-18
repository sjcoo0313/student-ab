import webpush from 'web-push';
import { readServerDb, writeServerDb } from '@/lib/serverDb';
import { PushSubscriptionItem } from '@/types';

// VAPID Keys for Web Push Protocol
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BAAbwpj0tGAAQfUcIIoZwthvWrN6aXaVVhzFXLUG85GqLrLm5Qdxrw0jvWsw3Sh4VfV9RED_IKMEPuaOgs2lHJc';

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  '_C2L4zd55hdmapY170hOTjRkrw43O7Md9F_mLZQN6sU';

const VAPID_SUBJECT = 'mailto:smart-absence@school.kr';

// Initialize web-push
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.warn('[WebPush] setVapidDetails error:', err);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Save or update a client push subscription in server database
 */
export async function savePushSubscription(item: PushSubscriptionItem): Promise<boolean> {
  try {
    const db = await readServerDb();
    const existing = db.pushSubscriptions || [];

    // Filter out existing subscription with same endpoint to avoid duplicates
    const filtered = existing.filter(
      (s) => s.subscription.endpoint !== item.subscription.endpoint
    );

    filtered.push(item);
    await writeServerDb({ pushSubscriptions: filtered });
    return true;
  } catch (err) {
    console.error('[WebPush] savePushSubscription error:', err);
    return false;
  }
}

/**
 * Remove a push subscription by endpoint
 */
export async function removePushSubscription(endpoint: string): Promise<boolean> {
  try {
    const db = await readServerDb();
    const existing = db.pushSubscriptions || [];
    const filtered = existing.filter((s) => s.subscription.endpoint !== endpoint);
    if (filtered.length !== existing.length) {
      await writeServerDb({ pushSubscriptions: filtered });
    }
    return true;
  } catch (err) {
    console.error('[WebPush] removePushSubscription error:', err);
    return false;
  }
}

/**
 * Send push notification to a single subscriber
 */
async function sendSinglePush(
  item: PushSubscriptionItem,
  payload: PushPayload,
  expiredEndpoints: Set<string>
): Promise<boolean> {
  try {
    const pushData = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      tag: payload.tag || 'absence-notification',
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
    });

    await webpush.sendNotification(
      item.subscription as webpush.PushSubscription,
      pushData,
      {
        TTL: 86400, // 24 hours
        urgency: 'high',
      }
    );
    return true;
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    console.warn(`[WebPush] Send error (${item.role}):`, err?.statusCode || err?.message);
    // 404 or 410 means subscription is no longer valid (unsubscribed or expired)
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      expiredEndpoints.add(item.subscription.endpoint);
    }
    return false;
  }
}

/**
 * Clean up expired endpoints from database
 */
async function cleanupExpired(expiredEndpoints: Set<string>) {
  if (expiredEndpoints.size === 0) return;
  try {
    const db = await readServerDb();
    const existing = db.pushSubscriptions || [];
    const valid = existing.filter((s) => !expiredEndpoints.has(s.subscription.endpoint));
    await writeServerDb({ pushSubscriptions: valid });
  } catch (err) {
    console.warn('[WebPush] cleanupExpired error:', err);
  }
}

/**
 * Send push notification to a specific student's registered devices
 */
export async function sendPushToStudent(studentId: string, payload: PushPayload): Promise<number> {
  try {
    const db = await readServerDb();
    const subs = (db.pushSubscriptions || []).filter(
      (s) => s.role === 'STUDENT' && s.studentId === studentId
    );

    if (subs.length === 0) return 0;

    const expiredEndpoints = new Set<string>();
    let successCount = 0;

    for (const sub of subs) {
      const ok = await sendSinglePush(sub, payload, expiredEndpoints);
      if (ok) successCount++;
    }

    await cleanupExpired(expiredEndpoints);
    return successCount;
  } catch (err) {
    console.error('[WebPush] sendPushToStudent error:', err);
    return 0;
  }
}

/**
 * Send push notification to multiple students
 */
export async function sendPushToMultipleStudents(
  studentIds: string[],
  payload: PushPayload
): Promise<number> {
  if (!studentIds || studentIds.length === 0) return 0;
  const idSet = new Set(studentIds);
  try {
    const db = await readServerDb();
    const subs = (db.pushSubscriptions || []).filter(
      (s) => s.role === 'STUDENT' && s.studentId && idSet.has(s.studentId)
    );

    if (subs.length === 0) return 0;

    const expiredEndpoints = new Set<string>();
    let successCount = 0;

    for (const sub of subs) {
      const ok = await sendSinglePush(sub, payload, expiredEndpoints);
      if (ok) successCount++;
    }

    await cleanupExpired(expiredEndpoints);
    return successCount;
  } catch (err) {
    console.error('[WebPush] sendPushToMultipleStudents error:', err);
    return 0;
  }
}

/**
 * Send push notification to all teacher devices
 */
export async function sendPushToTeacher(payload: PushPayload): Promise<number> {
  try {
    const db = await readServerDb();
    const subs = (db.pushSubscriptions || []).filter((s) => s.role === 'TEACHER');

    if (subs.length === 0) return 0;

    const expiredEndpoints = new Set<string>();
    let successCount = 0;

    for (const sub of subs) {
      const ok = await sendSinglePush(sub, payload, expiredEndpoints);
      if (ok) successCount++;
    }

    await cleanupExpired(expiredEndpoints);
    return successCount;
  } catch (err) {
    console.error('[WebPush] sendPushToTeacher error:', err);
    return 0;
  }
}
