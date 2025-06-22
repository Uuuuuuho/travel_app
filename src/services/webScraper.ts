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

  async scrapeDestinationInfo(destination: string): Promise<WebScrapingResult[]> {
    const results: WebScrapingResult[] = [];
    
    for (const site of this.travelSites) {
      try {
        const siteResults = await this.scrapeSite(site, destination);
        results.push(...siteResults);
      } catch (error) {
        console.error(`Error scraping ${site.url}:`, error);
        // Continue with other sites even if one fails
      }
    }

    // Also try general web search for travel blogs
    const blogResults = await this.searchTravelBlogs(destination);
    results.push(...blogResults);

    return this.rankResults(results);
  }

  private async scrapeSite(site: ScrapingTarget, destination: string): Promise<WebScrapingResult[]> {
    const url = site.url.replace('{destination}', encodeURIComponent(destination));
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
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

  private async searchTravelBlogs(destination: string): Promise<WebScrapingResult[]> {
    // Use Google Custom Search API if available, otherwise return empty array
    if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
      return [];
    }

    try {
      const query = `${destination} travel guide blog tips`;
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: query,
          num: 10,
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
}

export const webScrapingService = new WebScrapingService();
