/**
 * Vercel serverless — sends proposal responses to Discord.
 * Set DISCORD_WEBHOOK_URL in Vercel → Settings → Environment Variables → Redeploy.
 */

function formatMessage(data) {
  const maxPts = data.compatibilityMaxScore ?? 18;
  const lines = [
    '💌 **Proposal site update**',
    '',
    typeof data.compatibilityPercent === 'number'
      ? `**Compatibility:** ${data.compatibilityPercent}% (${data.compatibilityScore ?? '?'}/${maxPts}) — ${data.compatibilityPassed ? '✅ Girlfriend question' : '🌙 Soft ending'}`
      : null,
    data.favoritePartner ? `**Name:** ${data.favoritePartner}` : null,
    data.termsAccepted ? '**Terms:** accepted' : null,
    data.saidYes ? '**She said YES!** ❤️' : null,
  ].filter(Boolean);

  if (data.questionnaireAnswers && Object.keys(data.questionnaireAnswers).length) {
    lines.push('', '**Answers:**');
    Object.keys(data.questionnaireAnswers)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((key) => {
        const q = data.questionnaireAnswers[key];
        lines.push(`• Q${Number(key) + 1}: ${q.answer}`);
      });
  }

  lines.push('', `_${data.updatedAt || new Date().toISOString()}_`);
  const text = lines.join('\n').trim();
  return text.length ? text.slice(0, 1900) : 'Proposal site activity';
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.length) {
    return JSON.parse(req.body);
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function postToDiscord(webhook, content) {
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Discord ${res.status}: ${errText.slice(0, 200)}`);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const webhook = process.env.DISCORD_WEBHOOK_URL;

  if (!webhook) {
    return res.status(200).json({
      ok: false,
      notified: false,
      error: 'DISCORD_WEBHOOK_URL is not set in Vercel environment variables',
    });
  }

  if (req.method === 'GET') {
    try {
      await postToDiscord(webhook, '✅ **Test message** — Discord is connected to your proposal site.');
      return res.status(200).json({ ok: true, notified: true, message: 'Test sent to Discord' });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use GET to test or POST to send data' });
  }

  try {
    const data = await readJsonBody(req);
    await postToDiscord(webhook, formatMessage(data));
    return res.status(200).json({ ok: true, notified: true });
  } catch (err) {
    console.error('notify error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to send' });
  }
}
