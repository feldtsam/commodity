import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { searchBrave } from './sourceSearch.js';
import { getMockData } from './mockData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMODITIES = JSON.parse(readFileSync(path.join(__dirname, '../../config/commodities.json'), 'utf-8'));
const SOURCES_CFG = JSON.parse(readFileSync(path.join(__dirname, '../../config/sources.json'), 'utf-8'));

export async function gatherSignals(useMock = false) {
  if (useMock) {
    console.log('  Loading mock research data...');
    return getMockData();
  }

  const queries = buildQueryList();
  console.log(`  Running ${queries.length} research queries across ${COMMODITIES.commodities.length + COMMODITIES.themes.length} categories...`);

  const rawResults = await runBatched(queries, 5, SOURCES_CFG.searchDelayMs || 200);
  const results = deduplicate(rawResults);

  console.log(`  Found ${results.length} unique articles`);
  return results;
}

function buildQueryList() {
  const queries = [];

  for (const c of COMMODITIES.commodities) {
    const limit = c.priority === 1 ? 2 : 1;
    c.searchQueries.slice(0, limit).forEach(q =>
      queries.push({ query: q, category: c.name, id: c.id })
    );
  }

  for (const t of COMMODITIES.themes) {
    const limit = t.priority === 1 ? 2 : 1;
    t.searchQueries.slice(0, limit).forEach(q =>
      queries.push({ query: q, category: t.name, id: t.id })
    );
  }

  return queries;
}

async function runBatched(queries, batchSize, delayMs) {
  const all = [];
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async ({ query, category, id }) => {
        const hits = await searchBrave(query, {
          count: SOURCES_CFG.maxResultsPerQuery || 5,
          freshness: SOURCES_CFG.searchFreshness || 'pd'
        });
        return hits.map(h => ({ ...h, category, commodityId: id }));
      })
    );
    all.push(...results.flat());
    if (i + batchSize < queries.length && delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return all;
}

function deduplicate(results) {
  const seen = new Set();
  return results.filter(r => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}
