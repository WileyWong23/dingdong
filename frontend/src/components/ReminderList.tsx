// 叮咚 DingDong - Reminder List Component

import React from 'react';
import { useReminderStore } from '../stores/reminderStore';
import { formatTime, describeSchedule } from '../utils/schedule';
import type { Reminder } from '../types/reminder';

interface ReminderCardProps {
  reminder: Reminder;
  onToggle: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onToggle, onEdit, onDelete }) => {
  const time = reminder.type === 'once' && reminder.triggerAt
    ? formatTime(reminder.triggerAt)
    : reminder.schedule
      ? formatTime(new Date().setHours(...reminder.schedule.rangeStart.split(':').map(Number) as [number, number]))
      : '';

  const description = reminder.type === 'once'
    ? '一次性提醒'
    : reminder.schedule
      ? describeSchedule(reminder.schedule)
      : '';

  return (
    <div className="group bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-[16px] p-4 mb-2 flex items-center gap-3 shadow-[var(--shadow-card)] hover:shadow-md transition-all duration-200">
      {/* Toggle Check */}
      <button
        onClick={() => onToggle(reminder.id)}
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all duration-200 ${
          reminder.enabled
            ? 'border-[var(--color-border)] dark:border-[var(--color-border-dark)]'
            : 'bg-[var(--color-success)] border-[var(--color-success)]'
        }`}
      >
        {!reminder.enabled && (
          <span className="text-white text-xs font-bold">✓</span>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-[17px] font-medium ${
          !reminder.enabled ? 'line-through text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]' : ''
        }`}>
          {reminder.title}
        </div>
        {reminder.body && (
          <div className="text-[13px] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mt-0.5 truncate">
            {reminder.body}
          </div>
        )}
        <div className="mt-1">
          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-[6px] ${
            reminder.type === 'recurring'
              ? 'bg-[#E8F4FF] dark:bg-[#1a3a5c] text-[var(--color-accent)]'
              : 'bg-[#FFF3E0] dark:bg-[#5c3a1a] text-[var(--color-warning)]'
          }`}>
            {reminder.type === 'recurring' ? '🔄 重复' : '📌 一次'}
          </span>
        </div>
      </div>

      {/* Time */}
      <div className={`text-[15px] font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] flex-shrink-0 ${
        !reminder.enabled ? 'line-through' : ''
      }`}>
        {time}
      </div>

      {/* Actions */}
      <div className="hidden group-hover:flex items-center gap-1">
        <button
          onClick={() => onEdit(reminder)}
          className="w-8 h-8 rounded-lg bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] flex items-center justify-center cursor-pointer hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-border-dark)] transition-colors"
          aria-label="编辑"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(reminder.id)}
          className="w-8 h-8 rounded-lg bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] flex items-center justify-center cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
          aria-label="删除"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

interface SectionHeaderProps {
  label: string;
  count: number;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ label, count }) => (
  <div className="text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] uppercase tracking-wider py-4 px-0">
    {label} ({count})
  </div>
);

export const ReminderList: React.FC = () => {
  const { getGroupedReminders, toggleReminder, openForm, deleteReminder, isLoading } = useReminderStore();
  const groups = getGroupedReminders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent"></div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔔</div>
        <div className="text-[22px] font-semibold mb-2">还没有任何提醒</div>
        <div className="text-[15px] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] leading-relaxed">
          点击下方按钮，创建你的第一个提醒
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {groups.map(group => (
        <div key={group.label}>
          <SectionHeader label={group.label} count={group.reminders.length} />
          {group.reminders.map(reminder => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onToggle={toggleReminder}
              onEdit={openForm}
              onDelete={deleteReminder}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ReminderList;
