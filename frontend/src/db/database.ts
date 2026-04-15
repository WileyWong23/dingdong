// 叮咚 DingDong - IndexedDB Database Layer (Dexie.js)

import Dexie, { type Table } from 'dexie';
import type { Reminder } from '../types/reminder';

export class DingDongDB extends Dexie {
  reminders!: Table<Reminder, string>;

  constructor() {
    super('DingDongDB');
    
    this.version(1).stores({
      reminders: 'id, type, enabled, nextTriggerAt, createdAt'
    });
  }
}

export const db = new DingDongDB();

// Database helper functions
export const dbHelpers = {
  async getAllReminders(): Promise<Reminder[]> {
    return db.reminders.orderBy('createdAt').reverse().toArray();
  },

  async getReminder(id: string): Promise<Reminder | undefined> {
    return db.reminders.get(id);
  },

  async addReminder(reminder: Reminder): Promise<string> {
    return db.reminders.add(reminder);
  },

  async updateReminder(reminder: Reminder): Promise<string> {
    return db.reminders.put(reminder);
  },

  async deleteReminder(id: string): Promise<void> {
    return db.reminders.delete(id);
  },

  async getEnabledReminders(): Promise<Reminder[]> {
    return db.reminders.where('enabled').equals(1).toArray();
  },

  async getRemindersByType(type: 'once' | 'recurring'): Promise<Reminder[]> {
    return db.reminders.where('type').equals(type).toArray();
  },

  async getUpcomingReminders(limitMs: number = 3600000): Promise<Reminder[]> {
    const now = Date.now();
    return db.reminders
      .where('nextTriggerAt')
      .between(now, now + limitMs)
      .and(r => r.enabled)
      .toArray();
  },

  async toggleReminder(id: string): Promise<Reminder | undefined> {
    const reminder = await db.reminders.get(id);
    if (reminder) {
      reminder.enabled = !reminder.enabled;
      reminder.updatedAt = Date.now();
      await db.reminders.put(reminder);
      return reminder;
    }
    return undefined;
  },

  async clearAll(): Promise<void> {
    return db.reminders.clear();
  }
};
