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

/*
 * GIF เฉพาะหน้ารหัสความทรงจำ + หน้าแตะเพื่อเริ่ม (ใส่ "ลิงก์ตรงของไฟล์ GIF")
 * ถ้าช่องไหนว่าง ระบบจะใช้ GIF เดิมแทน
 */
const passwordGifs = {
  // ตอบผิดครั้งที่ 1, 2, 3, 4 (ครั้งที่ 5 ขึ้นไปใช้อันที่ 4)
  wrong: ['gifs/wrong-1.webp', 'gifs/wrong-2.webp', 'gifs/wrong-3.webp', 'gifs/wrong-4.webp'],
  correct: 'gifs/correct.webp', // ตอนขึ้นคำชม "เก่งมากค้าบคุณณณณ"
  opening: 'gifs/opening.gif',  // บนการ์ด "แตะเพื่อเริ่ม" แทน ❄
};
const fallbackWrongGifs = ['angry1', 'angry1', 'angry2', 'angry2'];
// โหลดรูปตอบผิด/ตอบถูกล่วงหน้า จะได้ขึ้นทันทีไม่กระพริบ
[...passwordGifs.wrong, passwordGifs.correct].filter(Boolean).forEach((src) => { new Image().src = src; });

function setReactionUrl(url, fallbackKey, caption) {
  if (url) {
    reactionGif.src = url;
    reactionGif.alt = `GIF: ${caption}`;
    reactionCaption.textContent = caption;
  } else setReaction(fallbackKey, caption);
}

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
  reactionGif.src = reactionGifs[key] || key; // ใส่ชื่อจาก reactionGifs หรือ path ของไฟล์ก็ได้
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

// GIF บนการ์ด "แตะเพื่อเริ่ม" (ถ้าใส่ลิงก์ไว้ใน passwordGifs.opening)
if (passwordGifs.opening) {
  $('#openingGif').src = passwordGifs.opening;
  $('#openingGif').hidden = false;
  $('#startSnow').hidden = true;
}

$('#startExperienceButton').addEventListener('click', () => {
  shouldStartMusic = true;
  createMusicPlayer();
  $('#startOverlay').classList.add('is-leaving');
  document.body.classList.remove('is-starting');
  window.setTimeout(() => { $('#startOverlay').hidden = true; }, 600);
});

$('#musicButton').addEventListener('click', () => { $('#musicDrawer').hidden = !$('#musicDrawer').hidden; });
$('#endMusicButton').addEventListener('click', () => { $('#musicDrawer').hidden = false; });
$('#closeMusicDrawer').addEventListener('click', () => { $('#musicDrawer').hidden = true; });
// ปุ่ม "ดูวิว": ซ่อนการ์ดชั่วคราว แล้วแตะ "กลับมาอ่านต่อ" (หรือปุ่มเดิม) เพื่อเอาการ์ดกลับมา
function setViewingScene(isViewing) {
  document.body.classList.toggle('is-viewing', isViewing);
  $('#viewSceneButton').setAttribute('aria-pressed', String(isViewing));
  $('#viewSceneButton').textContent = isViewing ? 'กลับ' : 'ดูวิว';
  $('#viewReturnButton').hidden = !isViewing;
}
$('#viewSceneButton').addEventListener('click', () => setViewingScene(!document.body.classList.contains('is-viewing')));
$('#viewReturnButton').addEventListener('click', () => setViewingScene(false));

$('#returnInstagramButton').addEventListener('click', () => history.length > 1 ? history.back() : window.close());

function reactionForStep(step) {
  if (step === 1) return ['nervous', 'ผมกำลังลุ้นอยู่นะ'];
  if (step === 2) return wrongAttempts ? [passwordGifs.wrong[Math.min(wrongAttempts, 4) - 1] || 'angry1', 'ยังจำได้ไหมมม'] : ['nervous', 'ลองนึกดูดี ๆ นะ'];
  if (step === 3) return ['shocked', 'หื้ยยยยย ใช่ป่าววว'];
  if (step === 6) return ['gifs/flowers.gif', 'ผมอ่านอยู่นะ'];
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
  // ทรานซิชันตอนเปลี่ยนหน้า: เพนกวินกระโดด + GIF ค่อย ๆ เปลี่ยน (ดู .is-stepping ใน styles.css)
  document.body.classList.remove('is-stepping');
  void document.body.offsetWidth;
  document.body.classList.add('is-stepping');
  window.clearTimeout(renderStep.timer);
  renderStep.timer = window.setTimeout(() => document.body.classList.remove('is-stepping'), 700);
}

function goToStep(step) {
  currentStep = Math.min(totalSteps, Math.max(1, step));
  renderStep();
}

/*
 * ปุ่ม "วันนี้ยังไม่พร้อม" แบบกวน ๆ
 * - แตะ/เอาเมาส์ไปใกล้ ครั้งที่ 1–3: ปุ่มกระโดดหนี + หดลง (ทั้งปุ่มและตัวอักษร) ส่วน "อ่านต่อ" ใหญ่ขึ้น
 * - ครั้งที่ 4: ปุ่มเดินออกนอกจอ แล้วเดินกลับมาเองหลัง NOT_READY_RETURN_MS ในขนาดปกติ
 * - หลังกลับมา ปุ่มไม่หนีแล้ว กดได้จริง → ขึ้นหน้า "ไม่เป็นไรนะ"
 */
const NOT_READY_DODGES = 3;            // จำนวนครั้งที่หนี+หด ก่อนเดินออกจอ
const NOT_READY_RETURN_MS = 8000;      // เดินออกไปนานเท่าไหร่ก่อนกลับมา
const notReadyButton = $('#notReadyButton');
const readButton = $('[data-panel="1"] [data-next]');
let notReadyState = 'dodging';         // dodging → away → back
let lastDodgeAt = 0;

function setNotReadyScale(count) {
  notReadyButton.style.setProperty('--run-scale', String(1 - count * 0.18));
  readButton.style.setProperty('--primary-scale', String(1 + count * 0.07));
}

function dodgeNotReadyButton() {
  if (notReadyState !== 'dodging') return false;
  const now = Date.now();
  if (now - lastDodgeAt < 350) return true; // กันนับซ้ำตอน hover แล้วคลิกต่อทันที
  lastDodgeAt = now;
  escapeCount += 1;

  if (escapeCount > NOT_READY_DODGES) {
    walkNotReadyAway();
    return true;
  }

  // สุ่มที่หนีภายในการ์ด สลับซ้ายขวาเพื่อให้เห็นว่าหนีจริง
  const zoneWidth = notReadyButton.parentElement.clientWidth;
  const side = escapeCount % 2 ? 1 : -1;
  const x = side * Math.round(zoneWidth * (0.12 + Math.random() * 0.14));
  const y = Math.round(4 + Math.random() * 14);
  notReadyButton.style.setProperty('--run-x', `${x}px`);
  notReadyButton.style.setProperty('--run-y', `${y}px`);
  setNotReadyScale(escapeCount);
  notReadyButton.classList.add('is-running');
  window.setTimeout(() => notReadyButton.classList.remove('is-running'), 520);
  return true;
}

function walkNotReadyAway() {
  notReadyState = 'away';
  notReadyButton.classList.remove('is-returning');
  notReadyButton.classList.add('is-running', 'is-walking-away');
  notReadyButton.setAttribute('aria-hidden', 'true');
  notReadyButton.tabIndex = -1;

  window.setTimeout(() => {
    // เดินกลับมาในขนาดปกติ และกดได้จริง
    notReadyState = 'back';
    notReadyButton.style.setProperty('--run-x', '0px');
    notReadyButton.style.setProperty('--run-y', '0px');
    setNotReadyScale(0);
    notReadyButton.classList.remove('is-walking-away');
    notReadyButton.classList.add('is-returning');
    notReadyButton.removeAttribute('aria-hidden');
    notReadyButton.tabIndex = 0;
    window.setTimeout(() => notReadyButton.classList.remove('is-running', 'is-returning'), 2100);
  }, NOT_READY_RETURN_MS);
}

notReadyButton.addEventListener('pointerenter', (event) => {
  if (event.pointerType === 'mouse') dodgeNotReadyButton();
});
notReadyButton.addEventListener('click', (event) => {
  if (dodgeNotReadyButton()) return event.preventDefault();
  if (notReadyState === 'away') return event.preventDefault();
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
  const numbers = normalized.match(/[0-9๐-๙]+/g) ?? [];
  if (numbers.some((number) => number !== '3' && number !== '๓')) return false;
  if (/ภาค(?:หนึ่ง|สอง|สี่|ห้า)/.test(normalized)) return false;
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
  const wrongIndex = Math.min(wrongAttempts, 4) - 1;
  setReactionUrl(passwordGifs.wrong[wrongIndex], fallbackWrongGifs[wrongIndex], wrongAttempts > 1 ? 'ผมเริ่มกระทืบเท้าแล้วนะ!' : 'ผมเริ่มงอนแล้วนะ');
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
  setReactionUrl(passwordGifs.correct, 'happy', 'เก่งมากค้าบคุณณณณ');
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
  // แสดงช่อดอกไม้ตามที่เลือกอยู่ทันที (pixel art จาก pixel-art.js)
  if (window.SnowyPixel) $('#bouquetPreview').innerHTML = window.SnowyPixel.bouquet(draft.flowers, draft.leaf, draft.ribbon);
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
  $('#bouquetPreview').classList.add('is-done'); // เด้งฉลองตอนจัดช่อเสร็จ
  $('#createBouquetButton').disabled = true;
  localStorage.setItem('snowy-love-draft', JSON.stringify(draft));
  await window.snowyBackend.saveAnswer({ page: 6, key: 'bouquet', type: 'bouquet', payload: { flowers: draft.flowers, leaf: draft.leaf, ribbon: draft.ribbon } }).catch(() => showToast('เก็บช่อไว้ในเครื่องแล้ว จะลองส่งใหม่อีกครั้ง'));
  showToast('จัดช่อเสร็จแล้ว!');
  // เฉลย: โชว์ช่อของเขาคู่กับช่อกุหลาบ 10 ดอกที่ผมจัดให้ แล้วให้เขากด "ไปต่อ" เองเมื่อดูพอแล้ว
  window.setTimeout(() => {
    $('#yourBouquet').innerHTML = window.SnowyPixel.bouquet(draft.flowers, draft.leaf, draft.ribbon);
    $('#myBouquet').innerHTML = window.SnowyPixel.roseBouquet('ชมพู');
    $('#bouquetBuilder').hidden = true;
    $('#bouquetReveal').hidden = false;
    $('#bouquetReveal').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 900);
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-next]')) goToStep(currentStep + 1);
  if (event.target.closest('[data-back]')) goToStep(currentStep - 1);
});

renderStep();
