module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { system, messages } = req.body;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
'x-api-key': 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,
        'anthropic-version': '2023-06-01'
      },
body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1000, system, messages })    });
    const d = await r.json();
    res.status(200).json({ reply: d.content?.map(i => i.text||'').join('') || '' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
