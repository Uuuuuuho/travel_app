import { llmService } from './llmService';
import { WebScrapingResult } from '@/types';
import axios from 'axios';
import * as cheerio from 'cheerio';

class WebScrapingService {
  async scrapeDestinationInfo(destination: string, language: string = 'en'): Promise<WebScrapingResult[]> {
    console.log(`Starting web scraping for "${destination}" in language "${language}" using LLM...`);

    // Use the same logic as scrapeUrl for consistency
    const searchResults = await this.performMockSearch('', destination);

    if (searchResults.length === 0) {
      console.log('No search results found. Returning empty array.');
      return [];
    }

    console.log(`Found ${searchResults.length} search results. Analyzing content with LLM...`);

    const extractionPromises = searchResults.map(async (result) => {
      // Use the same prompt format as scrapeUrl for vLLM compatibility
      const shortContent = result.content.substring(0, 1500);
      
      const extractionPrompt = `Summarize this travel content for ${destination} in exactly this JSON format (no other text):
{"title":"Brief title","summary":"2 sentences summary","relevanceScore":75}

Content: ${shortContent}

JSON response:`;

      try {
        const extractedJson = await llmService.chat([
          { role: 'user', content: extractionPrompt },
        ], { 
          max_tokens: 200,
          temperature: 0.0
        });

        // Use the same JSON parsing logic as scrapeUrl
        let cleanedJson = this.cleanLLMResponse(extractedJson);
        let extractedData;
        
        try {
          extractedData = JSON.parse(cleanedJson);
        } catch (parseError) {
          console.error('JSON parsing failed for destination info:', parseError);
          const alternativeParsing = this.extractJSONFromvLLMResponse(extractedJson);
          if (alternativeParsing) {
            extractedData = alternativeParsing;
          } else {
            // Fallback
            extractedData = {
              title: `Travel guide for ${destination}`,
              summary: result.content.substring(0, 200),
              relevanceScore: 50
            };
          }
        }

        return {
          url: result.url,
          title: extractedData.title,
          content: extractedData.summary,
          relevanceScore: Math.max(0, Math.min(100, extractedData.relevanceScore)),
          scrapedAt: new Date(),
        };
      } catch (error) {
        console.error(`Failed to process content from ${result.url}:`, error);
        return null;
      }
    });

    const processedResults = (await Promise.all(extractionPromises)).filter(Boolean) as WebScrapingResult[];

    console.log(`Successfully processed ${processedResults.length} results.`);

    return this.rankResults(processedResults);
  }

  async scrapeUrl(url: string): Promise<WebScrapingResult | null> {
    console.log(`Starting single URL scrape for: ${url}`);
    try {
      const { data: htmlContent } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      const $ = cheerio.load(htmlContent);
      
      // Remove script and style elements
      $('script, style, noscript').remove();
      
      // Extract title
      const pageTitle = $('title').text().trim() || $('h1').first().text().trim() || 'No title found';
      
      // Extract main content - try multiple selectors
      let mainContent = '';
      const contentSelectors = ['main', 'article', '.content', '#content', '.post', '.entry'];
      
      for (const selector of contentSelectors) {
        const content = $(selector).text().trim();
        if (content && content.length > mainContent.length) {
          mainContent = content;
        }
      }
      
      // Fallback to body content if no specific content area found
      if (!mainContent || mainContent.length < 100) {
        mainContent = $('body').text();
      }
      
      // Clean and limit content
      mainContent = mainContent
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 8000); // Increased limit for better analysis

      if (!mainContent || mainContent.length < 50) {
        console.log('Could not extract meaningful content from the page.');
        return null;
      }

      console.log(`Extracted ${mainContent.length} characters of content. Analyzing with LLM...`);

      // Improved prompt for single JSON object response
      const shortContent = mainContent.substring(0, 1500);
      
      const extractionPrompt = `Analyze this web content for travel information. Return exactly one JSON object only.

Content: "${shortContent}"

Return only ONE JSON object with these fields:
{
  "title": "Create a specific travel-focused title based on the content (under 80 characters)",
  "summary": "1-2 sentences summarizing the travel information",
  "relevanceScore": 85
}

Important: 
- Make the title specific to the location/attraction mentioned in the content
- If it's about Tokyo, include "Tokyo" in the title
- If it's about a specific place, include that place name
- Return only the JSON object, no other text, no arrays, no explanations

JSON:`;

      const extractedJson = await llmService.chat([
        { role: 'user', content: extractionPrompt },
      ], { 
        max_tokens: 120, // Further reduced to force concise response
        temperature: 0.1  // Low temperature for consistent format
      });

      console.log('LLM response:', extractedJson);

      // Enhanced JSON cleaning for vLLM responses
      let cleanedJson = this.cleanLLMResponse(extractedJson);

      let extractedData;
      try {
        extractedData = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        console.error('Original response:', extractedJson);
        console.error('Cleaned response was:', cleanedJson);
        
        // Try alternative parsing method for vLLM
        const alternativeParsing = this.extractJSONFromvLLMResponse(extractedJson);
        if (alternativeParsing) {
          extractedData = alternativeParsing;
        } else {
          // Fallback: create a basic result
          return {
            url: url,
            title: pageTitle.substring(0, 80),
            content: mainContent.substring(0, 300) + (mainContent.length > 300 ? '...' : ''),
            relevanceScore: 50, // Default moderate relevance
            scrapedAt: new Date(),
          };
        }
      }

      // Validate required fields
      if (!extractedData.title || !extractedData.summary || typeof extractedData.relevanceScore !== 'number') {
        console.error('Invalid LLM response structure:', extractedData);
        return null;
      }

      return {
        url: url,
        title: extractedData.title,
        content: extractedData.summary,
        relevanceScore: Math.max(0, Math.min(100, extractedData.relevanceScore)), // Ensure score is between 0-100
        scrapedAt: new Date(),
        originalContent: mainContent.substring(0, 2000), // Include original content for reference
      };
      
    } catch (error) {
      console.error(`Failed to scrape URL ${url}:`, error);
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          console.error('Request timed out');
        } else if (error.message.includes('Network Error')) {
          console.error('Network error occurred');
        }
      }
      
      return null;
    }
  }

  private cleanLLMResponse(response: string): string {
    let cleaned = response.trim();
    
    // Remove common vLLM response patterns
    cleaned = cleaned.replace(/^.*?JSON:\s*/i, ''); // Remove "JSON:" prefix
    cleaned = cleaned.replace(/^.*?response:\s*/i, ''); // Remove "response:" prefix
    cleaned = cleaned.replace(/^.*?```json\s*/i, ''); // Remove ```json
    cleaned = cleaned.replace(/\s*```.*$/i, ''); // Remove closing ```
    
    // Handle array responses - extract first object
    if (cleaned.startsWith('[')) {
      const match = cleaned.match(/\[\s*(\{[^}]*\})/);
      if (match) {
        cleaned = match[1];
      }
    }
    
    // Ensure we have a valid JSON object
    if (!cleaned.startsWith('{')) {
      const jsonMatch = cleaned.match(/\{[^}]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }
    }
    
    return cleaned.trim();
  }

  private extractJSONFromvLLMResponse(response: string): any | null {
    try {
      // Handle array responses first
      if (response.includes('[') && response.includes(']')) {
        const arrayMatch = response.match(/\[\s*(\{[^}]*\})/);
        if (arrayMatch) {
          try {
            return JSON.parse(arrayMatch[1]);
          } catch (e) {
            // Continue to other methods
          }
        }
      }

      // First try to find a complete JSON object
      const jsonMatch = response.match(/\{[^{}]*"title"[^{}]*"summary"[^{}]*"relevanceScore"[^{}]*\}/i);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Continue to manual extraction
        }
      }

      // Try to manually extract fields if JSON parsing fails
      const titleMatch = response.match(/"title"\s*:\s*"([^"]+)"/i);
      const summaryMatch = response.match(/"summary"\s*:\s*"([^"]+)"/i);
      const scoreMatch = response.match(/"relevanceScore"\s*:\s*(\d+)/i);

      if (titleMatch && summaryMatch) {
        return {
          title: titleMatch[1],
          summary: summaryMatch[1],
          relevanceScore: scoreMatch ? parseInt(scoreMatch[1]) : 50
        };
      }

      // If all else fails, create from the response text
      const lines = response.split('\n').filter(line => line.trim().length > 10);
      if (lines.length > 0) {
        return {
          title: lines[0].substring(0, 80).replace(/[^a-zA-Z0-9\s]/g, ''),
          summary: lines.slice(0, 2).join(' ').substring(0, 200),
          relevanceScore: 40
        };
      }

      return null;
    } catch (error) {
      console.error('Alternative JSON extraction failed:', error);
      return null;
    }
  }

  private extractTitleFromContent(content: string, pageTitle: string): string {
    // Extract a meaningful title from content or page title
    if (pageTitle && pageTitle.length > 5 && pageTitle !== 'No title found') {
      return pageTitle.substring(0, 80);
    }
    
    // Try to find a title-like sentence in the content
    const sentences = content.split(/[.!?]/);
    for (const sentence of sentences.slice(0, 3)) {
      const clean = sentence.trim();
      if (clean.length > 10 && clean.length < 80) {
        return clean;
      }
    }
    
    return content.substring(0, 60).trim() + '...';
  }

  private createFallbackSummary(content: string, llmResponse: string): string {
    // Try to use LLM response if it contains meaningful content
    if (llmResponse && llmResponse.length > 20 && !llmResponse.includes('JSON')) {
      const cleaned = llmResponse.replace(/[{}"\[\]]/g, '').trim();
      if (cleaned.length > 20) {
        return cleaned.substring(0, 200);
      }
    }
    
    // Create summary from content
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, 2).join('. ').trim();
    return summary.length > 20 ? summary.substring(0, 200) : content.substring(0, 200);
  }

  private estimateRelevance(content: string): number {
    const travelKeywords = [
      'travel', 'visit', 'trip', 'tourism', 'hotel', 'restaurant', 'attraction',
      'guide', 'vacation', 'destination', 'culture', 'food', 'sightseeing'
    ];
    
    const lowerContent = content.toLowerCase();
    let score = 20; // Base score
    
    for (const keyword of travelKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 10;
      }
    }
    
    return Math.min(score, 100);
  }

  private async performMockSearch(query: string, destination: string): Promise<{ url: string; content: string }[]> {
    // This is a mock implementation. Replace with a real search API call.
    console.warn('Using mock search results. Integrate a real search API for production use.');
    const cityName = destination.split(',')[0]?.trim() || destination;
    return [
      {
        url: `https://example.com/travel-guide-${cityName.toLowerCase()}`,
        content: `The Ultimate Guide to Visiting ${cityName}. Explore top attractions like the Grand Plaza and the historic Old Town. Find the best local restaurants and hidden gems. Our guide covers everything from transport to accommodation.`,
      },
      {
        url: `https://example.com/food-in-${cityName.toLowerCase()}`,
        content: `A food lover’s journey through ${cityName}. Discover the must-try dishes, from street food stalls to fine dining experiences. We review the top 5 restaurants for authentic local cuisine.`,
      },
      {
        url: `https://en.wikipedia.org/wiki/${cityName}`,
        content: `${cityName} is a major city in the region, known for its rich history and cultural heritage. The city has a population of over 1 million people and is a major economic hub.`,
      },
    ];
  }

  private rankResults(results: WebScrapingResult[]): WebScrapingResult[] {
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10); // Return top 10 results
  }
}

export const webScrapingService = new WebScrapingService();
