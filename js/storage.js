/**
 * Saves proposal data locally + sends to your server (Discord on Vercel).
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

  function formatDiscordClient(data) {
    const lines = [
      '💌 Proposal site update',
      data.compatibilityPercent != null
        ? `Compatibility: ${data.compatibilityPercent}% — ${data.compatibilityPassed ? 'confession' : 'soft ending'}`
        : null,
      data.favoritePartner ? `Name: ${data.favoritePartner}` : null,
      data.saidYes ? 'She said YES ❤️' : null,
    ].filter(Boolean);
    return lines.join('\n').slice(0, 1900);
  }

  async function sendNotifications(data) {
    const tasks = [];

    tasks.push(
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {})
    );

    const clientWebhook = window.PROPOSAL_CONFIG?.DISCORD_WEBHOOK_URL;
    if (clientWebhook) {
      tasks.push(
        fetch(clientWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: formatDiscordClient(data) }),
        }).catch(() => {})
      );
    }

    await Promise.allSettled(tasks);
  }

  window.ProposalStorage = {
    STORAGE_KEY,

    getSessionId,

    loadAll,

    loadLatest() {
      const all = loadAll();
      return all.length ? all[all.length - 1] : null;
    },

    save(partial) {
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
      sendNotifications(merged);
      return merged;
    },
  };
})();
