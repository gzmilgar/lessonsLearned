import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { phase, answers } = req.body || {};
    if (!phase || !['pre', 'post'].includes(phase)) {
      return res.status(400).json({ error: 'Phase must be pre or post' });
    }
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Missing answers' });
    }

    // Anonim — sadece zaman damgası ve random ID
    const submissionId = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const key = `survey:${phase}:${submissionId}`;
    await kv.set(key, { ...answers, submittedAt: Date.now() });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('survey error:', err);
    return res.status(500).json({ error: err.message });
  }
}
