import { useCallback } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

export const useExplain = () => {
  const { readScreen, language } = useAccessibility();

  const explain = useCallback((text: string) => {
    if (!readScreen) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to match the selected language
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'bn') {
      utterance.lang = 'bn-IN';
    } else {
      utterance.lang = 'en-US';
    }
    
    window.speechSynthesis.speak(utterance);
  }, [readScreen, language]);

  return explain;
};
