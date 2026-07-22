import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserProfile } from '../api';
import {
  getToken, setToken, removeToken,
  setUserCache, getUserCache, removeUserCache, apiGetMe,
} from '../api';
import i18n from '../i18n';
import { applyTheme } from '../theme';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (u: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(getUserCache());
  const [isLoading, setIsLoading] = useState(!!getToken() && !getUserCache());

  const refreshUser = useCallback(async () => {
    try {
      const u = await apiGetMe();
      setUser(u);
      setUserCache(u);
      if (u.theme) applyTheme(u.theme);
      if (u.language) {
        const lang = u.language === 'English' ? 'en' : u.language;
        i18n.changeLanguage(lang);
        localStorage.setItem('app_language', lang);
      }
    } catch {
      // token expired or invalid
      removeToken();
      removeUserCache();
      setUser(null);
    }
  }, []);

  // On mount: if we have a token but no cached user, fetch it
  useEffect(() => {
    if (getToken() && !getUserCache()) {
      setIsLoading(true);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = (token: string, u: UserProfile) => {
    setToken(token);
    setUserCache(u);
    setUser(u);
    if (u.theme) applyTheme(u.theme);
    if (u.language) {
      const lang = u.language === 'English' ? 'en' : u.language;
      i18n.changeLanguage(lang);
      localStorage.setItem('app_language', lang);
    }
  };

  const logout = () => {
    removeToken();
    removeUserCache();
    setUser(null);
  };

  const updateUser = (u: UserProfile) => {
    setUser(u);
    setUserCache(u);
    if (u.theme) applyTheme(u.theme);
    if (u.language) {
      const lang = u.language === 'English' ? 'en' : u.language;
      i18n.changeLanguage(lang);
      localStorage.setItem('app_language', lang);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
