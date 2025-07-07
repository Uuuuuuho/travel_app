# TravelCraft Setup Guide

This guide will help you set up TravelCraft with the necessary API keys for full functionality.

## Quick Start (Minimum Setup)

TravelCraft can work with just the basic setup, but for the best experience, you'll want to configure the AI service.

### 1. Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your API keys (see sections below)

3. Restart the development server:
   ```bash
   npm run dev
   ```

## API Configuration

### Required Services

#### OpenAI API (Required for AI-generated itineraries)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add to `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

**Note**: Without OpenAI API, the app will use fallback itineraries with basic information.

### Optional Services (Enhance functionality)

#### YouTube Data API (For travel video insights)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add to `.env.local`:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

#### Google Custom Search API (For web scraping)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Custom Search API
3. Create credentials (API Key)
4. Set up a Custom Search Engine at [Google CSE](https://cse.google.com/)
5. Add to `.env.local`:
   ```
   GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
   ```

#### Unsplash API (For destination images)

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Create an account and new application
3. Get your Access Key
4. Add to `.env.local`:
   ```
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
   ```

## Checking Configuration

### Method 1: API Status Endpoint

Visit `http://localhost:3000/api/status` to see which services are configured.

### Method 2: Console Logs

Check the console when starting the development server for configuration warnings.

### Method 3: Test Generation

Try generating an itinerary. If services are missing, you'll see fallback content.

## Troubleshooting

### "Failed to generate itinerary" Error

This error can occur for several reasons:

1. **Missing OpenAI API Key**: The app will use fallback mode
2. **Invalid API Key**: Check your OpenAI API key is correct
3. **Rate Limits**: Wait a moment and try again
4. **Network Issues**: Check your internet connection

### Fallback Mode

If OpenAI API is not configured, the app will:
- Generate basic itineraries with common attractions
- Provide general travel tips
- Include standard budget information
- Work in all supported languages

### Service-Specific Issues

- **No YouTube videos**: YouTube API not configured
- **Limited web insights**: Google Search API not configured  
- **No images**: Unsplash API not configured

## Development vs Production

### Development
- Detailed error messages in API responses
- Configuration status logged to console
- All debugging information available

### Production
- Error messages are user-friendly
- Sensitive information is hidden
- Graceful fallbacks for all services

## Cost Considerations

### OpenAI API
- Pay-per-use model
- Typical itinerary costs $0.01-0.05
- Set usage limits in OpenAI dashboard

### YouTube Data API
- Free tier: 10,000 units/day
- Each search uses ~100 units
- Usually sufficient for development

### Google Custom Search API
- Free tier: 100 searches/day
- Additional searches cost $5/1000
- Consider caching for production

### Unsplash API
- Free tier: 50 requests/hour
- Usually sufficient for most use cases

## Security Notes

1. **Never commit API keys** to version control
2. **Use `.env.local`** for local development
3. **Set up environment variables** in production deployment
4. **Rotate keys regularly** for security
5. **Monitor usage** to prevent unexpected charges

## Getting Help

If you encounter issues:

1. Check the console for error messages
2. Visit `/api/status` to verify configuration
3. Ensure all required environment variables are set
4. Restart the development server after changes
5. Check API key permissions and quotas

## Minimal Working Setup

For a basic working version:

```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

This will give you:
- AI-generated itineraries in all languages
- Basic functionality without external data
- Fallback content for missing services
