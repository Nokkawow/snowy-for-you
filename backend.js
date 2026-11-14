(function setupSnowyBackend() {
  const config = window.SNOWY_CONFIG ?? {};
  const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase?.createClient);
  const client = configured ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  const sessionKey = 'snowy-love-session-id';
  const pendingKey = 'snowy-love-pending-events';
  const sessionId = localStorage.getItem(sessionKey) || crypto.randomUUID();
  localStorage.setItem(sessionKey, sessionId);

  function readPending() {
    try { return JSON.parse(localStorage.getItem(pendingKey) || '[]'); }
    catch { return []; }
  }

  function queue(event) {
    const pending = readPending();
    const index = pending.findIndex((item) => item.session_id === event.session_id && item.page_number === event.page_number && item.answer_key === event.answer_key);
    if (index >= 0) pending[index] = event;
    else pending.push(event);
    localStorage.setItem(pendingKey, JSON.stringify(pending));
  }

  async function send(event) {
    if (!client) {
      queue(event);
      return { queued: true };
    }
    const { error } = await client.from('love_response_events').upsert(event, {
      onConflict: 'session_id,page_number,answer_key',
      ignoreDuplicates: true,
    });
    if (error) {
      queue(event);
      throw error;
    }
    return { queued: false };
  }

  async function saveAnswer({ page, key, value = null, payload = null, type = 'answer' }) {
    const event = {
      session_id: sessionId,
      event_type: type,
      page_number: page,
      answer_key: key,
      answer_text: value,
      payload,
    };
    return send(event);
  }

  async function flush() {
    if (!client) return;
    const pending = readPending();
    if (!pending.length) return;
    const { error } = await client.from('love_response_events').upsert(pending, {
      onConflict: 'session_id,page_number,answer_key',
      ignoreDuplicates: true,
    });
    if (!error) localStorage.removeItem(pendingKey);
  }

  window.snowyBackend = { client, configured, sessionId, saveAnswer, flush };
  flush().catch(() => {});
})();
