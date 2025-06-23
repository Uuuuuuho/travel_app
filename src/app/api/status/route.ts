import { NextResponse } from 'next/server';
import { getAppConfig, validateConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = getAppConfig();
    const validation = validateConfig();

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        openai: {
          available: config.openai.available,
          configured: !!config.openai.apiKey,
        },
        youtube: {
          available: config.youtube.available,
          configured: !!config.youtube.apiKey,
        },
        google: {
          available: config.google.available,
          configured: !!(config.google.searchApiKey && config.google.searchEngineId),
        },
        unsplash: {
          available: config.unsplash.available,
          configured: !!config.unsplash.accessKey,
        },
      },
      validation: {
        isValid: validation.isValid,
        missingServices: validation.missingServices,
        warnings: validation.warnings,
      },
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Error checking status:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to check service status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
