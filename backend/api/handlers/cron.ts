/**
 * api/handlers/cron.ts — Cron job handler for scanning due reminders
 */

import { Hono } from 'hono';
import {
  getRemindersDueBefore,
  saveReminder,
  getAllSubscriptions,
  removeSubscription,
} from '../../lib/kv';
import { calculateNextTrigger } from '../../lib/scheduler';
import { sendPushToAll } from '../../lib/push';
import { now } from '../../lib/crypto';

export const cronHandler = new Hono();

// GET /api/cron/check-reminders
cronHandler.get('/', async (c) => {
  // ── Auth check ──────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = c.req.header('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return c.json({ error: 'UNAUTHORIZED', message: 'Invalid cron secret' }, 401);
    }
  }

  try {
    const currentTime = now();
    const scanWindow = currentTime + 60_000; // look 60 seconds ahead

    const dueReminders = await getRemindersDueBefore(scanWindow);

    if (dueReminders.length === 0) {
      return c.json({
        success: true,
        message: 'No reminders due',
        checked: 0,
        sent: 0,
      });
    }

    const subscriptions = await getAllSubscriptions();
    if (subscriptions.length === 0) {
      return c.json({
        success: true,
        message: 'No subscribers to notify',
        checked: dueReminders.length,
        sent: 0,
      });
    }

    let totalSent = 0;
    const expiredEndpoints: string[] = [];

    for (const reminder of dueReminders) {
      const payload = {
        title: reminder.title,
        body: reminder.body || `Reminder: ${reminder.title}`,
        data: { reminderId: reminder.id },
      };

      const results = await sendPushToAll(subscriptions, payload);

      for (const result of results) {
        if (result.success) totalSent++;
        if (result.statusCode === 410 || result.statusCode === 404) {
          expiredEndpoints.push(result.endpoint);
        }
      }

      reminder.lastTriggeredAt = currentTime;

      if (reminder.type === 'recurring') {
        reminder.nextTriggerAt = calculateNextTrigger(reminder, currentTime);
      } else {
        reminder.nextTriggerAt = undefined;
        reminder.enabled = false;
      }

      await saveReminder(reminder);
    }

    // Clean up expired subscriptions
    for (const endpoint of expiredEndpoints) {
      await removeSubscription(endpoint);
    }

    return c.json({
      success: true,
      checked: dueReminders.length,
      sent: totalSent,
      expiredSubscriptions: expiredEndpoints.length,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return c.json(
      { error: 'INTERNAL_ERROR', message: 'Cron job failed' },
      500
    );
  }
});
