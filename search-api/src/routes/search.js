const express = require('express');
const router = express.Router();
const scraper = require('../services/scraper');
const parser = require('../services/parser');
const { buildSearchUrl, cache } = require('../utils/helpers');

/**
 * GET /search?q=keyword
 */
router.get('/', async (req, res) => {
  const query = (req.query.q || '').toString().trim();
  if (!query) {
    return res.status(400).json({ error: 'Missing q query parameter' });
  }

  // Check cache first
  if (cache.has(query)) {
    return res.json(cache.get(query));
  }

  try {
    // Define target sites
    const targets = [
      {
        name: 'google.com',
        url: buildSearchUrl('google', query),
      },
      {
        name: 'naver.com',
        url: buildSearchUrl('naver', query),
      },
      {
        name: 'bing.com',
        url: buildSearchUrl('bing', query),
      },
    ];

    const aggregatedResults = [];

    // Fetch + parse each site sequentially (could be Promise.all for speed)
    for (const target of targets) {
      const html = await scraper.fetchHtml(target.url);
      const parsed = parser.parse(target.name, html).map((item) => ({ ...item, site: target.name }));
      aggregatedResults.push(...parsed);
    }

    // Limit to top 10
    const results = aggregatedResults.slice(0, 10);

    // Cache for 5 minutes
    cache.set(query, results);

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

module.exports = router; 