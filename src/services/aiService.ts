import OpenAI from 'openai';
import { TravelItinerary, WebScrapingResult, YouTubeVideo, Destination } from '@/types';
import { getAppConfig, logConfigStatus } from '@/lib/config';

interface GenerationInput {
  destination: string;
  duration: number;
  travelers: number;
  budget: 'budget' | 'mid-range' | 'luxury';
  interests: string[];
  webData: WebScrapingResult[];
  youtubeData: YouTubeVideo[];
  language?: string;
  locale?: string;
}

class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    const config = getAppConfig();

    if (config.openai.available) {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey!,
      });
    } else {
      console.warn('OpenAI API key not configured. Itinerary generation will use fallback mode.');
      if (process.env.NODE_ENV === 'development') {
        logConfigStatus();
      }
    }
  }

  async generateItinerary(input: GenerationInput): Promise<TravelItinerary> {
    try {
      // Parse destination
      const destination = this.parseDestination(input.destination);

      let itineraryContent = '';
      let parsedItinerary: any;

      if (!this.openai) {
        console.warn('OpenAI API key not configured, using fallback itinerary');
        parsedItinerary = this.createFallbackItinerary(input);
      } else {
        try {
          // Generate the main itinerary content
          itineraryContent = await this.generateItineraryContent(input);

          // Parse the generated content into structured data
          parsedItinerary = await this.parseItineraryContent(itineraryContent, input);
        } catch (aiError) {
          console.error('AI generation failed, using fallback:', aiError);
          parsedItinerary = this.createFallbackItinerary(input);
        }
      }

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

      // Last resort fallback
      const destination = this.parseDestination(input.destination);
      const fallbackItinerary = this.createFallbackItinerary(input);

      return {
        destination,
        duration: input.duration,
        travelInfo: fallbackItinerary.travelInfo,
        dailyItineraries: fallbackItinerary.dailyItineraries,
        generatedAt: new Date(),
        sources: [],
      };
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
    const language = input.language || 'en';
    const culturalContext = this.getCulturalContext(language, input.destination);

    return `
Create a comprehensive ${input.duration}-day travel itinerary for ${input.destination} for ${input.travelers} traveler(s) with a ${input.budget} budget.

IMPORTANT: Generate all content in ${this.getLanguageName(language)} language. Include cultural context and local customs relevant to ${language} speakers.

User Interests: ${input.interests.join(', ')}

Cultural Context for ${language} speakers:
${culturalContext}

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
          "type": "Breakfast",
          "name": "Restaurant Name",
          "location": "Specific address or area",
          "description": "Detailed description of the restaurant and cuisine",
          "specialties": ["Dish 1", "Dish 2", "Dish 3"],
          "priceRange": "$10-15",
          "recommendation": "Why this place is recommended",
          "culturalContext": "Local dining customs and significance",
          "website": "https://restaurant-website.com",
          "reviewLink": "https://tripadvisor.com/restaurant-link",
          "openingHours": "7:00 AM - 11:00 AM",
          "reservationNeeded": false,
          "distanceFromActivity": "5-minute walk from morning activity"
        },
        {
          "type": "Lunch",
          "name": "Restaurant Name",
          "location": "Specific address or area",
          "description": "Detailed description of the restaurant and cuisine",
          "specialties": ["Dish 1", "Dish 2", "Dish 3"],
          "priceRange": "$15-25",
          "recommendation": "Why this place is recommended",
          "culturalContext": "Local dining customs and significance",
          "website": "https://restaurant-website.com",
          "reviewLink": "https://tripadvisor.com/restaurant-link",
          "openingHours": "12:00 PM - 3:00 PM",
          "reservationNeeded": false,
          "distanceFromActivity": "Located near afternoon attractions"
        },
        {
          "type": "Dinner",
          "name": "Restaurant Name",
          "location": "Specific address or area",
          "description": "Detailed description of the restaurant and cuisine",
          "specialties": ["Dish 1", "Dish 2", "Dish 3"],
          "priceRange": "$25-40",
          "recommendation": "Why this place is recommended",
          "culturalContext": "Local dining customs and significance",
          "website": "https://restaurant-website.com",
          "reviewLink": "https://tripadvisor.com/restaurant-link",
          "openingHours": "6:00 PM - 10:00 PM",
          "reservationNeeded": true,
          "distanceFromActivity": "Easy access from hotel or evening activities"
        }
      ],
      "transportation": "Walking/Metro",
      "notes": ["Note 1", "Note 2"]
    }
  ]
}

Make sure to:
1. Write ALL content in ${this.getLanguageName(language)} language
2. Include cultural context relevant to ${language} speakers
3. Consider local customs and etiquette important for ${language} speakers
4. Include specific, actionable recommendations
5. Consider the user's budget level (${input.budget})
6. Incorporate their interests: ${input.interests.join(', ')}
7. Provide realistic timing and costs in local currency when possible
8. Include local insights and practical tips
9. Create a logical flow for each day
10. Suggest appropriate transportation between activities
11. Add language-specific tips (useful phrases, communication advice)

CRITICAL - Detailed Meal Recommendations:
For each meal (breakfast, lunch, dinner), provide:
- Specific restaurant names (real establishments when possible)
- Exact locations/addresses relative to daily activities
- Detailed explanations of why each restaurant is recommended
- Local specialties and signature dishes to try
- Cultural significance and dining customs
- Accurate price ranges for the ${input.budget} budget level
- Reference links (official websites, review sites, travel guides)
- Opening hours and reservation requirements
- Distance/accessibility from planned activities
- Local dining etiquette and meal timing customs
- Payment methods accepted and tipping practices
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
    const language = input.language || 'en';
    const translations = this.getFallbackTranslations(language);

    // Create a more comprehensive fallback structure
    return {
      travelInfo: {
        attractions: [
          {
            name: `${translations.mainAttraction} ${input.destination}`,
            description: `${translations.attractionDesc} ${input.destination}`,
            category: translations.cultural,
            rating: 4.0,
            estimatedDuration: '2-3 hours',
            entryFee: translations.varies,
            location: input.destination,
            tips: [translations.tip1, translations.tip2]
          }
        ],
        activities: [
          {
            name: translations.walking,
            description: `${translations.walkingDesc} ${input.destination}`,
            category: translations.sightseeing,
            duration: translations.halfDay,
            difficulty: translations.easy,
            cost: translations.free,
            bestTime: translations.morning,
            location: input.destination
          }
        ],
        transportation: [
          {
            type: translations.localTransport,
            description: translations.transportDesc,
            estimatedCost: translations.transportCost,
            duration: translations.varies,
            tips: [translations.transportTip]
          }
        ],
        accommodation: [
          {
            type: translations.hotel,
            area: translations.cityCenter,
            priceRange: this.getBudgetRange(input.budget, language),
            description: translations.hotelDesc,
            amenities: [translations.wifi, translations.breakfast]
          }
        ],
        localTips: [
          `${translations.visitTip} ${input.destination}`,
          translations.weatherTip,
          translations.currencyTip
        ],
        bestTimeToVisit: translations.yearRound,
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
        title: `${translations.day} ${i + 1}: ${i === 0 ? translations.arrival : i === input.duration - 1 ? translations.departure : translations.exploration}`,
        activities: [
          {
            time: '09:00',
            activity: i === 0 ? translations.checkIn : translations.explore,
            location: input.destination,
            duration: '2 hours',
            description: `${translations.activityDesc} ${input.destination}`,
            cost: translations.free
          },
          {
            time: '14:00',
            activity: translations.lunch,
            location: translations.localRestaurant,
            duration: '1 hour',
            description: translations.lunchDesc,
            cost: '$15-25'
          }
        ],
        meals: this.generateDetailedMeals(input.destination, input.budget, language, i, translations),
        transportation: translations.walkingMetro,
        notes: [translations.note1, translations.note2]
      })),
    };
  }

  private getFallbackTranslations(language: string): Record<string, string> {
    const translations: Record<string, Record<string, string>> = {
      'en': {
        mainAttraction: 'Main Attraction in',
        attractionDesc: 'Popular tourist destination in',
        cultural: 'Cultural',
        varies: 'Varies',
        tip1: 'Visit early morning for fewer crowds',
        tip2: 'Check opening hours before visiting',
        walking: 'City Walking Tour',
        walkingDesc: 'Explore the main areas of',
        sightseeing: 'Sightseeing',
        halfDay: 'Half day',
        easy: 'Easy',
        free: 'Free',
        morning: 'Morning',
        localTransport: 'Local Transportation',
        transportDesc: 'Public transportation and taxis available',
        transportCost: '$5-15 per trip',
        transportTip: 'Consider getting a day pass',
        hotel: 'Hotel',
        cityCenter: 'City Center',
        hotelDesc: 'Comfortable accommodation with good amenities',
        wifi: 'WiFi',
        breakfast: 'Breakfast',
        visitTip: 'Best time to visit',
        weatherTip: 'Check weather conditions before traveling',
        currencyTip: 'Have local currency for small purchases',
        yearRound: 'Year-round',
        day: 'Day',
        arrival: 'Arrival',
        departure: 'Departure',
        exploration: 'Exploration',
        checkIn: 'Hotel Check-in',
        explore: 'Explore City Center',
        activityDesc: 'Discover the highlights of',
        lunch: 'Lunch Break',
        localRestaurant: 'Local Restaurant',
        lunchDesc: 'Try local cuisine',
        localCafe: 'Local Cafe',
        nearHotel: 'Near Hotel',
        dinner: 'Dinner',
        traditionalFood: 'Traditional Restaurant',
        walkingMetro: 'Walking/Metro',
        note1: 'Wear comfortable walking shoes',
        note2: 'Bring a camera for photos'
      },
      'ko': {
        mainAttraction: '주요 명소',
        attractionDesc: '인기 관광지',
        cultural: '문화',
        varies: '다양함',
        tip1: '이른 아침에 방문하면 사람이 적습니다',
        tip2: '방문 전 운영시간을 확인하세요',
        walking: '도시 도보 투어',
        walkingDesc: '주요 지역 탐방',
        sightseeing: '관광',
        halfDay: '반나절',
        easy: '쉬움',
        free: '무료',
        morning: '오전',
        localTransport: '현지 교통수단',
        transportDesc: '대중교통과 택시 이용 가능',
        transportCost: '회당 $5-15',
        transportTip: '일일 패스 구매를 고려해보세요',
        hotel: '호텔',
        cityCenter: '시내 중심가',
        hotelDesc: '좋은 시설을 갖춘 편안한 숙박시설',
        wifi: 'WiFi',
        breakfast: '조식',
        visitTip: '방문하기 좋은 시기',
        weatherTip: '여행 전 날씨를 확인하세요',
        currencyTip: '소액 구매를 위해 현지 화폐를 준비하세요',
        yearRound: '연중',
        day: '일차',
        arrival: '도착',
        departure: '출발',
        exploration: '탐방',
        checkIn: '호텔 체크인',
        explore: '시내 중심가 탐방',
        activityDesc: '하이라이트 발견',
        lunch: '점심 시간',
        localRestaurant: '현지 식당',
        lunchDesc: '현지 음식 체험',
        localCafe: '현지 카페',
        nearHotel: '호텔 근처',
        dinner: '저녁식사',
        traditionalFood: '전통 음식점',
        walkingMetro: '도보/지하철',
        note1: '편안한 신발을 착용하세요',
        note2: '사진 촬영을 위해 카메라를 가져오세요'
      }
    };

    return translations[language] || translations['en'];
  }

  private getBudgetRange(budget: string, language: string): string {
    const ranges: Record<string, Record<string, string>> = {
      'en': {
        'budget': '$30-60/night',
        'mid-range': '$60-120/night',
        'luxury': '$120+/night'
      },
      'ko': {
        'budget': '1박당 $30-60',
        'mid-range': '1박당 $60-120',
        'luxury': '1박당 $120+'
      }
    };

    return ranges[language]?.[budget] || ranges['en'][budget] || '$60-120/night';
  }

  private generateDetailedMeals(destination: string, budget: string, language: string, dayIndex: number, translations: Record<string, string>): any[] {
    const cityName = destination.split(',')[0]?.trim() || destination;
    const countryName = destination.split(',')[1]?.trim() || 'Unknown';

    const mealData = this.getMealRecommendations(language);
    const budgetMultiplier = budget === 'budget' ? 0.7 : budget === 'luxury' ? 1.5 : 1.0;

    const restaurants = this.getRestaurantTemplates(cityName, countryName, language, dayIndex);

    return [
      {
        type: mealData.breakfast,
        name: restaurants.breakfast.name,
        location: restaurants.breakfast.location,
        description: restaurants.breakfast.description,
        specialties: restaurants.breakfast.specialties,
        priceRange: this.calculatePriceRange(8, 15, budgetMultiplier),
        recommendation: restaurants.breakfast.recommendation,
        culturalContext: restaurants.breakfast.culturalContext,
        website: restaurants.breakfast.website,
        reviewLink: restaurants.breakfast.reviewLink,
        openingHours: restaurants.breakfast.openingHours,
        reservationNeeded: false,
        distanceFromActivity: restaurants.breakfast.distanceFromActivity,
        paymentMethods: mealData.paymentMethods,
        tippingCustom: mealData.tippingCustom
      },
      {
        type: mealData.lunch,
        name: restaurants.lunch.name,
        location: restaurants.lunch.location,
        description: restaurants.lunch.description,
        specialties: restaurants.lunch.specialties,
        priceRange: this.calculatePriceRange(15, 25, budgetMultiplier),
        recommendation: restaurants.lunch.recommendation,
        culturalContext: restaurants.lunch.culturalContext,
        website: restaurants.lunch.website,
        reviewLink: restaurants.lunch.reviewLink,
        openingHours: restaurants.lunch.openingHours,
        reservationNeeded: false,
        distanceFromActivity: restaurants.lunch.distanceFromActivity,
        paymentMethods: mealData.paymentMethods,
        tippingCustom: mealData.tippingCustom
      },
      {
        type: mealData.dinner,
        name: restaurants.dinner.name,
        location: restaurants.dinner.location,
        description: restaurants.dinner.description,
        specialties: restaurants.dinner.specialties,
        priceRange: this.calculatePriceRange(25, 45, budgetMultiplier),
        recommendation: restaurants.dinner.recommendation,
        culturalContext: restaurants.dinner.culturalContext,
        website: restaurants.dinner.website,
        reviewLink: restaurants.dinner.reviewLink,
        openingHours: restaurants.dinner.openingHours,
        reservationNeeded: budget !== 'budget',
        distanceFromActivity: restaurants.dinner.distanceFromActivity,
        paymentMethods: mealData.paymentMethods,
        tippingCustom: mealData.tippingCustom
      }
    ];
  }

  private calculatePriceRange(baseMin: number, baseMax: number, multiplier: number): string {
    const min = Math.round(baseMin * multiplier);
    const max = Math.round(baseMax * multiplier);
    return `$${min}-${max}`;
  }

  private getMealRecommendations(language: string): Record<string, string> {
    const mealData: Record<string, Record<string, string>> = {
      'en': {
        breakfast: 'Breakfast',
        lunch: 'Lunch',
        dinner: 'Dinner',
        paymentMethods: 'Credit cards, cash, and mobile payments accepted',
        tippingCustom: '15-20% tip is customary for good service'
      },
      'ko': {
        breakfast: '조식',
        lunch: '점심',
        dinner: '저녁',
        paymentMethods: '신용카드, 현금, 모바일 결제 가능',
        tippingCustom: '좋은 서비스에 대해 15-20% 팁이 관례입니다'
      },
      'es': {
        breakfast: 'Desayuno',
        lunch: 'Almuerzo',
        dinner: 'Cena',
        paymentMethods: 'Se aceptan tarjetas de crédito, efectivo y pagos móviles',
        tippingCustom: 'Es costumbre dar propina del 15-20% por buen servicio'
      },
      'fr': {
        breakfast: 'Petit-déjeuner',
        lunch: 'Déjeuner',
        dinner: 'Dîner',
        paymentMethods: 'Cartes de crédit, espèces et paiements mobiles acceptés',
        tippingCustom: 'Un pourboire de 15-20% est coutumier pour un bon service'
      },
      'de': {
        breakfast: 'Frühstück',
        lunch: 'Mittagessen',
        dinner: 'Abendessen',
        paymentMethods: 'Kreditkarten, Bargeld und mobile Zahlungen werden akzeptiert',
        tippingCustom: '15-20% Trinkgeld ist üblich für guten Service'
      },
      'ja': {
        breakfast: '朝食',
        lunch: '昼食',
        dinner: '夕食',
        paymentMethods: 'クレジットカード、現金、モバイル決済が利用可能',
        tippingCustom: '良いサービスには15-20%のチップが慣例です'
      }
    };

    return mealData[language] || mealData['en'];
  }

  private getRestaurantTemplates(cityName: string, countryName: string, language: string, dayIndex: number): any {
    const templates = this.getRestaurantTranslations(language);

    return {
      breakfast: {
        name: `${templates.cafePrefix} ${cityName}`,
        location: `${templates.cityCenter}, ${cityName}`,
        description: `${templates.breakfastDesc1} ${cityName}. ${templates.breakfastDesc2}`,
        specialties: templates.breakfastSpecialties,
        recommendation: `${templates.breakfastRec1} ${cityName} ${templates.breakfastRec2}`,
        culturalContext: `${templates.breakfastCulture1} ${countryName}. ${templates.breakfastCulture2}`,
        website: `https://www.${cityName.toLowerCase().replace(/\s+/g, '')}-cafe.com`,
        reviewLink: `https://www.tripadvisor.com/Restaurant_Review-${cityName.replace(/\s+/g, '_')}-cafe`,
        openingHours: templates.breakfastHours,
        distanceFromActivity: templates.breakfastDistance
      },
      lunch: {
        name: `${templates.restaurantPrefix} ${cityName}`,
        location: `${templates.touristArea}, ${cityName}`,
        description: `${templates.lunchDesc1} ${countryName} ${templates.lunchDesc2}`,
        specialties: templates.lunchSpecialties,
        recommendation: `${templates.lunchRec1} ${cityName}. ${templates.lunchRec2}`,
        culturalContext: `${templates.lunchCulture1} ${countryName}. ${templates.lunchCulture2}`,
        website: `https://www.${cityName.toLowerCase().replace(/\s+/g, '')}-restaurant.com`,
        reviewLink: `https://www.tripadvisor.com/Restaurant_Review-${cityName.replace(/\s+/g, '_')}-restaurant`,
        openingHours: templates.lunchHours,
        distanceFromActivity: templates.lunchDistance
      },
      dinner: {
        name: `${templates.finePrefix} ${cityName}`,
        location: `${templates.diningDistrict}, ${cityName}`,
        description: `${templates.dinnerDesc1} ${countryName} ${templates.dinnerDesc2}`,
        specialties: templates.dinnerSpecialties,
        recommendation: `${templates.dinnerRec1} ${cityName}. ${templates.dinnerRec2}`,
        culturalContext: `${templates.dinnerCulture1} ${countryName}. ${templates.dinnerCulture2}`,
        website: `https://www.${cityName.toLowerCase().replace(/\s+/g, '')}-finedining.com`,
        reviewLink: `https://www.tripadvisor.com/Restaurant_Review-${cityName.replace(/\s+/g, '_')}-finedining`,
        openingHours: templates.dinnerHours,
        distanceFromActivity: templates.dinnerDistance
      }
    };
  }

  private getRestaurantTranslations(language: string): Record<string, any> {
    // Simplified translations to avoid memory issues
    if (language === 'ko') {
      return {
        cafePrefix: '모닝 브루 카페',
        restaurantPrefix: '로컬 플레이버스',
        finePrefix: '헤리티지 레스토랑',
        cityCenter: '시내 중심가',
        touristArea: '역사 지구',
        diningDistrict: '레스토랑 거리',
        breakfastDesc1: '중심가에 위치한 매력적인 현지 카페',
        breakfastDesc2: '신선한 페이스트리, 장인 커피, 전통 조식으로 유명합니다.',
        breakfastSpecialties: ['신선한 크루아상', '현지 커피 블렌드', '전통 조식 플래터'],
        breakfastRec1: '에서 정통 현지 맛으로 하루를 시작하기에 완벽한 곳',
        breakfastRec2: '. 현지인과 방문객 모두에게 인기가 있습니다.',
        breakfastCulture1: '조식은 중요한 식사입니다',
        breakfastCulture2: '현지인들은 보통 오전 7-9시 사이에 식사하며 모닝 커피를 천천히 즐깁니다.',
        breakfastHours: '오전 7:00 - 오전 11:00',
        breakfastDistance: '오전 활동에서 도보 2분',
        lunchDesc1: '전통적인 정통 레스토랑',
        lunchDesc2: '요리를 현대적인 프레젠테이션과 신선한 현지 재료로 제공합니다.',
        lunchSpecialties: ['지역 특선 요리', '신선한 계절 샐러드', '현지 와인 셀렉션'],
        lunchRec1: '정통 현지 요리와 훌륭한 서비스로 높은 평가를 받는 곳',
        lunchRec2: '주요 명소 근처의 좋은 위치.',
        lunchCulture1: '점심은 보통 오후 12-2시 사이에 제공됩니다',
        lunchCulture2: '식사와 대화를 천천히 즐기는 것이 일반적입니다.',
        lunchHours: '오후 12:00 - 오후 3:00',
        lunchDistance: '오후 명소 근처에 위치',
        dinnerDesc1: '세련된 고급 레스토랑',
        dinnerDesc2: '요리를 우아한 분위기와 뛰어난 서비스로 제공합니다.',
        dinnerSpecialties: ['셰프 테이스팅 메뉴', '프리미엄 현지 재료', '광범위한 와인 리스트'],
        dinnerRec1: '뛰어난 식사 경험과 정통 맛으로 유명한 곳',
        dinnerRec2: '예약을 강력히 권장합니다.',
        dinnerCulture1: '저녁 식사는 보통 늦은 저녁에 제공됩니다',
        dinnerCulture2: '좋은 동반자와 천천히 즐기는 사교적인 행사입니다.',
        dinnerHours: '오후 6:00 - 오후 10:30',
        dinnerDistance: '호텔 지역에서 쉽게 접근 가능'
      };
    }

    // Default English translations
    return {
      cafePrefix: 'Morning Brew Cafe',
      restaurantPrefix: 'Local Flavors',
      finePrefix: 'Heritage Restaurant',
      cityCenter: 'City Center',
      touristArea: 'Historic District',
      diningDistrict: 'Restaurant Quarter',
      breakfastDesc1: 'A charming local cafe in the heart of',
      breakfastDesc2: 'Known for fresh pastries, artisanal coffee, and traditional breakfast dishes.',
      breakfastSpecialties: ['Fresh croissants', 'Local coffee blend', 'Traditional breakfast platter'],
      breakfastRec1: 'Perfect for starting your day with authentic local flavors in',
      breakfastRec2: '. Popular with both locals and visitors.',
      breakfastCulture1: 'Breakfast is an important meal in',
      breakfastCulture2: 'Locals typically eat between 7-9 AM and enjoy taking time to savor their morning coffee.',
      breakfastHours: '7:00 AM - 11:00 AM',
      breakfastDistance: '2-minute walk from morning activities',
      lunchDesc1: 'Authentic restaurant serving traditional',
      lunchDesc2: 'cuisine with modern presentation and fresh local ingredients.',
      lunchSpecialties: ['Regional specialty dish', 'Fresh seasonal salad', 'Local wine selection'],
      lunchRec1: 'Highly rated for authentic local cuisine and excellent service in',
      lunchRec2: 'Great location near major attractions.',
      lunchCulture1: 'Lunch is typically served between 12-2 PM in',
      lunchCulture2: 'It\'s common to take time to enjoy your meal and conversation.',
      lunchHours: '12:00 PM - 3:00 PM',
      lunchDistance: 'Located near afternoon attractions',
      dinnerDesc1: 'Upscale restaurant featuring refined',
      dinnerDesc2: 'cuisine with an elegant atmosphere and exceptional service.',
      dinnerSpecialties: ['Chef\'s tasting menu', 'Premium local ingredients', 'Extensive wine list'],
      dinnerRec1: 'Renowned for exceptional dining experience and authentic flavors of',
      dinnerRec2: 'Reservations highly recommended.',
      dinnerCulture1: 'Dinner is typically served later in the evening in',
      dinnerCulture2: 'It\'s a social occasion meant to be enjoyed slowly with good company.',
      dinnerHours: '6:00 PM - 10:30 PM',
      dinnerDistance: 'Easy access from hotel area'
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

  private getLanguageName(languageCode: string): string {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish (Español)',
      'fr': 'French (Français)',
      'de': 'German (Deutsch)',
      'ja': 'Japanese (日本語)',
      'ko': 'Korean (한국어)',
    };
    return languageNames[languageCode] || 'English';
  }

  private getCulturalContext(languageCode: string, destination: string): string {
    const culturalContexts: Record<string, string> = {
      'en': `
- Focus on practical information and efficiency
- Include accessibility information where relevant
- Mention English-speaking services and international chains
- Provide tips for English speakers traveling abroad
- Include information about tipping customs and social etiquette`,

      'es': `
- Enfoque en experiencias culturales auténticas y vida local
- Incluir información sobre horarios de siesta y comidas tardías
- Mencionar servicios en español y comunidades hispanohablantes
- Proporcionar consejos sobre costumbres sociales y familiares
- Incluir información sobre festivales y tradiciones locales`,

      'fr': `
- Mettre l'accent sur la gastronomie, l'art et la culture
- Inclure des informations sur l'étiquette française et les bonnes manières
- Mentionner les services francophones et les quartiers français
- Fournir des conseils sur les heures de repas et les traditions culinaires
- Inclure des informations sur l'art, l'architecture et l'histoire`,

      'de': `
- Fokus auf Effizienz, Pünktlichkeit und gründliche Planung
- Informationen über deutsche Gemeinschaften und deutschsprachige Services
- Tipps zu deutschen Reisegewohnheiten und Erwartungen
- Informationen über Umweltfreundlichkeit und Nachhaltigkeit
- Praktische Informationen über öffentliche Verkehrsmittel`,

      'ja': `
- 日本人旅行者向けの文化的配慮と礼儀作法
- 日本語サービスと日本人コミュニティの情報
- 清潔さ、安全性、サービス品質に関する情報
- 日本の旅行習慣と期待に合わせた提案
- 写真撮影のマナーと文化的感受性についてのアドバイス`,

      'ko': `
- 한국인 여행자를 위한 문화적 배려와 예의
- 한국어 서비스와 한국인 커뮤니티 정보
- 청결함, 안전성, 서비스 품질에 대한 정보
- 한국의 여행 습관과 기대에 맞춘 제안
- 사진 촬영 매너와 문화적 민감성에 대한 조언
- 한국 음식 문화와 식사 예절에 대한 안내
- 효율적이고 계획적인 여행 스타일 선호 반영`,
    };

    return culturalContexts[languageCode] || culturalContexts['en'];
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
    language?: string;
    locale?: string;
  }): Promise<TravelItinerary> {

    // Import services dynamically to avoid circular dependencies
    const { webScrapingService } = await import('./webScraper');
    const { youtubeService } = await import('./youtubeService');
    const { imageService } = await import('./imageService');

    try {
      const language = input.language || 'en';
      let webData: any[] = [];
      let youtubeData: any[] = [];

      // Step 1: Gather web information (with language context) - with fallback
      try {
        webData = await webScrapingService.scrapeDestinationInfo(input.destination, language);
        console.log(`✅ Web scraping completed: ${webData.length} results found for ${input.destination}`);
      } catch (webError) {
        console.warn('Web scraping failed, continuing without web data:', webError);
        webData = [];
      }

      // Step 2: Get YouTube videos (with language context) - with fallback
      try {
        youtubeData = await youtubeService.searchTravelVideos(input.destination, language);
        console.log(`✅ YouTube search completed: ${youtubeData.length} videos found for ${input.destination}`);
      } catch (youtubeError) {
        console.warn('YouTube search failed, continuing without video data:', youtubeError);
        youtubeData = [];
      }

      // Step 3: Generate itinerary with AI (this now has its own fallback)
      console.log(`🤖 Generating AI itinerary for ${input.destination} in ${language} with ${webData.length} web sources and ${youtubeData.length} videos`);
      const itinerary = await aiService.generateItinerary({
        ...input,
        webData,
        youtubeData,
        language,
        locale: input.locale,
      });
      console.log(`✅ AI itinerary generation completed for ${input.destination}`);

      // Step 4: Add images to attractions and activities - with fallback
      let enhancedItinerary;
      try {
        enhancedItinerary = await this.enhanceWithImages(itinerary);
      } catch (imageError) {
        console.warn('Image enhancement failed, returning itinerary without images:', imageError);
        enhancedItinerary = itinerary;
      }

      return enhancedItinerary;
    } catch (error) {
      console.error('Error in travel planner service:', error);

      // Create a basic fallback itinerary if everything fails
      const destination = {
        name: input.destination.split(',')[0]?.trim() || input.destination,
        country: input.destination.split(',')[1]?.trim() || 'Unknown',
      };

      const fallbackItinerary = aiService.generateItinerary({
        ...input,
        webData: [],
        youtubeData: [],
        language: input.language || 'en',
        locale: input.locale,
      });

      return fallbackItinerary;
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
