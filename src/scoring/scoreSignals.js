import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TONE = JSON.parse(readFileSync(path.join(__dirname, '../../config/tone.json'), 'utf-8'));

const MAX_ARTICLES = 50;
const MAX_DESC_CHARS = 220;
const MAX_SNIPPET_CHARS = 150;

export function buildResearchBrief(articles, date) {
  const trimmed = trimAndRank(articles);
  const grouped = groupByCategory(trimmed);

  const lines = [
    `RESEARCH DATE: ${date}`,
    `ARTICLES: ${trimmed.length} (of ${articles.length} gathered)`,
    '',
    '=== COMMODITY & THEME RESEARCH BRIEF ===',
    ''
  ];

  for (const [category, items] of Object.entries(grouped)) {
    lines.push(`--- ${category.toUpperCase()} ---`);
    items.forEach(a => {
      lines.push(`• ${a.title} [${a.source}]`);
      lines.push(`  ${truncate(a.description, MAX_DESC_CHARS)}`);
      if (a.snippet) lines.push(`  > ${truncate(a.snippet, MAX_SNIPPET_CHARS)}`);
    });
    lines.push('');
  }

  lines.push(`VOICE: ${TONE.voice.primary}`);
  lines.push(`SIGNALS NEEDED: ${TONE.signalCount}`);

  return lines.join('\n');
}

function trimAndRank(articles) {
  const grouped = groupByCategory(articles);
  const selected = [];

  for (const items of Object.values(grouped)) {
    const limit = Math.min(items.length, 4);
    selected.push(...items.slice(0, limit));
  }

  return selected.slice(0, MAX_ARTICLES);
}

function groupByCategory(articles) {
  const groups = {};
  for (const a of articles) {
    const key = a.category || 'General';
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  return groups;
}

function truncate(text, max) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}
