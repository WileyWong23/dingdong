// 叮咚 DingDong - API Service Layer

import type { Reminder, StoredSubscription } from '../types/reminder';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '请求失败' }));
      return { success: false, error: error.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('API request failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '网络错误' 
    };
  }
}

// 提醒 CRUD API
export const reminderApi = {
  async getAll(): Promise<ApiResponse<Reminder[]>> {
    return fetchApi('/reminders');
  },

  async get(id: string): Promise<ApiResponse<Reminder>> {
    return fetchApi(`/reminders/${id}`);
  },

  async create(reminder: Reminder): Promise<ApiResponse<Reminder>> {
    return fetchApi('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    });
  },

  async update(reminder: Reminder): Promise<ApiResponse<Reminder>> {
    return fetchApi(`/reminders/${reminder.id}`, {
      method: 'PUT',
      body: JSON.stringify(reminder),
    });
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return fetchApi(`/reminders/${id}`, {
      method: 'DELETE',
    });
  },

  async toggle(id: string): Promise<ApiResponse<Reminder>> {
    return fetchApi(`/reminders/${id}/toggle`, {
      method: 'PATCH',
    });
  },
};

// 推送订阅 API
export const subscribeApi = {
  async save(subscription: PushSubscription): Promise<ApiResponse<void>> {
    const sub: StoredSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
      createdAt: Date.now(),
    };
    
    return fetchApi('/subscribe', {
      method: 'POST',
      body: JSON.stringify(sub),
    });
  },

  async delete(endpoint: string): Promise<ApiResponse<void>> {
    return fetchApi('/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    });
  },
};

// 辅助函数
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary);
}

// 健康检查
export const healthApi = {
  async check(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
};
