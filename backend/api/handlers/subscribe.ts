/**
 * api/handlers/subscribe.ts — Push subscription handler
 */

import { Hono } from 'hono';
import { saveSubscription } from '../../lib/kv';
import type { StoredSubscription } from '../../types/reminder';

export const subscribeHandler = new Hono();

subscribeHandler.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    }>();

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return c.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Missing required fields: endpoint, keys.p256dh, keys.auth',
        },
        400
      );
    }

    const subscription: StoredSubscription = {
      endpoint: body.endpoint,
      keys: {
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      createdAt: Date.now(),
    };

    await saveSubscription(subscription);

    return c.json({ success: true, message: 'Subscription saved' }, 201);
  } catch (error) {
    console.error('Failed to save subscription:', error);
    return c.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to save subscription' },
      500
    );
  }
});
