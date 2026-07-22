import React, { useState } from 'react';
import type { NotificationItem } from './types';
import { X, CheckCheck, Trash2, CheckCircle, Clock, AlertTriangle, RefreshCw, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  error,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.is_read;
    return true;
  });

  const getChannelIcon = (channel: string) => {
    switch (channel.toUpperCase()) {
      case 'PUSH':
        return <Smartphone className="w-5 h-5 text-purple-600" />;
      case 'EMAIL':
        return <Mail className="w-5 h-5 text-blue-600" />;
      case 'SMS':
        return <MessageSquare className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3 mr-1" /> Delivered
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <AlertTriangle className="w-3 h-3 mr-1" /> Failed
          </span>
        );
      case 'RETRYING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Retrying
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Recent';
    const date = new Date(isoString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dim Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-gray-800 shadow-2xl flex flex-col border-l-2 border-gray-200 dark:border-gray-700">
          
          {/* Header */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-[#E8F5E9] text-[#2E7D32] rounded-xl font-bold">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">Notifications</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={onRefresh}
                title="Refresh Notifications"
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Action Sub-Bar */}
          <div className="px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-[#2E7D32] text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'unread'
                    ? 'bg-[#2E7D32] text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="inline-flex items-center text-xs font-extrabold text-[#2E7D32] hover:text-[#1B5E20] hover:underline"
              >
                <CheckCheck className="w-4 h-4 mr-1" /> Mark all read
              </button>
            )}
          </div>

          {/* Notification List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <RefreshCw className="w-10 h-10 animate-spin mb-3 text-[#2E7D32]" />
                <p className="font-bold text-gray-600 dark:text-gray-400">Fetching notifications...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
                <p className="font-bold text-sm">{error}</p>
                <button
                  onClick={onRefresh}
                  className="mt-2 text-xs font-extrabold underline hover:text-red-900"
                >
                  Try Again
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-10 h-10 text-[#2E7D32]" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">No Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                  {activeTab === 'unread'
                    ? 'You have read all your notifications!'
                    : 'Your notification list is currently empty.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  className={`relative p-4 rounded-2xl border-2 transition-all group ${
                    item.is_read
                      ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:border-gray-700'
                      : 'bg-emerald-50/60 border-emerald-200 shadow-sm'
                  }`}
                >
                  {/* Unread Indicator Bar */}
                  {!item.is_read && (
                    <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-[#2E7D32] rounded-r-full" />
                  )}

                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-100 dark:border-gray-800 shrink-0">
                      {getChannelIcon(item.channel)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          {item.channel}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>

                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base mt-1 line-clamp-1">
                        {item.subject || `${item.channel} Alert`}
                      </h4>

                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      {item.error_log && (
                        <p className="text-xs font-semibold text-red-600 mt-1.5 p-2 bg-red-50 rounded-lg border border-red-100">
                          Error: {item.error_log}
                        </p>
                      )}

                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-400 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {formatDate(item.created_at)}
                        </span>

                        <div className="flex items-center space-x-1">
                          {!item.is_read && (
                            <button
                              onClick={() => onMarkAsRead(item.id)}
                              title="Mark as read"
                              className="p-1.5 text-[#2E7D32] hover:bg-emerald-100 rounded-lg transition-colors"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(item.id)}
                            title="Delete notification"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Sahayak AI Notification Service • Auto-refreshes every 15s
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
