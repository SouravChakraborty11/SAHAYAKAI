import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Open Notifications"
      className="p-3 text-gray-600 hover:text-[#2E7D32] rounded-full hover:bg-gray-100 border-2 border-transparent focus:border-[#2E7D32] transition-all relative group"
    >
      <Bell className="w-8 h-8 group-hover:scale-105 transition-transform" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[20px] h-[20px] px-1 bg-[#D32F2F] text-white text-xs font-extrabold rounded-full border-2 border-white flex items-center justify-center shadow-md animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
