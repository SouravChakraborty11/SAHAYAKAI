import React, { useState } from 'react';
import { Settings, Eye, Type, Volume2, Globe, MonitorSpeaker, MonitorOff } from 'lucide-react';
import { useAccessibility } from '../core/contexts/AccessibilityContext';
import { GlassCard } from './GlassCard';

export const AccessibilityMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    highContrast, toggleHighContrast, 
    largeText, toggleLargeText, 
    voiceMode, toggleVoiceMode, 
    readScreen, toggleReadScreen,
    reduceMotion, toggleReduceMotion,
    language, setLanguage 
  } = useAccessibility();

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {isOpen && (
        <div className="mb-4 w-80 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <GlassCard className="space-y-4 shadow-2xl border-4 border-gray-200 !p-6">
            <h3 className="font-bold text-2xl border-b-2 border-gray-200 pb-3">Accessibility Settings</h3>
            
            <div className="space-y-4 pt-2">
              <button 
                onClick={toggleHighContrast}
                className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-transparent hover:border-gray-300 bg-gray-50 focus:ring-4 focus:ring-[#2E7D32] transition"
                aria-pressed={highContrast}
              >
                <div className="flex items-center space-x-3">
                  <Eye className="w-6 h-6 text-gray-700" />
                  <span className="text-lg font-semibold text-gray-800">High Contrast</span>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${highContrast ? 'bg-[#2E7D32]' : 'bg-gray-400'} relative`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${highContrast ? 'left-6' : 'left-0.5'}`} />
                </div>
              </button>
              
              <button 
                onClick={toggleLargeText}
                className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-transparent hover:border-gray-300 bg-gray-50 focus:ring-4 focus:ring-[#2E7D32] transition"
                aria-pressed={largeText}
              >
                <div className="flex items-center space-x-3">
                  <Type className="w-6 h-6 text-gray-700" />
                  <span className="text-lg font-semibold text-gray-800">Large Text</span>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${largeText ? 'bg-[#2E7D32]' : 'bg-gray-400'} relative`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${largeText ? 'left-6' : 'left-0.5'}`} />
                </div>
              </button>

              <button 
                onClick={toggleVoiceMode}
                className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-transparent hover:border-gray-300 bg-gray-50 focus:ring-4 focus:ring-[#2E7D32] transition"
                aria-pressed={voiceMode}
              >
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-6 h-6 text-gray-700" />
                  <span className="text-lg font-semibold text-gray-800">Voice Mode</span>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${voiceMode ? 'bg-[#2E7D32]' : 'bg-gray-400'} relative`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${voiceMode ? 'left-6' : 'left-0.5'}`} />
                </div>
              </button>
              
              <button 
                onClick={toggleReadScreen}
                className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-transparent hover:border-gray-300 bg-gray-50 focus:ring-4 focus:ring-[#2E7D32] transition"
                aria-pressed={readScreen}
              >
                <div className="flex items-center space-x-3">
                  <MonitorSpeaker className="w-6 h-6 text-gray-700" />
                  <span className="text-lg font-semibold text-gray-800">Read Screen</span>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${readScreen ? 'bg-[#2E7D32]' : 'bg-gray-400'} relative`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${readScreen ? 'left-6' : 'left-0.5'}`} />
                </div>
              </button>

              <button 
                onClick={toggleReduceMotion}
                className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-transparent hover:border-gray-300 bg-gray-50 focus:ring-4 focus:ring-[#2E7D32] transition"
                aria-pressed={reduceMotion}
              >
                <div className="flex items-center space-x-3">
                  <MonitorOff className="w-6 h-6 text-gray-700" />
                  <span className="text-lg font-semibold text-gray-800">Reduce Motion</span>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${reduceMotion ? 'bg-[#2E7D32]' : 'bg-gray-400'} relative`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${reduceMotion ? 'left-6' : 'left-0.5'}`} />
                </div>
              </button>

              <div className="pt-4 border-t-2 border-gray-200 mt-2">
                <div className="flex items-center space-x-3 mb-3 px-2">
                  <Globe className="w-6 h-6 text-gray-700" />
                  <label htmlFor="lang-select" className="text-lg font-semibold text-gray-800">Language</label>
                </div>
                <select 
                  id="lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-white border-2 border-gray-400 rounded-xl p-3 text-lg font-medium focus:ring-4 focus:ring-[#2E7D32] focus:border-[#2E7D32]"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-[#2E7D32] text-white shadow-xl flex items-center justify-center hover:bg-[#1B5E20] hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-[#2E7D32] border-4 border-white"
        aria-expanded={isOpen}
        aria-label="Open Accessibility Settings"
      >
        <Settings className="w-8 h-8" />
      </button>
    </div>
  );
};
