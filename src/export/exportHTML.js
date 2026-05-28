import { displayDate } from '../utils/dateUtils.js';

const MOOD_COLORS = {
  Expanding: '#22c55e',
  Tightening: '#ef4444',
  Fragile: '#f97316',
  Cooling: '#60a5fa',
  Stabilizing: '#a78bfa',
  Volatile: '#fbbf24',
  Overheated: '#dc2626',
  Constrained: '#6b7280',
  Optimistic: '#10b981'
};

export function toHTML(report) {
  const dateStr = displayDate(report.report_date);
  const signals = report.signals || [];
  const top3 = report.top_3_signals || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commodity Translator — ${report.report_date}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #080c12;
      --surface: #0f1620;
      --surface2: #161e2e;
      --border: #1e2d42;
      --text: #e2e8f0;
      --muted: #64748b;
      --copper: #b87333;
      --font: -apple-system, 'Inter', 'Segoe UI', sans-serif;
      --mono: 'SF Mono', 'Fira Code', monospace;
    }
    body { background: var(--bg); color: var(--text); font-family: var(--font); line-height: 1.6; min-height: 100vh; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 24px 80px; }

    /* Header */
    .header { border-bottom: 1px solid var(--border); padding-bottom: 32px; margin-bottom: 40px; }
    .brand { font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--copper); font-weight: 600; margin-bottom: 12px; }
    .report-title { font-size: 28px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
    .report-date { font-size: 14px; color: var(--muted); }
    .tagline { margin-top: 16px; font-size: 13px; color: var(--muted); font-style: italic; border-left: 2px solid var(--copper); padding-left: 12px; }

    /* Section headers */
    .section-label { font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--copper); font-weight: 700; margin-bottom: 20px; }

    /* Top 3 */
    .top3-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 48px; }
    .top3-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 20px; position: relative; }
    .top3-card::before { content: attr(data-rank); position: absolute; top: 16px; right: 16px; font-size: 36px; font-weight: 900; color: var(--border); font-family: var(--mono); line-height: 1; }
    .top3-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
    .top3-meta { font-size: 12px; color: var(--copper); margin-bottom: 12px; font-weight: 600; }
    .top3-why { font-size: 13px; color: var(--muted); line-height: 1.5; margin-bottom: 8px; }
    .top3-platform { font-size: 11px; background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 3px 8px; display: inline-block; color: var(--text); }

    /* Signal cards */
    .signals { display: flex; flex-direction: column; gap: 28px; }
    .signal-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    .signal-header { padding: 20px 24px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .signal-left { flex: 1; }
    .signal-commodity { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--copper); font-weight: 600; margin-bottom: 6px; }
    .signal-title { font-size: 22px; font-weight: 800; color: var(--text); line-height: 1.2; }
    .signal-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
    .mood-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 20px; }
    .score-wrap { display: flex; align-items: center; gap: 6px; }
    .score-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
    .score-bar-bg { width: 60px; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
    .score-bar-fill { height: 100%; background: var(--copper); border-radius: 2px; }
    .score-num { font-size: 12px; font-weight: 700; color: var(--copper); font-family: var(--mono); }
    .signal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .signal-section h4 { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); font-weight: 600; margin-bottom: 8px; }
    .signal-section p { font-size: 15px; color: var(--text); line-height: 1.65; }
    .hooks-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
    .hook-item { background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; }
    .hook-label { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--copper); font-weight: 600; margin-bottom: 4px; }
    .hook-text { font-size: 13px; color: var(--text); line-height: 1.5; }

    /* Footer */
    .footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--border); text-align: center; font-size: 12px; color: var(--muted); }
    .footer span { color: var(--copper); }

    @media (max-width: 600px) {
      .signal-header { flex-direction: column; }
      .signal-right { flex-direction: row; align-items: center; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="brand">Commodity Translator</div>
      <h1 class="report-title">Daily Signal Report</h1>
      <div class="report-date">${dateStr}</div>
      <div class="tagline">Signals from the physical economy before the headlines fully arrive.</div>
    </header>

    ${top3.length ? renderTop3(top3, report.signals) : ''}

    <div class="section-label">Today's Signals</div>
    <div class="signals">
      ${signals.map(s => renderSignalCard(s)).join('\n')}
    </div>

    <footer class="footer">
      <p>Generated by <span>Commodity Translator</span> · ${report.report_date}${report.usage ? ` · ${report.usage.input_tokens}/${report.usage.output_tokens} tokens` : ''}</p>
    </footer>
  </div>
</body>
</html>`;
}

function renderTop3(top3, allSignals) {
  return `
    <div class="section-label">Top 3 Signals To Post Today</div>
    <div class="top3-grid">
      ${top3.map(t => {
        const sig = allSignals.find(s => s.id === t.signal_id);
        return `
        <div class="top3-card" data-rank="${t.rank}">
          <div class="top3-title">${sig?.title || t.signal_id}</div>
          <div class="top3-meta">${sig?.commodity || ''} · ${sig?.industrial_mood || ''}</div>
          <div class="top3-why">${t.why_it_stands_out}</div>
          <span class="top3-platform">${t.best_platform_fit}</span>
        </div>`;
      }).join('')}
    </div>`;
}

function renderSignalCard(signal) {
  const color = MOOD_COLORS[signal.industrial_mood] || '#64748b';
  const scorePct = ((signal.storytelling_score || 0) / 10) * 100;
  const hooks = signal.content_hooks || {};

  return `
    <div class="signal-card" style="border-left: 3px solid ${color}">
      <div class="signal-header">
        <div class="signal-left">
          <div class="signal-commodity">${signal.commodity}</div>
          <div class="signal-title">${signal.title}</div>
        </div>
        <div class="signal-right">
          <span class="mood-badge" style="background:${color}22; color:${color}; border:1px solid ${color}44">${signal.industrial_mood}</span>
          <div class="score-wrap">
            <span class="score-label">Story</span>
            <div class="score-bar-bg"><div class="score-bar-fill" style="width:${scorePct}%"></div></div>
            <span class="score-num">${signal.storytelling_score}/10</span>
          </div>
        </div>
      </div>
      <div class="signal-body">
        <div class="signal-section">
          <h4>What Happened</h4>
          <p>${signal.what_happened}</p>
        </div>
        <div class="signal-section">
          <h4>Why This Matters</h4>
          <p>${signal.why_this_matters}</p>
        </div>
        <div class="signal-section">
          <h4>Downstream Implications</h4>
          <p>${signal.downstream_implications}</p>
        </div>
        <div class="signal-section">
          <h4>Content Hooks</h4>
          <div class="hooks-grid">
            ${hooks.short_social_hook ? `<div class="hook-item"><div class="hook-label">Short Hook</div><div class="hook-text">${hooks.short_social_hook}</div></div>` : ''}
            ${hooks.factory_weather_alert ? `<div class="hook-item"><div class="hook-label">Factory Weather Alert</div><div class="hook-text">${hooks.factory_weather_alert}</div></div>` : ''}
            ${hooks.why_normal_people_care ? `<div class="hook-item"><div class="hook-label">Why Normal People Care</div><div class="hook-text">${hooks.why_normal_people_care}</div></div>` : ''}
          </div>
        </div>
      </div>
    </div>`;
}
