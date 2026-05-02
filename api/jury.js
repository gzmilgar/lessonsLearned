import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { key } = req.query;
    const expected = process.env.JURY_KEY || 'jury-2026';
    if (key !== expected) return res.status(403).json({ error: 'Forbidden' });

    const teams = await kv.smembers('teams') || [];
    const sections = ['solution', 'plan', 'interventions'];

    const data = {};
    for (const team of teams) {
      data[team] = { answers: {}, locks: {}, scores: {}, updated: null };
      for (const section of sections) {
        const pattern = `answer:${team}:${section}:*`;
        const keys = await kv.keys(pattern);
        data[team].answers[section] = {};
        for (const k of keys) {
          const field = k.split(':').slice(3).join(':');
          data[team].answers[section][field] = await kv.get(k);
        }
        data[team].locks[section] = (await kv.get(`lock:${team}:${section}`)) ? true : false;
      }
      data[team].updated = await kv.get(`updated:${team}`);
      const scoreKeys = await kv.keys(`score:${team}:*`);
      for (const sk of scoreKeys) {
        const f = sk.split(':').slice(2).join(':');
        data[team].scores[f] = await kv.get(sk);
      }
    }

    // Anket cevapları (anonim, agregate)
    const surveyKeys = await kv.keys('survey:*');
    const surveys = { pre: [], post: [] };
    for (const sk of surveyKeys) {
      const parts = sk.split(':');
      const phase = parts[1]; // pre / post
      const data_ = await kv.get(sk);
      if (data_ && surveys[phase]) surveys[phase].push(data_);
    }

    const activeIntervention = await kv.get('active_intervention');
    const presentingTeam = await kv.get('presenting_team');
    const interventionLog = (await kv.get('intervention_log')) || [];

    return res.status(200).json({
      teams: data,
      activeIntervention,
      presentingTeam,
      interventionLog,
      surveys
    });
  } catch (err) {
    console.error('jury error:', err);
    return res.status(500).json({ error: err.message });
  }
}
