// Configuration validation and utilities

export interface AppConfig {
  openai: {
    apiKey: string | undefined;
    available: boolean;
  };
  youtube: {
    apiKey: string | undefined;
    available: boolean;
  };
  google: {
    searchApiKey: string | undefined;
    searchEngineId: string | undefined;
    available: boolean;
  };
  unsplash: {
    accessKey: string | undefined;
    available: boolean;
  };
}

export function getAppConfig(): AppConfig {
  return {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      available: !!process.env.OPENAI_API_KEY,
    },
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY,
      available: !!process.env.YOUTUBE_API_KEY,
    },
    google: {
      searchApiKey: process.env.GOOGLE_SEARCH_API_KEY,
      searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
      available: !!(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID),
    },
    unsplash: {
      accessKey: process.env.UNSPLASH_ACCESS_KEY,
      available: !!process.env.UNSPLASH_ACCESS_KEY,
    },
  };
}

export function validateConfig(): { isValid: boolean; missingServices: string[]; warnings: string[] } {
  const config = getAppConfig();
  const missingServices: string[] = [];
  const warnings: string[] = [];

  // Critical services
  if (!config.openai.available) {
    missingServices.push('OpenAI API (required for AI-generated itineraries)');
  }

  // Optional services
  if (!config.youtube.available) {
    warnings.push('YouTube API not configured - video insights will be limited');
  }

  if (!config.google.available) {
    warnings.push('Google Search API not configured - web scraping will be limited');
  }

  if (!config.unsplash.available) {
    warnings.push('Unsplash API not configured - image search will be limited');
  }

  return {
    isValid: missingServices.length === 0,
    missingServices,
    warnings,
  };
}

export function logConfigStatus(): void {
  const validation = validateConfig();
  
  if (validation.isValid) {
    console.log('✅ All required services are configured');
  } else {
    console.error('❌ Missing required configuration:');
    validation.missingServices.forEach(service => {
      console.error(`  - ${service}`);
    });
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Optional services not configured:');
    validation.warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
  }

  console.log('\n📝 To configure missing services:');
  console.log('1. Copy .env.example to .env.local');
  console.log('2. Add your API keys to .env.local');
  console.log('3. Restart the development server');
}
