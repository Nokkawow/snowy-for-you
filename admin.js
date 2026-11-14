const config = window.SNOWY_CONFIG ?? {};
const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase?.createClient);
const client = configured ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
const loginPanel = document.querySelector('#loginPanel');
const dashboard = document.querySelector('#dashboard');
const logoutButton = document.querySelector('#logoutButton');
const list = document.querySelector('#responseList');

if (!configured) {
  document.querySelector('#setupNotice').hidden = false;
  loginPanel.hidden = true;
}

const labels = { memory: 'หนังเรื่องแรก', feeling: 'ตอนนี้รู้สึกอย่างไร', work: 'วันนี้ทำงานเหนื่อยไหม', bouquet: 'ช่อดอกไม้ที่เลือก', message: 'ข้อความที่อยากบอก', completed: 'ทำเว็บครบแล้ว' };
const formatDate = (value) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

function groupEvents(events) {
  return events.reduce((groups, event) => {
    (groups[event.session_id] ??= []).push(event);
    return groups;
  }, {});
}

function render(events) {
  list.replaceChildren();
  document.querySelector('#responseCount').textContent = `${events.length} รายการ`;
  document.querySelector('#emptyState').hidden = events.length > 0;
  const groups = groupEvents(events);
  for (const [sessionId, sessionEvents] of Object.entries(groups).reverse()) {
    const article = document.createElement('article');
    article.className = 'response-session';
    const completed = sessionEvents.some((event) => event.event_type === 'complete');
    article.innerHTML = `<header class="session-heading"><strong>การตอบครั้งหนึ่ง</strong><small>${formatDate(sessionEvents[0].created_at)} · ${sessionId.slice(0, 8)}</small>${completed ? '<span class="complete-badge">อ่านจบแล้ว</span>' : ''}</header><div class="event-list"></div>`;
    const eventList = article.querySelector('.event-list');
    for (const event of sessionEvents) {
      const item = document.createElement('section');
      item.className = 'event-item';
      const value = event.answer_text || (event.payload ? JSON.stringify(event.payload, null, 2) : '—');
      item.innerHTML = `<div class="event-meta"><span>หน้า ${event.page_number}</span><time>${formatDate(event.created_at)}</time></div><h3></h3>${event.payload ? '<pre></pre>' : '<p></p>'}`;
      item.querySelector('h3').textContent = labels[event.answer_key] ?? event.answer_key;
      item.querySelector(event.payload ? 'pre' : 'p').textContent = value;
      eventList.append(item);
    }
    list.append(article);
  }
}

async function loadResponses() {
  const { data, error } = await client.from('love_response_events').select('*').order('created_at', { ascending: true });
  if (error) return document.querySelector('#liveStatus').textContent = `โหลดไม่ได้: ${error.message}`;
  render(data);
  document.querySelector('#liveStatus').textContent = 'อัปเดตแบบทันที';
}

async function showDashboard(session) {
  const signedIn = Boolean(session);
  loginPanel.hidden = signedIn;
  dashboard.hidden = !signedIn;
  logoutButton.hidden = !signedIn;
  if (!signedIn) return;
  await loadResponses();
  client.channel('love-responses-admin').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'love_response_events' }, loadResponses).subscribe();
}

if (client) {
  client.auth.getSession().then(({ data }) => showDashboard(data.session));
  client.auth.onAuthStateChange((_event, session) => showDashboard(session));
}

document.querySelector('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.querySelector('#adminEmail').value.trim();
  const password = document.querySelector('#adminPassword').value;
  const { error } = await client.auth.signInWithPassword({ email, password });
  document.querySelector('#loginMessage').textContent = error ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : '';
});
document.querySelector('#refreshButton').addEventListener('click', loadResponses);
logoutButton.addEventListener('click', () => client.auth.signOut());
