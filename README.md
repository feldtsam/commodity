# Commodity Translator

**Daily industrial intelligence.** Scans commodity markets, global events, logistics, and infrastructure — then translates the signals into human-readable content before the headlines arrive.

---

## What It Does

Each morning, Commodity Translator:

1. **Searches** ~25 live news queries across copper, steel, freight, AI infrastructure, energy grids, lithium, semiconductors, refrigerants, and more
2. **Analyzes** the raw results with Claude to identify 5–7 strongest signals
3. **Writes** a full daily report with narrative analysis for each signal
4. **Generates** ready-to-post social content for the top 3 signals

Output files saved to `outputs/YYYY-MM-DD/`:
- `daily-report.md` — full signal report in Markdown
- `daily-report.html` — dark-themed visual briefing (open in any browser)
- `daily-report.json` — structured data for downstream use
- `social-post-pack.md` — copy-paste ready LinkedIn, X, TikTok, and newsletter posts

---

## Setup

### 1. Install Node.js

If you don't have Node.js installed:
```
# macOS (Homebrew)
brew install node

# Or download directly: https://nodejs.org (v18 or newer)
```

### 2. Install dependencies

```bash
cd commodity-translator
npm install
```

### 3. Add API keys

```bash
cp .env.example .env
```

Edit `.env` and add:

- **ANTHROPIC_API_KEY** — Get at https://console.anthropic.com/
- **BRAVE_SEARCH_API_KEY** — Get at https://brave.com/search/api/ (free tier: 2,000 queries/month)

### 4. Verify setup

```bash
npm run setup
```

---

## Daily Usage

```bash
# Full daily run (live search + Claude analysis)
npm run daily

# Test with mock data (no Brave Search key needed)
npm test

# Specific date
npm run daily -- --date=2026-05-26
```

---

## Project Structure

```
commodity-translator/
  .env                      ← Your API keys (create from .env.example)
  config/
    commodities.json        ← Commodities and themes to track
    sources.json            ← Search configuration
    tone.json               ← Voice and style settings
  src/
    index.js                ← Main orchestrator
    research/
      gatherSignals.js      ← Runs all search queries
      sourceSearch.js       ← Brave Search API integration
      mockData.js           ← Static test data (--mock mode)
    scoring/
      scoreSignals.js       ← Formats research brief for Claude
    content/
      generateReport.js     ← Claude API — signal analysis + full report
      generateSocialPosts.js ← Assembles social post pack
      generateVisualPrompts.js ← Visual prompt generation
    export/
      exportMarkdown.js     ← MD + social pack rendering
      exportHTML.js         ← Dark-themed HTML report
      exportJSON.js         ← Raw JSON export
    utils/
      dateUtils.js
      cleanText.js
  outputs/
    2026-05-26/
      daily-report.md
      daily-report.html
      daily-report.json
      social-post-pack.md
```

---

## Customizing

### Add or remove commodities

Edit `config/commodities.json`. Each entry has:
- `id` — snake_case identifier
- `name` — display name
- `priority` — `1` (gets 2 search queries per run) or `2` (gets 1)
- `searchQueries` — array of search strings to use

### Change the voice

Edit `config/tone.json` to adjust the writing style, signal title examples, or number of signals per report.

### Change search freshness

Edit `config/sources.json`:
- `searchFreshness`: `"pd"` = past day, `"pw"` = past week
- `maxResultsPerQuery`: articles per search (default 5)

---

## Estimated Costs

| Run type | Approx cost |
|---|---|
| Full daily run | ~$0.10–0.20 (Claude) + free (Brave Search) |
| Mock mode (--mock) | ~$0.10–0.15 (Claude only) |

Prompt caching is active — the system prompt is cached after the first run, reducing cost on subsequent daily runs.

---

## Signal Moods

| Mood | Meaning |
|---|---|
| Expanding | Demand accelerating, capacity building |
| Tightening | Supply narrowing, buyers getting squeezed |
| Fragile | Functioning but vulnerable |
| Cooling | Demand softening from recent highs |
| Stabilizing | Volatility calming, finding equilibrium |
| Volatile | Unpredictable swings |
| Overheated | Unsustainable pace, downstream risks building |
| Constrained | Hard physical limits being hit |
| Optimistic | Forward signals positive, investment building |

---

*Built to make you the translator between raw commodity movement and everyday industrial reality.*
