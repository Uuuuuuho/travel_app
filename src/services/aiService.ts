import OpenAI from 'openai';
import { TravelItinerary, WebScrapingResult, YouTubeVideo, Destination } from '@/types';

interface GenerationInput {
  destination: string;
  duration: number;
  travelers: number;
  budget: 'budget' | 'mid-range' | 'luxury';
  interests: string[];
  webData: WebScrapingResult[];
  youtubeData: YouTubeVideo[];
}

class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async generateItinerary(input: GenerationInput): Promise<TravelItinerary> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Parse destination
      const destination = this.parseDestination(input.destination);

      // Generate the main itinerary content
      const itineraryContent = await this.generateItineraryContent(input);

      // Parse the generated content into structured data
      const parsedItinerary = await this.parseItineraryContent(itineraryContent, input);

      return {
        destination,
        duration: input.duration,
        travelInfo: parsedItinerary.travelInfo,
        dailyItineraries: parsedItinerary.dailyItineraries,
        generatedAt: new Date(),
        sources: this.extractSources(input.webData, input.youtubeData),
      };
    } catch (error) {
      console.error('Error generating itinerary:', error);
      throw new Error('Failed to generate itinerary');
    }
  }

  private async generateItineraryContent(input: GenerationInput): Promise<string> {
    const webContext = this.summarizeWebData(input.webData);
    const videoContext = this.summarizeVideoData(input.youtubeData);
    
    const prompt = this.buildPrompt(input, webContext, videoContext);

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner with extensive knowledge of destinations worldwide. Create detailed, practical, and engaging travel itineraries based on user preferences and available information.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  }

  private buildPrompt(input: GenerationInput, webContext: string, videoContext: string): string {
    return `
Create a comprehensive ${input.duration}-day travel itinerary for ${input.destination} for ${input.travelers} traveler(s) with a ${input.budget} budget.

User Interests: ${input.interests.join(', ')}

Available Information:
${webContext}

${videoContext}

Please provide a detailed itinerary in the following JSON format:
{
  "travelInfo": {
    "attractions": [
      {
        "name": "Attraction Name",
        "description": "Detailed description",
        "category": "Category",
        "rating": 4.5,
        "estimatedDuration": "2-3 hours",
        "entryFee": "$20",
        "location": "Address/Area",
        "tips": ["Tip 1", "Tip 2"]
      }
    ],
    "activities": [
      {
        "name": "Activity Name",
        "description": "Description",
        "category": "Category",
        "duration": "Half day",
        "difficulty": "Easy",
        "cost": "$50",
        "bestTime": "Morning",
        "location": "Location"
      }
    ],
    "transportation": [
      {
        "type": "Flight",
        "description": "How to get there",
        "estimatedCost": "$500",
        "duration": "8 hours",
        "tips": ["Book in advance"]
      }
    ],
    "accommodation": [
      {
        "type": "Hotel",
        "area": "City Center",
        "priceRange": "$100-200/night",
        "description": "Description",
        "amenities": ["WiFi", "Breakfast"]
      }
    ],
    "localTips": ["Tip 1", "Tip 2"],
    "bestTimeToVisit": "Spring (March-May)",
    "budget": {
      "daily": {
        "budget": "$50-80",
        "midRange": "$80-150",
        "luxury": "$150+"
      },
      "breakdown": {
        "accommodation": "40%",
        "food": "30%",
        "transportation": "20%",
        "activities": "10%"
      }
    }
  },
  "dailyItineraries": [
    {
      "day": 1,
      "title": "Arrival and City Center",
      "activities": [
        {
          "time": "09:00",
          "activity": "Activity name",
          "location": "Location",
          "duration": "2 hours",
          "description": "Description",
          "cost": "$20"
        }
      ],
      "meals": [
        {
          "type": "Lunch",
          "suggestion": "Restaurant name",
          "location": "Location",
          "cost": "$25"
        }
      ],
      "transportation": "Walking/Metro",
      "notes": ["Note 1", "Note 2"]
    }
  ]
}

Make sure to:
1. Include specific, actionable recommendations
2. Consider the user's budget level (${input.budget})
3. Incorporate their interests: ${input.interests.join(', ')}
4. Provide realistic timing and costs
5. Include local insights and practical tips
6. Create a logical flow for each day
7. Suggest appropriate transportation between activities
8. Include meal recommendations that fit the budget
`;
  }

  private summarizeWebData(webData: WebScrapingResult[]): string {
    if (webData.length === 0) return 'No web data available.';

    const topResults = webData.slice(0, 10);
    const summary = topResults.map(result => 
      `Source: ${result.title}\nContent: ${result.content.substring(0, 200)}...`
    ).join('\n\n');

    return `Web Research Results:\n${summary}`;
  }

  private summarizeVideoData(videoData: YouTubeVideo[]): string {
    if (videoData.length === 0) return 'No video data available.';

    const topVideos = videoData.slice(0, 5);
    const summary = topVideos.map(video => 
      `Video: ${video.title}\nChannel: ${video.channelTitle}\nDescription: ${video.description.substring(0, 150)}...`
    ).join('\n\n');

    return `YouTube Video Insights:\n${summary}`;
  }

  private async parseItineraryContent(content: string, input: GenerationInput): Promise<any> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error);
    }

    // Fallback: use AI to structure the content
    return this.structureContentWithAI(content, input);
  }

  private async structureContentWithAI(content: string, input: GenerationInput): Promise<any> {
    const structurePrompt = `
Please convert the following travel itinerary content into the exact JSON structure I specified earlier:

${content}

Return only valid JSON without any additional text.
`;

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: structurePrompt,
        },
      ],
      max_tokens: 3000,
      temperature: 0.1,
    });

    try {
      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Error parsing structured response:', error);
      return this.createFallbackItinerary(input);
    }
  }

  private createFallbackItinerary(input: GenerationInput): any {
    // Create a basic fallback structure
    return {
      travelInfo: {
        attractions: [],
        activities: [],
        transportation: [],
        accommodation: [],
        localTips: [`Visit ${input.destination} during the best season for your interests.`],
        bestTimeToVisit: 'Year-round',
        budget: {
          daily: {
            budget: '$50-80',
            midRange: '$80-150',
            luxury: '$150+',
          },
          breakdown: {
            accommodation: '40%',
            food: '30%',
            transportation: '20%',
            activities: '10%',
          },
        },
      },
      dailyItineraries: Array.from({ length: input.duration }, (_, i) => ({
        day: i + 1,
        title: `Day ${i + 1}`,
        activities: [],
        meals: [],
        transportation: 'To be determined',
        notes: [],
      })),
    };
  }

  private parseDestination(destinationString: string): Destination {
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
  }

  private extractSources(webData: WebScrapingResult[], videoData: YouTubeVideo[]): string[] {
    const sources: string[] = [];
    
    webData.slice(0, 5).forEach(result => {
      sources.push(result.url);
    });
    
    videoData.slice(0, 3).forEach(video => {
      sources.push(`https://youtube.com/watch?v=${video.id}`);
    });
    
    return sources;
  }
}

export const aiService = new AIService();

// Main orchestration service
export class TravelPlannerService {
  async generateCompleteItinerary(input: {
    destination: string;
    duration: number;
    travelers: number;
    budget: 'budget' | 'mid-range' | 'luxury';
    interests: string[];
  }): Promise<TravelItinerary> {

    // Import services dynamically to avoid circular dependencies
    const { webScrapingService } = await import('./webScraper');
    const { youtubeService } = await import('./youtubeService');
    const { imageService } = await import('./imageService');

    try {
      // Step 1: Gather web information
      const webData = await webScrapingService.scrapeDestinationInfo(input.destination);

      // Step 2: Get YouTube videos
      const youtubeData = await youtubeService.searchTravelVideos(input.destination);

      // Step 3: Generate itinerary with AI
      const itinerary = await aiService.generateItinerary({
        ...input,
        webData,
        youtubeData,
      });

      // Step 4: Add images to attractions and activities
      const enhancedItinerary = await this.enhanceWithImages(itinerary);

      return enhancedItinerary;
    } catch (error) {
      console.error('Error in travel planner service:', error);
      throw error;
    }
  }

  private async enhanceWithImages(itinerary: TravelItinerary): Promise<TravelItinerary> {
    const { imageService } = await import('./imageService');

    // Add images to attractions
    for (const attraction of itinerary.travelInfo.attractions) {
      try {
        const images = await imageService.getAttractionImages(
          attraction.name,
          itinerary.destination.name
        );
        attraction.images = images.slice(0, 3).map(img => img.url);
      } catch (error) {
        console.error(`Error getting images for ${attraction.name}:`, error);
        attraction.images = [];
      }
    }

    return itinerary;
  }
}

export const travelPlannerService = new TravelPlannerService();
