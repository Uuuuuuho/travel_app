import axios from 'axios';
import * as cheerio from 'cheerio';
import { WebScrapingResult } from '@/types';

interface ScrapingTarget {
  url: string;
  selectors: {
    title?: string;
    content?: string;
    articles?: string;
  };
  baseUrl?: string;
}

class WebScrapingService {
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  
  private readonly travelSites: ScrapingTarget[] = [
    {
      url: 'https://www.lonelyplanet.com/search?q={destination}',
      selectors: {
        title: 'h3.card-title a',
        content: '.card-text',
        articles: '.card'
      },
      baseUrl: 'https://www.lonelyplanet.com'
    },
    {
      url: 'https://www.tripadvisor.com/Search?q={destination}',
      selectors: {
        title: '.result-title',
        content: '.result-snippet',
        articles: '.result'
      },
      baseUrl: 'https://www.tripadvisor.com'
    }
  ];

  async scrapeDestinationInfo(destination: string, language: string = 'en'): Promise<WebScrapingResult[]> {
    const results: WebScrapingResult[] = [];

    // Create localized search terms
    const localizedDestination = this.getLocalizedDestination(destination, language);

    // Try Google Search API first (if available)
    const blogResults = await this.searchTravelBlogs(localizedDestination, language);
    results.push(...blogResults);

    // If we have results from Google Search, use them
    if (results.length > 0) {
      return this.rankResults(results);
    }

    // Fallback: Try direct scraping (may fail due to CORS/anti-bot)
    for (const site of this.travelSites) {
      try {
        const siteResults = await this.scrapeSite(site, localizedDestination, language);
        results.push(...siteResults);
      } catch (error) {
        console.warn(`Scraping ${site.url} failed (expected):`, error.message);
        // Continue with other sites even if one fails
      }
    }

    // If still no results, provide mock data
    if (results.length === 0) {
      console.log('No web scraping results available, using mock data for:', destination);
      return this.generateMockResults(destination, language);
    }

    return this.rankResults(results);
  }

  private async scrapeSite(site: ScrapingTarget, destination: string, language: string = 'en'): Promise<WebScrapingResult[]> {
    const url = site.url.replace('{destination}', encodeURIComponent(destination));
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': this.getAcceptLanguageHeader(language),
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const results: WebScrapingResult[] = [];

      $(site.selectors.articles || 'article').each((index, element) => {
        if (index >= 10) return false; // Limit to 10 results per site

        const $element = $(element);
        const titleElement = site.selectors.title ? $element.find(site.selectors.title) : $element.find('h1, h2, h3, h4').first();
        const contentElement = site.selectors.content ? $element.find(site.selectors.content) : $element.find('p').first();

        const title = titleElement.text().trim();
        const content = contentElement.text().trim();

        if (title && content && this.isRelevantContent(title + ' ' + content, destination)) {
          results.push({
            url: this.resolveUrl(titleElement.attr('href') || url, site.baseUrl),
            title,
            content: this.cleanContent(content),
            relevanceScore: this.calculateRelevance(title + ' ' + content, destination),
            scrapedAt: new Date(),
          });
        }
      });

      return results;
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
      return [];
    }
  }

  private async searchTravelBlogs(destination: string, language: string = 'en'): Promise<WebScrapingResult[]> {
    // Use Google Custom Search API if available, otherwise return empty array
    if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
      return [];
    }

    try {
      const query = this.buildLocalizedSearchQuery(destination, language);
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: query,
          num: 10,
          lr: this.getLanguageRestriction(language),
          hl: language,
        },
      });

      const results: WebScrapingResult[] = [];
      
      for (const item of response.data.items || []) {
        if (this.isRelevantContent(item.title + ' ' + item.snippet, destination)) {
          results.push({
            url: item.link,
            title: item.title,
            content: item.snippet,
            relevanceScore: this.calculateRelevance(item.title + ' ' + item.snippet, destination),
            scrapedAt: new Date(),
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching travel blogs:', error);
      return [];
    }
  }

  private isRelevantContent(content: string, destination: string): boolean {
    const lowerContent = content.toLowerCase();
    const lowerDestination = destination.toLowerCase();
    
    // Check if content mentions the destination
    if (!lowerContent.includes(lowerDestination)) {
      // Also check for partial matches (city without country, etc.)
      const destinationParts = lowerDestination.split(/[,\s]+/);
      const hasPartialMatch = destinationParts.some(part => 
        part.length > 2 && lowerContent.includes(part)
      );
      if (!hasPartialMatch) return false;
    }

    // Check for travel-related keywords
    const travelKeywords = [
      'travel', 'visit', 'trip', 'vacation', 'holiday', 'tourism', 'guide',
      'attraction', 'restaurant', 'hotel', 'things to do', 'places to see',
      'itinerary', 'experience', 'culture', 'food', 'sightseeing'
    ];

    return travelKeywords.some(keyword => lowerContent.includes(keyword));
  }

  private calculateRelevance(content: string, destination: string): number {
    const lowerContent = content.toLowerCase();
    const lowerDestination = destination.toLowerCase();
    
    let score = 0;

    // Exact destination match
    if (lowerContent.includes(lowerDestination)) {
      score += 50;
    }

    // Partial destination matches
    const destinationParts = lowerDestination.split(/[,\s]+/);
    destinationParts.forEach(part => {
      if (part.length > 2 && lowerContent.includes(part)) {
        score += 20;
      }
    });

    // Travel keywords
    const travelKeywords = [
      'travel guide', 'things to do', 'places to visit', 'attractions',
      'restaurants', 'hotels', 'itinerary', 'tips', 'experience'
    ];
    
    travelKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        score += 10;
      }
    });

    return Math.min(score, 100); // Cap at 100
  }

  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 500); // Limit content length
  }

  private resolveUrl(url: string, baseUrl?: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('/') && baseUrl) {
      return baseUrl + url;
    }
    return url;
  }

  private rankResults(results: WebScrapingResult[]): WebScrapingResult[] {
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20); // Return top 20 results
  }

  // Alternative method using Puppeteer for JavaScript-heavy sites
  async scrapeWithPuppeteer(url: string): Promise<string> {
    // This would require Puppeteer setup
    // For now, return empty string as fallback
    console.log('Puppeteer scraping not implemented yet for:', url);
    return '';
  }

  // Localization helper methods
  private getLocalizedDestination(destination: string, language: string): string {
    // For now, return the original destination
    // In a full implementation, you might translate city names
    return destination;
  }

  private getAcceptLanguageHeader(language: string): string {
    const languageHeaders: Record<string, string> = {
      'en': 'en-US,en;q=0.9',
      'es': 'es-ES,es;q=0.9,en;q=0.8',
      'fr': 'fr-FR,fr;q=0.9,en;q=0.8',
      'de': 'de-DE,de;q=0.9,en;q=0.8',
      'ja': 'ja-JP,ja;q=0.9,en;q=0.8',
      'ko': 'ko-KR,ko;q=0.9,en;q=0.8',
    };
    return languageHeaders[language] || 'en-US,en;q=0.9';
  }

  private getLanguageRestriction(language: string): string {
    const restrictions: Record<string, string> = {
      'en': 'lang_en',
      'es': 'lang_es',
      'fr': 'lang_fr',
      'de': 'lang_de',
      'ja': 'lang_ja',
      'ko': 'lang_ko',
    };
    return restrictions[language] || 'lang_en';
  }

  private buildLocalizedSearchQuery(destination: string, language: string): string {
    const searchTerms: Record<string, string[]> = {
      'en': ['travel guide', 'blog', 'tips', 'visit'],
      'es': ['guía de viaje', 'blog', 'consejos', 'visitar'],
      'fr': ['guide de voyage', 'blog', 'conseils', 'visiter'],
      'de': ['reiseführer', 'blog', 'tipps', 'besuchen'],
      'ja': ['旅行ガイド', 'ブログ', 'ヒント', '訪問'],
      'ko': ['여행 가이드', '블로그', '팁', '방문'],
    };

    const terms = searchTerms[language] || searchTerms['en'];
    return `${destination} ${terms.join(' ')}`;
  }

  private generateMockResults(destination: string, language: string): WebScrapingResult[] {
    const translations = this.getMockTranslations(language);
    const cityName = destination.split(',')[0]?.trim() || destination;

    return [
      {
        url: `https://example.com/travel-guide-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${translations.completeGuide} ${destination}`,
        content: `${translations.guideContent1} ${destination}. ${translations.guideContent2} ${cityName} ${translations.guideContent3}`,
        relevanceScore: 95,
        scrapedAt: new Date(),
      },
      {
        url: `https://example.com/top-attractions-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${translations.topAttractions} ${cityName}`,
        content: `${translations.attractionsContent1} ${cityName}. ${translations.attractionsContent2} ${destination} ${translations.attractionsContent3}`,
        relevanceScore: 90,
        scrapedAt: new Date(),
      },
      {
        url: `https://example.com/food-guide-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${translations.foodGuide} ${destination}`,
        content: `${translations.foodContent1} ${cityName} ${translations.foodContent2} ${destination} ${translations.foodContent3}`,
        relevanceScore: 85,
        scrapedAt: new Date(),
      },
      {
        url: `https://example.com/travel-tips-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${translations.travelTips} ${destination}`,
        content: `${translations.tipsContent1} ${destination}. ${translations.tipsContent2} ${cityName} ${translations.tipsContent3}`,
        relevanceScore: 80,
        scrapedAt: new Date(),
      },
      {
        url: `https://example.com/budget-travel-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${translations.budgetTravel} ${destination}`,
        content: `${translations.budgetContent1} ${destination} ${translations.budgetContent2} ${cityName} ${translations.budgetContent3}`,
        relevanceScore: 75,
        scrapedAt: new Date(),
      }
    ];
  }

  private getMockTranslations(language: string): Record<string, string> {
    const translations: Record<string, Record<string, string>> = {
      'en': {
        completeGuide: 'Complete Travel Guide to',
        guideContent1: 'Discover the best attractions, restaurants, and hidden gems in',
        guideContent2: 'This comprehensive guide covers everything you need to know about visiting',
        guideContent3: 'including local customs, transportation, and must-see sights.',
        topAttractions: 'Top 10 Must-Visit Attractions in',
        attractionsContent1: 'Explore the most popular tourist destinations and landmarks in',
        attractionsContent2: 'From historic sites to modern attractions,',
        attractionsContent3: 'offers something for every type of traveler.',
        foodGuide: 'Ultimate Food Guide for',
        foodContent1: 'Experience the local cuisine and food culture of',
        foodContent2: 'From street food to fine dining,',
        foodContent3: 'offers an incredible culinary journey for food lovers.',
        travelTips: 'Essential Travel Tips for',
        tipsContent1: 'Get insider tips and practical advice for your trip to',
        tipsContent2: 'Learn about local customs, transportation options, and how to make the most of your visit to',
        tipsContent3: 'with these expert recommendations.',
        budgetTravel: 'Budget Travel Guide to',
        budgetContent1: 'Discover how to explore',
        budgetContent2: 'on a budget. Find affordable accommodations, cheap eats, and free activities in',
        budgetContent3: 'without breaking the bank.'
      },
      'ko': {
        completeGuide: '완벽한 여행 가이드',
        guideContent1: '최고의 명소, 레스토랑, 숨겨진 보석들을 발견하세요',
        guideContent2: '이 종합 가이드는 방문에 대해 알아야 할 모든 것을 다룹니다',
        guideContent3: '현지 관습, 교통수단, 필수 관광지를 포함하여.',
        topAttractions: '꼭 방문해야 할 톱 10 명소',
        attractionsContent1: '가장 인기 있는 관광지와 랜드마크를 탐험하세요',
        attractionsContent2: '역사적 장소부터 현대적 명소까지,',
        attractionsContent3: '모든 유형의 여행자를 위한 무언가를 제공합니다.',
        foodGuide: '궁극의 음식 가이드',
        foodContent1: '현지 요리와 음식 문화를 경험하세요',
        foodContent2: '길거리 음식부터 고급 식당까지,',
        foodContent3: '음식 애호가들을 위한 놀라운 요리 여행을 제공합니다.',
        travelTips: '필수 여행 팁',
        tipsContent1: '여행을 위한 내부자 팁과 실용적인 조언을 얻으세요',
        tipsContent2: '현지 관습, 교통 옵션, 그리고 방문을 최대한 활용하는 방법을 배우세요',
        tipsContent3: '이 전문가 추천과 함께.',
        budgetTravel: '예산 여행 가이드',
        budgetContent1: '탐험하는 방법을 발견하세요',
        budgetContent2: '예산으로. 저렴한 숙박시설, 싼 음식, 무료 활동을 찾으세요',
        budgetContent3: '돈을 많이 쓰지 않고도.'
      }
    };

    return translations[language] || translations['en'];
  }
}

export const webScrapingService = new WebScrapingService();
