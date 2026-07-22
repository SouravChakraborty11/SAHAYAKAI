import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiPatchSettings, getToken } from '../api';

interface AccessibilityState {
  highContrast: boolean;
  largeText: boolean;
  voiceMode: boolean;
  readScreen: boolean;
  reduceMotion: boolean;
  language: string;
}

interface AccessibilityContextType extends AccessibilityState {
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleVoiceMode: () => void;
  toggleReadScreen: () => void;
  toggleReduceMotion: () => void;
  setLanguage: (lang: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AccessibilityState>({
    highContrast: false,
    largeText: false,
    voiceMode: false,
    readScreen: false,
    reduceMotion: false,
    language: localStorage.getItem('app_language') || 'en',
  });
  const { i18n } = useTranslation();

  useEffect(() => {
    if (state.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    if (state.largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }

    if (state.reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [state.highContrast, state.largeText, state.reduceMotion]);

  const toggleHighContrast = () => setState(prev => ({ ...prev, highContrast: !prev.highContrast }));
  const toggleLargeText = () => setState(prev => ({ ...prev, largeText: !prev.largeText }));
  const toggleVoiceMode = () => setState(prev => ({ ...prev, voiceMode: !prev.voiceMode }));
  const toggleReadScreen = () => setState(prev => ({ ...prev, readScreen: !prev.readScreen }));
  const toggleReduceMotion = () => setState(prev => ({ ...prev, reduceMotion: !prev.reduceMotion }));
  const setLanguage = async (language: string) => {
    setState(prev => ({ ...prev, language }));
    localStorage.setItem('app_language', language);
    i18n.changeLanguage(language);
    
    const token = getToken();
    if (token) {
      try {
        await apiPatchSettings({ language });
      } catch (err) {
        console.error('Failed to save language to backend', err);
      }
    }
  };

  return (
    <AccessibilityContext.Provider value={{ 
      ...state, 
      toggleHighContrast, 
      toggleLargeText, 
      toggleVoiceMode, 
      toggleReadScreen,
      toggleReduceMotion,
      setLanguage 
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
