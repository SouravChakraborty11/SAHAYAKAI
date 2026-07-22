import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, LogOut, User, Search } from 'lucide-react';
import { useAuth } from '../core/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/dashboard'    },
  { label: 'Schemes',      icon: Search,          path: '/schemes'       },
  { label: 'Applications', icon: FileText,         path: '/applications' },
  { label: 'Profile',      icon: User,             path: '/settings'     },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-20 md:w-72 bg-white dark:bg-gray-800 border-r-2 border-gray-200 dark:border-gray-700 hidden sm:flex flex-col shadow-sm z-10 shrink-0">
      {/* Logo */}
      <div className="h-24 flex items-center justify-center md:justify-start md:px-8 border-b-2 border-gray-200 dark:border-gray-700">
        <div className="w-12 h-12 rounded-xl bg-[#2E7D32] flex items-center justify-center text-white font-extrabold text-2xl shrink-0">
          S
        </div>
        <span className="ml-4 font-bold text-2xl hidden md:block text-[#1F2937]">Sahayak</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-8 flex flex-col gap-3 px-3">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center px-3 py-4 rounded-xl font-bold text-xl transition-colors w-full text-left gap-4
                ${active
                  ? 'bg-[#E8F5E9] text-[#2E7D32] border-2 border-[#2E7D32]'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:border-gray-700'
                }`}
            >
              <Icon className="w-7 h-7 shrink-0" />
              <span className="hidden md:block">{t(`nav.${label.toLowerCase()}`)}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Sign Out */}
      <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center md:justify-start gap-4 mb-4 px-3">
          <div className="w-10 h-10 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
            {user?.avatar_url ? (
              <img src={`http://127.0.0.1:8000${user.avatar_url}`} alt="Profile" className="w-full h-full object-cover" />
            ) : user?.full_name ? (
              user.full_name[0].toUpperCase()
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="hidden md:flex flex-col truncate overflow-hidden">
            <span className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{user?.full_name || 'User'}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center md:justify-start w-full px-3 py-4 text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300 border-2 border-transparent rounded-xl font-bold text-xl transition-colors gap-4"
        >
          <LogOut className="w-7 h-7 shrink-0" />
          <span className="hidden md:block">{t('nav.signOut')}</span>
        </button>
      </div>
    </aside>
  );
};
