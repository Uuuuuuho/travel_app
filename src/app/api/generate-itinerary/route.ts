import { NextRequest, NextResponse } from 'next/server';
import { travelPlannerService } from '@/services/aiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const { destination, duration, travelers, budget, interests } = body;
    
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
    const itinerary = await travelPlannerService.generateCompleteItinerary({
      destination,
      duration,
      travelers,
      budget,
      interests,
    });

    return NextResponse.json(itinerary);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate itinerary. Please try again.' },
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
