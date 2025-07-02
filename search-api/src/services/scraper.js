const axios = require('axios');
const { sleep } = require('../utils/helpers');

/**
 * Fetch HTML from a given URL with basic headers.
 * Retries up to 2 times on network failure.
 */
async function fetchHtml(url, retries = 2) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, { headers, timeout: 10_000 });
      return res.data;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(500 * (attempt + 1));
    }
  }
}

module.exports = {
  fetchHtml,
}; 