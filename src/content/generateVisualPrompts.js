export function getAllVisualPrompts(report) {
  return (report.signals || []).map(s => ({
    signal_id: s.id,
    title: s.title,
    commodity: s.commodity,
    mood: s.industrial_mood,
    visual_prompt: s.social_posts?.visual_prompt || generateFallbackPrompt(s)
  }));
}

function generateFallbackPrompt(signal) {
  const moodToStyle = {
    Tightening: 'tight close-up, compressed industrial space, workers in hard hats, amber warning light',
    Expanding: 'wide aerial shot, construction cranes, scale and momentum, early morning golden hour',
    Fragile: 'cracked infrastructure, storm light, tension in the frame, cinematic dread',
    Cooling: 'empty warehouse, still machinery, dust motes in pale light, quiet industrial scale',
    Volatile: 'movement blur, forklift tracks in wet concrete, flickering work lights',
    Constrained: 'bottleneck framing, queue of trucks, overloaded dock, physical limit visible',
    Overheated: 'heat shimmer over machinery, orange slag pour, intense industrial light',
    Stabilizing: 'long lens compression, steady conveyor belt, orderly stacking',
    Optimistic: 'wide angle, new construction, blue sky above industrial skyline'
  };

  const style = moodToStyle[signal.industrial_mood] || 'cinematic wide shot, industrial scale, documentary style';
  return `${signal.commodity} — industrial documentary photography. ${style}. Sebastião Salgado influence. 35mm film grain. Desaturated palette. No people's faces visible.`;
}
