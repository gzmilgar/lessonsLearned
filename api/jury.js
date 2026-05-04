import { loadAllData } from './_lib/loadAll.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = await loadAllData();
    return res.status(200).json(data);
  } catch (err) {
    console.error('jury error:', err);
    return res.status(500).json({ error: err.message });
  }
}
