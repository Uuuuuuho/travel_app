# TravelCraft Internationalization (i18n) Guide

This document provides comprehensive information about the internationalization implementation in TravelCraft and how to add new languages.

## Overview

TravelCraft supports multiple languages with full localization including:
- UI text translation
- Date, currency, and number formatting
- AI-generated content in user's language
- Localized web scraping and YouTube searches
- Cultural context adaptation

## Supported Languages

Currently supported languages:
- **English (en)** - Default language
- **Spanish (es)** - Español
- **French (fr)** - Français
- **German (de)** - Deutsch
- **Japanese (ja)** - 日本語
- **Korean (ko)** - 한국어

## Architecture

### Core Components

1. **i18n Configuration** (`src/lib/i18n.ts`)
   - Main i18n setup using react-i18next
   - Language detection and persistence
   - Resource loading and fallback handling

2. **Translation Files** (`src/locales/[lang]/common.json`)
   - JSON files containing all UI text translations
   - Organized by feature/component sections

3. **Language Selector** (`src/components/LanguageSelector.tsx`)
   - Dropdown component for language switching
   - Persists selection in localStorage
   - Updates URL routing

4. **Localization Utilities** (`src/lib/localization.ts`)
   - Date, currency, and number formatting
   - Address formatting by locale
   - Cultural context helpers

### Service Localization

1. **AI Service** (`src/services/aiService.ts`)
   - Generates content in user's selected language
   - Includes cultural context and local customs
   - Adapts recommendations for language speakers

2. **Web Scraping** (`src/services/webScraper.ts`)
   - Performs searches in target language
   - Uses localized search terms
   - Sets appropriate language headers

3. **YouTube Service** (`src/services/youtubeService.ts`)
   - Searches for videos in target language
   - Uses localized search queries
   - Filters by region and language

## Adding a New Language

### Step 1: Update Configuration

1. **Add language to Next.js config** (`next.config.ts`):
```typescript
const nextConfig: NextConfig = {
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'ja', 'NEW_LANG'], // Add your language code
    defaultLocale: 'en',
    localeDetection: true,
  },
};
```

2. **Update i18n configuration** (`src/lib/i18n.ts`):
```typescript
export const supportedLanguages = [
  // ... existing languages
  { code: 'NEW_LANG', name: 'Language Name', nativeName: 'Native Name' },
];

export const resources = {
  // ... existing resources
  'NEW_LANG': {
    common: newLangTranslations,
  },
};
```

### Step 2: Create Translation File

Create `src/locales/NEW_LANG/common.json` with all required translations. Use the English file as a template:

```json
{
  "app": {
    "name": "TravelCraft",
    "tagline": "Your translated tagline"
  },
  "navigation": {
    "home": "Translated Home",
    "myItineraries": "Translated My Itineraries",
    // ... continue with all sections
  }
}
```

### Step 3: Update Localization Utilities

1. **Add locale mapping** (`src/lib/localization.ts`):
```typescript
export const localeMapping: Record<string, string> = {
  // ... existing mappings
  'NEW_LANG': 'NEW_LANG-REGION', // e.g., 'pt': 'pt-BR'
};

export const currencyMapping: Record<string, { code: string; symbol: string; name: string }> = {
  // ... existing mappings
  'NEW_LANG': { code: 'CURRENCY_CODE', symbol: 'SYMBOL', name: 'Currency Name' },
};
```

2. **Add cultural context** (`src/services/aiService.ts`):
```typescript
private getCulturalContext(languageCode: string, destination: string): string {
  const culturalContexts: Record<string, string> = {
    // ... existing contexts
    'NEW_LANG': `
- Cultural considerations for NEW_LANG speakers
- Local customs and etiquette
- Communication tips and useful phrases
- Travel habits and expectations
    `,
  };
  return culturalContexts[languageCode] || culturalContexts['en'];
}
```

### Step 4: Update Service Localizations

1. **Web Scraping Service** (`src/services/webScraper.ts`):
```typescript
private getAcceptLanguageHeader(language: string): string {
  const languageHeaders: Record<string, string> = {
    // ... existing headers
    'NEW_LANG': 'NEW_LANG-REGION,NEW_LANG;q=0.9,en;q=0.8',
  };
  return languageHeaders[language] || 'en-US,en;q=0.9';
}

private buildLocalizedSearchQuery(destination: string, language: string): string {
  const searchTerms: Record<string, string[]> = {
    // ... existing terms
    'NEW_LANG': ['translated travel guide', 'translated blog', 'translated tips'],
  };
  const terms = searchTerms[language] || searchTerms['en'];
  return `${destination} ${terms.join(' ')}`;
}
```

2. **YouTube Service** (`src/services/youtubeService.ts`):
```typescript
private getLocalizedSearchTerms(language: string): Record<string, string> {
  const searchTerms: Record<string, Record<string, string>> = {
    // ... existing terms
    'NEW_LANG': {
      travel: 'translated travel',
      travelGuide: 'translated travel guide',
      // ... all search terms
    },
  };
  return searchTerms[language] || searchTerms['en'];
}
```

### Step 5: Test the Implementation

1. **Manual Testing**:
   - Switch to the new language using the language selector
   - Verify all UI text is translated
   - Test form validation messages
   - Generate a sample itinerary
   - Check that AI content is in the correct language

2. **Automated Testing**:
   - Add test cases for the new language
   - Verify translation completeness
   - Test localization utilities

## Translation Guidelines

### General Principles

1. **Consistency**: Use consistent terminology throughout the application
2. **Context**: Consider the context when translating (formal vs. informal)
3. **Cultural Adaptation**: Adapt content for cultural relevance
4. **Length**: Be mindful of text expansion/contraction in different languages

### Key Translation Areas

1. **Navigation & UI Elements**
   - Keep navigation terms short and clear
   - Use standard conventions for the target language

2. **Form Labels & Validation**
   - Use clear, actionable language
   - Ensure error messages are helpful and polite

3. **Content Descriptions**
   - Adapt marketing copy for cultural relevance
   - Consider local travel preferences and habits

4. **Technical Terms**
   - Use established translations for technical terms
   - Provide explanations for complex concepts

## Maintenance

### Updating Translations

1. **Adding New Keys**:
   - Add to English file first
   - Update all other language files
   - Use fallback to English for missing keys

2. **Modifying Existing Keys**:
   - Update all language files simultaneously
   - Test changes across all supported languages

3. **Quality Assurance**:
   - Regular review by native speakers
   - User feedback integration
   - Automated translation validation

### Performance Considerations

1. **Bundle Size**: Monitor translation file sizes
2. **Loading**: Implement lazy loading for large translation files
3. **Caching**: Leverage browser caching for translation resources

## Troubleshooting

### Common Issues

1. **Missing Translations**:
   - Check console for missing key warnings
   - Verify translation file structure
   - Ensure proper import in i18n config

2. **Formatting Issues**:
   - Check locale-specific formatting
   - Verify currency and date formats
   - Test number formatting edge cases

3. **Language Detection**:
   - Clear localStorage if language persists incorrectly
   - Check browser language settings
   - Verify URL routing configuration

### Debug Tools

1. **React Developer Tools**: Inspect i18n context
2. **Console Logging**: Enable debug mode in i18n config
3. **Network Tab**: Check translation file loading

## Best Practices

1. **Namespace Organization**: Group related translations logically
2. **Key Naming**: Use descriptive, hierarchical key names
3. **Pluralization**: Handle plural forms correctly for each language
4. **Interpolation**: Use proper variable interpolation syntax
5. **Fallbacks**: Always provide English fallbacks
6. **Testing**: Test with pseudo-localization for layout issues

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [Next.js Internationalization](https://nextjs.org/docs/advanced-features/i18n)
- [Unicode CLDR](http://cldr.unicode.org/) for locale data
- [Google Translate](https://translate.google.com/) for initial translations (review required)

## Contributing

When contributing translations:
1. Follow the existing file structure
2. Test thoroughly in the target language
3. Consider cultural context and local preferences
4. Provide context for ambiguous terms
5. Review with native speakers when possible
