import { useState, useEffect, useRef, useCallback } from 'react';
import type { NotificationItem, ToastItem } from './types';

const API_BASE = 'http://127.0.0.1:8000/api/v1/notifications';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Track previous notification IDs to detect new notifications during polling
  const prevIdsRef = useRef<Set<number>>(new Set());
  const initialFetchDone = useRef<boolean>(false);

  const fetchNotifications = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      setError(null);

      const [historyRes, countRes] = await Promise.all([
        fetch(`${API_BASE}/history`),
        fetch(`${API_BASE}/unread-count`)
      ]);

      if (!historyRes.ok || !countRes.ok) {
        throw new Error('Failed to fetch notification data');
      }

      const historyData: NotificationItem[] = await historyRes.json();
      const countData = await countRes.json();

      setNotifications(historyData);
      setUnreadCount(countData.unread_count || 0);

      // Detect new notifications during polling
      if (initialFetchDone.current) {
        const newItems = historyData.filter(item => !prevIdsRef.current.has(item.id));
        if (newItems.length > 0) {
          const newToasts: ToastItem[] = newItems.map(item => ({
            id: `toast-${item.id}-${Date.now()}`,
            title: item.subject || `New ${item.channel} Notification`,
            message: item.message,
            type: item.status === 'FAILED' ? 'error' : item.channel === 'PUSH' ? 'info' : 'success',
            timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
          }));
          setToasts(prev => [...prev, ...newToasts]);
        }
      }

      // Update known IDs
      prevIdsRef.current = new Set(historyData.map(item => item.id));
      initialFetchDone.current = true;
    } catch (err: any) {
      console.error('[USE_NOTIFICATIONS_ERROR]', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  // Initial fetch on mount & set up 15-second polling interval
  useEffect(() => {
    fetchNotifications(false);

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/read`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark notification as read');

      setNotifications(prev =>
        prev.map(item => (item.id === id ? { ...item, is_read: true } : item))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('[MARK_READ_ERROR]', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/read-all`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark all notifications as read');

      setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('[MARK_ALL_READ_ERROR]', err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notification');

      const target = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(item => item.id !== id));
      if (target && !target.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('[DELETE_NOTIFICATION_ERROR]', err);
    }
  };

  const dismissToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    toasts,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    dismissToast
  };
};
