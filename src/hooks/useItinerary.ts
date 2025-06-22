import { useState, useCallback } from 'react';
import { TravelItinerary } from '@/types';

interface UseItineraryReturn {
  itineraries: TravelItinerary[];
  currentItinerary: TravelItinerary | null;
  isLoading: boolean;
  error: string | null;
  saveItinerary: (itinerary: TravelItinerary) => void;
  loadItinerary: (id: string) => TravelItinerary | null;
  deleteItinerary: (id: string) => void;
  clearError: () => void;
}

export function useItinerary(): UseItineraryReturn {
  const [itineraries, setItineraries] = useState<TravelItinerary[]>([]);
  const [currentItinerary, setCurrentItinerary] = useState<TravelItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveItinerary = useCallback((itinerary: TravelItinerary) => {
    try {
      // Add a unique ID if not present
      const itineraryWithId = {
        ...itinerary,
        id: itinerary.id || generateId(),
      };

      // Save to localStorage
      const saved = JSON.parse(localStorage.getItem('travel-itineraries') || '[]');
      const existingIndex = saved.findIndex((item: any) => item.id === itineraryWithId.id);
      
      if (existingIndex >= 0) {
        saved[existingIndex] = itineraryWithId;
      } else {
        saved.push(itineraryWithId);
      }
      
      localStorage.setItem('travel-itineraries', JSON.stringify(saved));
      setItineraries(saved);
      setCurrentItinerary(itineraryWithId);
    } catch (err) {
      setError('Failed to save itinerary');
    }
  }, []);

  const loadItinerary = useCallback((id: string): TravelItinerary | null => {
    try {
      const saved = JSON.parse(localStorage.getItem('travel-itineraries') || '[]');
      const itinerary = saved.find((item: any) => item.id === id);
      
      if (itinerary) {
        setCurrentItinerary(itinerary);
        return itinerary;
      }
      
      return null;
    } catch (err) {
      setError('Failed to load itinerary');
      return null;
    }
  }, []);

  const deleteItinerary = useCallback((id: string) => {
    try {
      const saved = JSON.parse(localStorage.getItem('travel-itineraries') || '[]');
      const filtered = saved.filter((item: any) => item.id !== id);
      
      localStorage.setItem('travel-itineraries', JSON.stringify(filtered));
      setItineraries(filtered);
      
      if (currentItinerary?.id === id) {
        setCurrentItinerary(null);
      }
    } catch (err) {
      setError('Failed to delete itinerary');
    }
  }, [currentItinerary]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    itineraries,
    currentItinerary,
    isLoading,
    error,
    saveItinerary,
    loadItinerary,
    deleteItinerary,
    clearError,
  };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Add id to TravelItinerary type extension
declare module '@/types' {
  interface TravelItinerary {
    id?: string;
  }
}
