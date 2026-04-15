/**
 * api/handlers/toggle.ts — Toggle reminder enabled/disabled
 */

import { Hono } from 'hono';
import { getReminder, saveReminder } from '../../lib/kv';
import { calculateNextTrigger } from '../../lib/scheduler';
import { now } from '../../lib/crypto';

export const toggleHandler = new Hono();

// PATCH /api/reminders/:id/toggle
toggleHandler.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const reminder = await getReminder(id);

    if (!reminder) {
      return c.json(
        { error: 'NOT_FOUND', message: `Reminder ${id} not found` },
        404
      );
    }

    reminder.enabled = !reminder.enabled;
    reminder.updatedAt = now();
    reminder.nextTriggerAt = calculateNextTrigger(reminder, reminder.updatedAt);

    await saveReminder(reminder);

    return c.json(reminder);
  } catch (error) {
    console.error('Failed to toggle reminder:', error);
    return c.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to toggle reminder' },
      500
    );
  }
});
