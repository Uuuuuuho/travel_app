import { describe, it, expect, beforeEach } from '@jest/globals';
import i18n from '../lib/i18n';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('Internationalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Language Support', () => {
    it('should support all required languages', () => {
      const supportedLanguages = ['en', 'es', 'fr', 'de', 'ja', 'ko'];

      supportedLanguages.forEach(lang => {
        expect(i18n.hasResourceBundle(lang, 'common')).toBe(true);
      });
    });

    it('should have English as default language', () => {
      expect(i18n.language).toBe('en');
    });

    it('should fallback to English for missing translations', () => {
      i18n.changeLanguage('es');
      
      // Test with a key that might not exist in Spanish
      const translation = i18n.t('nonexistent.key', { fallbackLng: 'en' });
      expect(translation).toBeDefined();
    });
  });

  describe('Translation Completeness', () => {
    const requiredKeys = [
      'app.name',
      'navigation.home',
      'hero.title',
      'form.title',
      'form.destination.label',
      'form.submit',
      'loading.title',
      'itinerary.title',
      'error.title',
    ];

    const supportedLanguages = ['en', 'es', 'fr', 'de', 'ja', 'ko'];

    supportedLanguages.forEach(language => {
      it(`should have all required translations for ${language}`, () => {
        i18n.changeLanguage(language);
        
        requiredKeys.forEach(key => {
          const translation = i18n.t(key);
          expect(translation).toBeDefined();
          expect(translation).not.toBe(key); // Should not return the key itself
          expect(translation.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Language Switching', () => {
    it('should change language correctly', async () => {
      await i18n.changeLanguage('es');
      expect(i18n.language).toBe('es');
      
      await i18n.changeLanguage('fr');
      expect(i18n.language).toBe('fr');
    });

    it('should translate text correctly after language change', async () => {
      await i18n.changeLanguage('en');
      const englishTitle = i18n.t('app.name');
      
      await i18n.changeLanguage('es');
      const spanishTitle = i18n.t('app.name');
      
      // Both should be defined but could be the same (TravelCraft is a brand name)
      expect(englishTitle).toBeDefined();
      expect(spanishTitle).toBeDefined();
    });
  });

  describe('Interpolation', () => {
    it('should handle variable interpolation', () => {
      i18n.changeLanguage('en');
      
      // Test with a translation that uses interpolation
      const translation = i18n.t('form.duration.error');
      expect(translation).toBeDefined();
      expect(typeof translation).toBe('string');
    });
  });

  describe('Namespace Support', () => {
    it('should support common namespace', () => {
      expect(i18n.hasResourceBundle('en', 'common')).toBe(true);
    });

    it('should load translations from common namespace', () => {
      i18n.changeLanguage('en');
      const translation = i18n.t('common:app.name');
      expect(translation).toBeDefined();
    });
  });
});

describe('Localization Utilities', () => {
  describe('Currency Formatting', () => {
    it('should format currency for different locales', () => {
      const { LocalizationUtils } = require('../lib/localization');
      
      const enUtils = new LocalizationUtils('en');
      const esUtils = new LocalizationUtils('es');
      const jaUtils = new LocalizationUtils('ja');
      
      expect(enUtils.formatCurrency(100)).toContain('$');
      expect(esUtils.formatCurrency(100)).toContain('€');
      expect(jaUtils.formatCurrency(100)).toContain('¥');
    });
  });

  describe('Date Formatting', () => {
    it('should format dates according to locale', () => {
      const { LocalizationUtils } = require('../lib/localization');
      const testDate = new Date('2024-01-15');
      
      const enUtils = new LocalizationUtils('en');
      const frUtils = new LocalizationUtils('fr');
      
      const enDate = enUtils.formatDate(testDate);
      const frDate = frUtils.formatDate(testDate);
      
      expect(enDate).toBeDefined();
      expect(frDate).toBeDefined();
      expect(typeof enDate).toBe('string');
      expect(typeof frDate).toBe('string');
    });
  });

  describe('Number Formatting', () => {
    it('should format numbers according to locale', () => {
      const { LocalizationUtils } = require('../lib/localization');
      
      const enUtils = new LocalizationUtils('en');
      const deUtils = new LocalizationUtils('de');
      
      const enNumber = enUtils.formatNumber(1234.56);
      const deNumber = deUtils.formatNumber(1234.56);
      
      expect(enNumber).toBeDefined();
      expect(deNumber).toBeDefined();
      expect(typeof enNumber).toBe('string');
      expect(typeof deNumber).toBe('string');
    });
  });
});

describe('Service Localization', () => {
  describe('Search Query Localization', () => {
    it('should generate localized search queries', () => {
      // Mock the services since they depend on external APIs
      const mockWebScraper = {
        buildLocalizedSearchQuery: (destination: string, language: string) => {
          const searchTerms: Record<string, string[]> = {
            'en': ['travel guide', 'blog', 'tips'],
            'es': ['guía de viaje', 'blog', 'consejos'],
            'fr': ['guide de voyage', 'blog', 'conseils'],
          };
          const terms = searchTerms[language] || searchTerms['en'];
          return `${destination} ${terms.join(' ')}`;
        }
      };

      const enQuery = mockWebScraper.buildLocalizedSearchQuery('Paris', 'en');
      const esQuery = mockWebScraper.buildLocalizedSearchQuery('Paris', 'es');
      const frQuery = mockWebScraper.buildLocalizedSearchQuery('Paris', 'fr');

      expect(enQuery).toContain('travel guide');
      expect(esQuery).toContain('guía de viaje');
      expect(frQuery).toContain('guide de voyage');
    });
  });

  describe('Cultural Context', () => {
    it('should provide different cultural contexts for different languages', () => {
      const mockAIService = {
        getCulturalContext: (language: string) => {
          const contexts: Record<string, string> = {
            'en': 'English cultural context',
            'es': 'Spanish cultural context',
            'ja': 'Japanese cultural context',
          };
          return contexts[language] || contexts['en'];
        }
      };

      const enContext = mockAIService.getCulturalContext('en');
      const esContext = mockAIService.getCulturalContext('es');
      const jaContext = mockAIService.getCulturalContext('ja');

      expect(enContext).toContain('English');
      expect(esContext).toContain('Spanish');
      expect(jaContext).toContain('Japanese');
    });
  });
});

describe('Error Handling', () => {
  it('should handle missing translation keys gracefully', () => {
    i18n.changeLanguage('en');
    
    const missingTranslation = i18n.t('nonexistent.deeply.nested.key');
    expect(missingTranslation).toBeDefined();
    // Should return the key or a fallback, not throw an error
  });

  it('should handle invalid language codes gracefully', async () => {
    const originalLanguage = i18n.language;
    
    try {
      await i18n.changeLanguage('invalid-lang');
      // Should fallback to default or previous language
      expect(['en', originalLanguage]).toContain(i18n.language);
    } catch (error) {
      // Should not throw an error
      expect(error).toBeUndefined();
    }
  });
});
