const cheerio = require('cheerio');
const { truncate } = require('../utils/helpers');

function parse(site, html) {
  const $ = cheerio.load(html);
  switch (site) {
    case 'google.com':
      return parseGoogle($);
    case 'naver.com':
      return parseNaver($);
    case 'bing.com':
      return parseBing($);
    default:
      return [];
  }
}

function parseGoogle($) {
  const results = [];
  $('div.g').each((i, el) => {
    const title = $(el).find('h3').text().trim();
    const url = $(el).find('a').attr('href');
    const snippet = $(el).find('span.aCOpRe').text().trim();
    if (title && url) {
      results.push({ title, snippet: truncate(snippet, 300), url });
    }
  });
  return results;
}

function parseNaver($) {
  const results = [];
  $('div.total_wrap').each((i, el) => {
    const aTag = $(el).find('a').first();
    const title = aTag.text().trim();
    const url = aTag.attr('href');
    const snippet = $(el).find('div.total_group').text().trim();
    if (title && url) {
      results.push({ title, snippet: truncate(snippet, 300), url });
    }
  });
  return results;
}

function parseBing($) {
  const results = [];
  $('li.b_algo').each((i, el) => {
    const title = $(el).find('h2').text().trim();
    const url = $(el).find('h2 a').attr('href');
    const snippet = $(el).find('p').text().trim();
    if (title && url) {
      results.push({ title, snippet: truncate(snippet, 300), url });
    }
  });
  return results;
}

module.exports = {
  parse,
}; 