import { google } from 'googleapis';
import { YouTubeVideo } from '@/types';

class YouTubeService {
  private youtube;

  constructor() {
    if (process.env.YOUTUBE_API_KEY) {
      this.youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY,
      });
    }
  }

  async searchTravelVideos(destination: string): Promise<YouTubeVideo[]> {
    if (!this.youtube) {
      console.warn('YouTube API key not configured');
      return [];
    }

    try {
      const searchQueries = this.generateSearchQueries(destination);
      const allVideos: YouTubeVideo[] = [];

      for (const query of searchQueries) {
        const videos = await this.searchVideos(query);
        allVideos.push(...videos);
      }

      // Remove duplicates and rank by relevance
      const uniqueVideos = this.removeDuplicates(allVideos);
      return this.rankVideos(uniqueVideos, destination);
    } catch (error) {
      console.error('Error searching YouTube videos:', error);
      return [];
    }
  }

  private generateSearchQueries(destination: string): string[] {
    const baseQueries = [
      `${destination} travel guide`,
      `${destination} travel vlog`,
      `${destination} things to do`,
      `${destination} travel tips`,
      `${destination} attractions`,
      `${destination} food tour`,
      `${destination} walking tour`,
      `visit ${destination}`,
      `${destination} travel documentary`,
      `${destination} local experience`,
    ];

    // Add variations for city/country combinations
    if (destination.includes(',')) {
      const [city, country] = destination.split(',').map(s => s.trim());
      baseQueries.push(
        `${city} ${country} travel`,
        `${city} travel guide`,
        `${country} travel vlog`
      );
    }

    return baseQueries;
  }

  private async searchVideos(query: string): Promise<YouTubeVideo[]> {
    try {
      const response = await this.youtube!.search.list({
        part: ['snippet'],
        q: query,
        type: ['video'],
        maxResults: 10,
        order: 'relevance',
        videoDuration: 'medium', // 4-20 minutes
        videoDefinition: 'any',
        safeSearch: 'moderate',
      });

      const videos: YouTubeVideo[] = [];
      
      if (response.data.items) {
        for (const item of response.data.items) {
          if (item.id?.videoId && item.snippet) {
            const video: YouTubeVideo = {
              id: item.id.videoId,
              title: item.snippet.title || '',
              description: item.snippet.description || '',
              channelTitle: item.snippet.channelTitle || '',
              publishedAt: item.snippet.publishedAt || '',
              thumbnails: {
                default: item.snippet.thumbnails?.default?.url || '',
                medium: item.snippet.thumbnails?.medium?.url || '',
                high: item.snippet.thumbnails?.high?.url || '',
              },
            };

            // Get additional video details
            const videoDetails = await this.getVideoDetails(item.id.videoId);
            if (videoDetails) {
              video.viewCount = videoDetails.viewCount;
              video.duration = videoDetails.duration;
            }

            videos.push(video);
          }
        }
      }

      return videos;
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
      return [];
    }
  }

  private async getVideoDetails(videoId: string): Promise<{ viewCount?: string; duration?: string } | null> {
    try {
      const response = await this.youtube!.videos.list({
        part: ['statistics', 'contentDetails'],
        id: [videoId],
      });

      const video = response.data.items?.[0];
      if (video) {
        return {
          viewCount: video.statistics?.viewCount,
          duration: video.contentDetails?.duration,
        };
      }
    } catch (error) {
      console.error(`Error getting video details for ${videoId}:`, error);
    }
    return null;
  }

  private removeDuplicates(videos: YouTubeVideo[]): YouTubeVideo[] {
    const seen = new Set<string>();
    return videos.filter(video => {
      if (seen.has(video.id)) {
        return false;
      }
      seen.add(video.id);
      return true;
    });
  }

  private rankVideos(videos: YouTubeVideo[], destination: string): YouTubeVideo[] {
    return videos
      .map(video => ({
        ...video,
        relevanceScore: this.calculateVideoRelevance(video, destination),
      }))
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 15) // Return top 15 videos
      .map(({ relevanceScore, ...video }) => video); // Remove relevanceScore from final result
  }

  private calculateVideoRelevance(video: YouTubeVideo, destination: string): number {
    let score = 0;
    const lowerDestination = destination.toLowerCase();
    const searchText = `${video.title} ${video.description} ${video.channelTitle}`.toLowerCase();

    // Exact destination match in title
    if (video.title.toLowerCase().includes(lowerDestination)) {
      score += 50;
    }

    // Partial destination matches
    const destinationParts = lowerDestination.split(/[,\s]+/);
    destinationParts.forEach(part => {
      if (part.length > 2 && searchText.includes(part)) {
        score += 15;
      }
    });

    // Travel-related keywords in title
    const travelKeywords = [
      'travel', 'guide', 'vlog', 'tour', 'visit', 'things to do',
      'attractions', 'food', 'culture', 'experience', 'tips'
    ];
    
    travelKeywords.forEach(keyword => {
      if (video.title.toLowerCase().includes(keyword)) {
        score += 10;
      }
    });

    // Channel credibility (travel channels)
    const travelChannels = [
      'travel', 'vlog', 'guide', 'adventure', 'explore', 'wanderlust',
      'nomad', 'backpack', 'journey', 'discover'
    ];
    
    travelChannels.forEach(keyword => {
      if (video.channelTitle.toLowerCase().includes(keyword)) {
        score += 5;
      }
    });

    // Video popularity (view count)
    if (video.viewCount) {
      const views = parseInt(video.viewCount);
      if (views > 100000) score += 10;
      else if (views > 10000) score += 5;
      else if (views > 1000) score += 2;
    }

    // Video recency (prefer newer videos)
    const publishDate = new Date(video.publishedAt);
    const monthsOld = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsOld < 6) score += 5;
    else if (monthsOld < 12) score += 3;
    else if (monthsOld < 24) score += 1;

    return score;
  }

  // Extract key insights from video descriptions
  extractVideoInsights(videos: YouTubeVideo[]): string[] {
    const insights: string[] = [];
    
    videos.forEach(video => {
      const description = video.description.toLowerCase();
      
      // Extract mentions of specific places, restaurants, hotels
      const placePatterns = [
        /visit\s+([^.!?]+)/g,
        /go\s+to\s+([^.!?]+)/g,
        /check\s+out\s+([^.!?]+)/g,
        /recommend\s+([^.!?]+)/g,
      ];

      placePatterns.forEach(pattern => {
        const matches = description.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const insight = match.trim();
            if (insight.length > 10 && insight.length < 100) {
              insights.push(insight);
            }
          });
        }
      });
    });

    // Remove duplicates and return top insights
    return [...new Set(insights)].slice(0, 20);
  }
}

export const youtubeService = new YouTubeService();
