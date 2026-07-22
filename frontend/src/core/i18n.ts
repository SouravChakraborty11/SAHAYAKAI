import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import bnTranslations from '../locales/bn.json';

const resources = {
  en: { translation: enTranslations },
  hi: { translation: hiTranslations },
  bn: { translation: bnTranslations }
};

const savedLanguage = localStorage.getItem('app_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
