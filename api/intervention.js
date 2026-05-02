import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { key, action, card } = req.body || {};
    const expected = process.env.JURY_KEY || 'jury-2026';
    if (key !== expected) return res.status(403).json({ error: 'Forbidden' });

    if (action === 'set') {
      if (!card) return res.status(400).json({ error: 'Missing card' });
      const intervention = { ...card, id: Date.now(), startedAt: Date.now() };
      await kv.set('active_intervention', intervention);
      const log = (await kv.get('intervention_log')) || [];
      log.push(intervention);
      await kv.set('intervention_log', log);
      return res.status(200).json({ ok: true, intervention });
    } else if (action === 'clear') {
      await kv.del('active_intervention');
      return res.status(200).json({ ok: true });
    } else if (action === 'present') {
      const { team } = req.body;
      await kv.set('presenting_team', team || null);
      return res.status(200).json({ ok: true, presentingTeam: team });
    } else if (action === 'score') {
      const { team, field, value } = req.body;
      if (!team || !field) return res.status(400).json({ error: 'Missing team or field' });
      await kv.set(`score:${team}:${field}`, value);
      return res.status(200).json({ ok: true });
    } else if (action === 'reset') {
      const allKeys = await kv.keys('*');
      for (const k of allKeys) await kv.del(k);
      return res.status(200).json({ ok: true, cleared: allKeys.length });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('intervention error:', err);
    return res.status(500).json({ error: err.message });
  }
}
