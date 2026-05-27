/**
 * Saves proposal form data locally and optionally to a webhook (Google Sheet, etc.)
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'gf_proposal_responses';
  const SESSION_KEY = 'gf_proposal_session_id';

  // Paste your Google Apps Script Web App URL here to receive responses on your phone/PC
  // See responses.html for setup instructions
  const WEBHOOK_URL = '';

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

  async function sendToWebhook(data) {
    if (!WEBHOOK_URL) return;
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn('Could not send to webhook:', err);
    }
  }

  window.ProposalStorage = {
    STORAGE_KEY,
    WEBHOOK_URL,

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
      sendToWebhook(merged);
      return merged;
    },
  };
})();
