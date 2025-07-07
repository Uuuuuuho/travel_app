// Simple test script to verify services are working
const { webScrapingService } = require('./src/services/webScraper.ts');
const { youtubeService } = require('./src/services/youtubeService.ts');

async function testServices() {
  console.log('🧪 Testing TravelCraft Services...\n');

  // Test web scraping
  console.log('📰 Testing Web Scraping Service...');
  try {
    const webResults = await webScrapingService.scrapeDestinationInfo('Paris, France', 'en');
    console.log(`✅ Web scraping: ${webResults.length} results`);
    if (webResults.length > 0) {
      console.log(`   Sample: ${webResults[0].title}`);
    }
  } catch (error) {
    console.log(`❌ Web scraping error: ${error.message}`);
  }

  console.log('');

  // Test YouTube service
  console.log('🎥 Testing YouTube Service...');
  try {
    const videoResults = await youtubeService.searchTravelVideos('Paris, France', 'en');
    console.log(`✅ YouTube search: ${videoResults.length} videos`);
    if (videoResults.length > 0) {
      console.log(`   Sample: ${videoResults[0].title}`);
    }
  } catch (error) {
    console.log(`❌ YouTube error: ${error.message}`);
  }

  console.log('\n🎉 Service testing completed!');
}

testServices().catch(console.error);
