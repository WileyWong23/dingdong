/**
 * lib/kv.ts — Upstash Redis wrapper for Reminder CRUD and Subscription management.
 *
 * All data is stored with keys prefixed by `dd:` (dingdong).
 */

import { Redis } from '@upstash/redis';
import type { Reminder, StoredSubscription } from '../types/reminder';

// ─── Initialize Redis client ────────────────────────────────────────
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// ─── Key prefixes ───────────────────────────────────────────────────
const REMINDER_PREFIX = 'dd:reminder:';
const REMINDER_INDEX_KEY = 'dd:reminders:index'; // set of all reminder IDs
const SUBSCRIPTION_PREFIX = 'dd:sub:';
const SUBSCRIPTION_INDEX_KEY = 'dd:subs:index'; // set of all subscription endpoints

// ─── Reminder CRUD ──────────────────────────────────────────────────

/** Save a reminder (create or update). */
export async function saveReminder(reminder: Reminder): Promise<void> {
  await redis.set(`${REMINDER_PREFIX}${reminder.id}`, JSON.stringify(reminder));
  await redis.sadd(REMINDER_INDEX_KEY, reminder.id);
}

/** Get a single reminder by ID. */
export async function getReminder(id: string): Promise<Reminder | null> {
  const data = await redis.get(`${REMINDER_PREFIX}${id}`);
  if (!data) return null;
  if (typeof data === 'string') return JSON.parse(data);
  return data as Reminder;
}

/** Get all reminders. */
export async function getAllReminders(): Promise<Reminder[]> {
  const ids = await redis.smembers(REMINDER_INDEX_KEY);
  if (!ids || ids.length === 0) return [];

  const reminders: Reminder[] = [];
  for (const id of ids) {
    const data = await redis.get(`${REMINDER_PREFIX}${id}`);
    if (data) {
      reminders.push(
        typeof data === 'string' ? JSON.parse(data) : (data as Reminder)
      );
    }
  }

  return reminders;
}

/** Get reminders where nextTriggerAt <= maxTimestamp (for cron scanning). */
export async function getRemindersDueBefore(maxTimestamp: number): Promise<Reminder[]> {
  const all = await getAllReminders();
  return all.filter(
    (r) => r.enabled && r.nextTriggerAt !== undefined && r.nextTriggerAt <= maxTimestamp
  );
}

/** Delete a reminder by ID. */
export async function deleteReminder(id: string): Promise<void> {
  await redis.del(`${REMINDER_PREFIX}${id}`);
  await redis.srem(REMINDER_INDEX_KEY, id);
}

/** Check if a reminder exists. */
export async function reminderExists(id: string): Promise<boolean> {
  return (await redis.exists(`${REMINDER_PREFIX}${id}`)) === 1;
}

// ─── Subscription management ────────────────────────────────────────

/** Save a push subscription. Uses endpoint as the key. */
export async function saveSubscription(sub: StoredSubscription): Promise<void> {
  await redis.set(`${SUBSCRIPTION_PREFIX}${sub.endpoint}`, JSON.stringify(sub));
  await redis.sadd(SUBSCRIPTION_INDEX_KEY, sub.endpoint);
}

/** Get all subscriptions. */
export async function getAllSubscriptions(): Promise<StoredSubscription[]> {
  const endpoints = await redis.smembers(SUBSCRIPTION_INDEX_KEY);
  if (!endpoints || endpoints.length === 0) return [];

  const subscriptions: StoredSubscription[] = [];
  for (const ep of endpoints) {
    const data = await redis.get(`${SUBSCRIPTION_PREFIX}${ep}`);
    if (data) {
      subscriptions.push(
        typeof data === 'string' ? JSON.parse(data) : (data as StoredSubscription)
      );
    }
  }

  return subscriptions;
}

/** Remove a subscription by endpoint. */
export async function removeSubscription(endpoint: string): Promise<void> {
  await redis.del(`${SUBSCRIPTION_PREFIX}${endpoint}`);
  await redis.srem(SUBSCRIPTION_INDEX_KEY, endpoint);
}
