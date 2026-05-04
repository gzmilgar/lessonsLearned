import { loadAllData } from './_lib/loadAll.js';

const HEADERS = {
  Teams_Answers: ['team', 'section', 'field', 'value', 'locked', 'updatedAt'],
  Intervention_Responses: ['team', 'interventionKey', 'from', 'title', 'quote', 'response', 'respondedAt'],
  Scores: ['team', 'dimension', 'value'],
  Surveys: ['phase', 'submittedAt', 'questionKey', 'question', 'answer'],
  Intervention_Log: ['id', 'startedAt', 'from', 'title', 'quote'],
  Meta: ['key', 'value']
};

function flatten(data) {
  const tabs = {
    Teams_Answers: [],
    Intervention_Responses: [],
    Scores: [],
    Surveys: [],
    Intervention_Log: [],
    Meta: []
  };

  for (const [team, td] of Object.entries(data.teams || {})) {
    for (const section of ['solution', 'plan']) {
      const fields = (td.answers && td.answers[section]) || {};
      for (const [field, value] of Object.entries(fields)) {
        tabs.Teams_Answers.push([
          team,
          section,
          field,
          typeof value === 'string' ? value : JSON.stringify(value ?? ''),
          !!(td.locks && td.locks[section]),
          td.updated || ''
        ]);
      }
    }
    const interventions = (td.answers && td.answers.interventions) || {};
    for (const [k, obj] of Object.entries(interventions)) {
      tabs.Intervention_Responses.push([
        team,
        k,
        obj?.from || '',
        obj?.title || '',
        obj?.quote || '',
        obj?.response || '',
        obj?.respondedAt || ''
      ]);
    }
    for (const [dim, v] of Object.entries(td.scores || {})) {
      tabs.Scores.push([team, dim, v]);
    }
  }

  for (const phase of ['pre', 'post']) {
    for (const submission of (data.surveys?.[phase] || [])) {
      const { submittedAt, ...qs } = submission;
      for (const [qk, qv] of Object.entries(qs)) {
        const question = qv && typeof qv === 'object' ? (qv.question || '') : '';
        const answer = qv && typeof qv === 'object'
          ? (qv.answer ?? '')
          : String(qv ?? '');
        tabs.Surveys.push([phase, submittedAt || '', qk, question, answer]);
      }
    }
  }

  for (const e of (data.interventionLog || [])) {
    tabs.Intervention_Log.push([
      e.id || '',
      e.startedAt || '',
      e.from || '',
      e.title || '',
      e.quote || ''
    ]);
  }

  tabs.Meta.push(['exportedAt', new Date().toISOString()]);
  tabs.Meta.push(['presentingTeam', data.presentingTeam || '']);
  tabs.Meta.push(['activeInterventionTitle', data.activeIntervention?.title || '']);
  tabs.Meta.push(['totalTeams', Object.keys(data.teams || {}).length]);
  tabs.Meta.push(['totalSurveysPre', (data.surveys?.pre || []).length]);
  tabs.Meta.push(['totalSurveysPost', (data.surveys?.post || []).length]);
  tabs.Meta.push(['totalInterventionLog', (data.interventionLog || []).length]);

  return tabs;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const webhook = process.env.SHEETS_WEBHOOK_URL;
  if (!webhook) {
    return res.status(400).json({ error: 'SHEETS_WEBHOOK_URL not configured on Vercel' });
  }

  try {
    const mode = req.body?.mode === 'append' ? 'append' : 'replace';
    const data = await loadAllData();
    const tabs = flatten(data);

    const payload = { mode, headers: HEADERS, tabs };
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const text = await r.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch (_) { /* non-JSON */ }

    if (!r.ok) {
      return res.status(502).json({
        error: 'Apps Script webhook returned ' + r.status,
        body: parsed || text
      });
    }

    return res.status(200).json({
      ok: true,
      mode,
      written: parsed?.written || Object.fromEntries(Object.entries(tabs).map(([k, v]) => [k, v.length])),
      raw: parsed || text
    });
  } catch (err) {
    console.error('export-sheets error:', err);
    return res.status(500).json({ error: err.message });
  }
}
