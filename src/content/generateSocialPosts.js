export function buildSocialPackData(report) {
  const top3Ids = new Set((report.top_3_signals || []).map(t => t.signal_id));

  return {
    date: report.report_date,
    topSignals: report.top_3_signals || [],
    posts: (report.signals || [])
      .filter(s => top3Ids.has(s.id))
      .map(s => ({
        signal: s,
        rank: report.top_3_signals.find(t => t.signal_id === s.id)?.rank,
        linkedin: s.social_posts?.linkedin || '',
        x_post: s.social_posts?.x_post || '',
        tiktok: s.social_posts?.tiktok_concept || {},
        newsletter: s.social_posts?.newsletter_blurb || '',
        visual_prompt: s.social_posts?.visual_prompt || ''
      }))
      .sort((a, b) => (a.rank || 99) - (b.rank || 99))
  };
}
