/**
 * Vercel serverless — sends proposal responses to your Discord (or logs if unset).
 * Set DISCORD_WEBHOOK_URL in Vercel → Project → Settings → Environment Variables
 */
function formatMessage(data) {
  const lines = [
    '💌 **New proposal site activity**',
    '',
    data.compatibilityPercent != null
      ? `**Compatibility:** ${data.compatibilityPercent}% (${data.compatibilityScore ?? '?'}/20) — ${data.compatibilityPassed ? '✅ Confession path' : '🌙 Soft ending'}`
      : null,
    data.favoritePartner ? `**Dance partner name:** ${data.favoritePartner}` : null,
    data.saidYes ? '**She said YES!** ❤️' : null,
    data.termsAccepted ? '**Terms accepted:** yes' : null,
  ].filter(Boolean);

  if (data.questionnaireAnswers && Object.keys(data.questionnaireAnswers).length) {
    lines.push('', '**Questionnaire:**');
    Object.keys(data.questionnaireAnswers)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((key) => {
        const q = data.questionnaireAnswers[key];
        lines.push(`Q${Number(key) + 1}: ${q.answer} (${q.score ?? '?'} pts)`);
      });
  }

  lines.push('', `_Updated: ${data.updatedAt || new Date().toISOString()}_`);
  return lines.join('\n').slice(0, 1900);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const webhook = process.env.DISCORD_WEBHOOK_URL;

  if (!webhook) {
    return res.status(200).json({
      ok: true,
      notified: false,
      hint: 'Add DISCORD_WEBHOOK_URL in Vercel environment variables',
    });
  }

  try {
    const discordRes = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: formatMessage(data) }),
    });

    if (!discordRes.ok) {
      throw new Error(`Discord returned ${discordRes.status}`);
    }

    return res.status(200).json({ ok: true, notified: true });
  } catch (err) {
    console.error('notify error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to send notification' });
  }
}
