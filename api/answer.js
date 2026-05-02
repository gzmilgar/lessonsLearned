import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { team, section, field, value } = req.body || {};
    if (!team || !section || !field) {
      return res.status(400).json({ error: 'Missing team, section, or field' });
    }

    // Kilitli mi kontrol et
    const lockKey = `lock:${team}:${section}`;
    const isLocked = await kv.get(lockKey);
    if (isLocked) {
      return res.status(423).json({ error: 'Bu bölüm kilitli, değiştirilemez' });
    }

    const key = `answer:${team}:${section}:${field}`;
    await kv.set(key, value);
    await kv.sadd('teams', team);
    await kv.set(`updated:${team}`, Date.now());

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('answer error:', err);
    return res.status(500).json({ error: err.message });
  }
}
