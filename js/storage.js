/**
 * Saves proposal data locally + sends milestones to Discord.
 *
 * EASIEST FIX: paste your Discord webhook in js/config.js → DISCORD_WEBHOOK_URL
 * OR set DISCORD_WEBHOOK_URL in Vercel environment variables (more private).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'gf_proposal_responses';
  const SESSION_KEY = 'gf_proposal_session_id';

  function getSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveAll(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function getWebhookUrl() {
    const fromConfig = window.PROPOSAL_CONFIG?.DISCORD_WEBHOOK_URL?.trim();
    return fromConfig || '';
  }

  function shouldNotify(data) {
    return (
      data.saidYes === true ||
      data.termsAccepted === true ||
      typeof data.compatibilityPercent === 'number'
    );
  }

  function formatClientMessage(data) {
    const lines = [
      '💌 Proposal site update',
      typeof data.compatibilityPercent === 'number'
        ? `Score: ${data.compatibilityPercent}% — ${data.compatibilityPassed ? 'confession' : 'soft ending'}`
        : null,
      data.favoritePartner ? `Name: ${data.favoritePartner}` : null,
      data.termsAccepted ? 'Terms accepted' : null,
      data.saidYes ? 'She said YES ❤️' : null,
    ].filter(Boolean);
    return lines.join('\n') || 'Proposal activity';
  }

  async function sendToDiscordDirect(data) {
    const webhook = getWebhookUrl();
    if (!webhook || !webhook.startsWith('https://discord.com/api/webhooks/')) {
      return { ok: false, reason: 'no_client_webhook' };
    }

    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: formatClientMessage(data) }),
    });

    if (!res.ok) {
      throw new Error(`Discord direct failed: ${res.status}`);
    }
    return { ok: true, method: 'direct' };
  }

  async function sendToVercelApi(data) {
    const url = `${window.location.origin}/api/notify`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json.error || `API error ${res.status}`);
    }

    if (json.notified === false && json.error) {
      throw new Error(json.error);
    }

    return { ok: true, method: 'api', ...json };
  }

  async function sendNotifications(data) {
    if (!shouldNotify(data)) return;

    const results = [];

    try {
      results.push(await sendToVercelApi(data));
    } catch (apiErr) {
      console.warn('[Proposal] Vercel /api/notify failed:', apiErr.message);
    }

    try {
      results.push(await sendToDiscordDirect(data));
    } catch (directErr) {
      console.warn('[Proposal] Direct Discord failed:', directErr.message);
    }

    const anyOk = results.some((r) => r?.ok);
    if (!anyOk && !getWebhookUrl()) {
      console.warn(
        '[Proposal] No Discord message sent. Add DISCORD_WEBHOOK_URL in js/config.js or Vercel env vars.'
      );
    }
  }

  window.ProposalStorage = {
    STORAGE_KEY,

    getSessionId,

    loadAll,

    loadLatest() {
      const all = loadAll();
      return all.length ? all[all.length - 1] : null;
    },

    /** @param {object} partial @param {{ notify?: boolean }} options */
    save(partial, options = {}) {
      const all = loadAll();
      const sessionId = getSessionId();
      const index = all.findIndex((e) => e.sessionId === sessionId);
      const merged = {
        ...(index >= 0 ? all[index] : { sessionId }),
        ...partial,
        sessionId,
        updatedAt: new Date().toISOString(),
      };

      if (index >= 0) {
        all[index] = merged;
      } else {
        all.push(merged);
      }

      saveAll(all);

      const notify = options.notify !== false && shouldNotify(merged);
      if (notify) {
        sendNotifications(merged);
      }

      return merged;
    },

    testDiscord() {
      return sendNotifications({
        compatibilityPercent: 99,
        compatibilityScore: 17,
        compatibilityMaxScore: 18,
        compatibilityPassed: true,
        favoritePartner: 'Test',
        termsAccepted: true,
        updatedAt: new Date().toISOString(),
      });
    },
  };
})();
