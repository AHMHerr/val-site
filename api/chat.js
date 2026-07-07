const SUPABASE_URL = 'https://wphzopmzryzzwpuhdosi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHpvcG16cnl6endwdWhkb3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MDI5NDYsImV4cCI6MjA5NDk3ODk0Nn0.Uy3Yia4lgFKrCl2wHoQomu-_SvfA-iqdrEhCoMPzfwM';

const sb = (path, opts = {}) => {
  const { extraHeaders = {}, ...rest } = opts;
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...rest,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...extraHeaders
    }
  });
};

const DEFAULT_CONFIG = {
  personality: `Você é Val, uma mulher de 50 anos, educada, formal e acolhedora. Especialista em saúde, sexualidade e relacionamentos. Responda sempre em português do Brasil, de forma respeitosa, empática e formal. Use "você" (nunca "tu"). Seja paciente e gentil. Nunca se apresente como IA ou robô.`,
  topics: `Responda APENAS sobre saúde (bem-estar, saúde mental, física, preventiva), sexualidade (intimidade, identidade, prazer saudável, saúde sexual) e relacionamentos (família, amizades, amor, autoestima). Se perguntarem outro tema, diga educadamente que só trata desses assuntos.`,
  rules: `Nunca forneça diagnósticos médicos definitivos. Recomende sempre buscar um profissional quando necessário. Mantenha confidencialidade e respeito absoluto. Nunca seja julgamental sobre escolhas pessoais ou orientação sexual.`,
  welcome: `Olá! Seja muito bem-vinda(o). É um prazer tê-la(o) aqui. Meu nome é Val, e estou aqui para conversar sobre saúde, sexualidade e relacionamentos. Como posso ajudá-la(o) hoje?`
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { action, payload } = req.body;

  try {

    // ── CONFIG ──────────────────────────────────────────────
    if (action === 'getConfig') {
      const r = await sb('configs?id=eq.main');
      const d = await r.json();
      return res.json(d[0] || DEFAULT_CONFIG);
    }

    if (action === 'saveConfig') {
      const r = await sb('configs', {
        method: 'POST',
        extraHeaders: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ id: 'main', ...payload, updated_at: new Date().toISOString() })
      });
      const d = await r.json();
      console.log('saveConfig result:', JSON.stringify(d).substring(0, 200));
      return res.json({ ok: true });
    }

    // ── HISTÓRICO ────────────────────────────────────────────
    if (action === 'getHistory') {
      const r = await sb(`historico?usuario=eq.${encodeURIComponent(payload.usuario)}&order=created_at.asc`);
      return res.json(await r.json());
    }

    if (action === 'getAllHistory') {
      const r = await sb('historico?order=created_at.desc');
      return res.json(await r.json());
    }

    if (action === 'saveHistory') {
      await sb('historico', { method: 'POST', body: JSON.stringify(payload) });
      return res.json({ ok: true });
    }

    if (action === 'deleteHistory') {
      await sb(`historico?usuario=eq.${encodeURIComponent(payload.usuario)}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    // ── BASE DE CONHECIMENTO ─────────────────────────────────
    if (action === 'getKb') {
      const r = await sb('conhecimento?order=created_at.asc');
      return res.json(await r.json());
    }

    if (action === 'saveKb') {
      await sb('conhecimento', { method: 'POST', body: JSON.stringify(payload) });
      return res.json({ ok: true });
    }

    if (action === 'deleteKb') {
      await sb(`conhecimento?id=eq.${payload.id}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    // ── SENHAS ───────────────────────────────────────────────
    if (action === 'getPassword') {
      const r = await sb(`senhas?usuario=eq.${encodeURIComponent(payload.usuario)}`);
      const d = await r.json();
      return res.json({ senha: d[0]?.senha || null });
    }

    if (action === 'savePassword') {
      await sb('senhas', {
        method: 'POST',
        extraHeaders: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() })
      });
      return res.json({ ok: true });
    }

    // ── SUGESTÕES ────────────────────────────────────────────
    if (action === 'saveSugestao') {
      await sb('sugestoes', {
        method: 'POST',
        body: JSON.stringify({
          usuario:    payload.usuario,
          tipo:       payload.tipo,
          titulo:     payload.titulo,
          descricao:  payload.descricao,
          status:     'pendente',
          nota_admin: null,
          created_at: new Date().toISOString()
        })
      });
      return res.json({ ok: true });
    }

    if (action === 'getSugestoes') {
      const r = await sb(`sugestoes?usuario=eq.${encodeURIComponent(payload.usuario)}&order=created_at.desc`);
      return res.json(await r.json());
    }

    if (action === 'getAllSugestoes') {
      const r = await sb('sugestoes?order=created_at.desc');
      return res.json(await r.json());
    }

    if (action === 'updateSugestao') {
      await sb(`sugestoes?id=eq.${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status:     payload.status,
          nota_admin: payload.nota_admin || null,
          updated_at: new Date().toISOString()
        })
      });
      return res.json({ ok: true });
    }

    // ── REQUISITOS DE INDICAÇÃO ──────────────────────────────
    if (action === 'getRequisitos') {
      const r = await sb('configs?id=eq.requisitos_indicacao');
      const d = await r.json();
      if (d && d[0]) return res.json({ min_quiz: d[0].min_quiz ?? 1, min_dias: d[0].min_dias ?? 30 });
      return res.json({ min_quiz: 1, min_dias: 30 });
    }

    if (action === 'saveRequisitos') {
      await sb('configs', {
        method: 'POST',
        extraHeaders: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id: 'requisitos_indicacao',
          min_quiz: payload.min_quiz,
          min_dias: payload.min_dias,
          updated_at: new Date().toISOString()
        })
      });
      return res.json({ ok: true });
    }

    // ── INDICAÇÕES ───────────────────────────────────────────
    if (action === 'saveIndicacao') {
      await sb('indicacoes', {
        method: 'POST',
        body: JSON.stringify({
          indicante:     payload.indicante,
          nome_indicada: payload.nome_indicada,
          idade:         payload.idade,
          estado_civil:  payload.estado_civil,
          meio_contato:  payload.meio_contato,
          contato:       payload.contato,
          descricao:     payload.descricao,
          status:        'pendente',
          motivo_admin:  null,
          created_at:    new Date().toISOString()
        })
      });
      return res.json({ ok: true });
    }

    if (action === 'getIndicacoes') {
      const r = await sb(`indicacoes?indicante=eq.${encodeURIComponent(payload.usuario)}&order=created_at.desc`);
      return res.json(await r.json());
    }

    if (action === 'getAllIndicacoes') {
      const r = await sb('indicacoes?order=created_at.desc');
      return res.json(await r.json());
    }

    if (action === 'updateIndicacao') {
      await sb(`indicacoes?id=eq.${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status:       payload.status,
          motivo_admin: payload.motivo_admin || null,
          updated_at:   new Date().toISOString()
        })
      });
      return res.json({ ok: true });
    }

    // ── QUIZ RESULTADOS ──────────────────────────────────────
    if (action === 'saveQuizResultado') {
      await sb('quiz_resultados', {
        method: 'POST',
        body: JSON.stringify({
          usuario:      payload.usuario,
          pontuacao:    payload.pontuacao,
          perfil:       payload.perfil,
          respostas:    payload.respostas,
          bloco_scores: payload.bloco_scores,
          created_at:   new Date().toISOString()
        })
      });
      return res.json({ ok: true });
    }

    if (action === 'getQuizResultados') {
      const r = await sb(`quiz_resultados?usuario=eq.${encodeURIComponent(payload.usuario)}&order=created_at.desc`);
      return res.json(await r.json());
    }

    if (action === 'getAllQuizResultados') {
      const r = await sb('quiz_resultados?order=created_at.desc');
      return res.json(await r.json());
    }

    // ── CHAT COM A VAL ───────────────────────────────────────
    if (action === 'chat') {
      const { system, messages } = payload;

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: system || '',
          messages
        })
      });

      const d = await r.json();
      console.log('Anthropic response type:', d.type, '| stop_reason:', d.stop_reason);

      if (!r.ok) {
        console.error('Anthropic error:', JSON.stringify(d));
        return res.json({ error: d.error?.message || 'Erro na API' });
      }

      const reply = Array.isArray(d.content)
        ? d.content.filter(b => b.type === 'text').map(b => b.text).join('')
        : '';

      if (!reply) {
        console.error('Empty reply. Full response:', JSON.stringify(d));
        return res.json({ error: 'Resposta vazia da API' });
      }

      return res.json({ reply });
    }

    return res.status(400).json({ error: 'Ação desconhecida' });

  } catch (e) {
    console.error('Unhandled error:', e);
    return res.status(500).json({ error: e.message });
  }
};
