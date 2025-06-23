import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslations from '../locales/en/common.json';
import esTranslations from '../locales/es/common.json';
import frTranslations from '../locales/fr/common.json';
import deTranslations from '../locales/de/common.json';
import jaTranslations from '../locales/ja/common.json';
import koTranslations from '../locales/ko/common.json';

export const defaultNS = 'common';
export const resources = {
  en: {
    common: enTranslations,
  },
  es: {
    common: esTranslations,
  },
  fr: {
    common: frTranslations,
  },
  de: {
    common: deTranslations,
  },
  ja: {
    common: jaTranslations,
  },
  ko: {
    common: koTranslations,
  },
} as const;

export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

i18n
  .use(initReactI18next)
  .init({
    defaultNS,
    resources,
    lng: 'en',
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    react: {
      useSuspense: false,
    },

    // Load missing keys
    saveMissing: false,
    
    // Namespace separator
    nsSeparator: ':',
    
    // Key separator
    keySeparator: '.',
  });

export default i18n;

// Utility functions for i18n
export const getCurrentLanguage = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || i18n.language || 'en';
  }
  return 'en';
};

export const setLanguage = (language: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', language);
  }
  i18n.changeLanguage(language);
};

export const getLanguageName = (code: string): string => {
  const lang = supportedLanguages.find(l => l.code === code);
  return lang?.nativeName || code;
};

export const isRTL = (language: string): boolean => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language);
};

// Currency mapping for different locales
export const getCurrencyForLocale = (locale: string): string => {
  const currencyMap: Record<string, string> = {
    'en': 'USD',
    'es': 'EUR',
    'fr': 'EUR',
    'de': 'EUR',
    'ja': 'JPY',
    'ko': 'KRW',
  };
  return currencyMap[locale] || 'USD';
};

// Date format mapping for different locales
export const getDateFormatForLocale = (locale: string): Intl.DateTimeFormatOptions => {
  const formatMap: Record<string, Intl.DateTimeFormatOptions> = {
    'en': { year: 'numeric', month: 'long', day: 'numeric' },
    'es': { year: 'numeric', month: 'long', day: 'numeric' },
    'fr': { day: 'numeric', month: 'long', year: 'numeric' },
    'de': { day: 'numeric', month: 'long', year: 'numeric' },
    'ja': { year: 'numeric', month: 'long', day: 'numeric' },
    'ko': { year: 'numeric', month: 'long', day: 'numeric' },
  };
  return formatMap[locale] || formatMap['en'];
};
