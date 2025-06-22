'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import DestinationForm from '@/components/DestinationForm';
import LoadingProgress from '@/components/LoadingProgress';
import ItineraryDisplay from '@/components/ItineraryDisplay';
import { TravelItinerary } from '@/types';

type FormData = {
  destination: string;
  duration: number;
  travelers: number;
  budget: 'budget' | 'mid-range' | 'luxury';
  interests: string[];
};

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [generatedItinerary, setGeneratedItinerary] = useState<TravelItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (data: FormData) => {
    setFormData(data);
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate itinerary');
      }

      const itinerary = await response.json();
      setGeneratedItinerary(itinerary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    setGeneratedItinerary(null);
    setFormData(null);
    setError(null);
  };

  return (
    <Layout>
      {isGenerating ? (
        <LoadingProgress />
      ) : generatedItinerary ? (
        <div className="space-y-6">
          <div className="text-center">
            <button
              onClick={handleStartOver}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Plan Another Trip
            </button>
          </div>
          <ItineraryDisplay itinerary={generatedItinerary} />
        </div>
      ) : error ? (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleStartOver}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center py-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Discover Your Next
              <span className="text-blue-600 block">Adventure</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Let AI create the perfect travel itinerary for you. Get personalized recommendations,
              local insights, and detailed day-by-day plans tailored to your interests and budget.
            </p>
          </div>

          {/* Destination Form */}
          <DestinationForm onSubmit={handleFormSubmit} isLoading={isGenerating} />

          {/* Features Section */}
          <div className="py-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Why Choose TravelCraft?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Planning</h3>
                <p className="text-gray-600">
                  Our advanced AI analyzes thousands of travel resources to create personalized itineraries just for you.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Local Insights</h3>
                <p className="text-gray-600">
                  Get insider tips and hidden gems from travel blogs, videos, and local recommendations.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Budget-Friendly</h3>
                <p className="text-gray-600">
                  Plans tailored to your budget with cost breakdowns and money-saving tips for every destination.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
