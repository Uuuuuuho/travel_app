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

  async searchTravelVideos(destination: string, language: string = 'en'): Promise<YouTubeVideo[]> {
    if (!this.youtube) {
      console.log('YouTube API key not configured, using mock video data for:', destination);
      return this.generateMockVideos(destination, language);
    }

    try {
      const searchQueries = this.generateSearchQueries(destination, language);
      const allVideos: YouTubeVideo[] = [];

      for (const query of searchQueries) {
        const videos = await this.searchVideos(query, language);
        allVideos.push(...videos);
      }

      // Remove duplicates and rank by relevance
      const uniqueVideos = this.removeDuplicates(allVideos);
      return this.rankVideos(uniqueVideos, destination);
    } catch (error) {
      console.error('Error searching YouTube videos, using mock data:', error);
      return this.generateMockVideos(destination, language);
    }
  }

  private generateSearchQueries(destination: string, language: string = 'en'): string[] {
    const searchTerms = this.getLocalizedSearchTerms(language);

    const baseQueries = [
      `${destination} ${searchTerms.travelGuide}`,
      `${destination} ${searchTerms.travelVlog}`,
      `${destination} ${searchTerms.thingsToDo}`,
      `${destination} ${searchTerms.travelTips}`,
      `${destination} ${searchTerms.attractions}`,
      `${destination} ${searchTerms.foodTour}`,
      `${destination} ${searchTerms.walkingTour}`,
      `${searchTerms.visit} ${destination}`,
      `${destination} ${searchTerms.documentary}`,
      `${destination} ${searchTerms.localExperience}`,
    ];

    // Add variations for city/country combinations
    if (destination.includes(',')) {
      const [city, country] = destination.split(',').map(s => s.trim());
      baseQueries.push(
        `${city} ${country} ${searchTerms.travel}`,
        `${city} ${searchTerms.travelGuide}`,
        `${country} ${searchTerms.travelVlog}`
      );
    }

    return baseQueries;
  }

  private async searchVideos(query: string, language: string = 'en'): Promise<YouTubeVideo[]> {
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
        relevanceLanguage: language,
        regionCode: this.getRegionCode(language),
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

  // Localization helper methods
  private getLocalizedSearchTerms(language: string): Record<string, string> {
    const searchTerms: Record<string, Record<string, string>> = {
      'en': {
        travel: 'travel',
        travelGuide: 'travel guide',
        travelVlog: 'travel vlog',
        thingsToDo: 'things to do',
        travelTips: 'travel tips',
        attractions: 'attractions',
        foodTour: 'food tour',
        walkingTour: 'walking tour',
        visit: 'visit',
        documentary: 'travel documentary',
        localExperience: 'local experience',
      },
      'es': {
        travel: 'viaje',
        travelGuide: 'guía de viaje',
        travelVlog: 'vlog de viaje',
        thingsToDo: 'qué hacer',
        travelTips: 'consejos de viaje',
        attractions: 'atracciones',
        foodTour: 'tour gastronómico',
        walkingTour: 'tour a pie',
        visit: 'visitar',
        documentary: 'documental de viaje',
        localExperience: 'experiencia local',
      },
      'fr': {
        travel: 'voyage',
        travelGuide: 'guide de voyage',
        travelVlog: 'vlog de voyage',
        thingsToDo: 'que faire',
        travelTips: 'conseils de voyage',
        attractions: 'attractions',
        foodTour: 'tour gastronomique',
        walkingTour: 'visite à pied',
        visit: 'visiter',
        documentary: 'documentaire de voyage',
        localExperience: 'expérience locale',
      },
      'de': {
        travel: 'reise',
        travelGuide: 'reiseführer',
        travelVlog: 'reise vlog',
        thingsToDo: 'was zu tun',
        travelTips: 'reisetipps',
        attractions: 'sehenswürdigkeiten',
        foodTour: 'food tour',
        walkingTour: 'stadtrundgang',
        visit: 'besuchen',
        documentary: 'reise dokumentation',
        localExperience: 'lokale erfahrung',
      },
      'ja': {
        travel: '旅行',
        travelGuide: '旅行ガイド',
        travelVlog: '旅行vlog',
        thingsToDo: 'やること',
        travelTips: '旅行のコツ',
        attractions: '観光地',
        foodTour: 'フードツアー',
        walkingTour: 'ウォーキングツアー',
        visit: '訪問',
        documentary: '旅行ドキュメンタリー',
        localExperience: '地元体験',
      },
      'ko': {
        travel: '여행',
        travelGuide: '여행 가이드',
        travelVlog: '여행 브이로그',
        thingsToDo: '할 일',
        travelTips: '여행 팁',
        attractions: '관광지',
        foodTour: '음식 투어',
        walkingTour: '도보 투어',
        visit: '방문',
        documentary: '여행 다큐멘터리',
        localExperience: '현지 체험',
      },
    };

    return searchTerms[language] || searchTerms['en'];
  }

  private getRegionCode(language: string): string {
    const regionCodes: Record<string, string> = {
      'en': 'US',
      'es': 'ES',
      'fr': 'FR',
      'de': 'DE',
      'ja': 'JP',
      'ko': 'KR',
    };
    return regionCodes[language] || 'US';
  }

  private generateMockVideos(destination: string, language: string): YouTubeVideo[] {
    const translations = this.getMockVideoTranslations(language);
    const cityName = destination.split(',')[0]?.trim() || destination;

    return [
      {
        id: `mock-video-1-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${translations.completeGuide} ${destination} | ${translations.travelVlog}`,
        description: `${translations.guideDesc1} ${destination}. ${translations.guideDesc2} ${cityName} ${translations.guideDesc3}`,
        channelTitle: `${translations.travelChannel}`,
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        thumbnails: {
          default: `https://via.placeholder.com/120x90/4285f4/ffffff?text=${encodeURIComponent(cityName)}`,
          medium: `https://via.placeholder.com/320x180/4285f4/ffffff?text=${encodeURIComponent(cityName)}`,
          high: `https://via.placeholder.com/480x360/4285f4/ffffff?text=${encodeURIComponent(cityName)}`,
        },
        viewCount: '125000',
        duration: 'PT12M34S',
      },
      {
        id: `mock-video-2-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${translations.topAttractions} ${cityName} | ${translations.thingsToDo}`,
        description: `${translations.attractionsDesc1} ${cityName}. ${translations.attractionsDesc2} ${destination} ${translations.attractionsDesc3}`,
        channelTitle: `${translations.exploreChannel}`,
        publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        thumbnails: {
          default: `https://via.placeholder.com/120x90/34a853/ffffff?text=${encodeURIComponent(cityName)}`,
          medium: `https://via.placeholder.com/320x180/34a853/ffffff?text=${encodeURIComponent(cityName)}`,
          high: `https://via.placeholder.com/480x360/34a853/ffffff?text=${encodeURIComponent(cityName)}`,
        },
        viewCount: '89000',
        duration: 'PT8M15S',
      },
      {
        id: `mock-video-3-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${translations.foodTour} ${destination} | ${translations.localCuisine}`,
        description: `${translations.foodDesc1} ${destination}. ${translations.foodDesc2} ${cityName} ${translations.foodDesc3}`,
        channelTitle: `${translations.foodieChannel}`,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        thumbnails: {
          default: `https://via.placeholder.com/120x90/ea4335/ffffff?text=${encodeURIComponent(cityName)}`,
          medium: `https://via.placeholder.com/320x180/ea4335/ffffff?text=${encodeURIComponent(cityName)}`,
          high: `https://via.placeholder.com/480x360/ea4335/ffffff?text=${encodeURIComponent(cityName)}`,
        },
        viewCount: '67000',
        duration: 'PT15M42S',
      },
      {
        id: `mock-video-4-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${translations.budgetTravel} ${destination} | ${translations.travelTips}`,
        description: `${translations.budgetDesc1} ${destination} ${translations.budgetDesc2} ${cityName} ${translations.budgetDesc3}`,
        channelTitle: `${translations.budgetChannel}`,
        publishedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
        thumbnails: {
          default: `https://via.placeholder.com/120x90/fbbc04/ffffff?text=${encodeURIComponent(cityName)}`,
          medium: `https://via.placeholder.com/320x180/fbbc04/ffffff?text=${encodeURIComponent(cityName)}`,
          high: `https://via.placeholder.com/480x360/fbbc04/ffffff?text=${encodeURIComponent(cityName)}`,
        },
        viewCount: '43000',
        duration: 'PT10M28S',
      },
      {
        id: `mock-video-5-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${translations.walkingTour} ${cityName} | ${translations.cityExploration}`,
        description: `${translations.walkingDesc1} ${cityName}. ${translations.walkingDesc2} ${destination} ${translations.walkingDesc3}`,
        channelTitle: `${translations.walkingChannel}`,
        publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        thumbnails: {
          default: `https://via.placeholder.com/120x90/9c27b0/ffffff?text=${encodeURIComponent(cityName)}`,
          medium: `https://via.placeholder.com/320x180/9c27b0/ffffff?text=${encodeURIComponent(cityName)}`,
          high: `https://via.placeholder.com/480x360/9c27b0/ffffff?text=${encodeURIComponent(cityName)}`,
        },
        viewCount: '156000',
        duration: 'PT25M17S',
      }
    ];
  }

  private getMockVideoTranslations(language: string): Record<string, string> {
    const translations: Record<string, Record<string, string>> = {
      'en': {
        completeGuide: 'Complete Travel Guide to',
        travelVlog: 'Travel Vlog',
        guideDesc1: 'Join me as I explore the amazing city of',
        guideDesc2: 'In this comprehensive travel guide, I\'ll show you the best places to visit in',
        guideDesc3: 'including hidden gems, local restaurants, and must-see attractions.',
        topAttractions: 'Top 10 Must-See Attractions in',
        thingsToDo: 'Things to Do',
        attractionsDesc1: 'Discover the most incredible attractions and landmarks in',
        attractionsDesc2: 'From historic sites to modern marvels,',
        attractionsDesc3: 'has something amazing for every traveler.',
        foodTour: 'Ultimate Food Tour of',
        localCuisine: 'Local Cuisine',
        foodDesc1: 'Experience the incredible food scene of',
        foodDesc2: 'From street food to fine dining, I\'ll take you on a culinary journey through',
        foodDesc3: 'and show you the best places to eat.',
        budgetTravel: 'Budget Travel Guide:',
        travelTips: 'Travel Tips',
        budgetDesc1: 'Learn how to explore',
        budgetDesc2: 'on a budget! I\'ll share my best tips for saving money while visiting',
        budgetDesc3: 'including cheap accommodations and free activities.',
        walkingTour: '4K Walking Tour of',
        cityExploration: 'City Exploration',
        walkingDesc1: 'Take a relaxing walking tour through the beautiful streets of',
        walkingDesc2: 'Experience the atmosphere and daily life of',
        walkingDesc3: 'in this immersive 4K walking tour.',
        travelChannel: 'Travel Adventures',
        exploreChannel: 'Explore World',
        foodieChannel: 'Foodie Travels',
        budgetChannel: 'Budget Wanderer',
        walkingChannel: 'City Walks 4K'
      },
      'ko': {
        completeGuide: '완벽한 여행 가이드',
        travelVlog: '여행 브이로그',
        guideDesc1: '놀라운 도시를 탐험하는 저와 함께하세요',
        guideDesc2: '이 종합 여행 가이드에서, 방문할 최고의 장소들을 보여드리겠습니다',
        guideDesc3: '숨겨진 보석, 현지 레스토랑, 필수 관광지를 포함하여.',
        topAttractions: '꼭 봐야 할 톱 10 명소',
        thingsToDo: '할 일',
        attractionsDesc1: '가장 놀라운 명소와 랜드마크를 발견하세요',
        attractionsDesc2: '역사적 장소부터 현대적 경이로움까지,',
        attractionsDesc3: '모든 여행자를 위한 놀라운 무언가가 있습니다.',
        foodTour: '궁극의 음식 투어',
        localCuisine: '현지 요리',
        foodDesc1: '놀라운 음식 문화를 경험하세요',
        foodDesc2: '길거리 음식부터 고급 식당까지, 요리 여행으로 안내해드리겠습니다',
        foodDesc3: '그리고 최고의 식당들을 보여드리겠습니다.',
        budgetTravel: '예산 여행 가이드:',
        travelTips: '여행 팁',
        budgetDesc1: '탐험하는 방법을 배우세요',
        budgetDesc2: '예산으로! 방문하면서 돈을 절약하는 최고의 팁을 공유하겠습니다',
        budgetDesc3: '저렴한 숙박시설과 무료 활동을 포함하여.',
        walkingTour: '4K 도보 투어',
        cityExploration: '도시 탐험',
        walkingDesc1: '아름다운 거리를 통한 편안한 도보 투어를 즐기세요',
        walkingDesc2: '분위기와 일상 생활을 경험하세요',
        walkingDesc3: '이 몰입형 4K 도보 투어에서.',
        travelChannel: '여행 모험',
        exploreChannel: '세계 탐험',
        foodieChannel: '음식 여행',
        budgetChannel: '예산 여행자',
        walkingChannel: '도시 산책 4K'
      }
    };

    return translations[language] || translations['en'];
  }
}

export const youtubeService = new YouTubeService();
