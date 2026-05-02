import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { team } = req.query;
    if (!team) return res.status(400).json({ error: 'Missing team' });

    const sections = ['solution', 'plan', 'interventions'];
    const answers = {};
    const locks = {};
    for (const section of sections) {
      const pattern = `answer:${team}:${section}:*`;
      const keys = await kv.keys(pattern);
      answers[section] = {};
      for (const k of keys) {
        const field = k.split(':').slice(3).join(':');
        answers[section][field] = await kv.get(k);
      }
      locks[section] = (await kv.get(`lock:${team}:${section}`)) ? true : false;
    }

    const activeIntervention = await kv.get('active_intervention');
    const presentingTeam = await kv.get('presenting_team');

    return res.status(200).json({
      team, answers, locks, activeIntervention, presentingTeam
    });
  } catch (err) {
    console.error('state error:', err);
    return res.status(500).json({ error: err.message });
  }
}
