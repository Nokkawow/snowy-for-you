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

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // ส่ง 1 รายการ ถ้าเน็ตสะดุดจะลองใหม่เองอีก 2 ครั้ง (รอ 0.8 และ 2 วินาที)
  async function insertWithRetry(event) {
    let lastError = null;
    for (const delay of [0, 800, 2000]) {
      if (delay) await wait(delay);
      try {
        const { error } = await client.from('love_response_events').insert(event);
        if (!error || error.code === '23505') return null; // 23505 = เคยส่งแล้ว ถือว่าสำเร็จ
        lastError = error;
        if (error.code && /^(23|42)/.test(error.code)) break; // ข้อมูลผิดกติกา ลองซ้ำก็ไม่ผ่าน
      } catch (networkError) {
        lastError = networkError;
      }
    }
    return lastError;
  }

  async function send(event) {
    if (!client) {
      queue(event);
      return { queued: true };
    }
    const error = await insertWithRetry(event);
    if (error) {
      queue(event); // เก็บไว้ในเครื่อง แล้วส่งตามให้ทีหลังด้วย flush()
      throw error;
    }
    flush().catch(() => {}); // ส่งของที่ค้างจากรอบก่อน (ถ้ามี)
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
    const remaining = [];
    for (const event of pending) {
      const { error } = await client.from('love_response_events').insert(event);
      if (error && error.code !== '23505') remaining.push(event);
    }
    if (remaining.length) localStorage.setItem(pendingKey, JSON.stringify(remaining));
    else localStorage.removeItem(pendingKey);
  }

  window.snowyBackend = { client, configured, sessionId, saveAnswer, flush };
  flush().catch(() => {});
  // เน็ตกลับมา / กลับเข้าแอป → ส่งของที่ค้างอยู่
  window.addEventListener('online', () => flush().catch(() => {}));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) flush().catch(() => {}); });
})();
