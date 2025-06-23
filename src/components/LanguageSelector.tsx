'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { supportedLanguages, setLanguage, getCurrentLanguage } from '@/lib/i18n';

interface LanguageSelectorProps {
  className?: string;
}

export default function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize current language from localStorage or i18n
    const savedLang = getCurrentLanguage();
    setCurrentLang(savedLang);

    // Set i18n language if different
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      // Update local state
      setCurrentLang(languageCode);
      setIsOpen(false);

      // Update i18n and localStorage
      setLanguage(languageCode);

      // For App Router, we'll handle language change through i18n only
      // URL routing can be added later if needed
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const getCurrentLanguageInfo = () => {
    return supportedLanguages.find(lang => lang.code === currentLang) || supportedLanguages[0];
  };

  const currentLanguageInfo = getCurrentLanguageInfo();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={t('language.selector')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLanguageInfo.nativeName}</span>
        <span className="sm:hidden">{currentLanguageInfo.code.toUpperCase()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
            {t('language.selector')}
          </div>
          <div role="listbox" aria-label={t('language.selector')}>
            {supportedLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  currentLang === language.code ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
                role="option"
                aria-selected={currentLang === language.code}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{language.nativeName}</span>
                  <span className="text-xs text-gray-500">{language.name}</span>
                </div>
                {currentLang === language.code && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified version for mobile/compact spaces
export function LanguageSelectorCompact({ className = '' }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    const savedLang = getCurrentLanguage();
    setCurrentLang(savedLang);

    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const languageCode = event.target.value;

    try {
      setCurrentLang(languageCode);
      setLanguage(languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={currentLang}
        onChange={handleLanguageChange}
        className="appearance-none bg-transparent border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Select language"
      >
        {supportedLanguages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeName}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}

// Hook for using language functionality in other components
export function useLanguage() {
  const { i18n } = useTranslation();

  const changeLanguage = async (languageCode: string) => {
    try {
      setLanguage(languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const getCurrentLang = () => getCurrentLanguage();

  const getLanguageInfo = (code?: string) => {
    const langCode = code || getCurrentLang();
    return supportedLanguages.find(lang => lang.code === langCode) || supportedLanguages[0];
  };

  return {
    currentLanguage: getCurrentLang(),
    changeLanguage,
    getLanguageInfo,
    supportedLanguages,
    isRTL: false, // Can be extended for RTL languages
  };
}
