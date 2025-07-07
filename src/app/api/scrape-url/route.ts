import { NextRequest, NextResponse } from 'next/server';
import { webScrapingService } from '@/services/webScraper';
import { llmService } from '@/services/llmService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Check if LLM service is available
    if (!llmService.isAvailable()) {
      return NextResponse.json({ 
        error: 'LLM service is not available. Please check your configuration.' 
      }, { status: 503 });
    }

    console.log(`Starting scrape for URL: ${url}`);
    const result = await webScrapingService.scrapeUrl(url);

    if (!result) {
      return NextResponse.json({ 
        error: 'Failed to scrape the URL. The page might be inaccessible or the content could not be analyzed.' 
      }, { status: 500 });
    }

    console.log(`Successfully scraped URL: ${url}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Scrape URL API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 });
  }
}
