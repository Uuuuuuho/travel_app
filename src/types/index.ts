export interface Destination {
  name: string;
  country: string;
  region?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TravelInfo {
  attractions: Attraction[];
  activities: Activity[];
  transportation: TransportationOption[];
  accommodation: AccommodationSuggestion[];
  localTips: string[];
  bestTimeToVisit: string;
  budget: BudgetInfo;
}

export interface Attraction {
  name: string;
  description: string;
  category: string;
  rating?: number;
  estimatedDuration: string;
  entryFee?: string;
  location: string;
  images?: string[];
  tips?: string[];
}

export interface Activity {
  name: string;
  description: string;
  category: string;
  duration: string;
  difficulty?: 'Easy' | 'Moderate' | 'Hard';
  cost?: string;
  bestTime?: string;
  location: string;
}

export interface TransportationOption {
  type: 'Flight' | 'Train' | 'Bus' | 'Car' | 'Local Transport';
  description: string;
  estimatedCost?: string;
  duration?: string;
  tips?: string[];
}

export interface AccommodationSuggestion {
  type: 'Hotel' | 'Hostel' | 'Airbnb' | 'Resort' | 'Guesthouse';
  name?: string;
  area: string;
  priceRange: string;
  description: string;
  amenities?: string[];
}

export interface BudgetInfo {
  daily: {
    budget: string;
    midRange: string;
    luxury: string;
  };
  breakdown: {
    accommodation: string;
    food: string;
    transportation: string;
    activities: string;
  };
}

export interface DailyItinerary {
  day: number;
  title: string;
  activities: ItineraryActivity[];
  meals: MealSuggestion[];
  transportation?: string;
  notes?: string[];
}

export interface ItineraryActivity {
  time: string;
  activity: string;
  location: string;
  duration: string;
  description?: string;
  cost?: string;
}

export interface MealSuggestion {
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  suggestion: string;
  location?: string;
  cost?: string;
  priceRange?: string;
  name?: string;
  description?: string;
  specialties?: string[];
  recommendation?: string;
  culturalContext?: string;
  website?: string;
  reviewLink?: string;
  openingHours?: string;
  reservationNeeded?: boolean;
  distanceFromActivity?: string;
  [key: string]: unknown;
}

export interface TravelItinerary {
  destination: Destination;
  duration: number; // days
  travelInfo: TravelInfo;
  dailyItineraries: DailyItinerary[];
  generatedAt: Date;
  sources: string[];
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  viewCount?: string;
  duration?: string;
}

export interface WebScrapingResult {
  url: string;
  title: string;
  content: string;
  relevanceScore: number;
  scrapedAt: Date;
}

export interface ImageResult {
  url: string;
  alt: string;
  source: string;
  width?: number;
  height?: number;
}

export interface GenerationProgress {
  step: string;
  progress: number;
  message: string;
  isComplete: boolean;
}
