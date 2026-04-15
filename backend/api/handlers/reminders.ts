/**
 * api/handlers/reminders.ts — Reminder CRUD handler
 */

import { Hono } from 'hono';
import { generateId, now } from '../../lib/crypto';
import {
  saveReminder,
  getReminder,
  getAllReminders,
  deleteReminder,
  reminderExists,
} from '../../lib/kv';
import { calculateNextTrigger } from '../../lib/scheduler';
import type { Reminder, CreateReminderInput, UpdateReminderInput } from '../../types/reminder';

export const remindersHandler = new Hono();

// POST /api/reminders
remindersHandler.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateReminderInput>();

    if (!body.title || !body.type) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'Missing required fields: title, type' },
        400
      );
    }

    if (body.type !== 'once' && body.type !== 'recurring') {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'type must be "once" or "recurring"' },
        400
      );
    }

    if (body.type === 'once' && !body.triggerAt) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'triggerAt is required for once-type reminders' },
        400
      );
    }

    if (body.type === 'recurring' && !body.schedule) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'schedule is required for recurring reminders' },
        400
      );
    }

    const id = generateId();
    const timestamp = now();

    const reminder: Reminder = {
      id,
      title: body.title,
      body: body.body || '',
      type: body.type,
      triggerAt: body.triggerAt,
      schedule: body.schedule,
      enabled: body.enabled !== undefined ? body.enabled : true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    reminder.nextTriggerAt = calculateNextTrigger(reminder, timestamp);
    await saveReminder(reminder);

    return c.json(reminder, 201);
  } catch (error) {
    console.error('Failed to create reminder:', error);
    return c.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create reminder' },
      500
    );
  }
});

// GET /api/reminders
remindersHandler.get('/', async (c) => {
  try {
    const all = await getAllReminders();
    all.sort((a, b) => b.createdAt - a.createdAt);
    return c.json(all);
  } catch (error) {
    console.error('Failed to list reminders:', error);
    return c.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to list reminders' },
      500
    );
  }
});

// GET /api/reminders/:id
remindersHandler.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const reminder = await getReminder(id);

    if (!reminder) {
      return c.json(
        { error: 'NOT_FOUND', message: `Reminder ${id} not found` },
        404
      );
    }

    return c.json(reminder);
  } catch (error) {
    console.error('Failed to get reminder:', error);
    return c.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to get reminder' },
      500
    );
  }
});

// PUT /api/reminders/:id
remindersHandler.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const existing = await getReminder(id);

    if (!existing) {
      return c.json(
        { error: 'NOT_FOUND', message: `Reminder ${id} not found` },
        404
      );
    }

    const body = await c.req.json<UpdateReminderInput>();

    const updated: Reminder = {
      ...existing,
      title: body.title !== undefined ? body.title : existing.title,
      body: body.body !== undefined ? body.body : existing.body,
      type: body.type !== undefined ? body.type : existing.type,
      triggerAt: body.triggerAt !== undefined ? body.triggerAt : existing.triggerAt,
      schedule: body.schedule !== undefined ? body.schedule : existing.schedule,
      enabled: body.enabled !== undefined ? body.enabled : existing.enabled,
      updatedAt: now(),
    };

    updated.nextTriggerAt = calculateNextTrigger(updated, updated.updatedAt);
    await saveReminder(updated);

    return c.json(updated);
  } catch (error) {
    console.error('Failed to update reminder:', error);
    return c.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update reminder' },
      500
    );
  }
});

// DELETE /api/reminders/:id
remindersHandler.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    if (!(await reminderExists(id))) {
      return c.json(
        { error: 'NOT_FOUND', message: `Reminder ${id} not found` },
        404
      );
    }

    await deleteReminder(id);

    return c.json({ success: true, message: 'Reminder deleted' });
  } catch (error) {
    console.error('Failed to delete reminder:', error);
    return c.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete reminder' },
      500
    );
  }
});
