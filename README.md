# TravelCraft - AI-Powered Travel Itinerary Generator

TravelCraft is a comprehensive travel planning application that uses artificial intelligence to create personalized travel itineraries. The app gathers information from web sources, YouTube travel videos, and uses AI to generate detailed day-by-day travel plans tailored to your preferences and budget.

## Features

- **AI-Powered Itinerary Generation**: Uses OpenAI's GPT models to create detailed travel plans
- **Multilingual Support**: Full internationalization with 6 languages (English, Spanish, French, German, Japanese, Korean)
- **Cultural Adaptation**: AI generates culturally relevant content for each language
- **Web Scraping**: Automatically gathers travel information from various travel websites and blogs
- **YouTube Integration**: Analyzes travel videos and vlogs for local insights and recommendations
- **Image Search**: Fetches relevant destination images from Unsplash and Google Images
- **Budget Planning**: Provides cost breakdowns and budget-appropriate recommendations with local currency formatting
- **Interactive UI**: Clean, modern interface with day-by-day itinerary display
- **Export Functionality**: Save and export itineraries in various formats
- **Local Storage**: Save your favorite itineraries locally
- **Localized Search**: Web scraping and YouTube searches performed in user's selected language

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
```bash
cp .env.example .env.local
```
Then edit `.env.local` and add your API keys.

**Quick start**: At minimum, add your OpenAI API key:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

> 📋 **Need detailed setup help?** See [SETUP.md](SETUP.md) for complete API configuration instructions and troubleshooting.

## API Configuration

For detailed API setup instructions, see [SETUP.md](SETUP.md).

**Quick reference**:
- **OpenAI API** (Required): [Get key here](https://platform.openai.com/)
- **YouTube Data API** (Optional): [Google Cloud Console](https://console.cloud.google.com/)
- **Google Search API** (Optional): [Google Cloud Console](https://console.cloud.google.com/)
- **Unsplash API** (Optional): [Unsplash Developers](https://unsplash.com/developers)

> ⚠️ **Note**: The app works with just OpenAI API key. Other services enhance functionality but aren't required.

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

1. **Select Language**: Choose your preferred language from the language selector in the header
2. **Enter Destination**: Type your desired travel destination (e.g., "Paris, France")
3. **Set Preferences**: Choose duration, number of travelers, budget level, and interests
4. **Generate Itinerary**: Click "Create My Itinerary" and wait for AI to process
5. **Review Results**: Browse your personalized day-by-day itinerary in your selected language
6. **Export/Share**: Save or share your itinerary using the provided options

### Language Support

The application automatically:
- Translates all UI elements to your selected language
- Generates AI content in your chosen language with cultural context
- Searches for travel information in your target language
- Formats dates, currencies, and numbers according to your locale
- Provides culturally relevant recommendations

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

## Internationalization

TravelCraft supports multiple languages with comprehensive localization:

### Supported Languages
- **English (en)** - Default
- **Spanish (es)** - Español
- **French (fr)** - Français
- **German (de)** - Deutsch
- **Japanese (ja)** - 日本語
- **Korean (ko)** - 한국어

### Features
- Complete UI translation
- AI-generated content in user's language
- Cultural context adaptation
- Localized date/currency formatting
- Language-specific web scraping
- Regional YouTube content

### Adding New Languages
See [docs/INTERNATIONALIZATION.md](docs/INTERNATIONALIZATION.md) for detailed instructions on adding new languages.

## Testing

Run the test suite:
```bash
npm test
# or
yarn test
# or
pnpm test
```

Test specific features:
```bash
# Test internationalization
npm test i18n.test.ts

# Test services
npm test services.test.ts
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
