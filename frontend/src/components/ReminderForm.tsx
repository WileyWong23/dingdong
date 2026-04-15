// 叮咚 DingDong - Reminder Form Component (Bottom Sheet)

import React, { useState, useEffect, useCallback } from 'react';
import { useReminderStore } from '../stores/reminderStore';
import { ScheduleEditor } from './ScheduleEditor';
import { 
  createOnceReminder, 
  createRecurringReminder, 
  formatTime,
  describeSchedule,
  getDefaultTimezone,
  calculateNextFromSchedule
} from '../utils/schedule';
import type { Schedule } from '../types/reminder';

export const ReminderForm: React.FC = () => {
  const { isFormOpen, editingReminder, closeForm, addReminder, updateReminder } = useReminderStore();
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'once' | 'recurring'>('once');
  const [triggerDate, setTriggerDate] = useState('');
  const [triggerTime, setTriggerTime] = useState('');
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; time?: string }>({});

  // Initialize form when editing
  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title);
      setBody(editingReminder.body || '');
      setType(editingReminder.type);
      
      if (editingReminder.type === 'once' && editingReminder.triggerAt) {
        const date = new Date(editingReminder.triggerAt);
        setTriggerDate(date.toISOString().split('T')[0]);
        setTriggerTime(date.toTimeString().slice(0, 5));
      }
      
      if (editingReminder.type === 'recurring' && editingReminder.schedule) {
        setSchedule(editingReminder.schedule);
      }
    } else {
      resetForm();
    }
  }, [editingReminder, isFormOpen]);

  const resetForm = () => {
    setTitle('');
    setBody('');
    setType('once');
    setTriggerDate(new Date().toISOString().split('T')[0]);
    setTriggerTime('09:00');
    setSchedule(null);
    setShowScheduleEditor(false);
    setErrors({});
  };

  const handleClose = useCallback(() => {
    closeForm();
    resetForm();
  }, [closeForm]);

  const handleSubmit = () => {
    // Validate
    const newErrors: { title?: string; time?: string } = {};
    if (!title.trim()) {
      newErrors.title = '请输入提醒标题';
    }
    
    if (type === 'once') {
      if (!triggerDate || !triggerTime) {
        newErrors.time = '请选择触发时间';
      }
    } else if (!schedule) {
      newErrors.time = '请设置重复规则';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Create or update reminder
    if (type === 'once') {
      const triggerAt = new Date(`${triggerDate}T${triggerTime}`).getTime();
      const reminder = editingReminder
        ? { ...editingReminder, title, body, type, triggerAt, nextTriggerAt: triggerAt }
        : createOnceReminder(title, body, triggerAt);
      
      if (editingReminder) {
        updateReminder(reminder);
      } else {
        addReminder(reminder);
      }
    } else if (schedule) {
      const nextTriggerAt = calculateNextFromSchedule(schedule, Date.now());
      const reminder = editingReminder
        ? { ...editingReminder, title, body, type, schedule, nextTriggerAt }
        : createRecurringReminder(title, body, schedule);
      
      if (editingReminder) {
        updateReminder(reminder);
      } else {
        addReminder(reminder);
      }
    }
    
    handleClose();
  };

  if (!isFormOpen) return null;

  if (showScheduleEditor) {
    return (
      <div className="fixed inset-0 bg-black/30 z-[300] flex items-end justify-center" onClick={(e) => {
        if (e.target === e.currentTarget) setShowScheduleEditor(false);
      }}>
        <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] w-full max-w-[430px] rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto animate-slideUp">
          <div className="w-9 h-1 bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] rounded mx-auto mb-4"></div>
          <ScheduleEditor
            schedule={schedule || undefined}
            onSave={(s) => {
              setSchedule(s);
              setShowScheduleEditor(false);
            }}
            onCancel={() => setShowScheduleEditor(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-[300] flex items-end justify-center" onClick={(e) => {
      if (e.target === e.currentTarget) handleClose();
    }}>
      <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] w-full max-w-[430px] rounded-t-2xl px-5 pb-8 max-h-[85vh] overflow-y-auto animate-slideUp">
        {/* Handle */}
        <div className="w-9 h-1 bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] rounded mx-auto mt-4 mb-4"></div>
        
        {/* Title */}
        <h2 className="text-[22px] font-bold text-center mb-5">
          {editingReminder ? '编辑提醒' : '新建提醒'}
        </h2>

        {/* Title Input */}
        <div className="mb-4">
          <label className="text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] block mb-1.5">
            提醒标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：喝水、吃药、开会..."
            className="w-full h-12 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl px-4 text-[16px] bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          {errors.title && (
            <span className="text-[13px] text-[var(--color-danger)] mt-1 block">{errors.title}</span>
          )}
        </div>

        {/* Body Input */}
        <div className="mb-4">
          <label className="text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] block mb-1.5">
            提醒内容（选填）
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="添加详细说明..."
            className="w-full h-20 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl px-4 py-3 text-[16px] bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
          />
        </div>

        {/* Type Toggle */}
        <div className="mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setType('once')}
              className={`flex-1 h-11 rounded-xl text-[15px] font-medium border cursor-pointer transition-all duration-200 ${
                type === 'once'
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'border-[var(--color-border)] dark:border-[var(--color-border-dark)] hover:border-[var(--color-accent)]'
              }`}
            >
              📌 一次性
            </button>
            <button
              onClick={() => setType('recurring')}
              className={`flex-1 h-11 rounded-xl text-[15px] font-medium border cursor-pointer transition-all duration-200 ${
                type === 'recurring'
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'border-[var(--color-border)] dark:border-[var(--color-border-dark)] hover:border-[var(--color-accent)]'
              }`}
            >
              🔄 重复
            </button>
          </div>
        </div>

        {/* Time Picker (Once) */}
        {type === 'once' && (
          <div className="mb-4">
            <label className="text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] block mb-1.5">
              触发时间
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={triggerDate}
                onChange={(e) => setTriggerDate(e.target.value)}
                className="flex-1 h-12 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl px-4 text-[16px] bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
              <input
                type="time"
                value={triggerTime}
                onChange={(e) => setTriggerTime(e.target.value)}
                className="w-32 h-12 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl px-4 text-[16px] bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </div>
          </div>
        )}

        {/* Schedule Selector (Recurring) */}
        {type === 'recurring' && (
          <div 
            onClick={() => setShowScheduleEditor(true)}
            className="flex items-center justify-between py-3.5 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] cursor-pointer hover:bg-[var(--color-bg)] dark:hover:bg-[var(--color-bg-dark)] -mx-5 px-5 transition-colors"
          >
            <div className="flex items-center gap-2.5 text-[16px]">
              <span>🔄</span>
              <span>{schedule ? describeSchedule(schedule) : '设置重复规则'}</span>
            </div>
            <span className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">›</span>
          </div>
        )}

        {errors.time && (
          <span className="text-[13px] text-[var(--color-danger)] mt-2 block">{errors.time}</span>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full h-12 bg-[var(--color-accent)] text-white border-none rounded-xl text-[17px] font-semibold cursor-pointer mt-6 hover:opacity-90 transition-opacity active:scale-[0.97]"
        >
          {editingReminder ? '保存修改' : '保存提醒'}
        </button>
      </div>
    </div>
  );
};

export default ReminderForm;
