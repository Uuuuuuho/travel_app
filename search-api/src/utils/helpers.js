const NodeCache = require('node-cache');

// Simple in-memory cache with 5-minute default TTL
const cache = new NodeCache({ stdTTL: 300 });

function buildSearchUrl(engine, query) {
  const q = encodeURIComponent(query);
  switch (engine) {
    case 'google':
      return `https://www.google.com/search?q=${q}&hl=ko`;
    case 'naver':
      return `https://search.naver.com/search.naver?query=${q}`;
    case 'bing':
      return `https://www.bing.com/search?q=${q}`;
    default:
      throw new Error(`Unknown engine: ${engine}`);
  }
}

function truncate(text = '', max = 300) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

module.exports = {
  buildSearchUrl,
  truncate,
  sleep,
  cache,
}; 