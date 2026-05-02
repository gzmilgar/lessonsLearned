import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { team, section } = req.body || {};
    if (!team || !section) return res.status(400).json({ error: 'Missing team or section' });

    const lockKey = `lock:${team}:${section}`;
    await kv.set(lockKey, { lockedAt: Date.now() });

    return res.status(200).json({ ok: true, locked: true });
  } catch (err) {
    console.error('lock error:', err);
    return res.status(500).json({ error: err.message });
  }
}
