import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

const __file = fileURLToPath(import.meta.url);
const __root = path.join(path.dirname(__file), '..');
loadEnv({ path: path.join(__root, '.env'), override: true });

import fs from 'fs-extra';
import chalk from 'chalk';

import { gatherSignals } from './research/gatherSignals.js';
import { buildResearchBrief } from './scoring/scoreSignals.js';
import { generateReport } from './content/generateReport.js';
import { buildSocialPackData } from './content/generateSocialPosts.js';
import { getAllVisualPrompts } from './content/generateVisualPrompts.js';
import { toMarkdown, toSocialPackMarkdown } from './export/exportMarkdown.js';
import { toHTML } from './export/exportHTML.js';
import { toJSON } from './export/exportJSON.js';
import { exportToNotion } from './export/exportNotion.js';
import { today, outputDir } from './utils/dateUtils.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const args = process.argv.slice(2);
  const useMock = args.includes('--mock');
  const dateArg = args.find(a => a.startsWith('--date='))?.split('=')[1];
  const reportDate = dateArg || today();
  const hasNotion = !!(process.env.NOTION_TOKEN && process.env.NOTION_PAGE_ID);

  console.log('');
  console.log(chalk.hex('#b87333').bold('  COMMODITY TRANSLATOR'));
  console.log(chalk.gray('  Daily Industrial Intelligence Engine'));
  console.log(chalk.gray(`  ${reportDate}${useMock ? ' (mock mode)' : ''}`));
  console.log('');

  validateEnv(useMock);

  const outDir = outputDir(path.join(ROOT, 'outputs'), reportDate);
  await fs.ensureDir(outDir);

  // 01 Research
  console.log(chalk.white.bold('01 / Research'));
  const articles = await gatherSignals(useMock);
  console.log(chalk.green(`   ✓ ${articles.length} articles gathered`));
  console.log('');

  // 02 Analysis
  console.log(chalk.white.bold('02 / Analysis'));
  const brief = buildResearchBrief(articles, reportDate);
  const report = await generateReport(brief, reportDate);
  console.log(chalk.green(`   ✓ ${report.signals?.length || 0} signals generated`));
  console.log('');

  // 03 Export
  console.log(chalk.white.bold('03 / Export'));
  const socialPack = buildSocialPackData(report);
  report.visual_prompts = getAllVisualPrompts(report);

  const files = {
    'daily-report.md': toMarkdown(report),
    'daily-report.html': toHTML(report),
    'daily-report.json': toJSON(report),
    'social-post-pack.md': toSocialPackMarkdown(socialPack)
  };

  for (const [filename, content] of Object.entries(files)) {
    await fs.writeFile(path.join(outDir, filename), content, 'utf-8');
    console.log(chalk.green(`   ✓ ${reportDate}/${filename}`));
  }

  // 04 Notion
  if (hasNotion) {
    console.log('');
    console.log(chalk.white.bold('04 / Notion'));
    try {
      const notionUrl = await exportToNotion(report);
      console.log(chalk.green(`   ✓ Published → ${notionUrl}`));
    } catch (err) {
      console.log(chalk.yellow(`   ⚠ Notion export failed: ${err.message}`));
      console.log(chalk.gray('     Report still saved locally.'));
    }
  }

  console.log('');
  printSummary(report);
  console.log('');
  console.log(chalk.hex('#b87333')(`  Report saved to: outputs/${reportDate}/`));
  if (hasNotion) console.log(chalk.hex('#b87333')('  Also published to Notion.'));
  console.log('');
}

function validateEnv(useMock) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(chalk.red('  ✗ ANTHROPIC_API_KEY is missing from .env'));
    process.exit(1);
  }
  if (!useMock && !process.env.BRAVE_SEARCH_API_KEY) {
    console.error(chalk.red('  ✗ BRAVE_SEARCH_API_KEY is missing from .env'));
    console.error(chalk.gray('    Or run with --mock to skip live search.'));
    process.exit(1);
  }
}

function printSummary(report) {
  if (!report.signals?.length) return;

  console.log(chalk.white.bold('  TODAY\'S SIGNALS'));
  console.log('');

  for (const signal of report.signals) {
    const moodColor = {
      Tightening: '#ef4444', Expanding: '#22c55e', Fragile: '#f97316',
      Cooling: '#60a5fa', Volatile: '#fbbf24', Constrained: '#6b7280',
      Overheated: '#dc2626', Stabilizing: '#a78bfa', Optimistic: '#10b981'
    }[signal.industrial_mood] || '#64748b';

    console.log(`  ${chalk.hex(moodColor)(signal.industrial_mood.padEnd(12))} ${chalk.white.bold(signal.title)}`);
    console.log(chalk.gray(`             ${signal.content_hooks?.short_social_hook || ''}`));
    console.log('');
  }

  if (report.top_3_signals?.length) {
    console.log(chalk.white.bold('  TOP 3 TO POST'));
    report.top_3_signals.forEach(t => {
      const sig = report.signals.find(s => s.id === t.signal_id);
      console.log(`  ${chalk.hex('#b87333')(t.rank + '.')} ${sig?.title || t.signal_id} ${chalk.gray('→')} ${chalk.gray(t.best_platform_fit)}`);
    });
  }
}

main().catch(err => {
  console.error(chalk.red(`\n  Error: ${err.message}`));
  process.exit(1);
});
