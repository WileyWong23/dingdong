// 叮咚 DingDong - Layout Component

import React from 'react';
import { useReminderStore } from '../stores/reminderStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isDarkMode, toggleDarkMode } = useReminderStore();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <div className="max-w-[720px] mx-auto px-5 py-4 flex items-center justify-between">
          <h1 className="text-[22px] font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]">
            叮咚
          </h1>
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-full border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="切换暗色模式"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[720px] mx-auto px-5">
        {children}
      </main>
    </div>
  );
};

export default Layout;
