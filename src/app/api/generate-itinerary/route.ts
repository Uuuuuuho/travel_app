import { NextRequest, NextResponse } from 'next/server';
import { travelPlannerService } from '@/services/aiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const { destination, duration, travelers, budget, interests, language, locale } = body;
    
    if (!destination || !duration || !travelers || !budget || !interests) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (duration < 1 || duration > 30) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 30 days' },
        { status: 400 }
      );
    }

    if (travelers < 1 || travelers > 20) {
      return NextResponse.json(
        { error: 'Number of travelers must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (!['budget', 'mid-range', 'luxury'].includes(budget)) {
      return NextResponse.json(
        { error: 'Invalid budget level' },
        { status: 400 }
      );
    }

    if (!Array.isArray(interests) || interests.length === 0) {
      return NextResponse.json(
        { error: 'At least one interest must be selected' },
        { status: 400 }
      );
    }

    // Generate the itinerary
    try {
      const itinerary = await travelPlannerService.generateCompleteItinerary({
        destination,
        duration,
        travelers,
        budget,
        interests,
        language: language || 'en',
        locale: locale || 'en-US',
      });

      return NextResponse.json(itinerary);
    } catch (generationError) {
      console.error('Error generating itinerary:', generationError);

      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to generate itinerary. Please try again.';

      if (generationError instanceof Error) {
        if (generationError.message.includes('API key')) {
          errorMessage = 'AI service is temporarily unavailable. Please try again later.';
        } else if (generationError.message.includes('rate limit')) {
          errorMessage = 'Service is busy. Please wait a moment and try again.';
        } else if (generationError.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }

      const errorDetails =
        process.env.NODE_ENV === 'development'
          ? (generationError instanceof Error ? generationError.message : String(generationError))
          : undefined;

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in API route:', error);

    const unexpectedDetails =
      process.env.NODE_ENV === 'development'
        ? (error instanceof Error ? error.message : String(error))
        : undefined;

    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        details: unexpectedDetails,
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
