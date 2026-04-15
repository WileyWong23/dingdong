// 叮咚 DingDong - Schedule Calculation Utilities

import type { Schedule, Reminder, TimeUnit } from '../types/reminder';

/**
 * 计算下次触发时间
 * @param reminder 提醒对象
 * @param fromTime 起始时间（默认当前时间）
 * @returns 下次触发的时间戳 (ms)
 */
export function calculateNextTrigger(reminder: Reminder, fromTime?: number): number {
  const now = fromTime || Date.now();

  if (reminder.type === 'once') {
    return reminder.triggerAt || now + 60000; // 默认1分钟后
  }

  if (!reminder.schedule) {
    return now + 3600000; // 默认1小时后
  }

  const { schedule } = reminder;
  return calculateNextFromSchedule(schedule, now);
}

/**
 * 从调度规则计算下次触发时间
 */
export function calculateNextFromSchedule(schedule: Schedule, fromTime: number): number {
  const { intervalSeconds, rangeStart, rangeEnd, daysOfWeek, timezone } = schedule;
  
  // 转换起始时间到目标时区
  const nowInTz = new Date(fromTime);
  
  // 获取当前时间在目标时区的各部分
  const nowHour = parseInt(nowInTz.toLocaleString('en-US', { 
    timeZone: timezone, 
    hour: '2-digit', 
    hour12: false 
  }).split(',')[0].trim());
  
  const nowMinute = parseInt(nowInTz.toLocaleString('en-US', { 
    timeZone: timezone, 
    minute: '2-digit' 
  }));
  
  const nowDayOfWeek = getDayOfWeekInTz(nowInTz, timezone);
  
  // 解析范围时间
  const [startHour, startMinute] = parseTime(rangeStart);
  const [endHour, endMinute] = parseTime(rangeEnd);
  
  const rangeStartMinutes = startHour * 60 + startMinute;
  const rangeEndMinutes = endHour * 60 + endMinute;
  const nowMinutes = nowHour * 60 + nowMinute;
  
  const intervalMinutes = Math.floor(intervalSeconds / 60);
  
  // 今天范围内查找
  if (daysOfWeek.includes(nowDayOfWeek)) {
    if (rangeStartMinutes <= rangeEndMinutes) {
      // 正常范围（如 09:00 - 21:00）
      if (nowMinutes < rangeEndMinutes) {
        // 找下一个有效时间点
        let candidate = Math.max(rangeStartMinutes, nowMinutes + 1);
        // 对齐到间隔
        candidate = Math.ceil(candidate / intervalMinutes) * intervalMinutes;
        
        if (candidate <= rangeEndMinutes) {
          return setTimeInTz(nowInTz, Math.floor(candidate / 60), candidate % 60, timezone);
        }
      }
    }
  }
  
  // 今天没有更多时间点，查找未来几天
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const futureDate = new Date(nowInTz);
    futureDate.setDate(futureDate.getDate() + dayOffset);
    const futureDay = getDayOfWeekInTz(futureDate, timezone);
    
    if (daysOfWeek.includes(futureDay)) {
      return setTimeInTz(futureDate, startHour, startMinute, timezone);
    }
  }
  
  // 兜底：1小时后
  return fromTime + 3600000;
}

/**
 * 解析 "HH:mm" 格式的时间字符串
 */
export function parseTime(timeStr: string): [number, number] {
  const [hour, minute] = timeStr.split(':').map(Number);
  return [hour || 0, minute || 0];
}

/**
 * 获取指定时区的星期几
 */
export function getDayOfWeekInTz(date: Date, timezone: string): number {
  const dayStr = date.toLocaleString('en-US', { 
    timeZone: timezone, 
    weekday: 'short' 
  });
  const dayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  };
  return dayMap[dayStr.substring(0, 3)] ?? 0;
}

/**
 * 在指定时区设置时间
 */
export function setTimeInTz(date: Date, hour: number, minute: number, timezone: string): number {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  localDate.setHours(hour, minute, 0, 0);
  return localDate.getTime();
}

/**
 * 计算间隔秒数
 */
export function calculateInterval(interval: number, unit: TimeUnit): number {
  const unitSeconds: Record<TimeUnit, number> = {
    minutes: 60,
    hours: 3600,
    days: 86400,
    weeks: 604800
  };
  return interval * unitSeconds[unit];
}

/**
 * 从秒数反推间隔和单位
 */
export function parseInterval(seconds: number): { interval: number; unit: TimeUnit } {
  if (seconds % 604800 === 0) return { interval: seconds / 604800, unit: 'weeks' };
  if (seconds % 86400 === 0) return { interval: seconds / 86400, unit: 'days' };
  if (seconds % 3600 === 0) return { interval: seconds / 3600, unit: 'hours' };
  return { interval: seconds / 60, unit: 'minutes' };
}

/**
 * 格式化时间为 HH:mm
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 格式化日期为友好的字符串
 */
export function formatDateGroup(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (targetDate.getTime() === today.getTime()) return '今天的提醒';
  if (targetDate.getTime() === tomorrow.getTime()) return '明天的提醒';
  
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = dayNames[date.getDay()];
  
  return `${month}月${day}日 ${dayName}`;
}

/**
 * 生成调度规则的描述文字
 */
export function describeSchedule(schedule: Schedule): string {
  const { intervalSeconds, rangeStart, rangeEnd, daysOfWeek } = schedule;
  const { interval, unit } = parseInterval(intervalSeconds);
  
  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];
  const dayStr = daysOfWeek.length === 7 
    ? '每天' 
    : daysOfWeek.length === 5 && !daysOfWeek.includes(0) && !daysOfWeek.includes(6)
      ? '工作日'
      : daysOfWeek.map(d => dayLabels[d]).join('、');
  
  const unitLabels: Record<TimeUnit, string> = {
    minutes: '分钟',
    hours: '小时', 
    days: '天',
    weeks: '周'
  };
  
  if (rangeStart === rangeEnd) {
    return `${dayStr} ${rangeStart}，每${interval > 1 ? interval : ''}${unitLabels[unit]}`;
  }
  
  return `${dayStr} ${rangeStart} - ${rangeEnd}，每${interval > 1 ? interval : ''}${unitLabels[unit]}`;
}

/**
 * 获取默认时区
 */
export function getDefaultTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
}

/**
 * 创建默认的一次性提醒
 */
export function createOnceReminder(title: string, body: string, triggerAt: number): Reminder {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title,
    body,
    type: 'once',
    triggerAt,
    enabled: true,
    nextTriggerAt: triggerAt,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * 创建默认的重复提醒
 */
export function createRecurringReminder(title: string, body: string, schedule: Schedule): Reminder {
  const now = Date.now();
  const nextTriggerAt = calculateNextFromSchedule(schedule, now);
  
  return {
    id: crypto.randomUUID(),
    title,
    body,
    type: 'recurring',
    schedule,
    enabled: true,
    nextTriggerAt,
    createdAt: now,
    updatedAt: now
  };
}
