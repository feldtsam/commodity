import Anthropic from '@anthropic-ai/sdk';

let client;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const SYSTEM_PROMPT = `You are the Commodity Translator — an industrial intelligence analyst who transforms raw commodity market data, supply chain signals, and global event streams into clear, cinematic, systems-thinking content.

Your job is to read raw research data and extract the real story underneath: what systems are tightening, cooling, breaking, or building. You are NOT a financial advisor. You are a translator of physical economy signals — the voice that explains what commodity movement means for the real world before the mainstream headlines arrive.

## YOUR VOICE
- Sharp, cinematic, intelligent but readable
- Observational — you notice what others miss
- Systems-thinking: connect the physical to the real
- Calm authority, not hype
- Think: Bloomberg Originals meets industrial documentary

## STRICT AVOIDS
- No stock market advice or trading language (no bullish/bearish, long/short, calls/puts)
- No finance bro tone
- No generic market summaries
- No overly technical jargon
- No price-only reporting without meaning
- No sensationalism

## SIGNAL PRIORITIES
Strong signals have ALL of these:
- Active movement or pressure right now
- Clear downstream consequences for real operations (factories, kitchens, grids, trucks, jobsites)
- Narrative tension — a story is unfolding, something changed
- Novel development (not the same story every week)
- Visual and storytelling potential

## INDUSTRIAL MOOD DEFINITIONS
Expanding | Tightening | Fragile | Cooling | Stabilizing | Volatile | Overheated | Constrained | Optimistic`;

const SIGNALS_TOOL = {
  name: 'create_signal_analysis',
  description: 'Identify and analyze the 5-7 strongest commodity signals from the research brief',
  input_schema: {
    type: 'object',
    properties: {
      signals: {
        type: 'array',
        description: '5-7 signals, each covering a DIFFERENT commodity or theme',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'snake_case identifier' },
            title: { type: 'string', description: '2-6 word cinematic headline' },
            commodity: { type: 'string' },
            what_happened: { type: 'string', description: '2-4 sentences of factual events' },
            why_this_matters: { type: 'string', description: '3-5 sentences on what system is shifting' },
            downstream_implications: { type: 'string', description: '3-5 sentences on real-world consequences for manufacturing, logistics, food service, construction, HVAC, power grids, consumer pricing' },
            industrial_mood: { type: 'string', enum: ['Expanding', 'Tightening', 'Fragile', 'Cooling', 'Stabilizing', 'Volatile', 'Overheated', 'Constrained', 'Optimistic'] },
            storytelling_score: { type: 'number', description: '1-10' },
            content_hooks: {
              type: 'object',
              properties: {
                short_social_hook: { type: 'string', description: 'One punchy sentence for LinkedIn/X' },
                factory_weather_alert: { type: 'string', description: 'One cinematic operational warning' },
                why_normal_people_care: { type: 'string', description: 'One sentence of everyday relevance' }
              },
              required: ['short_social_hook', 'factory_weather_alert', 'why_normal_people_care']
            }
          },
          required: ['id', 'title', 'commodity', 'what_happened', 'why_this_matters', 'downstream_implications', 'industrial_mood', 'storytelling_score', 'content_hooks']
        }
      },
      top_3_signals: {
        type: 'array',
        description: 'Top 3 signals by storytelling and social media potential',
        items: {
          type: 'object',
          properties: {
            rank: { type: 'number', enum: [1, 2, 3] },
            signal_id: { type: 'string' },
            why_it_stands_out: { type: 'string' },
            best_visual_direction: { type: 'string' },
            best_platform_fit: { type: 'string', enum: ['LinkedIn', 'X', 'newsletter', 'TikTok/short-form video'] }
          },
          required: ['rank', 'signal_id', 'why_it_stands_out', 'best_visual_direction', 'best_platform_fit']
        }
      }
    },
    required: ['signals', 'top_3_signals']
  }
};

const SOCIAL_TOOL = {
  name: 'create_social_posts',
  description: 'Generate social media posts and visual prompts for the top 3 signals',
  input_schema: {
    type: 'object',
    properties: {
      posts: {
        type: 'array',
        description: 'Social posts for each of the top 3 signals',
        items: {
          type: 'object',
          properties: {
            signal_id: { type: 'string' },
            linkedin: { type: 'string', description: '100-180 word LinkedIn post: intelligent, calm, narrative. Observation → system analysis → downstream implication.' },
            x_post: { type: 'string', description: 'MUST be under 280 characters. Punchy, sharp, curiosity-driven.' },
            tiktok_concept: {
              type: 'object',
              properties: {
                hook: { type: 'string', description: 'Opening 3 seconds — grab attention immediately' },
                visual_idea: { type: 'string' },
                intro_5_7_seconds: { type: 'string' },
                scene_beats: { type: 'array', items: { type: 'string' } },
                on_screen_text: { type: 'string' },
                voiceover: { type: 'string' },
                cta: { type: 'string' }
              },
              required: ['hook', 'visual_idea', 'intro_5_7_seconds', 'scene_beats', 'on_screen_text', 'voiceover', 'cta']
            },
            newsletter_blurb: { type: 'string', description: '120-200 words. Bloomberg Originals tone: event → system → downstream consequence.' },
            visual_prompt: { type: 'string', description: 'Cinematic industrial documentary image/video prompt. Sebastiao Salgado influence. Ultra-wide or aerial. Desaturated with one accent color.' }
          },
          required: ['signal_id', 'linkedin', 'x_post', 'tiktok_concept', 'newsletter_blurb', 'visual_prompt']
        }
      }
    },
    required: ['posts']
  }
};

export async function generateReport(researchBrief, date) {
  console.log('  Analyzing signals...');

  const analysisResponse = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }
    ],
    tools: [SIGNALS_TOOL],
    tool_choice: { type: 'tool', name: 'create_signal_analysis' },
    messages: [
      {
        role: 'user',
        content: `Analyze this research brief and identify the 5-7 strongest commodity signals.\n\n${researchBrief}`
      }
    ]
  });

  const analysisTool = analysisResponse.content.find(b => b.type === 'tool_use');
  if (!analysisTool) throw new Error('No signal analysis returned from Claude');

  const signals = analysisTool.input?.signals;
  if (!signals?.length) throw new Error('Claude returned no signals — research brief may be too long or API quota exceeded');
  let { top_3_signals } = analysisTool.input;
  console.log(`  Generated ${signals?.length || 0} signals`);

  if (!top_3_signals?.length) {
    top_3_signals = [...signals]
      .sort((a, b) => (b.storytelling_score || 0) - (a.storytelling_score || 0))
      .slice(0, 3)
      .map((s, i) => ({
        rank: i + 1,
        signal_id: s.id,
        why_it_stands_out: s.content_hooks?.short_social_hook || '',
        best_visual_direction: 'Industrial documentary style',
        best_platform_fit: 'LinkedIn'
      }));
  }

  const top3Ids = top_3_signals.map(t => t.signal_id);
  const top3Signals = signals.filter(s => top3Ids.includes(s.id));

  console.log('  Generating social media content for top 3...');

  const socialResponse = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }
    ],
    tools: [SOCIAL_TOOL],
    tool_choice: { type: 'tool', name: 'create_social_posts' },
    messages: [
      {
        role: 'user',
        content: `Generate social media posts and visual prompts for these top 3 commodity signals:\n\n${JSON.stringify(top3Signals, null, 2)}`
      }
    ]
  });

  const socialTool = socialResponse.content.find(b => b.type === 'tool_use');
  const socialPosts = socialTool?.input?.posts || [];

  const postsBySignalId = {};
  for (const p of socialPosts) {
    postsBySignalId[p.signal_id] = p;
  }

  const signalsWithPosts = signals.map(s => ({
    ...s,
    social_posts: postsBySignalId[s.id] || null
  }));

  const totalUsage = {
    input_tokens: (analysisResponse.usage?.input_tokens || 0) + (socialResponse.usage?.input_tokens || 0),
    output_tokens: (analysisResponse.usage?.output_tokens || 0) + (socialResponse.usage?.output_tokens || 0),
    cache_read_tokens: (analysisResponse.usage?.cache_read_input_tokens || 0) + (socialResponse.usage?.cache_read_input_tokens || 0)
  };

  if (totalUsage.cache_read_tokens > 0) {
    console.log(`  Cache hit: ${totalUsage.cache_read_tokens} tokens from cache`);
  }

  return {
    report_date: date,
    generated_at: new Date().toISOString(),
    signals: signalsWithPosts,
    top_3_signals,
    usage: totalUsage
  };
}
