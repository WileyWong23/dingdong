// 叮咚 DingDong - Zustand Reminder Store

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Reminder, ReminderGroup } from '../types/reminder';
import { dbHelpers } from '../db/database';
import { calculateNextTrigger, formatDateGroup } from '../utils/schedule';

interface ReminderState {
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  
  // UI 状态
  isFormOpen: boolean;
  editingReminder: Reminder | null;
  isDarkMode: boolean;
  
  // Actions
  loadReminders: () => Promise<void>;
  addReminder: (reminder: Reminder) => Promise<void>;
  updateReminder: (reminder: Reminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  
  // UI Actions
  openForm: (reminder?: Reminder) => void;
  closeForm: () => void;
  toggleDarkMode: () => void;
  
  // Computed
  getGroupedReminders: () => ReminderGroup[];
  getEnabledCount: () => number;
}

export const useReminderStore = create<ReminderState>()(
  subscribeWithSelector((set, get) => ({
    reminders: [],
    isLoading: false,
    error: null,
    isFormOpen: false,
    editingReminder: null,
    isDarkMode: false,
    
    loadReminders: async () => {
      set({ isLoading: true, error: null });
      try {
        const reminders = await dbHelpers.getAllReminders();
        set({ reminders, isLoading: false });
      } catch (error) {
        console.error('Failed to load reminders:', error);
        set({ error: '加载提醒失败', isLoading: false });
      }
    },
    
    addReminder: async (reminder: Reminder) => {
      try {
        // 计算下次触发时间
        reminder.nextTriggerAt = calculateNextTrigger(reminder);
        reminder.updatedAt = Date.now();
        
        await dbHelpers.addReminder(reminder);
        
        set(state => ({
          reminders: [reminder, ...state.reminders],
          isFormOpen: false,
          editingReminder: null
        }));
      } catch (error) {
        console.error('Failed to add reminder:', error);
        set({ error: '添加提醒失败' });
      }
    },
    
    updateReminder: async (reminder: Reminder) => {
      try {
        // 重新计算下次触发时间
        reminder.nextTriggerAt = calculateNextTrigger(reminder);
        reminder.updatedAt = Date.now();
        
        await dbHelpers.updateReminder(reminder);
        
        set(state => ({
          reminders: state.reminders.map(r => r.id === reminder.id ? reminder : r),
          isFormOpen: false,
          editingReminder: null
        }));
      } catch (error) {
        console.error('Failed to update reminder:', error);
        set({ error: '更新提醒失败' });
      }
    },
    
    deleteReminder: async (id: string) => {
      try {
        await dbHelpers.deleteReminder(id);
        set(state => ({
          reminders: state.reminders.filter(r => r.id !== id)
        }));
      } catch (error) {
        console.error('Failed to delete reminder:', error);
        set({ error: '删除提醒失败' });
      }
    },
    
    toggleReminder: async (id: string) => {
      try {
        const reminder = await dbHelpers.toggleReminder(id);
        if (reminder) {
          set(state => ({
            reminders: state.reminders.map(r => r.id === id ? reminder : r)
          }));
        }
      } catch (error) {
        console.error('Failed to toggle reminder:', error);
        set({ error: '切换提醒状态失败' });
      }
    },
    
    openForm: (reminder?: Reminder) => {
      set({ isFormOpen: true, editingReminder: reminder || null });
    },
    
    closeForm: () => {
      set({ isFormOpen: false, editingReminder: null });
    },
    
    toggleDarkMode: () => {
      set(state => {
        const newMode = !state.isDarkMode;
        // 保存到 localStorage
        localStorage.setItem('darkMode', JSON.stringify(newMode));
        // 更新 HTML class
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: newMode };
      });
    },
    
    getGroupedReminders: () => {
      const { reminders } = get();
      const enabledReminders = reminders.filter(r => r.enabled);
      const disabledReminders = reminders.filter(r => !r.enabled);
      
      // 按日期分组启用的提醒
      const groups: Record<string, ReminderGroup> = {};
      
      enabledReminders.forEach(reminder => {
        const triggerTime = reminder.nextTriggerAt || reminder.triggerAt || reminder.createdAt;
        const groupLabel = formatDateGroup(triggerTime);
        
        if (!groups[groupLabel]) {
          groups[groupLabel] = {
            label: groupLabel,
            date: new Date(triggerTime),
            reminders: []
          };
        }
        groups[groupLabel].reminders.push(reminder);
      });
      
      // 添加已暂停的提醒组
      if (disabledReminders.length > 0) {
        groups['已暂停'] = {
          label: '已暂停',
          date: new Date(0),
          reminders: disabledReminders
        };
      }
      
      // 按日期排序
      return Object.values(groups).sort((a, b) => {
        if (a.label === '已暂停') return 1;
        if (b.label === '已暂停') return -1;
        return a.date.getTime() - b.date.getTime();
      });
    },
    
    getEnabledCount: () => {
      return get().reminders.filter(r => r.enabled).length;
    }
  }))
);

// 初始化暗色模式
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'true') {
  document.documentElement.classList.add('dark');
  useReminderStore.setState({ isDarkMode: true });
}
