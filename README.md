# TravelCraft - AI-Powered Travel Itinerary Generator

TravelCraft is a comprehensive travel planning application that uses artificial intelligence to create personalized travel itineraries. The app gathers information from web sources, YouTube travel videos, and uses AI to generate detailed day-by-day travel plans tailored to your preferences and budget.

## Features

- **AI-Powered Itinerary Generation**: Uses OpenAI's GPT models to create detailed travel plans
- **Web Scraping**: Automatically gathers travel information from various travel websites and blogs
- **YouTube Integration**: Analyzes travel videos and vlogs for local insights and recommendations
- **Image Search**: Fetches relevant destination images from Unsplash and Google Images
- **Budget Planning**: Provides cost breakdowns and budget-appropriate recommendations
- **Interactive UI**: Clean, modern interface with day-by-day itinerary display
- **Export Functionality**: Save and export itineraries in various formats
- **Local Storage**: Save your favorite itineraries locally

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-4
- **APIs**: YouTube Data API, Google Custom Search API, Unsplash API
- **Web Scraping**: Cheerio, Puppeteer
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Prerequisites

- Node.js 18.18.0 or higher
- npm, yarn, or pnpm
- API keys for the following services:
  - OpenAI API
  - YouTube Data API
  - Google Custom Search API (optional)
  - Unsplash API (optional)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd travel_app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your API keys:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here

# Optional (for enhanced functionality)
GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

## Getting API Keys

### OpenAI API Key (Required)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env.local` file

### YouTube Data API Key (Required)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Copy the key to your `.env.local` file

### Google Custom Search API (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Custom Search API
3. Create an API key
4. Set up a Custom Search Engine at [Google CSE](https://cse.google.com/)
5. Copy both the API key and Search Engine ID to your `.env.local` file

### Unsplash API (Optional)
1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Create a new application
3. Copy the Access Key to your `.env.local` file

## Running the Application

1. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Enter Destination**: Type your desired travel destination (e.g., "Paris, France")
2. **Set Preferences**: Choose duration, number of travelers, budget level, and interests
3. **Generate Itinerary**: Click "Create My Itinerary" and wait for AI to process
4. **Review Results**: Browse your personalized day-by-day itinerary
5. **Export/Share**: Save or share your itinerary using the provided options

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── DestinationForm.tsx
│   ├── ItineraryDisplay.tsx
│   ├── Layout.tsx
│   └── LoadingProgress.tsx
├── hooks/                 # Custom React hooks
│   └── useItinerary.ts
├── services/              # Business logic and API integrations
│   ├── aiService.ts       # OpenAI integration
│   ├── imageService.ts    # Image search functionality
│   ├── webScraper.ts      # Web scraping service
│   └── youtubeService.ts  # YouTube API integration
├── types/                 # TypeScript type definitions
│   └── index.ts
└── __tests__/             # Test files
    └── services.test.ts
```

## API Endpoints

- `POST /api/generate-itinerary` - Generate a new travel itinerary

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

Run the test suite:
```bash
npm test
# or
yarn test
# or
pnpm test
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The app can be deployed to any platform that supports Next.js applications:
- Netlify
- Railway
- Heroku
- AWS
- Google Cloud Platform

## Limitations

- Requires valid API keys for full functionality
- Web scraping may be limited by target site policies
- Rate limits apply to external APIs
- Some features may not work without optional API keys

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the development team.
