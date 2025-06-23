// Test script to check if real APIs are working
const axios = require('axios');

async function testGoogleSearch() {
  console.log('🔍 Testing Google Custom Search API...\n');
  
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    console.log('❌ Google Search API not configured');
    console.log('   Missing: GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID');
    console.log('   Status: Using MOCK data\n');
    return false;
  }
  
  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: searchEngineId,
        q: 'Paris France travel guide',
        num: 3
      }
    });
    
    console.log('✅ Google Search API working!');
    console.log(`   Found ${response.data.items?.length || 0} real results`);
    if (response.data.items?.[0]) {
      console.log(`   Sample: ${response.data.items[0].title}`);
      console.log(`   URL: ${response.data.items[0].link}`);
    }
    console.log('   Status: Using REAL web data\n');
    return true;
  } catch (error) {
    console.log('❌ Google Search API error:', error.response?.data?.error?.message || error.message);
    console.log('   Status: Using MOCK data\n');
    return false;
  }
}

async function testYouTubeAPI() {
  console.log('🎥 Testing YouTube Data API...\n');
  
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.log('❌ YouTube API not configured');
    console.log('   Missing: YOUTUBE_API_KEY');
    console.log('   Status: Using MOCK video data\n');
    return false;
  }
  
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        key: apiKey,
        part: 'snippet',
        q: 'Paris travel guide',
        type: 'video',
        maxResults: 3
      }
    });
    
    console.log('✅ YouTube API working!');
    console.log(`   Found ${response.data.items?.length || 0} real videos`);
    if (response.data.items?.[0]) {
      console.log(`   Sample: ${response.data.items[0].snippet.title}`);
      console.log(`   Channel: ${response.data.items[0].snippet.channelTitle}`);
    }
    console.log('   Status: Using REAL video data\n');
    return true;
  } catch (error) {
    console.log('❌ YouTube API error:', error.response?.data?.error?.message || error.message);
    console.log('   Status: Using MOCK video data\n');
    return false;
  }
}

async function testOpenAI() {
  console.log('🤖 Testing OpenAI API...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OpenAI API not configured');
    console.log('   Missing: OPENAI_API_KEY');
    console.log('   Status: Using FALLBACK itineraries\n');
    return false;
  }
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "API test successful"' }],
      max_tokens: 10
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ OpenAI API working!');
    console.log(`   Response: ${response.data.choices[0].message.content}`);
    console.log('   Status: Using REAL AI generation\n');
    return true;
  } catch (error) {
    console.log('❌ OpenAI API error:', error.response?.data?.error?.message || error.message);
    console.log('   Status: Using FALLBACK itineraries\n');
    return false;
  }
}

async function runTests() {
  console.log('🧪 TravelCraft API Configuration Test\n');
  console.log('=' .repeat(50));
  
  const googleWorking = await testGoogleSearch();
  const youtubeWorking = await testYouTubeAPI();
  const openaiWorking = await testOpenAI();
  
  console.log('📊 SUMMARY:');
  console.log('=' .repeat(50));
  console.log(`Google Search: ${googleWorking ? '✅ REAL DATA' : '❌ MOCK DATA'}`);
  console.log(`YouTube Search: ${youtubeWorking ? '✅ REAL DATA' : '❌ MOCK DATA'}`);
  console.log(`OpenAI Generation: ${openaiWorking ? '✅ REAL AI' : '❌ FALLBACK'}`);
  
  if (!googleWorking && !youtubeWorking && !openaiWorking) {
    console.log('\n⚠️  ALL APIS MISSING - App will use mock/fallback data only');
    console.log('   Restaurants and references will be placeholder/fake');
  } else if (!googleWorking || !youtubeWorking) {
    console.log('\n⚠️  PARTIAL CONFIGURATION - Some data will be mock/fallback');
  } else {
    console.log('\n🎉 FULL CONFIGURATION - All data will be real!');
  }
  
  console.log('\n📋 To fix missing APIs:');
  console.log('1. Copy .env.example to .env.local');
  console.log('2. Add your API keys to .env.local');
  console.log('3. Restart the development server');
  console.log('4. See SETUP.md for detailed instructions');
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

runTests().catch(console.error);
