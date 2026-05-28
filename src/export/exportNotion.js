import { Client } from '@notionhq/client';
import { displayDate } from '../utils/dateUtils.js';

let notion;
function getNotion() {
  if (!notion) notion = new Client({ auth: process.env.NOTION_TOKEN });
  return notion;
}

const MOOD_COLORS = {
  Expanding: 'green', Tightening: 'red', Fragile: 'orange',
  Cooling: 'blue', Stabilizing: 'purple', Volatile: 'yellow',
  Overheated: 'red', Constrained: 'gray', Optimistic: 'teal'
};

const MOOD_EMOJI = {
  Expanding: '▲', Tightening: '◆', Fragile: '⚠️', Cooling: '▼',
  Stabilizing: '●', Volatile: '⚡', Overheated: '🔴', Constrained: '■', Optimistic: '★'
};

export async function exportToNotion(report) {
  const parentId = process.env.NOTION_PAGE_ID;
  if (!parentId) throw new Error('NOTION_PAGE_ID not set in .env');

  const title = `Commodity Translator — ${displayDate(report.report_date)}`;

  // Create the daily page
  const page = await getNotion().pages.create({
    parent: { page_id: parentId },
    properties: {
      title: { title: [{ text: { content: title } }] }
    },
    children: buildHeaderBlocks(report)
  });

  // Append signals in batches (Notion limit: 100 blocks per call)
  const signalBlocks = buildSignalBlocks(report);
  for (let i = 0; i < signalBlocks.length; i += 90) {
    await getNotion().blocks.children.append({
      block_id: page.id,
      children: signalBlocks.slice(i, i + 90)
    });
  }

  return page.url;
}

function buildHeaderBlocks(report) {
  const blocks = [];

  blocks.push(quote('Signals from the physical economy before the headlines fully arrive.'));
  blocks.push(divider());

  if (report.top_3_signals?.length) {
    blocks.push(heading1('🏆 Top 3 Signals To Post Today'));
    for (const top of report.top_3_signals) {
      const sig = report.signals.find(s => s.id === top.signal_id);
      if (!sig) continue;
      blocks.push(callout(
        `${top.rank}. ${sig.title}`,
        `📣 ${sig.content_hooks?.short_social_hook || ''}\n\n📱 Best platform: ${top.best_platform_fit}\n🎯 Why it stands out: ${top.why_it_stands_out}\n🎬 Visual direction: ${top.best_visual_direction}`,
        MOOD_COLORS[sig.industrial_mood] || 'gray',
        `${top.rank}️⃣`
      ));
    }
    blocks.push(divider());
  }

  blocks.push(heading1('📡 All Signals'));
  return blocks;
}

function buildSignalBlocks(report) {
  const blocks = [];
  const top3Ids = new Set((report.top_3_signals || []).map(t => t.signal_id));

  for (const signal of report.signals || []) {
    const color = MOOD_COLORS[signal.industrial_mood] || 'gray';
    const moodEmoji = MOOD_EMOJI[signal.industrial_mood] || '●';
    const hasPost = signal.social_posts && top3Ids.has(signal.id);

    // Signal header
    blocks.push(heading2(`${moodEmoji} ${signal.title}`));
    blocks.push(paragraph(
      `${signal.commodity}  ·  ${signal.industrial_mood}  ·  Story Score: ${signal.storytelling_score}/10`,
      'gray'
    ));

    // Core content
    blocks.push(heading3('What Happened'));
    blocks.push(paragraph(signal.what_happened));

    blocks.push(heading3('Why This Matters'));
    blocks.push(paragraph(signal.why_this_matters));

    blocks.push(heading3('Downstream Implications'));
    blocks.push(paragraph(signal.downstream_implications));

    // Content hooks
    blocks.push(heading3('Content Hooks'));
    if (signal.content_hooks?.short_social_hook) {
      blocks.push(callout(
        signal.content_hooks.short_social_hook,
        null, color, '📣'
      ));
    }
    if (signal.content_hooks?.factory_weather_alert) {
      blocks.push(callout(
        signal.content_hooks.factory_weather_alert,
        null, 'orange', '🏭'
      ));
    }
    if (signal.content_hooks?.why_normal_people_care) {
      blocks.push(callout(
        signal.content_hooks.why_normal_people_care,
        null, 'blue', '👥'
      ));
    }

    // Social posts (top 3 only)
    if (hasPost) {
      const posts = signal.social_posts;
      blocks.push(heading3('Social Posts'));

      if (posts.linkedin) {
        blocks.push(toggle('💼 LinkedIn', [paragraph(posts.linkedin)]));
      }
      if (posts.x_post) {
        blocks.push(toggle('𝕏  X / Twitter', [paragraph(posts.x_post)]));
      }
      if (posts.tiktok_concept?.hook) {
        const t = posts.tiktok_concept;
        const content = [
          `🎣 Hook: ${t.hook}`,
          `🎬 Visual: ${t.visual_idea}`,
          `▶️ Intro: ${t.intro_5_7_seconds}`,
          `📋 Beats:\n${(t.scene_beats || []).map(b => `  • ${b}`).join('\n')}`,
          `📺 On-screen text: ${t.on_screen_text}`,
          `🎙️ Voiceover: ${t.voiceover}`,
          `📢 CTA: ${t.cta}`
        ].join('\n\n');
        blocks.push(toggle('🎵 TikTok / Reels Concept', [paragraph(content)]));
      }
      if (posts.newsletter_blurb) {
        blocks.push(toggle('📰 Newsletter Blurb', [paragraph(posts.newsletter_blurb)]));
      }
      if (posts.visual_prompt) {
        blocks.push(toggle('🎨 Visual Prompt (AI Image/Video)', [
          code(posts.visual_prompt)
        ]));
      }
    }

    blocks.push(divider());
  }

  return blocks;
}

// ─── Block builders ──────────────────────────────────────────────────────────

function richText(content, color) {
  const obj = { text: { content: cap(content) } };
  if (color) obj.annotations = { color };
  return obj;
}

function cap(text, max = 1999) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function heading1(text) {
  return { object: 'block', type: 'heading_1', heading_1: { rich_text: [richText(text)] } };
}

function heading2(text) {
  return { object: 'block', type: 'heading_2', heading_2: { rich_text: [richText(text)] } };
}

function heading3(text) {
  return { object: 'block', type: 'heading_3', heading_3: { rich_text: [richText(text)] } };
}

function paragraph(text, color) {
  return {
    object: 'block', type: 'paragraph',
    paragraph: { rich_text: [richText(text || '', color)] }
  };
}

function callout(title, body, color, emoji = '💡') {
  const children = body ? [paragraph(body)] : [];
  return {
    object: 'block', type: 'callout',
    callout: {
      rich_text: [richText(title)],
      icon: { type: 'emoji', emoji },
      color: `${color}_background`,
      children
    }
  };
}

function toggle(title, children = []) {
  return {
    object: 'block', type: 'toggle',
    toggle: {
      rich_text: [richText(title)],
      children
    }
  };
}

function quote(text) {
  return { object: 'block', type: 'quote', quote: { rich_text: [richText(text)] } };
}

function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}

function code(text) {
  return {
    object: 'block', type: 'code',
    code: { rich_text: [richText(text)], language: 'plain text' }
  };
}
