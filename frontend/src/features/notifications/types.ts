export interface NotificationItem {
  id: number;
  user_id?: number | null;
  channel: 'PUSH' | 'EMAIL' | 'SMS' | string;
  recipient: string;
  subject?: string | null;
  message: string;
  status: 'PENDING' | 'DELIVERED' | 'FAILED' | 'RETRYING' | string;
  is_read: boolean;
  retry_count: number;
  max_retries: number;
  error_log?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
}

export const NOTIFICATION_MODULE_ACTIVE = true;
