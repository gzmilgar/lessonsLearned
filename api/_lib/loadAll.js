import { kv } from '@vercel/kv';

export async function loadAllData() {
  const teams = (await kv.smembers('teams')) || [];
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

  const surveyKeys = await kv.keys('survey:*');
  const surveys = { pre: [], post: [] };
  for (const sk of surveyKeys) {
    const phase = sk.split(':')[1];
    const row = await kv.get(sk);
    if (row && surveys[phase]) surveys[phase].push(row);
  }

  const activeIntervention = await kv.get('active_intervention');
  const presentingTeam = await kv.get('presenting_team');
  const interventionLog = (await kv.get('intervention_log')) || [];

  return {
    teams: data,
    activeIntervention,
    presentingTeam,
    interventionLog,
    surveys
  };
}
