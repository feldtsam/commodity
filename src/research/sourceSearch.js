import axios from 'axios';

const BRAVE_NEWS_URL = 'https://api.search.brave.com/res/v1/news/search';

export async function searchBrave(query, options = {}) {
  const { count = 5, freshness = 'pd' } = options;

  if (!process.env.BRAVE_SEARCH_API_KEY) {
    throw new Error('BRAVE_SEARCH_API_KEY not found in .env — see .env.example');
  }

  try {
    const response = await axios.get(BRAVE_NEWS_URL, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY
      },
      params: { q: query, count, freshness, search_lang: 'en', country: 'us' },
      timeout: 12000
    });

    return (response.data?.results || []).map(r => ({
      title: r.title || '',
      description: r.description || '',
      url: r.url || '',
      source: r.source || extractDomain(r.url),
      age: r.age || 'recent',
      snippet: (r.extra_snippets || []).join(' ')
    }));
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn(`    ⚠ Rate limited: "${query}" — skipping`);
      return [];
    }
    if (err.response?.status === 401) {
      throw new Error('Invalid BRAVE_SEARCH_API_KEY — check your .env file');
    }
    console.warn(`    ⚠ Search failed for "${query}": ${err.message}`);
    return [];
  }
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return 'unknown'; }
}
