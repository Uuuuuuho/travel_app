import { getCurrencyForLocale, getDateFormatForLocale } from './i18n';

// Locale mapping for different regions
export const localeMapping: Record<string, string> = {
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
};

// Currency symbols and codes for different locales
export const currencyMapping: Record<string, { code: string; symbol: string; name: string }> = {
  'en': { code: 'USD', symbol: '$', name: 'US Dollar' },
  'es': { code: 'EUR', symbol: '€', name: 'Euro' },
  'fr': { code: 'EUR', symbol: '€', name: 'Euro' },
  'de': { code: 'EUR', symbol: '€', name: 'Euro' },
  'ja': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  'ko': { code: 'KRW', symbol: '₩', name: 'Korean Won' },
};

// Number formatting utilities
export class LocalizationUtils {
  private locale: string;
  private currency: string;

  constructor(locale: string = 'en') {
    this.locale = localeMapping[locale] || 'en-US';
    this.currency = getCurrencyForLocale(locale);
  }

  // Format currency amounts
  formatCurrency(amount: number, options?: Intl.NumberFormatOptions): string {
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    };

    return new Intl.NumberFormat(this.locale, { ...defaultOptions, ...options }).format(amount);
  }

  // Format currency range (e.g., "$50-100")
  formatCurrencyRange(min: number, max: number): string {
    const minFormatted = this.formatCurrency(min);
    const maxFormatted = this.formatCurrency(max);
    return `${minFormatted}-${maxFormatted}`;
  }

  // Format numbers with locale-specific separators
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.locale, options).format(number);
  }

  // Format percentages
  formatPercentage(value: number, options?: Intl.NumberFormatOptions): string {
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    };

    return new Intl.NumberFormat(this.locale, { ...defaultOptions, ...options }).format(value / 100);
  }

  // Format dates
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions = getDateFormatForLocale(this.locale.split('-')[0]);
    
    return new Intl.DateTimeFormat(this.locale, { ...defaultOptions, ...options }).format(dateObj);
  }

  // Format date ranges
  formatDateRange(startDate: Date | string, endDate: Date | string): string {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    const formatter = new Intl.DateTimeFormat(this.locale, {
      month: 'short',
      day: 'numeric',
    });

    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      // Same month: "Jan 15-20, 2024"
      return `${formatter.formatRange(start, end)}, ${start.getFullYear()}`;
    } else {
      // Different months: "Jan 15 - Feb 20, 2024"
      return formatter.formatRange(start, end);
    }
  }

  // Format relative time (e.g., "2 hours ago", "in 3 days")
  formatRelativeTime(date: Date | string, options?: Intl.RelativeTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = (dateObj.getTime() - now.getTime()) / 1000;

    const rtf = new Intl.RelativeTimeFormat(this.locale, {
      numeric: 'auto',
      style: 'long',
      ...options,
    });

    // Determine the appropriate unit
    const absDiff = Math.abs(diffInSeconds);
    
    if (absDiff < 60) {
      return rtf.format(Math.round(diffInSeconds), 'second');
    } else if (absDiff < 3600) {
      return rtf.format(Math.round(diffInSeconds / 60), 'minute');
    } else if (absDiff < 86400) {
      return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
    } else if (absDiff < 2592000) {
      return rtf.format(Math.round(diffInSeconds / 86400), 'day');
    } else if (absDiff < 31536000) {
      return rtf.format(Math.round(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(Math.round(diffInSeconds / 31536000), 'year');
    }
  }

  // Format duration (e.g., "2 hours 30 minutes")
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    const parts: string[] = [];
    
    if (hours > 0) {
      parts.push(this.formatNumber(hours) + (hours === 1 ? ' hour' : ' hours'));
    }
    
    if (mins > 0) {
      parts.push(this.formatNumber(mins) + (mins === 1 ? ' minute' : ' minutes'));
    }

    return parts.join(' ') || '0 minutes';
  }

  // Format file sizes
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${this.formatNumber(size, { maximumFractionDigits: 1 })} ${units[unitIndex]}`;
  }

  // Get currency info for current locale
  getCurrencyInfo(): { code: string; symbol: string; name: string } {
    const langCode = this.locale.split('-')[0];
    return currencyMapping[langCode] || currencyMapping['en'];
  }

  // Get locale-specific list formatting
  formatList(items: string[], options?: Intl.ListFormatOptions): string {
    const defaultOptions: Intl.ListFormatOptions = {
      style: 'long',
      type: 'conjunction',
    };

    return new Intl.ListFormat(this.locale, { ...defaultOptions, ...options }).format(items);
  }

  // Format addresses based on locale conventions
  formatAddress(address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }): string {
    const { street, city, state, country, postalCode } = address;
    const langCode = this.locale.split('-')[0];

    switch (langCode) {
      case 'ja':
        // Japanese format: Country, PostalCode, State, City, Street
        return [country, postalCode, state, city, street].filter(Boolean).join(' ');

      case 'ko':
        // Korean format: Country, State, City, Street, PostalCode
        return [country, state, city, street, postalCode].filter(Boolean).join(' ');

      case 'de':
        // German format: Street, PostalCode City, Country
        const germanAddress = [];
        if (street) germanAddress.push(street);
        if (postalCode && city) germanAddress.push(`${postalCode} ${city}`);
        if (country) germanAddress.push(country);
        return germanAddress.join(', ');

      default:
        // US/International format: Street, City, State PostalCode, Country
        const usAddress = [];
        if (street) usAddress.push(street);
        
        const cityStateZip = [];
        if (city) cityStateZip.push(city);
        if (state) cityStateZip.push(state);
        if (postalCode) cityStateZip.push(postalCode);
        
        if (cityStateZip.length > 0) {
          usAddress.push(cityStateZip.join(', '));
        }
        
        if (country) usAddress.push(country);
        return usAddress.join(', ');
    }
  }

  // Convert budget strings to localized format
  formatBudgetRange(budgetString: string): string {
    // Extract numbers from strings like "$50-100/day"
    const matches = budgetString.match(/(\d+)-?(\d+)?/);
    if (!matches) return budgetString;

    const min = parseInt(matches[1]);
    const max = matches[2] ? parseInt(matches[2]) : min;

    if (max === min) {
      return `${this.formatCurrency(min)}/day`;
    } else {
      return `${this.formatCurrencyRange(min, max)}/day`;
    }
  }
}

// Factory function to create localization utils
export function createLocalizationUtils(locale: string): LocalizationUtils {
  return new LocalizationUtils(locale);
}

// Default instance for current locale
export function getLocalizationUtils(locale?: string): LocalizationUtils {
  const currentLocale = locale || (typeof window !== 'undefined' ? 
    localStorage.getItem('language') || 'en' : 'en');
  return new LocalizationUtils(currentLocale);
}

// Utility functions for common formatting needs
export function formatCurrency(amount: number, locale: string = 'en'): string {
  return new LocalizationUtils(locale).formatCurrency(amount);
}

export function formatDate(date: Date | string, locale: string = 'en'): string {
  return new LocalizationUtils(locale).formatDate(date);
}

export function formatNumber(number: number, locale: string = 'en'): string {
  return new LocalizationUtils(locale).formatNumber(number);
}
