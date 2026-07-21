import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, FileText, CheckCircle, Search, Heart, Map, 
  Mic, LogOut, User, LayoutDashboard, Settings, Activity
} from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { AccessibilityMenu } from '../../components/AccessibilityMenu';
import { useExplain } from '../../core/hooks/useExplain';
import { ChatInterface } from '../../components/chat/ChatInterface';
import { useNotifications, NotificationBell, NotificationDrawer, NotificationToasts } from '../notifications';

interface ActivityItem {
  id: number;
  action: string;
  details: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const explain = useExplain();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

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
  }, []);

  const quickActions = [
    { icon: FileText, label: 'Government Schemes', color: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]', border: 'border-[#A5D6A7]' },
    { icon: CheckCircle, label: 'Eligibility Checker', color: 'text-[#43A047]', bg: 'bg-[#E8F5E9]', border: 'border-[#A5D6A7]' },
    { icon: Search, label: 'NGO Support', color: 'text-[#F57F17]', bg: 'bg-[#FFFDE7]', border: 'border-[#FFF59D]' },
    { icon: Heart, label: 'Caregiver Assistance', color: 'text-[#E65100]', bg: 'bg-[#FFF3E0]', border: 'border-[#FFCC80]' },
    { icon: Map, label: 'Application Tracking', color: 'text-[#1565C0]', bg: 'bg-[#E3F2FD]', border: 'border-[#90CAF9]' },
    { icon: Mic, label: 'Voice Assistant', color: 'text-[#6A1B9A]', bg: 'bg-[#F3E5F5]', border: 'border-[#CE93D8]' },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--bg-color)]">
      {/* Sidebar */}
      <aside className="w-24 md:w-72 bg-white border-r-2 border-gray-200 hidden sm:flex flex-col shadow-sm z-10">
        <div className="h-24 flex items-center justify-center md:justify-start md:px-8 border-b-2 border-gray-200">
          <div className="w-12 h-12 rounded-xl bg-[#2E7D32] flex items-center justify-center text-white font-extrabold text-2xl">
            S
          </div>
          <span className="ml-4 font-bold text-2xl hidden md:block text-[#1F2937]">Sahayak</span>
        </div>
        <nav className="flex-1 py-8 flex flex-col gap-4 px-4">
          <a href="#" className="flex items-center px-4 py-4 bg-[#E8F5E9] text-[#2E7D32] border-2 border-[#2E7D32] rounded-xl font-bold text-xl">
            <LayoutDashboard className="w-8 h-8" />
            <span className="ml-4 hidden md:block">Dashboard</span>
          </a>
          <a href="#" className="flex items-center px-4 py-4 text-gray-700 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300 rounded-xl font-bold text-xl transition-colors">
            <FileText className="w-8 h-8" />
            <span className="ml-4 hidden md:block">Applications</span>
          </a>
          <a href="#" className="flex items-center px-4 py-4 text-gray-700 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300 rounded-xl font-bold text-xl transition-colors">
            <Settings className="w-8 h-8" />
            <span className="ml-4 hidden md:block">Settings</span>
          </a>
        </nav>
        <div className="p-6 border-t-2 border-gray-200">
          <button 
            onClick={() => navigate('/login')}
            onMouseEnter={() => explain('Sign Out')}
            className="flex items-center justify-center md:justify-start w-full px-4 py-4 text-gray-700 hover:bg-[#FEE2E2] hover:text-[#D32F2F] hover:border-[#D32F2F] border-2 border-transparent rounded-xl font-bold text-xl transition-colors"
          >
            <LogOut className="w-8 h-8" />
            <span className="ml-4 hidden md:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-24 bg-white border-b-2 border-gray-200 flex items-center justify-between px-6 sm:px-10 shrink-0 shadow-sm">
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
            <button className="flex items-center space-x-3 p-2 pr-4 bg-gray-50 border-2 border-gray-200 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-[#2E7D32]">
              <div className="h-12 w-12 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-xl">
                <User className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl text-gray-800 hidden sm:block">Profile</span>
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-6 sm:p-10">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Welcome Banner */}
            <GlassCard className="bg-[#2E7D32] text-white !border-4 !border-[#1B5E20] !p-10 shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Hello, Welcome Back! 👋</h1>
                <p className="text-white text-xl sm:text-2xl font-medium max-w-2xl leading-relaxed">
                  We are here to help you access community services, government schemes, and support easily.
                </p>
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <div>
              <h2 className="text-3xl font-extrabold text-[#1F2937] mb-6 flex items-center">
                <span className="bg-[#F4B400] w-2 h-8 mr-4 inline-block rounded"></span>
                How can we help you today?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickActions.map((action, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => {
                      if (action.label === 'Voice Assistant') {
                        setIsChatOpen(true);
                      } else if (action.label === 'NGO Support' || action.label === 'Caregiver Assistance') {
                        navigate('/care-community');
                      } else if (action.label === 'Application Tracking') {
                        navigate('/automation');
                      }
                    }}
                    className={`flex items-center p-6 bg-white border-4 ${action.border} rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-[#2E7D32] transition-transform hover:-translate-y-1 shadow-sm text-left`}
                    onMouseEnter={() => explain(action.label)}
                    onFocus={() => explain(action.label)}
                  >
                    <div className={`w-20 h-20 shrink-0 rounded-2xl ${action.bg} ${action.color} flex items-center justify-center mr-6 border-2 ${action.border}`}>
                      <action.icon className="w-10 h-10" />
                    </div>
                    <span className="text-2xl font-bold text-gray-800 leading-tight">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-3xl font-extrabold text-[#1F2937] mb-6 flex items-center">
                <span className="bg-[#2E7D32] w-2 h-8 mr-4 inline-block rounded"></span>
                Your Recent Activity
              </h2>
              <GlassCard className="!p-0 overflow-hidden border-2 border-gray-300">
                <ul className="divide-y-2 divide-gray-200">
                  {activities.length > 0 ? activities.map((item) => (
                    <li key={item.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#E3F2FD] rounded-full text-[#1565C0]">
                          <Activity className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-extrabold text-2xl text-gray-900 mb-1">{item.details}</p>
                          <p className="text-lg text-gray-600 font-medium">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold px-4 py-2 rounded-xl border-2 bg-gray-100 text-gray-700 border-gray-300 self-start sm:self-auto">
                        {item.action}
                      </span>
                    </li>
                  )) : (
                    <li className="p-8 text-center text-gray-500 font-medium text-lg">No recent activity.</li>
                  )}
                </ul>
              </GlassCard>
            </div>

            
            {/* Bottom Padding for floating action buttons */}
            <div className="h-24"></div>
          </div>
        </div>
      </main>

      {/* Floating AI Assistant Button */}
      <button 
        onClick={() => setIsChatOpen(true)}
        onMouseEnter={() => explain("Talk to Sahayak")}
        className="fixed bottom-6 right-6 z-40 px-8 py-5 rounded-full bg-[#2E7D32] text-white shadow-2xl flex items-center justify-center hover:bg-[#1B5E20] hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-[#2E7D32] border-4 border-white"
      >
        <Mic className="w-8 h-8 mr-3" />
        <span className="text-2xl font-extrabold tracking-wide">Talk to Sahayak</span>
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
