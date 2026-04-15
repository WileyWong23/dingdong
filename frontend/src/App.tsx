// 叮咚 DingDong - Main Application Component

import React, { useEffect } from 'react';
import { Layout } from './components/Layout';
import { ReminderList } from './components/ReminderList';
import { ReminderForm } from './components/ReminderForm';
import { useReminderStore } from './stores/reminderStore';
import { initializePush, isNotificationSupported, getNotificationPermission } from './services/push';

function App() {
  const { loadReminders, openForm } = useReminderStore();

  useEffect(() => {
    // Load reminders from IndexedDB
    loadReminders();

    // Initialize push notifications
    const initPush = async () => {
      if (isNotificationSupported() && getNotificationPermission() === 'default') {
        // Don't auto-request, wait for user interaction
        console.log('Push notifications available but not yet granted');
      } else if (getNotificationPermission() === 'granted') {
        await initializePush();
      }
    };
    initPush();
  }, [loadReminders]);

  return (
    <Layout>
      <div className="pt-4">
        <h1 className="text-[34px] font-bold tracking-[-0.5px] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] mb-4">
          提醒
        </h1>
      </div>
      
      <ReminderList />
      
      {/* FAB - New Reminder Button */}
      <button
        onClick={() => openForm()}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[390px] h-[50px] bg-[var(--color-accent)] text-white border-none rounded-[14px] text-[17px] font-semibold cursor-pointer shadow-[0_4px_12px_rgba(0,122,255,0.3)] hover:shadow-[0_6px_20px_rgba(0,122,255,0.4)] transition-all active:scale-[0.97] z-50"
      >
        + 新建提醒
      </button>

      {/* Form Modal */}
      <ReminderForm />
    </Layout>
  );
}

export default App;
