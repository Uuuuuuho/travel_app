import axios from 'axios';
import { ImageResult } from '@/types';

class ImageService {
  async searchDestinationImages(destination: string, query?: string): Promise<ImageResult[]> {
    const searchQueries = this.generateImageQueries(destination, query);
    const allImages: ImageResult[] = [];

    for (const searchQuery of searchQueries) {
      try {
        // Try Unsplash first (if API key available)
        if (process.env.UNSPLASH_ACCESS_KEY) {
          const unsplashImages = await this.searchUnsplash(searchQuery);
          allImages.push(...unsplashImages);
        }

        // Try Google Custom Search for images (if API key available)
        if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
          const googleImages = await this.searchGoogleImages(searchQuery);
          allImages.push(...googleImages);
        }
      } catch (error) {
        console.error(`Error searching images for "${searchQuery}":`, error);
      }
    }

    return this.removeDuplicates(allImages).slice(0, 20);
  }

  private generateImageQueries(destination: string, query?: string): string[] {
    const baseQueries = [
      destination,
      `${destination} attractions`,
      `${destination} landmarks`,
      `${destination} cityscape`,
      `${destination} culture`,
      `${destination} food`,
      `${destination} architecture`,
    ];

    if (query) {
      baseQueries.unshift(`${destination} ${query}`);
    }

    // Add variations for city/country combinations
    if (destination.includes(',')) {
      const [city, country] = destination.split(',').map(s => s.trim());
      baseQueries.push(
        city,
        `${city} ${country}`,
        `${country} landmarks`
      );
    }

    return baseQueries.slice(0, 5); // Limit to 5 queries to avoid rate limits
  }

  private async searchUnsplash(query: string): Promise<ImageResult[]> {
    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query,
          per_page: 10,
          orientation: 'landscape',
        },
        headers: {
          'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      });

      return response.data.results.map((photo: any) => ({
        url: photo.urls.regular,
        alt: photo.alt_description || photo.description || query,
        source: 'Unsplash',
        width: photo.width,
        height: photo.height,
      }));
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      return [];
    }
  }

  private async searchGoogleImages(query: string): Promise<ImageResult[]> {
    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: query,
          searchType: 'image',
          num: 10,
          imgSize: 'large',
          imgType: 'photo',
          safe: 'active',
        },
      });

      return (response.data.items || []).map((item: any) => ({
        url: item.link,
        alt: item.title,
        source: 'Google Images',
        width: item.image?.width,
        height: item.image?.height,
      }));
    } catch (error) {
      console.error('Error searching Google Images:', error);
      return [];
    }
  }

  private removeDuplicates(images: ImageResult[]): ImageResult[] {
    const seen = new Set<string>();
    return images.filter(image => {
      if (seen.has(image.url)) {
        return false;
      }
      seen.add(image.url);
      return true;
    });
  }

  // Get images for specific categories
  async getAttractionImages(attractionName: string, destination: string): Promise<ImageResult[]> {
    return this.searchDestinationImages(destination, attractionName);
  }

  async getFoodImages(destination: string): Promise<ImageResult[]> {
    return this.searchDestinationImages(destination, 'food cuisine restaurant');
  }

  async getCultureImages(destination: string): Promise<ImageResult[]> {
    return this.searchDestinationImages(destination, 'culture traditional festival');
  }

  async getLandscapeImages(destination: string): Promise<ImageResult[]> {
    return this.searchDestinationImages(destination, 'landscape nature scenery');
  }

  // Validate image URL accessibility
  async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, { timeout: 5000 });
      return response.status === 200 && response.headers['content-type']?.startsWith('image/');
    } catch {
      return false;
    }
  }

  // Filter images by aspect ratio for better layout
  filterImagesByAspectRatio(images: ImageResult[], preferredRatio: 'landscape' | 'portrait' | 'square' = 'landscape'): ImageResult[] {
    return images.filter(image => {
      if (!image.width || !image.height) return true; // Keep images without dimensions

      const ratio = image.width / image.height;
      
      switch (preferredRatio) {
        case 'landscape':
          return ratio > 1.2;
        case 'portrait':
          return ratio < 0.8;
        case 'square':
          return ratio >= 0.8 && ratio <= 1.2;
        default:
          return true;
      }
    });
  }

  // Generate placeholder images if no real images are found
  generatePlaceholderImages(destination: string, count: number = 5): ImageResult[] {
    const placeholders: ImageResult[] = [];
    
    for (let i = 0; i < count; i++) {
      placeholders.push({
        url: `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(destination)}`,
        alt: `${destination} placeholder image`,
        source: 'Placeholder',
        width: 800,
        height: 600,
      });
    }

    return placeholders;
  }
}

export const imageService = new ImageService();
