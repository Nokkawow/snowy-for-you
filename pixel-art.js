/*
 * pixel-art.js — ภาพ pixel art ทั้งหมดของเว็บ (เพนกวิน ดอกไม้ ใบไม้ ริบบิ้น ช่อดอกไม้)
 *
 * ภาพแต่ละรูปเขียนเป็น "แผนที่ตัวอักษร" 1 ตัวอักษร = 1 พิกเซล ('.' = โปร่งใส)
 * แล้วแปลงเป็น SVG ตอนเปิดเว็บ จึงคมทุกขนาดจอและไม่ต้องโหลดไฟล์รูปเพิ่ม
 * อยากเปลี่ยนสี แก้ที่ PALETTES ได้เลย
 */
(() => {
  // ---------- แผนที่พิกเซล ----------
  const PENGUIN = [
    '......kkkk......',
    '....kkbbbbkk....',
    '...kbbbbbbbbk...',
    '..kbbwwwwwwbbk..',
    '..kbwwewwewwbk..',
    '..kbwcwoowcwbk..',
    '..kbwwwoowwwbk..',
    '.kssssssssssssk.',
    '.kSSSSSSSSSSSSk.',
    'kbbwwwwwwwwssbbk',
    'kbbwwwwwwwwssbbk',
    'kbbwwwwwwwwwSbbk',
    '.kbwwwwwwwwwwbk.',
    '.kbbwwwwwwwwbbk.',
    '..kbbwwwwwwbbk..',
    '...kkkkkkkkkk...',
    '...kffk..kffk...',
    '..kfffk..kfffk..',
  ];

  const STEM = ['....g....', '....g....', '.ll.g.ll.', '..llgll..', '....g....'];
  const HEADS = {
    round: ['..p.p.p..', '.ppppppp.', 'pppcccppp', '.ppcccpp.', 'pppcccppp', '.ppppppp.'],
    tulip: ['.p..p..p.', '.pp.p.pp.', '.ppppppp.', '.ppqpqpp.', '..ppppp..', '...ppp...'],
    rose: ['...ppp...', '..pqqqp..', '.pqpppqp.', '.pqpqpqp.', '.ppqqqpp.', '..ppppp..'],
    spike: ['...p.p...', '..ppqpp..', '...pqp...', '..pqpqp..', '...pqp...', '..ppqpp..'],
  };
  const LEAVES = {
    'ใบอ่อน': ['......ll.', '....llll.', '...lllLl.', '..llLll..', '..lLll...', '.lLll....', '.gll.....', 'g........'],
    'ใบเฟิร์น': ['....g....', '.l..g..l.', '..l.g.l..', '.ll.g.ll.', '..llgll..', '.ll.g.ll.', '...lgl...', '....g....'],
  };
  const BOW = ['rr.....rr', 'rRr...rRr', 'rRRrRrRRr', 'rRr.R.rRr', 'rr.rRr.rr', '...r.r...', '..r...r..'];

  // ---------- สี ----------
  const GREEN = { g: '#3f8f4a', l: '#5fb35a', L: '#3f8f4a' };
  const PALETTES = {
    penguinBlue: { k: '#1b2a4f', b: '#3a72c4', w: '#fff8e8', e: '#1b2a4f', c: '#f7a8b8', o: '#ffb34c', s: '#6fb6f5', S: '#3f86d6', f: '#f59e2b' },
    penguinPink: { k: '#1b2a4f', b: '#de7697', w: '#fff8e8', e: '#1b2a4f', c: '#f7a8b8', o: '#ffb34c', s: '#ffb3c8', S: '#ea7fa0', f: '#f59e2b' },
    ribbonBlue: { r: '#6fb2f0', R: '#3a7cc8' },
    ribbonPink: { r: '#f59ab8', R: '#e0668f' },
    wrap: { w: '#fff3dc', W: '#e9d4ad' },
  };
  const FLOWERS = {
    'เดซี่': { head: 'round', colors: { p: '#ffffff', q: '#e6eef5', c: '#ffcf3f' } },
    'ทานตะวัน': { head: 'round', colors: { p: '#ffc928', q: '#e9a514', c: '#7a4a26' } },
    'ไฮยาซินธ์': { head: 'spike', colors: { p: '#a283e6', q: '#6e52b8' } },
    'ทิวลิป': { head: 'tulip', colors: { p: '#ff7a9c', q: '#e24f77' } },
    'กุหลาบ': { head: 'rose', colors: { p: '#e8434f', q: '#a8222f' } },
    'ซากุระ': { head: 'round', colors: { p: '#ffc3d6', q: '#f59ab8', c: '#e2668f' } },
  };

  // ---------- ตัวแปลงแผนที่ → SVG ----------
  // รวมพิกเซลที่ติดกันในแถวเดียวกันเป็นสี่เหลี่ยมเดียว เพื่อให้ SVG เบา
  function rects(map, colors, dx = 0, dy = 0) {
    let out = '';
    map.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let run = 1;
        while (row[x + run] === ch) run += 1;
        if (ch !== '.' && colors[ch]) {
          out += `<rect class="px-${ch}" x="${x + dx}" y="${y + dy}" width="${run}" height="1" fill="${colors[ch]}"/>`;
        }
        x += run;
      }
    });
    return out;
  }

  function svg(width, height, body, label) {
    const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
    return `<svg class="pixel-svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" ${a11y}>${body}</svg>`;
  }

  function penguin(color) {
    const colors = color === 'pink' ? PALETTES.penguinPink : PALETTES.penguinBlue;
    return svg(16, 18, rects(PENGUIN, colors));
  }

  function flower(name, withStem = true) {
    const def = FLOWERS[name];
    const map = withStem ? [...HEADS[def.head], ...STEM] : HEADS[def.head];
    return svg(9, map.length, rects(map, { ...GREEN, ...def.colors }), name);
  }

  function leaf(name) {
    return svg(9, 8, rects(LEAVES[name], GREEN), name);
  }

  function ribbon(name) {
    return svg(9, 7, rects(BOW, name === 'ชมพู' ? PALETTES.ribbonPink : PALETTES.ribbonBlue), `ริบบิ้นสี${name}`);
  }

  // ช่อดอกไม้: ดอก 3 ดอกเรียงโค้ง + ใบไม้ด้านหลัง + กระดาษห่อ + โบว์
  function bouquet(flowers, leafName, ribbonName) {
    let body = '';
    const leafMap = LEAVES[leafName] || LEAVES['ใบอ่อน'];
    body += rects(leafMap, GREEN, 1, 3) + rects(leafMap.map((r) => [...r].reverse().join('')), GREEN, 17, 3);
    const spots = [[0, 4], [9, 1], [18, 4]];
    flowers.slice(0, 3).forEach((name, i) => {
      const def = FLOWERS[name];
      if (!def) return;
      const [x, y] = spots[i];
      body += `<rect x="${x + 4}" y="${y + 6}" width="1" height="${12 - y}" fill="${GREEN.g}"/>`;
      body += rects(HEADS[def.head], { ...GREEN, ...def.colors }, x, y);
    });
    // กระดาษห่อทรงกรวย
    for (let row = 0; row < 14; row += 1) {
      const half = Math.max(3, 11 - Math.floor(row * 0.6));
      const left = 13 - half;
      body += `<rect x="${left}" y="${12 + row}" width="${half * 2 + 1}" height="1" fill="${PALETTES.wrap.w}"/>`;
      body += `<rect x="${left}" y="${12 + row}" width="1" height="1" fill="${PALETTES.wrap.W}"/>`;
    }
    body += rects(BOW, ribbonName === 'ชมพู' ? PALETTES.ribbonPink : PALETTES.ribbonBlue, 9, 15);
    return svg(27, 26, body, `ช่อดอกไม้ ${flowers.join(' ')}`);
  }

  // ช่อกุหลาบใหญ่ 10 ดอกที่ "ผม" จัดให้: แถวหลัง 3 / กลาง 4 / หน้า 3 + ใบเฟิร์น + ดอกยิปโซ + โบว์
  function roseBouquet(ribbonName = 'ชมพู') {
    const W = 30;
    const roseHead = HEADS.rose.map((r) => r.slice(1, 8)); // ตัดขอบว่างซ้ายขวา เหลือกว้าง 7
    const roseColors = [
      { p: '#e8434f', q: '#a8222f' },
      { p: '#f0596a', q: '#b52a3b' },
    ];
    const fern = LEAVES['ใบเฟิร์น'];
    let body = '';
    // ใบเฟิร์นด้านหลังซ้าย-ขวา-กลาง
    body += rects(fern, GREEN, 0, 3) + rects(fern, GREEN, 21, 3) + rects(fern, GREEN, 10, -1);
    // กุหลาบ 10 ดอก วาดจากแถวหลังมาแถวหน้า
    const spots = [
      [4, 0], [11, -1], [18, 0],                 // แถวหลัง 3
      [1, 4], [8, 4], [15, 4], [22, 4],          // แถวกลาง 4
      [4, 8], [11, 9], [18, 8],                  // แถวหน้า 3
    ];
    spots.forEach(([x, y], i) => { body += rects(roseHead, { ...GREEN, ...roseColors[i % 2] }, x, y + 1); });
    // ดอกยิปโซ (จุดขาวเล็ก ๆ) แทรกระหว่างดอก
    [[3, 3], [10, 3], [18, 3], [26, 3], [7, 8], [22, 8], [15, 8], [1, 10], [28, 10]].forEach(([x, y]) => {
      body += `<rect x="${x}" y="${y + 1}" width="1" height="1" fill="#ffffff"/>`;
    });
    // กระดาษห่อทรงกรวยใหญ่
    for (let row = 0; row < 20; row += 1) {
      const half = Math.max(3, 14 - Math.floor(row * 0.6));
      const left = 15 - half;
      body += `<rect x="${left}" y="${15 + row}" width="${half * 2}" height="1" fill="${PALETTES.wrap.w}"/>`;
      body += `<rect x="${left}" y="${15 + row}" width="1" height="1" fill="${PALETTES.wrap.W}"/>`;
      body += `<rect x="${left + half * 2 - 1}" y="${15 + row}" width="1" height="1" fill="${PALETTES.wrap.W}"/>`;
    }
    body += rects(BOW, ribbonName === 'ฟ้า' ? PALETTES.ribbonBlue : PALETTES.ribbonPink, 10, 19);
    return svg(W, 35, body, 'ช่อกุหลาบ 10 ดอกผูกโบว์');
  }

  window.SnowyPixel = { penguin, flower, leaf, ribbon, bouquet, roseBouquet };

  // ---------- ใส่ภาพลงหน้าเว็บ ----------
  // เพนกวินพิกเซลยังเรียกใช้ได้ผ่าน SnowyPixel.penguin() แต่ตอนนี้เว็บใช้ GIF ด้านบนแทน
  document.querySelectorAll('[data-flower]').forEach((el) => {
    el.innerHTML = flower(el.dataset.flower);
    el.setAttribute('aria-label', el.dataset.flower);
  });
  document.querySelectorAll('[data-leaf]').forEach((el) => {
    el.innerHTML = leaf(el.dataset.leaf);
    el.setAttribute('aria-label', el.dataset.leaf);
  });
  document.querySelectorAll('[data-ribbon]').forEach((el) => {
    el.innerHTML = ribbon(el.dataset.ribbon);
    el.setAttribute('aria-label', `ริบบิ้นสี${el.dataset.ribbon}`);
  });
})();
