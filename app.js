const totalSteps = 8;
let currentStep = 1;
let escapeCount = 0;
let wrongAttempts = 0;
let hintLevel = 0;

const draft = { memory: "", feeling: "", work: "", message: "", flowers: [], leaf: "", ribbon: "" };
const reactionGifs = {
  nervous: "https://media.giphy.com/media/Wpnp8ESQcjfPXeCO2r/giphy.gif",
  angry1: "https://media.giphy.com/media/qqtsoAV7CDzVvM1BRR/giphy.gif",
  angry2: "https://media.giphy.com/media/2RVOucql3F60DKXK2r/giphy.gif",
  shocked: "https://media.giphy.com/media/aLR5MFmLZLI9KkD4ZU/giphy.gif",
  happy: "https://media.giphy.com/media/2uaneUSer0ikUtRhgJ/giphy.gif",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const panels = $$('[data-panel]');
const reactionGif = $('#reactionGif');
const reactionCaption = $('#reactionCaption');
const progressDots = $('#progressDots');
let youtubePlayer = null;
let shouldStartMusic = false;

for (let index = 1; index <= totalSteps; index += 1) {
  const dot = document.createElement('i');
  dot.dataset.dot = String(index);
  progressDots.append(dot);
}

function setReaction(key, caption) {
  reactionGif.src = reactionGifs[key];
  reactionGif.alt = `เพนกวินแสดงอารมณ์: ${caption}`;
  reactionCaption.textContent = caption;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

function createMusicPlayer() {
  if (youtubePlayer || !window.YT?.Player) return;
  youtubePlayer = new window.YT.Player('youtubePlayer', {
    height: '135',
    width: '240',
    videoId: window.SNOWY_CONFIG.youtubeVideoId,
    playerVars: { autoplay: 1, controls: 1, loop: 1, playlist: window.SNOWY_CONFIG.youtubeVideoId, playsinline: 1 },
    events: { onReady: (event) => { event.target.setVolume(30); if (shouldStartMusic) event.target.playVideo(); } },
  });
}

window.onYouTubeIframeAPIReady = () => { if (shouldStartMusic) createMusicPlayer(); };

$('#startExperienceButton').addEventListener('click', () => {
  shouldStartMusic = true;
  createMusicPlayer();
  $('#startOverlay').classList.add('is-leaving');
  window.setTimeout(() => { $('#startOverlay').hidden = true; }, 600);
});

$('#musicButton').addEventListener('click', () => { $('#musicDrawer').hidden = !$('#musicDrawer').hidden; });
$('#closeMusicDrawer').addEventListener('click', () => { $('#musicDrawer').hidden = true; });
$('#returnInstagramButton').addEventListener('click', () => history.length > 1 ? history.back() : window.close());

function reactionForStep(step) {
  if (step === 1) return ['nervous', 'ผมกำลังลุ้นอยู่นะ'];
  if (step === 2) return wrongAttempts ? [wrongAttempts > 1 ? 'angry2' : 'angry1', 'ยังจำได้ไหมมม'] : ['nervous', 'ลองนึกดูดี ๆ นะ'];
  if (step === 3) return ['shocked', 'หื้ยยยยย ใช่ป่าววว'];
  if (step === 8) return ['happy', 'ขอบคุณที่อ่านจนจบนะ'];
  return ['happy', 'ผมอ่านอยู่นะ'];
}

function renderStep() {
  document.body.dataset.step = String(currentStep);
  $('#stepNumber').textContent = String(currentStep);
  for (const panel of panels) panel.hidden = Number(panel.dataset.panel) !== currentStep;
  for (const dot of progressDots.children) dot.classList.toggle('is-current', Number(dot.dataset.dot) === currentStep);
  setReaction(...reactionForStep(currentStep));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep(step) {
  currentStep = Math.min(totalSteps, Math.max(1, step));
  renderStep();
}

function moveNotReadyButton() {
  if (escapeCount >= 2) return false;
  const positions = [{ x: '18px', y: '5px' }, { x: '-18px', y: '4px' }];
  const button = $('#notReadyButton');
  const position = positions[escapeCount];
  escapeCount += 1;
  button.style.setProperty('--run-x', position.x);
  button.style.setProperty('--run-y', position.y);
  button.classList.add('is-running');
  $('[data-panel="1"] [data-next]').style.setProperty('--primary-scale', String(1 + escapeCount * 0.04));
  window.setTimeout(() => button.classList.remove('is-running'), 520);
  return true;
}

$('#notReadyButton').addEventListener('pointerenter', (event) => {
  if (event.pointerType === 'mouse') moveNotReadyButton();
});
$('#notReadyButton').addEventListener('click', (event) => {
  if (moveNotReadyButton()) return event.preventDefault();
  $('#exitOverlay').hidden = false;
});
$('#returnButton').addEventListener('click', () => { $('#exitOverlay').hidden = true; });

function normalizeAnswer(value) {
  return value.normalize('NFKC').toLowerCase().replace(/[\s\-_:;,.!?"'()\[\]{}]/g, '');
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, row) => [row]);
  for (let column = 0; column <= a.length; column += 1) matrix[0][column] = column;
  for (let row = 1; row <= b.length; row += 1) {
    for (let column = 1; column <= a.length; column += 1) {
      const cost = a[column - 1] === b[row - 1] ? 0 : 1;
      matrix[row][column] = Math.min(matrix[row - 1][column] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column - 1] + cost);
    }
  }
  return matrix[b.length][a.length];
}

function isAvatarAnswer(value) {
  const normalized = normalizeAnswer(value);
  if (!normalized) return false;
  const accepted = ['avatar', 'avatar3', 'อวตาร', 'อวตาร3', 'อวาตาร', 'อวาตาร3', 'อวาร์ตาน', 'อวตาน', 'อวตารอัคนีและธุลีดิน'];
  return accepted.some((answer) => normalized.includes(answer) || levenshtein(normalized, answer) <= 2);
}

$('#passwordForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = $('#memoryAnswer');
  const value = input.value.trim();
  if (isAvatarAnswer(value)) {
    draft.memory = value;
    $('#confirmedMemory').textContent = value;
    $('#passwordMessage').textContent = '';
    await window.snowyBackend.saveAnswer({ page: 2, key: 'memory', value }).catch(() => showToast('เก็บไว้ในเครื่องแล้ว จะลองส่งใหม่อีกครั้ง'));
    goToStep(3);
    return;
  }
  wrongAttempts += 1;
  if (value) window.snowyBackend.saveAnswer({ page: 2, key: `memory_try_${wrongAttempts}`, value }).catch(() => {});
  $('#passwordMessage').textContent = wrongAttempts === 1 ? 'เอ๊ะ…เรื่องนั้นจริงเหรอ ลองอีกทีนะ' : 'ยังไม่ใช่อ่า ลองขอคำใบ้ดูไหม';
  setReaction(wrongAttempts > 1 ? 'angry2' : 'angry1', wrongAttempts > 1 ? 'ผมเริ่มกระทืบเท้าแล้วนะ!' : 'ผมเริ่มงอนแล้วนะ');
  $('#hintRunner').hidden = false;
});

$('#hintButton').addEventListener('click', () => {
  hintLevel = Math.min(3, hintLevel + 1);
  const hints = ['ตัวฟ้า ๆ อะคุณ 👀', 'หนังเรื่องแรกที่เราไปดูด้วยกันไง', 'ขึ้นต้นด้วย A นะ จำได้หรือยังงง'];
  const runner = $('#hintRunner');
  runner.hidden = false;
  $('#hintText').textContent = hints[hintLevel - 1];
  runner.classList.remove('is-entering');
  requestAnimationFrame(() => runner.classList.add('is-entering'));
  setReaction('angry1', 'ต้องให้ใบ้ด้วยเหรอเนี่ยยย');
});

$('#confirmAnswerButton').addEventListener('click', (event) => {
  $('#confirmationPraise').hidden = false;
  event.currentTarget.disabled = true;
  setReaction('happy', 'เก่งมากค้าบคุณณณณ');
  window.setTimeout(() => goToStep(4), 1600);
});

for (const form of $$('.answer-form')) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton.disabled) return;
    const field = form.querySelector('textarea');
    const value = field.value.trim();
    if (!value) {
      showToast('พิมพ์อะไรสักนิดก่อนนะ');
      field.focus();
      return;
    }
    draft[form.dataset.answerKey] = value;
    localStorage.setItem('snowy-love-draft', JSON.stringify(draft));
    const page = currentStep;
    if (form.dataset.answerKey === 'message' && !window.snowyBackend.configured) {
      showToast('ยังไม่เชื่อมระบบส่งข้อความ กรุณาลองอีกครั้งภายหลัง');
      return;
    }
    submitButton.disabled = true;
    let result;
    try {
      result = await window.snowyBackend.saveAnswer({ page, key: form.dataset.answerKey, value });
    } catch {
      showToast('ส่งไม่สำเร็จ เก็บไว้ในเครื่องแล้ว กรุณาลองใหม่');
      submitButton.disabled = false;
      return;
    }
    if (form.dataset.answerKey === 'message' && result.queued) {
      showToast('ยังส่งไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่');
      submitButton.disabled = false;
      return;
    }
    if (form.dataset.answerKey === 'message') {
      await window.snowyBackend.saveAnswer({ page: 8, key: 'completed', type: 'complete', payload: { completed: true } }).catch(() => {});
    }
    goToStep(currentStep + 1);
  });
}

const flowerButtons = $$('[data-flower]');
const leafButtons = $$('[data-leaf]');
const ribbonButtons = $$('[data-ribbon]');

function updateBouquet() {
  $('#flowerStatus').textContent = `เลือกแล้ว ${draft.flowers.length}/3 ดอก`;
  $('#createBouquetButton').disabled = !(draft.flowers.length === 3 && draft.leaf && draft.ribbon);
}

for (const button of flowerButtons) {
  button.addEventListener('click', () => {
    const flower = button.dataset.flower;
    if (draft.flowers.includes(flower)) {
      draft.flowers = draft.flowers.filter((item) => item !== flower);
      button.classList.remove('is-selected');
    } else if (draft.flowers.length < 3) {
      draft.flowers.push(flower);
      button.classList.add('is-selected');
    } else showToast('เลือกได้ 3 ดอกนะ');
    updateBouquet();
  });
}

function selectOne(buttons, key) {
  for (const button of buttons) {
    button.addEventListener('click', () => {
      for (const other of buttons) other.classList.remove('is-selected');
      button.classList.add('is-selected');
      draft[key] = button.dataset[key];
      updateBouquet();
    });
  }
}

selectOne(leafButtons, 'leaf');
selectOne(ribbonButtons, 'ribbon');

$('#createBouquetButton').addEventListener('click', async () => {
  const flowers = flowerButtons.filter((button) => button.classList.contains('is-selected')).map((button) => button.textContent).join('');
  $('#bouquetPreview').textContent = `${flowers} ${draft.ribbon === 'ฟ้า' ? '🩵' : '🩷'}`;
  $('#createBouquetButton').disabled = true;
  localStorage.setItem('snowy-love-draft', JSON.stringify(draft));
  await window.snowyBackend.saveAnswer({ page: 6, key: 'bouquet', type: 'bouquet', payload: { flowers: draft.flowers, leaf: draft.leaf, ribbon: draft.ribbon } }).catch(() => showToast('เก็บช่อไว้ในเครื่องแล้ว จะลองส่งใหม่อีกครั้ง'));
  showToast('จัดช่อเสร็จแล้ว!');
  window.setTimeout(() => goToStep(7), 1200);
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-next]')) goToStep(currentStep + 1);
  if (event.target.closest('[data-back]')) goToStep(currentStep - 1);
});

renderStep();
