import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, CheckCircle, Search, Heart, Map, 
  Mic, User, Activity
} from 'lucide-react';
import { AccessibilityMenu } from '../../components/AccessibilityMenu';
import { useExplain } from '../../core/hooks/useExplain';
import { apiGetDashboardStats, type DashboardStatsData } from '../../core/api';
import { ChatInterface } from '../../components/chat/ChatInterface';
import { Sidebar } from '../../components/Sidebar';
import { useAuth } from '../../core/contexts/AuthContext';
import { useNotifications, NotificationBell, NotificationDrawer, NotificationToasts } from '../notifications';
import { useTranslation } from 'react-i18next';

interface ActivityItem {
  id: number;
  action: string;
  details: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const explain = useExplain();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<DashboardStatsData['stats'] | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { t } = useTranslation();

  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    toasts,
    refetch: refetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    dismissToast
  } = useNotifications();

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/activity/')
      .then(res => res.json())
      .then(data => setActivities(data.slice(0, 5)))
      .catch(err => console.error(err));

    setStatsLoading(true);
    apiGetDashboardStats()
      .then(data => setStats(data.stats))
      .catch(err => console.error("Failed to fetch dashboard stats:", err))
      .finally(() => setStatsLoading(false));
  }, []);

  const quickActions = [
    { icon: FileText, label: t('dashboard.actions.govSchemes'), color: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]', border: 'border-[#A5D6A7]' },
    { icon: CheckCircle, label: t('dashboard.actions.eligibility'), color: 'text-[#43A047]', bg: 'bg-[#E8F5E9]', border: 'border-[#A5D6A7]' },
    { icon: Search, label: t('dashboard.actions.ngo'), color: 'text-[#F57F17]', bg: 'bg-[#FFFDE7]', border: 'border-[#FFF59D]' },
    { icon: Heart, label: t('dashboard.actions.caregiver'), color: 'text-[#E65100]', bg: 'bg-[#FFF3E0]', border: 'border-[#FFCC80]' },
    { icon: Map, label: t('dashboard.actions.tracking'), color: 'text-[#1565C0]', bg: 'bg-[#E3F2FD]', border: 'border-[#90CAF9]' },
    { icon: Mic, label: t('dashboard.actions.voice'), color: 'text-[#6A1B9A]', bg: 'bg-[#F3E5F5]', border: 'border-[#CE93D8]' },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--bg-color)]">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-24 bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 sm:px-10 shrink-0 shadow-sm">
          <div className="flex items-center sm:hidden">
             <div className="w-12 h-12 rounded-xl bg-[#2E7D32] flex items-center justify-center text-white font-extrabold text-2xl">
                S
             </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center space-x-6">
            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setIsNotificationOpen(true)}
            />
            <button onClick={() => navigate('/settings')} className="flex items-center space-x-3 p-2 pr-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-[#2E7D32]">
              <div className="h-12 w-12 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0">
                {user?.avatar_url ? (
                  <img src={`http://127.0.0.1:8000${user.avatar_url}`} alt="Profile" className="w-full h-full object-cover" />
                ) : user?.full_name ? (
                  user.full_name[0].toUpperCase()
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <span className="font-bold text-xl text-gray-800 dark:text-gray-200 hidden sm:block">{user?.full_name || t('dashboard.profile')}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-[#2E7D32] to-[#43A047] rounded-3xl text-white border border-[#1B5E20]/20 p-8 sm:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              
              <div className="relative z-10 flex-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">
                  {t('dashboard.welcome')}, {user?.full_name ? user.full_name.split(' ')[0] : t('dashboard.user')}
                </h1>
                <p className="text-[#E8F5E9] text-lg sm:text-xl font-medium max-w-2xl">
                  {t('dashboard.welcomeDesc')}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="relative z-10 flex flex-wrap sm:flex-nowrap gap-4 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1 md:w-32 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold mb-1">
                    {statsLoading ? (
                      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    ) : (
                      stats?.active_applications ?? 0
                    )}
                  </span>
                  <span className="text-sm font-medium text-white/90 text-center" dangerouslySetInnerHTML={{ __html: t('dashboard.activeApplications').replace(' ', '<br/>') }}></span>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1 md:w-32 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold mb-1">{unreadCount}</span>
                  <span className="text-sm font-medium text-white/90 text-center" dangerouslySetInnerHTML={{ __html: t('dashboard.newNotifications').replace(' ', '<br/>') }}></span>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1 md:w-32 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold mb-1">
                    {statsLoading ? (
                      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    ) : (
                      stats?.eligible_schemes ?? 0
                    )}
                  </span>
                  <span className="text-sm font-medium text-white/90 text-center" dangerouslySetInnerHTML={{ __html: t('dashboard.eligibleSchemes').replace(' ', '<br/>') }}></span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <span className="bg-[#F4B400] w-1.5 h-6 mr-3 inline-block rounded-full"></span>
                {t('dashboard.helpTitle')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {quickActions.map((action, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => {
                      if (action.label === t('dashboard.actions.voice')) {
                        setIsChatOpen(true);
                      } else if (action.label === t('dashboard.actions.ngo') || action.label === t('dashboard.actions.caregiver')) {
                        navigate('/care-community');
                      } else if (action.label === t('dashboard.actions.tracking')) {
                        navigate('/automation');
                      } else if (action.label === t('dashboard.actions.govSchemes')) {
                        navigate('/schemes?tab=search');
                      } else if (action.label === t('dashboard.actions.eligibility')) {
                        navigate('/schemes?tab=eligibility');
                      }
                    }}
                    className="h-full flex flex-col sm:flex-row items-start sm:items-center p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E7D32] transition-all hover:shadow-md hover:-translate-y-0.5 text-left group"
                    onMouseEnter={() => explain(action.label)}
                    onFocus={() => explain(action.label)}
                  >
                    <div className={`w-14 h-14 shrink-0 rounded-xl ${action.bg} ${action.color} flex items-center justify-center mb-4 sm:mb-0 sm:mr-5 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-7 h-7" />
                    </div>
                    <span className="text-xl font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <span className="bg-[#2E7D32] w-1.5 h-6 mr-3 inline-block rounded-full"></span>
                {t('dashboard.recentActivity')}
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {activities.length > 0 ? activities.map((item) => (
                    <li key={item.id} className="p-5 sm:p-6 hover:bg-gray-50 dark:bg-gray-900/50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#E3F2FD] rounded-xl text-[#1565C0] shrink-0">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-0.5">{item.details}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{new Date(item.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 self-start sm:self-auto whitespace-nowrap">
                        {item.action}
                      </span>
                    </li>
                  )) : (
                    <li className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.noActivity')}</li>
                  )}
                </ul>
              </div>
            </div>

            
            {/* Bottom Padding for floating action buttons */}
            <div className="h-24"></div>
          </div>
        </div>
      </main>

      {/* Floating AI Assistant Button */}
      <button 
        onClick={() => setIsChatOpen(true)}
        onMouseEnter={() => explain(t('dashboard.talkToSahayak'))}
        className="fixed bottom-6 right-6 z-40 px-6 py-4 rounded-full bg-[#2E7D32] text-white shadow-xl flex items-center justify-center hover:bg-[#1B5E20] hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-[#2E7D32]"
      >
        <Mic className="w-6 h-6 mr-2" />
        <span className="text-lg font-bold tracking-wide">{t('dashboard.talkToSahayak')}</span>
      </button>

      {isChatOpen && <ChatInterface onClose={() => setIsChatOpen(false)} />}

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={notificationsLoading}
        error={notificationsError}
        onRefresh={refetchNotifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
      />

      <NotificationToasts toasts={toasts} onDismiss={dismissToast} />

      {/* Accessibility Menu */}
      <AccessibilityMenu />
    </div>
  );
};

export default Dashboard;
