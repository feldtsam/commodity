import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import chalk from 'chalk';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

async function setup() {
  console.log('');
  console.log(chalk.hex('#b87333').bold('  COMMODITY TRANSLATOR — Setup Check'));
  console.log('');

  let ok = true;

  // .env check
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    console.log(chalk.yellow('  ⚠ No .env file found'));
    console.log(chalk.gray('    Run: cp .env.example .env'));
    console.log(chalk.gray('    Then add your API keys.\n'));
    ok = false;
  } else {
    console.log(chalk.green('  ✓ .env file found'));
  }

  // Anthropic key check
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(chalk.red('  ✗ ANTHROPIC_API_KEY missing'));
    ok = false;
  } else {
    try {
      const client = new Anthropic();
      await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }]
      });
      console.log(chalk.green('  ✓ Anthropic API key valid'));
    } catch {
      console.log(chalk.red('  ✗ Anthropic API key invalid or quota exhausted'));
      ok = false;
    }
  }

  // Brave Search key check
  if (!process.env.BRAVE_SEARCH_API_KEY) {
    console.log(chalk.yellow('  ⚠ BRAVE_SEARCH_API_KEY missing (required for live search)'));
    console.log(chalk.gray('    Get a free key: https://brave.com/search/api/'));
    console.log(chalk.gray('    You can still run tests with: npm test (--mock mode)'));
  } else {
    try {
      await axios.get('https://api.search.brave.com/res/v1/news/search', {
        headers: { 'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY, 'Accept': 'application/json' },
        params: { q: 'copper supply', count: 1 },
        timeout: 8000
      });
      console.log(chalk.green('  ✓ Brave Search API key valid'));
    } catch (e) {
      if (e.response?.status === 401) {
        console.log(chalk.red('  ✗ Brave Search API key invalid'));
        ok = false;
      } else {
        console.log(chalk.yellow(`  ⚠ Brave Search check inconclusive: ${e.message}`));
      }
    }
  }

  // Output directory
  const outDir = path.join(ROOT, 'outputs');
  await fs.ensureDir(outDir);
  console.log(chalk.green('  ✓ outputs/ directory ready'));

  console.log('');
  if (ok) {
    console.log(chalk.green.bold('  All checks passed. Run: npm run daily'));
  } else {
    console.log(chalk.yellow('  Fix the issues above, then run: npm run daily'));
    console.log(chalk.gray('  To test without a search key: npm test'));
  }
  console.log('');
}

setup().catch(err => {
  console.error(chalk.red(`\n  Setup error: ${err.message}`));
  process.exit(1);
});
