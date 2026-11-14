/*
 * snow.js — หิมะตกแบบ pixel art บน <canvas id="snowCanvas">
 *
 * วิธีทำงาน: วาดหิมะลงบน canvas ความละเอียดต่ำ (1 พิกเซลของ canvas = PIXEL_SIZE พิกเซลบนจอ)
 * แล้วให้ CSS ขยายภาพแบบ pixelated เกล็ดหิมะจึงเป็นสี่เหลี่ยมคม ๆ เข้ากับภาพพื้นหลัง
 *
 * ปรับความรู้สึกได้ที่ SNOW_SETTINGS ด้านล่าง ไม่ต้องแตะส่วนอื่น
 */
(() => {
  const SNOW_SETTINGS = {
    PIXEL_SIZE: 3,          // ขนาด 1 พิกเซลศิลป์ (px บนจอ) ยิ่งมากยิ่งดูเป็นพิกเซลชัด
    FLAKES_PER_10K: 24,    // จำนวนเกล็ดต่อพื้นที่ 10,000 พิกเซลศิลป์ (ความหนาแน่น)
    MAX_FLAKES: 140,        // เพดานจำนวนเกล็ด กันจอใหญ่หนักเกินไป
    WIND: 2.5,              // ลมพัดไปทางขวา (พิกเซลศิลป์/วินาที) ใส่ค่าลบถ้าอยากให้พัดซ้าย
    REDUCED_MOTION_FLAKES: 24, // จำนวนเกล็ดนิ่ง ๆ เมื่อเครื่องเปิดโหมดลดการเคลื่อนไหว
  };

  // 3 ชั้นระยะ: ไกล (เล็ก ช้า จาง) → ใกล้ (ใหญ่ เร็ว ชัด)
  const LAYERS = [
    { share: 0.45, size: 1, speed: [6, 10],  sway: [0.6, 1.2], alpha: 0.6,  color: '#d6ebff' },
    { share: 0.35, size: 1, speed: [11, 17], sway: [1.0, 2.0], alpha: 0.85, color: '#ffffff' },
    { share: 0.2,  size: 2, speed: [18, 26], sway: [1.5, 3.0], alpha: 0.95, color: '#ffffff' },
  ];

  const canvas = document.getElementById('snowCanvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const realMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  // สำหรับทดสอบ: เปิดด้วย ?motion=on เพื่อบังคับให้หิมะตก แม้เครื่องจะตั้ง "ลดการเคลื่อนไหว" ไว้
  const forceMotion = new URLSearchParams(window.location.search).get('motion') === 'on';
  const motionQuery = forceMotion
    ? { matches: false, addEventListener: null }
    : realMotionQuery;

  let width = 0;   // หน่วยพิกเซลศิลป์
  let height = 0;
  let flakes = [];
  let frameId = 0;
  let lastTime = 0;

  const random = (min, max) => min + Math.random() * (max - min);

  function pickLayer() {
    let roll = Math.random();
    for (const layer of LAYERS) {
      if ((roll -= layer.share) <= 0) return layer;
    }
    return LAYERS[0];
  }

  function makeFlake(startAnywhere) {
    const layer = pickLayer();
    return {
      layer,
      x: random(0, width),
      y: startAnywhere ? random(0, height) : random(-12, -2),
      speed: random(...layer.speed),
      swayAmp: random(...layer.sway),
      swayFreq: random(0.4, 1.1),
      phase: random(0, Math.PI * 2),
      // เกล็ดใหญ่บางเกล็ดเป็นรูปกากบาทเล็ก ๆ ให้ดูระยิบ
      cross: layer.size === 2 && Math.random() < 0.3,
    };
  }

  function resize() {
    const px = SNOW_SETTINGS.PIXEL_SIZE;
    width = Math.max(1, Math.ceil(window.innerWidth / px));
    height = Math.max(1, Math.ceil(window.innerHeight / px));
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;

    const target = motionQuery.matches
      ? SNOW_SETTINGS.REDUCED_MOTION_FLAKES
      : Math.min(SNOW_SETTINGS.MAX_FLAKES, Math.round((width * height) / 10000 * SNOW_SETTINGS.FLAKES_PER_10K));

    // เก็บเกล็ดเดิมไว้ เติมหรือตัดให้ได้จำนวนใหม่ จะได้ไม่กระพริบตอนหมุนจอ
    flakes = flakes.filter((f) => f.x < width && f.y < height).slice(0, target);
    while (flakes.length < target) flakes.push(makeFlake(true));
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    for (const f of flakes) {
      const x = Math.round(f.x + Math.sin(time * f.swayFreq + f.phase) * f.swayAmp);
      const y = Math.round(f.y);
      ctx.globalAlpha = f.layer.alpha;
      ctx.fillStyle = f.layer.color;
      if (f.cross) {
        ctx.fillRect(x, y - 1, 1, 3);
        ctx.fillRect(x - 1, y, 3, 1);
      } else {
        ctx.fillRect(x, y, f.layer.size, f.layer.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    // จำกัด dt กันหิมะกระโดดเมื่อกลับมาจากแอปอื่น
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.y += f.speed * dt;
      f.x += SNOW_SETTINGS.WIND * dt * (f.layer.size === 2 ? 1.4 : 1);
      if (f.y > height + 3) flakes[i] = makeFlake(false);
      else if (f.x > width + 3) f.x = -3;
      else if (f.x < -3) f.x = width + 3;
    }
    draw(now / 1000);
    frameId = requestAnimationFrame(tick);
  }

  function start() {
    cancelAnimationFrame(frameId);
    resize();
    if (motionQuery.matches) {
      draw(0); // โหมดลดการเคลื่อนไหว: วาดเกล็ดนิ่ง ๆ ครั้งเดียว
      return;
    }
    lastTime = performance.now();
    draw(lastTime / 1000); // วาดเฟรมแรกทันที ไม่ต้องรอเฟรมถัดไป
    frameId = requestAnimationFrame(tick);
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 150);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frameId);
    else start();
  });
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', start);

  start();
})();
