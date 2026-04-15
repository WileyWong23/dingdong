/** Reminder data model */
export interface Reminder {
  id: string; // UUID v4
  title: string;
  body: string;
  type: 'once' | 'recurring';

  /** One-time reminder trigger timestamp (ms) */
  triggerAt?: number;

  /** Recurring schedule configuration */
  schedule?: {
    intervalSeconds: number;
    rangeStart: string; // "HH:mm"
    rangeEnd: string;   // "HH:mm"
    daysOfWeek: number[]; // 0=Sunday ... 6=Saturday
    timezone: string;   // e.g. "Asia/Shanghai"
  };

  /** Whether the reminder is active */
  enabled: boolean;

  /** Last time a notification was sent (ms) */
  lastTriggeredAt?: number;

  /** Next scheduled trigger timestamp (ms, UTC) */
  nextTriggerAt?: number;

  createdAt: number;
  updatedAt: number;
}

/** Stored push subscription (simplified PushSubscription) */
export interface StoredSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: number;
}

/** Payload for creating a reminder */
export interface CreateReminderInput {
  title: string;
  body?: string;
  type: 'once' | 'recurring';
  triggerAt?: number;
  schedule?: {
    intervalSeconds: number;
    rangeStart: string;
    rangeEnd: string;
    daysOfWeek: number[];
    timezone: string;
  };
  enabled?: boolean;
}

/** Payload for updating a reminder */
export interface UpdateReminderInput {
  title?: string;
  body?: string;
  type?: 'once' | 'recurring';
  triggerAt?: number;
  schedule?: {
    intervalSeconds: number;
    rangeStart: string;
    rangeEnd: string;
    daysOfWeek: number[];
    timezone: string;
  };
  enabled?: boolean;
}

/** Push notification payload */
export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** API error response */
export interface ErrorResponse {
  error: string;
  message: string;
}
