/**
 * push.ts — Web Push wrapper using the web-push npm package.
 *
 * Sends push notifications to subscribers using VAPID keys.
 */

import webPush from 'web-push';
import type { StoredSubscription, PushPayload } from '../types/reminder';

// ─── VAPID configuration ────────────────────────────────────────────
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || '';

// Initialize web-push with VAPID details (only if keys are available)
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_EMAIL) {
  webPush.setVapidDetails(
    `mailto:${VAPID_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

/**
 * Get the VAPID public key (for the frontend to subscribe).
 */
export function getPublicVapidKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Send a push notification to a specific subscription.
 *
 * @param subscription - The stored push subscription.
 * @param payload - Notification content (title, body, optional data).
 * @returns Promise that resolves to the response, or rejects on failure.
 */
export async function sendPush(
  subscription: StoredSubscription,
  payload: PushPayload
): Promise<{ statusCode: number; body?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
  });

  try {
    const result = await webPush.sendNotification(pushSubscription, payloadString, {
      TTL: 60, // Time-to-live: 60 seconds
    });

    return {
      statusCode: result.statusCode,
      body: result.body,
    };
  } catch (error: any) {
    // If subscription is expired or invalid, return the status code
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { statusCode: error.statusCode };
    }
    throw error;
  }
}

/**
 * Send a push notification to ALL subscriptions.
 *
 * @param subscriptions - Array of stored subscriptions.
 * @param payload - Notification content.
 * @returns Results with per-subscription status.
 */
export async function sendPushToAll(
  subscriptions: StoredSubscription[],
  payload: PushPayload
): Promise<{ endpoint: string; success: boolean; statusCode?: number }[]> {
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const result = await sendPush(sub, payload);
      return {
        endpoint: sub.endpoint,
        success: result.statusCode >= 200 && result.statusCode < 300,
        statusCode: result.statusCode,
      };
    })
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      endpoint: subscriptions[i].endpoint,
      success: false,
      statusCode: undefined,
    };
  });
}
