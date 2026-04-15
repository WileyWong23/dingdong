// 叮咚 DingDong - Schedule Editor Component

import React, { useState, useEffect } from 'react';
import type { Schedule } from '../types/reminder';
import { 
  PRESET_SCHEDULES, 
  DAY_LABELS, 
  TIME_UNITS,
  type TimeUnit 
} from '../types/reminder';
import { parseInterval, getDefaultTimezone } from '../utils/schedule';

interface ScheduleEditorProps {
  schedule?: Schedule;
  onSave: (schedule: Schedule) => void;
  onCancel: () => void;
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  schedule,
  onSave,
  onCancel
}) => {
  const defaultSchedule: Schedule = {
    intervalSeconds: 3600,
    rangeStart: '09:00',
    rangeEnd: '21:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    timezone: getDefaultTimezone()
  };

  const [interval, setInterval] = useState(1);
  const [unit, setUnit] = useState<TimeUnit>('hours');
  const [rangeStart, setRangeStart] = useState('09:00');
  const [rangeEnd, setRangeEnd] = useState('21:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    const s = schedule || defaultSchedule;
    const parsed = parseInterval(s.intervalSeconds);
    setInterval(parsed.interval);
    setUnit(parsed.unit);
    setRangeStart(s.rangeStart);
    setRangeEnd(s.rangeEnd);
    setDaysOfWeek(s.daysOfWeek);
  }, [schedule]);

  const handlePresetClick = (presetName: string) => {
    const preset = PRESET_SCHEDULES.find(p => p.name === presetName);
    if (preset) {
      const parsed = parseInterval(preset.intervalSeconds);
      setInterval(parsed.interval);
      setUnit(parsed.unit);
      setRangeStart(preset.rangeStart);
      setRangeEnd(preset.rangeEnd);
      setDaysOfWeek(preset.daysOfWeek);
      setActivePreset(presetName);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setDaysOfWeek(prev => 
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
    setActivePreset(null);
  };

  const handleSave = () => {
    const unitConfig = TIME_UNITS.find(u => u.value === unit);
    const intervalSeconds = interval * (unitConfig?.seconds || 3600);
    
    onSave({
      intervalSeconds,
      rangeStart,
      rangeEnd,
      daysOfWeek,
      timezone: getDefaultTimezone()
    });
  };

  return (
    <div className="animate-slideUp">
      {/* Title */}
      <h2 className="text-[22px] font-bold text-center mb-6">重复规则</h2>

      {/* Preset Grid */}
      <div className="mb-6">
        <div className="text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-2">
          预设方案
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_SCHEDULES.map(preset => (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset.name)}
              className={`p-3.5 rounded-xl border text-center cursor-pointer text-[15px] font-medium transition-all duration-200 ${
                activePreset === preset.name
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border-[var(--color-border)] dark:border-[var(--color-border-dark)] hover:border-[var(--color-accent)]'
              }`}
            >
              {preset.icon} {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Interval Input */}
      <div className="mb-6">
        <div className="text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-2">
          重复间隔
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[15px] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">每</span>
          <input
            type="number"
            min="1"
            max="999"
            value={interval}
            onChange={(e) => {
              setInterval(Math.max(1, parseInt(e.target.value) || 1));
              setActivePreset(null);
            }}
            className="w-[72px] h-11 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl text-center text-[17px] font-medium bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value as TimeUnit);
              setActivePreset(null);
            }}
            className="h-11 px-3 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl text-[15px] font-medium bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] outline-none focus:border-[var(--color-accent)] transition-colors cursor-pointer"
          >
            {TIME_UNITS.map(u => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Time Range */}
      <div className="mb-6">
        <div className="text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-2">
          有效时间范围
        </div>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={rangeStart}
            onChange={(e) => {
              setRangeStart(e.target.value);
              setActivePreset(null);
            }}
            className="flex-1 h-12 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl text-center text-[20px] font-medium bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          <span className="text-[20px] text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">→</span>
          <input
            type="time"
            value={rangeEnd}
            onChange={(e) => {
              setRangeEnd(e.target.value);
              setActivePreset(null);
            }}
            className="flex-1 h-12 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl text-center text-[20px] font-medium bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>
      </div>

      {/* Days of Week */}
      <div className="mb-6">
        <div className="text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)] mb-2">
          重复日期
        </div>
        <div className="flex gap-2 justify-between">
          {DAY_LABELS.map((label, index) => (
            <button
              key={index}
              onClick={() => toggleDay(index)}
              className={`w-11 h-11 rounded-full border flex items-center justify-center text-[14px] font-semibold cursor-pointer transition-all duration-200 ${
                daysOfWeek.includes(index)
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border-[var(--color-border)] dark:border-[var(--color-border-dark)] hover:border-[var(--color-accent)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onCancel}
          className="flex-1 h-12 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl text-[16px] font-medium cursor-pointer hover:bg-[var(--color-bg)] dark:hover:bg-[var(--color-bg-dark)] transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="flex-1 h-12 bg-[var(--color-accent)] text-white border-none rounded-xl text-[16px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
        >
          保存规则
        </button>
      </div>
    </div>
  );
};

export default ScheduleEditor;
