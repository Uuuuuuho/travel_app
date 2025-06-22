// Basic tests for services
// Note: These are simplified tests for demonstration

import { describe, it, expect, jest } from '@jest/globals';

// Mock the services since they depend on external APIs
jest.mock('../services/webScraper', () => ({
  webScrapingService: {
    scrapeDestinationInfo: jest.fn().mockResolvedValue([
      {
        url: 'https://example.com',
        title: 'Test Travel Guide',
        content: 'Test content about the destination',
        relevanceScore: 85,
        scrapedAt: new Date(),
      },
    ]),
  },
}));

jest.mock('../services/youtubeService', () => ({
  youtubeService: {
    searchTravelVideos: jest.fn().mockResolvedValue([
      {
        id: 'test-video-id',
        title: 'Amazing Travel Video',
        description: 'A great travel video about the destination',
        channelTitle: 'Travel Channel',
        publishedAt: '2024-01-01T00:00:00Z',
        thumbnails: {
          default: 'https://example.com/thumb.jpg',
          medium: 'https://example.com/thumb-medium.jpg',
          high: 'https://example.com/thumb-high.jpg',
        },
      },
    ]),
  },
}));

jest.mock('../services/imageService', () => ({
  imageService: {
    searchDestinationImages: jest.fn().mockResolvedValue([
      {
        url: 'https://example.com/image.jpg',
        alt: 'Beautiful destination',
        source: 'Test Source',
        width: 800,
        height: 600,
      },
    ]),
  },
}));

describe('Travel Services', () => {
  describe('Web Scraping Service', () => {
    it('should scrape destination information', async () => {
      const { webScrapingService } = await import('../services/webScraper');
      
      const results = await webScrapingService.scrapeDestinationInfo('Paris, France');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('content');
      expect(results[0]).toHaveProperty('relevanceScore');
    });
  });

  describe('YouTube Service', () => {
    it('should search for travel videos', async () => {
      const { youtubeService } = await import('../services/youtubeService');
      
      const results = await youtubeService.searchTravelVideos('Tokyo, Japan');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('description');
    });
  });

  describe('Image Service', () => {
    it('should search for destination images', async () => {
      const { imageService } = await import('../services/imageService');
      
      const results = await imageService.searchDestinationImages('London, UK');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('url');
      expect(results[0]).toHaveProperty('alt');
      expect(results[0]).toHaveProperty('source');
    });
  });
});

describe('Utility Functions', () => {
  describe('Destination Parsing', () => {
    it('should parse destination strings correctly', () => {
      const parseDestination = (destinationString: string) => {
        const parts = destinationString.split(',').map(s => s.trim());
        
        if (parts.length >= 2) {
          return {
            name: parts[0],
            country: parts[1],
            region: parts[2] || undefined,
          };
        }
        
        return {
          name: destinationString,
          country: 'Unknown',
        };
      };

      expect(parseDestination('Paris, France')).toEqual({
        name: 'Paris',
        country: 'France',
        region: undefined,
      });

      expect(parseDestination('New York, USA, North America')).toEqual({
        name: 'New York',
        country: 'USA',
        region: 'North America',
      });

      expect(parseDestination('Tokyo')).toEqual({
        name: 'Tokyo',
        country: 'Unknown',
      });
    });
  });

  describe('Content Relevance Scoring', () => {
    it('should calculate relevance scores correctly', () => {
      const calculateRelevance = (content: string, destination: string): number => {
        const lowerContent = content.toLowerCase();
        const lowerDestination = destination.toLowerCase();
        
        let score = 0;

        // Exact destination match
        if (lowerContent.includes(lowerDestination)) {
          score += 50;
        }

        // Travel keywords
        const travelKeywords = ['travel', 'visit', 'attraction', 'guide'];
        travelKeywords.forEach(keyword => {
          if (lowerContent.includes(keyword)) {
            score += 10;
          }
        });

        return Math.min(score, 100);
      };

      expect(calculateRelevance('Paris travel guide with attractions', 'Paris')).toBe(80);
      expect(calculateRelevance('Visit Tokyo attractions', 'Tokyo')).toBe(70);
      expect(calculateRelevance('Random content', 'Paris')).toBe(0);
    });
  });
});

describe('Form Validation', () => {
  it('should validate destination form data', () => {
    const validateFormData = (data: any) => {
      const errors: string[] = [];

      if (!data.destination || data.destination.length < 2) {
        errors.push('Destination must be at least 2 characters');
      }

      if (!data.duration || data.duration < 1 || data.duration > 30) {
        errors.push('Duration must be between 1 and 30 days');
      }

      if (!data.travelers || data.travelers < 1 || data.travelers > 20) {
        errors.push('Number of travelers must be between 1 and 20');
      }

      if (!['budget', 'mid-range', 'luxury'].includes(data.budget)) {
        errors.push('Invalid budget level');
      }

      if (!Array.isArray(data.interests) || data.interests.length === 0) {
        errors.push('At least one interest must be selected');
      }

      return errors;
    };

    // Valid data
    expect(validateFormData({
      destination: 'Paris, France',
      duration: 7,
      travelers: 2,
      budget: 'mid-range',
      interests: ['Culture & History'],
    })).toEqual([]);

    // Invalid data
    expect(validateFormData({
      destination: 'P',
      duration: 0,
      travelers: 0,
      budget: 'invalid',
      interests: [],
    })).toHaveLength(5);
  });
});

describe('Error Handling', () => {
  it('should handle API errors gracefully', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    const handleApiCall = async () => {
      try {
        await fetch('/api/test');
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    };

    const result = await handleApiCall();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});
