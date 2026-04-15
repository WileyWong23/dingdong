// 叮咚 DingDong - Reminder Type Definitions

export interface Schedule {
  intervalSeconds: number;     // 间隔秒数
  rangeStart: string;          // "HH:mm" 格式
  rangeEnd: string;            // "HH:mm" 格式
  daysOfWeek: number[];        // 0=周日, 1=周一...6=周六
  timezone: string;            // "Asia/Shanghai" 等 IANA 时区
}

export interface Reminder {
  id: string;                  // UUID v4
  title: string;
  body: string;
  type: 'once' | 'recurring';
  
  // 一次性提醒
  triggerAt?: number;          // Unix timestamp (ms)
  
  // 重复提醒
  schedule?: Schedule;
  
  // 状态
  enabled: boolean;
  lastTriggeredAt?: number;    // 上次触发时间
  nextTriggerAt?: number;      // 下次触发时间
  createdAt: number;
  updatedAt: number;
}

export interface StoredSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: number;
}

export interface ReminderGroup {
  label: string;
  date: Date;
  reminders: Reminder[];
}

export type TimeUnit = 'minutes' | 'hours' | 'days' | 'weeks';

export interface PresetSchedule {
  name: string;
  icon: string;
  intervalSeconds: number;
  rangeStart: string;
  rangeEnd: string;
  daysOfWeek: number[];
}

export const PRESET_SCHEDULES: PresetSchedule[] = [
  {
    name: '每小时',
    icon: '⏰',
    intervalSeconds: 3600,
    rangeStart: '09:00',
    rangeEnd: '21:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    name: '每天',
    icon: '📅',
    intervalSeconds: 86400,
    rangeStart: '09:00',
    rangeEnd: '09:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    name: '工作日',
    icon: '💼',
    intervalSeconds: 86400,
    rangeStart: '09:00',
    rangeEnd: '09:00',
    daysOfWeek: [1, 2, 3, 4, 5]
  },
  {
    name: '每周',
    icon: '📆',
    intervalSeconds: 604800,
    rangeStart: '09:00',
    rangeEnd: '09:00',
    daysOfWeek: [1]
  }
];

export const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export const TIME_UNITS: { value: TimeUnit; label: string; seconds: number }[] = [
  { value: 'minutes', label: '分钟', seconds: 60 },
  { value: 'hours', label: '小时', seconds: 3600 },
  { value: 'days', label: '天', seconds: 86400 },
  { value: 'weeks', label: '周', seconds: 604800 }
];
