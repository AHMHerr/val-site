const SUPABASE_URL = 'https://wphzopmzryzzwpuhdosi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHpvcG16cnl6endwdWhkb3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MDI5NDYsImV4cCI6MjA5NDk3ODk0Nn0.Uy3Yia4lgFKrCl2wHoQomu-_SvfA-iqdrEhCoMPzfwM';

const sb = (path, opts={}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
  headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...opts.headers },
  ...opts
});

const DEFAULT_CONFIG = {
  personality: `Você é Val, uma mulher de 50 anos, educada, formal e acolhedora. Especialista em saúde e relacionamentos. Responda sempre em português do Brasil, de forma respeitosa, empática e formal. Use "você" (nunca "tu"). Seja paciente e gentil. Nunca se apresente como IA ou robô.`,
  topics: `Responda APENAS sobre saúde (bem-estar, saúde mental, física, preventiva) e relacionamentos (família, amizades, amor, autoestima). Se perguntarem outro tema, diga educadamente que só trata desses assuntos.`,
  rules: `Nunca forneça diagnósticos médicos definitivos. Recomende sempre buscar um profissional quando necessário. Mantenha confidencialidade e respeito absoluto.`,
  welcome: `Olá! Seja muito bem-vindo(a). É um prazer ter você aqui. Meu nome é Val, e estou aqui para conversar sobre saúde e relacionamentos. Como posso ajudá-lo(a) hoje?`
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { action, payload } = req.body;

  try {
    // ── AÇÕES DO SUPABASE ──────────────────────────────────
    if (action === 'getConfig') {
      const r = await sb('configs?id=eq.main');
      const d = await r.json();
      return res.status(200).json(d[0] || DEFAULT_CONFIG);
    }

    if (action === 'saveConfig') {
      await sb('configs', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ id: 'main', ...payload, updated_at: new Date().toISOString() })
      });
      return res.status(200).json({ ok: true });
    }

    if (action === 'getHistory') {
      const r = await sb(`historico?usuario=eq.${payload.usuario}&order=created_at.asc`);
      const d = await r.json();
      return res.status(200).json(d);
    }

    if (action === 'getAllHistory') {
      const r = await sb('historico?order=created_at.desc');
      const d = await r.json();
      return res.status(200).json(d);
    }

    if (action === 'saveHistory') {
      await sb('historico', { method: 'POST', body: JSON.stringify(payload) });
      return res.status(200).json({ ok: true });
    }

    if (action === 'deleteHistory') {
      await sb(`historico?usuario=eq.${payload.usuario}`, { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }

    if (action === 'getKb') {
      const r = await sb('conhecimento?order=created_at.asc');
      const d = await r.json();
      return res.status(200).json(d);
    }

    if (action === 'saveKb') {
      await sb('conhecimento', { method: 'POST', body: JSON.stringify(payload) });
      return res.status(200).json({ ok: true });
    }

    if (action === 'deleteKb') {
      await sb(`conhecimento?id=eq.${payload.id}`, { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }

    if (action === 'getPassword') {
      const r = await sb(`senhas?usuario=eq.${payload.usuario}`);
      const d = await r.json();
      return res.status(200).json({ senha: d[0]?.senha || null });
    }

    if (action === 'savePassword') {
      await sb('senhas', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() })
      });
      return res.status(200).json({ ok: true });
    }

    // ── CHAT COM A VAL ─────────────────────────────────────
    if (action === 'chat') {
      const { system, messages } = payload;
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000, system: system || '', messages })
      });
      const d = await r.json();
      if (!r.ok) return res.status(200).json({ error: JSON.stringify(d) });
      return res.status(200).json({ reply: d.content?.map(i => i.text || '').join('') || '' });
    }

    return res.status(400).json({ error: 'Ação desconhecida' });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
