// ===================== RESIDENCY — WITTY AMBIENT HOSPITAL ANIMATIONS =====================
// Purely decorative: overhead-page ticker, a coffee machine "out of order since 2009", an
// on-call room that snores, pneumatic tubes, a sanitizing robot with opinions, a wet-floor
// sign of questionable accuracy, a self-driving wheelchair, a fish tank, a skeleton with puns,
// a beeping ventilator, a lecture clock that never ends and a whiteboard that draws itself.
'use strict';
const PAGES = {
  all: [
    'CODE BROWN, ROOM 12. ENVIRONMENTAL SERVICES HAS BEEN NOTIFIED. GOD SPEED.',
    'WILL THE OWNER OF THE SILVER HATCHBACK PLEASE MOVE IT OFF THE HELIPAD',
    'PHARMACY UPDATE: WE ARE OUT OF PATIENCE. BACKORDERED UNTIL FURTHER NOTICE.',
    'CAFETERIA SPECIAL: MYSTERY MEAT (HIPAA PROTECTED)',
    'REMINDER: "WNL" MEANS "WITHIN NORMAL LIMITS," NOT "WE NEVER LOOKED"',
    'THE EHR WILL BE DOWN FOR MAINTENANCE FROM 7:00 AM UNTIL THE HEAT DEATH OF THE UNIVERSE',
    'PAGING DR. CAFFEINE TO THE CALL ROOM. STAT.',
    'INFECTION CONTROL SAYS: GEL IN, GEL OUT, GEL SIDEWAYS',
    'LOST: ONE STETHOSCOPE. LAST SEEN AROUND A RESIDENT\'S NECK. ALL OF THEM.',
    'DO NOT SAY THE Q-WORD. YES, "QUIET." YOU JUST JINXED THE WHOLE SHIFT.',
    'PATIENT SATISFACTION IS UP 2%. THE COFFEE BUDGET IS DOWN 40%.',
  ],
  classroom: ['LECTURE ATTENDANCE IS OPTIONAL*   *NOT OPTIONAL', 'STEP 1 IS PASS/FAIL. YOUR ANXIETY IS NOT.', 'THE SKELETON IN ROOM 3 IS NOT A STANDARDIZED PATIENT'],
  clinic: ['ESTIMATED WAIT TIME: YES', 'PLEASE HAVE YOUR INSURANCE CARD, PHOTO ID AND 3 YEARS OF SYMPTOMS READY', 'YOUR 10:15 IS HERE. SO ARE YOUR 9:00, 9:15 AND 9:30.'],
  hospital: ['BED BOARD UPDATE: WE HAVE ZERO BEDS AND ELEVEN ADMISSIONS', 'DISCHARGE BEFORE NOON. NO, NOT THAT NOON.', 'RAPID RESPONSE TO THE CAFETERIA — THE TACOS ARE BACK'],
  or: ['COUNT THE SPONGES. THEN COUNT THEM AGAIN. THEN ONE MORE TIME.', 'OR 3 MUSIC: CLASSIC ROCK ONLY BY ORDER OF THE ATTENDING', 'THE SCRUB NURSE IS ALWAYS RIGHT. ALWAYS.'],
};
const QUIPS = {
  robot: ['Beep. You missed a spot.', 'Germs: 0. Me: 1.', 'Stand clear. I sanitize with prejudice.', 'I have a PhD in mopping.', 'Please gel before touching the patient. Or me.'],
  wetfloor: ['Caution: wet floor (probably).', 'It\'s just hand sanitizer. Mostly.', 'Not my fault if you slip.'],
  chair: ['Transport ETA: 45 minutes.', 'Room 6? Never heard of it.', 'Self-driving? More like self-wandering.'],
  coffee: ['*sputters ominously*', 'Brewing… just kidding.', 'Error 418: I\'m a teapot.'],
  oncall: ['Five more minutes!', 'I\'m not asleep, I\'m charting with my eyes closed.', 'Unless it\'s a code, I\'m a ghost.'],
  fish: ['blub. (that\'s "HIPAA" in fish)', 'We\'re on call too, you know.', 'Please stop tapping the glass.'],
  skeleton: ['I\'ve got a bone to pick with you.', 'Nothing gets under my skin.', 'Studied so hard I\'m skin and bones. Mostly bones.'],
  vent: ['Beep… beep… (that\'s normal)', 'PEEP of 5. Don\'t ask.', 'I breathe so you don\'t have to.'],
  handwash: ['Wash your hands. Yes, you.', 'Gel in, gel out!', 'Twenty seconds. Sing something.'],
};

const Decor = {
  init() {
    const setting = G.zone.setting;
    const D = G.decor = { items: [], quips: [], quipT: 6, ticker: { msgs: shuffle(PAGES.all.concat(PAGES[setting] || [])), i: 0, x: 0 }, tubes: [], tubeT: 2, chairT: 12, chair: null };
    const wall = (kind, x, w, extra) => D.items.push(Object.assign({ kind, x, y: 6, w, h: 48, wall: true, t: Math.random() * 10 }, extra || {}));
    if (setting === 'classroom') {
      wall('clock', 440, 50);
      wall('board', 780, 220);
      this.floor('skeletonwave', 48, 60);
      this.floor('robot', 40, 40);
      this.floor('wetfloor', 40, 30);
    } else {
      wall('ticker', 960, 220);
      wall('coffee', 360, 90);
      wall('oncall', 660, 100);
      wall('handwash', 1260, 90);
      if (setting === 'clinic') wall('fish', 1560, 150);
      else wall('coffee', 1560, 90, { second: true });
      this.floor('robot', 40, 40);
      this.floor('wetfloor', 40, 30);
      if (setting !== 'clinic') this.floor('vent', 60, 46);
      if (setting === 'clinic') this.floor('skeletonwave', 48, 60);
    }
  },
  floor(kind, w, h) {
    const p = freeSpot(260);
    const it = { kind, x: p.x, y: p.y, w, h, t: Math.random() * 10, r: 16 };
    if (kind === 'robot') { it.tx = it.x; it.ty = it.y; it.uv = 0; }
    G.decor.items.push(it);
  },
  update(dt) {
    const D = G.decor; if (!D) return;
    for (const it of D.items) {
      it.t += dt;
      if (it.kind === 'robot') {
        const d = Math.hypot(it.tx - it.x, it.ty - it.y);
        if (d < 10 || it.stuck > 1.5) { const p = freeSpot(0); it.tx = p.x; it.ty = p.y; it.stuck = 0; }
        else {
          const ox = it.x, oy = it.y, sp = 55 * dt;
          it.x += (it.tx - it.x) / d * sp; it.y += (it.ty - it.y) / d * sp;
          resolveProps(it);
          if (Math.hypot(it.x - ox, it.y - oy) < sp * 0.3) it.stuck = (it.stuck || 0) + dt; else it.stuck = 0;
          it.face = it.tx >= it.x ? 1 : -1;
        }
      }
    }
    // pneumatic tube capsules
    D.tubeT -= dt; if (D.tubeT <= 0) { D.tubeT = rand(2.5, 6); D.tubes.push({ x: WALL, dir: 1, col: pick(['#2f80ed', '#e2574c', '#27ae60', '#f2c94c']) }); }
    for (const c of D.tubes) c.x += 900 * dt;
    D.tubes = D.tubes.filter(c => c.x < WW - WALL + 40);
    // self-driving wheelchair
    D.chairT -= dt;
    if (!D.chair && D.chairT <= 0) { const dir = Math.random() < 0.5 ? 1 : -1; D.chair = { x: dir > 0 ? WALL - 40 : WW - WALL + 40, y: WH - WALL - rand(24, 60), dir, t: 0 }; this.say({ x: D.chair.x, y: D.chair.y }, pick(QUIPS.chair), true); D.quips[D.quips.length - 1].follow = D.chair; }
    if (D.chair) { D.chair.x += D.chair.dir * 120 * dt; D.chair.t += dt; if (D.chair.x < WALL - 60 || D.chair.x > WW - WALL + 60) { D.chair = null; D.chairT = rand(18, 30); } }
    // ticker scroll
    D.ticker.x += 70 * dt;
    // quips from things near the player
    D.quipT -= dt;
    if (D.quipT <= 0) {
      D.quipT = rand(7, 12);
      const p = G.player, near = D.items.filter(it => QUIPS[this.quipKey(it.kind)] && Math.hypot(it.x - p.x, it.y - p.y) < 650);
      if (near.length) { const it = pick(near); this.say(it, pick(QUIPS[this.quipKey(it.kind)])); }
    }
    for (const q of D.quips) { q.t -= dt; if (q.follow) { q.x = q.follow.x; q.y = q.follow.y; } }
    D.quips = D.quips.filter(q => q.t > 0);
  },
  quipKey(k) { return k === 'skeletonwave' ? 'skeleton' : k; },
  say(it, text) { G.decor.quips.push({ x: it.x, y: it.y, wall: !!it.wall, text, t: 3.4, follow: null }); },

  // ---------- drawing ----------
  drawWall() {
    const D = G.decor; if (!D) return;
    const c = ctx;
    // pneumatic tube along the top of the wall
    c.fillStyle = 'rgba(210,230,245,0.35)'; c.fillRect(WALL, 1, WW - WALL * 2, 5);
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(WALL, 1.5, WW - WALL * 2, 1);
    for (const cap of D.tubes) {
      const g = c.createLinearGradient(cap.x - 60, 0, cap.x, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.6)');
      c.fillStyle = g; c.fillRect(cap.x - 60, 2, 60, 3); c.fillStyle = cap.col; roundRect(cap.x - 12, 1.5, 14, 4, 2); c.fill();
    }
    for (const it of D.items) if (it.wall) this.drawWallItem(it);
  },
  drawWallItem(it) {
    const c = ctx, t = it.t, x = it.x, y = it.y;
    switch (it.kind) {
      case 'ticker': {
        const w = it.w, h = 24, x0 = x - w / 2, y0 = y + 10;
        c.fillStyle = '#111316'; roundRect(x0 - 3, y0 - 3, w + 6, h + 6, 3); c.fill();
        c.fillStyle = '#05070a'; c.fillRect(x0, y0, w, h);
        c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
        const T = G.decor.ticker, msg = T.msgs[T.i % T.msgs.length];
        c.font = '700 13px "Courier New", monospace'; c.textBaseline = 'middle';
        const tw = c.measureText(msg).width, px = x0 + w - (T.x % (tw + w + 40));
        if (T.x % (tw + w + 40) > tw + w + 30) { T.i++; T.x = 0; }
        c.fillStyle = '#ffb02e'; c.shadowColor = '#ff8a00'; c.shadowBlur = 6; c.fillText(msg, px, y0 + h / 2 + 1); c.shadowBlur = 0;
        c.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < w; i += 3) c.fillRect(x0 + i, y0, 1, h); // LED grid
        c.restore();
        c.fillStyle = '#c0392b'; c.beginPath(); c.arc(x0 - 8, y0 + h / 2, 3, 0, 7); c.fill(); // recording light
        break; }
      case 'coffee': {
        const w = 52, x0 = x - w / 2;
        box(x0, y + 22, w, 26, 34, '#4b4f57', '#2e3138');
        c.fillStyle = '#0e1a14'; c.fillRect(x0 + 6, y - 6, w - 12, 10);
        c.fillStyle = (Math.floor(t * 2) % 2) ? '#ff5a5a' : '#7a1f1f'; c.font = '700 6px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('OUT OF ORDER', x, y + 1);
        c.fillStyle = '#f4f6f8'; c.save(); c.translate(x + 18, y - 22); c.rotate(-0.12); c.fillRect(-20, -6, 40, 13); c.fillStyle = '#c0392b'; c.font = '700 5px Inter, sans-serif'; c.fillText('SINCE 2009', 0, 3); c.restore();
        c.fillStyle = '#e9e2d0'; roundRect(x - 6, y + 10, 12, 10, 2); c.fill(); c.fillStyle = '#5a3a20'; c.fillRect(x - 5, y + 11, 10, 2);
        for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; c.strokeStyle = `rgba(240,240,240,${0.5 * (1 - k)})`; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 2 + i * 2, y + 8 - k * 26); c.quadraticCurveTo(x + 6 * Math.sin(t * 3 + i), y - k * 26, x + i * 2, y - 6 - k * 30); c.stroke(); }
        if (Math.sin(t * 0.7) > 0.97) { c.fillStyle = '#5a3a20'; c.beginPath(); c.arc(x, y + 22 + (t * 40) % 20, 1.5, 0, 7); c.fill(); }
        break; }
      case 'oncall': {
        const w = 56, x0 = x - w / 2, jig = Math.sin(t * 11) > 0.92 ? Math.sin(t * 60) * 1.2 : 0;
        c.fillStyle = '#6b4b2e'; c.fillRect(x0 - 3, y - 6, w + 6, 58);
        c.fillStyle = '#a77a4f'; c.fillRect(x0 + jig, y - 3, w, 55);
        c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1; c.strokeRect(x0 + 6 + jig, y + 2, w - 12, 20); c.strokeRect(x0 + 6 + jig, y + 26, w - 12, 20);
        c.fillStyle = '#d9b44a'; c.beginPath(); c.arc(x0 + w - 8 + jig, y + 26, 2.5, 0, 7); c.fill();
        c.fillStyle = '#1f3a6b'; c.fillRect(x - 30, y - 15, 60, 12); c.fillStyle = '#fff'; c.font = '700 7px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('ON-CALL ROOM', x, y - 6);
        c.fillStyle = '#c0392b'; c.fillRect(x - 18, y + 30, 36, 8); c.fillStyle = '#fff'; c.font = '700 5px Inter, sans-serif'; c.fillText('DO NOT DISTURB', x, y + 36);
        for (let i = 0; i < 3; i++) { const k = (t * 0.35 + i / 3) % 1; c.fillStyle = `rgba(160,200,255,${0.9 * (1 - k)})`; c.font = `800 ${8 + k * 10}px Inter, sans-serif`; c.fillText('Z', x + 30 + k * 22 + Math.sin(t * 2 + i) * 4, y + 10 - k * 40); }
        break; }
      case 'handwash': {
        c.fillStyle = '#f2f5f8'; roundRect(x - 12, y + 8, 24, 32, 4); c.fill(); c.strokeStyle = '#b8c3cf'; c.lineWidth = 1; c.stroke();
        c.fillStyle = '#2f80ed'; c.beginPath(); c.moveTo(x, y + 14); c.quadraticCurveTo(x + 6, y + 23, x, y + 26); c.quadraticCurveTo(x - 6, y + 23, x, y + 14); c.fill();
        c.fillStyle = '#9aa6b2'; c.fillRect(x - 4, y + 40, 8, 4);
        const k = (t * 0.8) % 1; if (k < 0.4) { c.fillStyle = 'rgba(150,200,255,0.8)'; c.beginPath(); c.arc(x, y + 46 + k * 30, 2, 0, 7); c.fill(); }
        const on = Math.floor(t * 1.6) % 2;
        c.fillStyle = on ? '#2f80ed' : '#1c4f99'; c.fillRect(x + 18, y - 4, 64, 30);
        c.fillStyle = '#fff'; c.font = '800 7px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('WASH YOUR', x + 50, y + 7); c.fillText('HANDS.', x + 50, y + 15); c.font = '600 6px Inter, sans-serif'; c.fillText(on ? 'YES, YOU.' : '', x + 50, y + 23);
        break; }
      case 'fish': {
        const w = it.w, x0 = x - w / 2, y0 = y + 2, h = 44;
        c.fillStyle = '#1b2733'; c.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
        const g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#5fc4e8'); g.addColorStop(1, '#1a6f9c'); c.fillStyle = g; c.fillRect(x0, y0, w, h);
        c.fillStyle = '#d9c38c'; c.fillRect(x0, y0 + h - 6, w, 6);
        for (let i = 0; i < 4; i++) { c.strokeStyle = '#2e8b57'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 18 + i * 34, y0 + h - 6); c.quadraticCurveTo(x0 + 18 + i * 34 + Math.sin(t * 2 + i) * 5, y0 + h - 20, x0 + 18 + i * 34, y0 + h - 30); c.stroke(); }
        for (let i = 0; i < 3; i++) {
          const ph = t * (0.4 + i * 0.13) + i * 2, fx = x0 + 15 + ((Math.sin(ph) + 1) / 2) * (w - 30), fy = y0 + 12 + i * 10 + Math.sin(t * 2 + i) * 2, dir = Math.cos(ph) >= 0 ? 1 : -1;
          c.fillStyle = ['#ff8c42', '#ffd23f', '#ee4266'][i]; c.beginPath(); c.ellipse(fx, fy, 6, 3.5, 0, 0, 7); c.fill();
          c.beginPath(); c.moveTo(fx - dir * 5, fy); c.lineTo(fx - dir * 10, fy - 4); c.lineTo(fx - dir * 10, fy + 4); c.closePath(); c.fill();
          c.fillStyle = '#000'; c.fillRect(fx + dir * 3 - 0.5, fy - 1.5, 1.2, 1.2);
        }
        for (let i = 0; i < 4; i++) { const k = (t * 0.5 + i / 4) % 1; c.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; c.lineWidth = 1; c.beginPath(); c.arc(x0 + w - 16 + Math.sin(t + i) * 2, y0 + h - 8 - k * (h - 10), 2, 0, 7); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x0 + 4, y0 + 2, 8, h - 10);
        c.fillStyle = '#f4f6f8'; c.fillRect(x - 46, y0 + h + 4, 92, 9); c.fillStyle = '#334'; c.font = '700 5px Inter, sans-serif'; c.textAlign = 'center'; c.fillText("DON'T TAP THE GLASS. THE FISH ARE ON CALL.", x, y0 + h + 10);
        break; }
      case 'clock': {
        const cx = x, cy = y + 22;
        c.fillStyle = '#f7f7f2'; c.beginPath(); c.arc(cx, cy, 20, 0, 7); c.fill(); c.strokeStyle = '#333'; c.lineWidth = 2.5; c.stroke();
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillStyle = '#333'; c.fillRect(cx + Math.cos(a) * 16 - 1, cy + Math.sin(a) * 16 - 1, 2, 2); }
        c.strokeStyle = '#222'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(t * 0.6) * 9, cy + Math.sin(t * 0.6) * 9); c.stroke();
        c.strokeStyle = '#c0392b'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(-t * 7) * 15, cy + Math.sin(-t * 7) * 15); c.stroke();
        c.fillStyle = '#222'; c.font = '700 6px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('LECTURE ENDS: NEVER', cx, cy + 30);
        break; }
      case 'board': { // the whiteboard draws a heart and an ECG, then erases itself
        const x0 = x + 135, y0 = y + 2, cyc = t % 9, k = Math.min(1, cyc / 5), fade = cyc > 7.5 ? 1 - (cyc - 7.5) / 1.5 : 1;
        c.save(); c.globalAlpha = fade; c.strokeStyle = '#c0392b'; c.lineWidth = 2; c.lineCap = 'round';
        const pts = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2; pts.push([x0 + 40 + 11 * Math.pow(Math.sin(a), 3), y0 + 16 - (10 * Math.cos(a) - 4 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]); }
        c.beginPath(); const n = Math.floor(pts.length * Math.min(1, k * 2)); pts.slice(0, n).forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
        c.strokeStyle = '#1f4ea8'; c.beginPath(); const e = Math.max(0, k * 2 - 1);
        for (let i = 0; i <= 66 * e; i++) { const xx = x0 + 6 + i * 1.1, ph = i % 22; const yy = y0 + 38 - (ph === 10 ? 14 : ph === 11 ? -6 : ph > 16 && ph < 20 ? 3 : 0); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
        c.restore();
        break; }
    }
  },
  floorDrawables(list) {
    const D = G.decor; if (!D) return;
    for (const it of D.items) if (!it.wall) list.push({ y: it.y + (it.kind === 'robot' ? 0 : 4), f: () => this.drawFloorItem(it) });
    if (D.chair) list.push({ y: D.chair.y, f: () => this.drawChair(D.chair) });
  },
  drawFloorItem(it) {
    const c = ctx, t = it.t, x = it.x, y = it.y;
    switch (it.kind) {
      case 'robot': {
        const pulse = 0.5 + 0.5 * Math.sin(t * 4);
        const g = c.createRadialGradient(x, y, 4, x, y, 70); g.addColorStop(0, `rgba(170,90,255,${0.25 + 0.15 * pulse})`); g.addColorStop(1, 'rgba(170,90,255,0)');
        c.fillStyle = g; c.beginPath(); c.ellipse(x, y, 70, 40, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x, y + 2, 18, 6, 0, 0, 7); c.fill();
        c.fillStyle = lg(x - 16, 0, x + 16, 0, [[0, '#9aa6b2'], [0.5, '#f2f5f8'], [1, '#8b97a3']]); c.fillRect(x - 15, y - 34, 30, 34);
        c.fillStyle = '#dfe5eb'; c.beginPath(); c.ellipse(x, y - 34, 15, 5, 0, 0, 7); c.fill();
        c.fillStyle = `rgba(190,120,255,${0.6 + 0.4 * pulse})`; c.fillRect(x - 3, y - 58, 6, 24); c.shadowColor = '#b57bff'; c.shadowBlur = 14; c.fillRect(x - 2, y - 58, 4, 24); c.shadowBlur = 0;
        c.fillStyle = '#1e2228'; c.fillRect(x - 10, y - 26, 20, 8); c.fillStyle = (Math.floor(t * 3) % 2) ? '#7dffb0' : '#2f8f5f'; c.font = '700 5px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('UV ON', x, y - 20.5);
        c.fillStyle = '#2b2f36'; c.beginPath(); c.arc(x - 10, y, 3, 0, 7); c.arc(x + 10, y, 3, 0, 7); c.fill();
        break; }
      case 'wetfloor': {
        const wob = Math.sin(t * 1.3) > 0.9 ? Math.sin(t * 25) * 0.08 : 0;
        const g = c.createRadialGradient(x + 14, y + 4, 2, x + 14, y + 4, 34); g.addColorStop(0, 'rgba(180,220,255,0.45)'); g.addColorStop(1, 'rgba(180,220,255,0)');
        c.fillStyle = g; c.beginPath(); c.ellipse(x + 14, y + 4, 36, 12, 0, 0, 7); c.fill();
        c.strokeStyle = `rgba(255,255,255,${0.4 + 0.3 * Math.sin(t * 3)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(x + 18, y + 3, 10 + (t * 6) % 14, 3, 0, 0, 7); c.stroke();
        c.save(); c.translate(x, y); c.rotate(wob);
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 0, 14, 4, 0, 0, 7); c.fill();
        c.fillStyle = '#f5c518'; c.beginPath(); c.moveTo(-12, 0); c.lineTo(-4, -42); c.lineTo(4, -42); c.lineTo(12, 0); c.closePath(); c.fill();
        c.fillStyle = '#d4a700'; c.fillRect(-4, -44, 8, 3);
        c.fillStyle = '#111'; c.beginPath(); c.moveTo(0, -36); c.lineTo(-6, -26); c.lineTo(6, -26); c.closePath(); c.fill(); c.fillStyle = '#f5c518'; c.fillRect(-0.6, -33, 1.2, 4);
        c.fillStyle = '#111'; c.font = '800 4.5px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('CAUTION', 0, -18); c.fillText('WET FLOOR', 0, -12); c.font = 'italic 600 3.8px Inter, sans-serif'; c.fillText('(probably)', 0, -6);
        c.restore();
        break; }
      case 'vent': {
        box(x - 22, y - 26, 44, 26, 30, '#d9dde2', '#a3abb3');
        c.fillStyle = '#0b1f14'; c.fillRect(x - 18, y - 60, 36, 22);
        c.strokeStyle = '#3f6'; c.lineWidth = 1.2; c.beginPath();
        for (let i = 0; i < 34; i++) { const ph = (i / 34 * 2 + t * 0.4) % 1; c.lineTo(x - 17 + i, y - 44 - (ph < 0.4 ? Math.sin(ph / 0.4 * Math.PI) * 8 : 0)); } c.stroke();
        const b = 0.5 + 0.5 * Math.sin(t * 2.1);
        c.fillStyle = 'rgba(220,235,250,0.85)'; c.strokeStyle = '#7f8c99'; c.lineWidth = 1; const bh = 8 + 10 * b;
        c.fillRect(x + 22, y - 10 - bh, 12, bh); for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + 22, y - 10 - bh * k / 4); c.lineTo(x + 34, y - 10 - bh * k / 4); c.stroke(); }
        break; }
      case 'skeletonwave': {
        const sx = x, sy = y;
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(sx, sy, 16, 5, 0, 0, 7); c.fill();
        c.strokeStyle = '#7f8c99'; c.lineWidth = 2; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy - 70); c.moveTo(sx - 12, sy); c.lineTo(sx + 12, sy); c.stroke();
        c.strokeStyle = '#efe9d8'; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(sx, sy - 66); c.lineTo(sx, sy - 34); c.stroke(); // spine
        for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(sx, sy - 58 + i * 5, 9 - i, 2.5, 0, 0, 7); c.lineWidth = 1.5; c.stroke(); }
        c.lineWidth = 2.5; c.beginPath(); c.moveTo(sx - 5, sy - 34); c.lineTo(sx - 7, sy - 14); c.lineTo(sx - 6, sy - 2); c.moveTo(sx + 5, sy - 34); c.lineTo(sx + 7, sy - 14); c.lineTo(sx + 6, sy - 2); c.stroke(); // legs
        c.beginPath(); c.moveTo(sx - 9, sy - 62); c.lineTo(sx - 13, sy - 46); c.lineTo(sx - 12, sy - 34); c.stroke(); // left arm
        const wave = Math.sin(t * 5) * 0.5;
        c.save(); c.translate(sx + 9, sy - 62); c.rotate(-2.2 + wave); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 14); c.stroke(); c.translate(0, 14); c.rotate(0.6 + wave * 0.6); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 12); c.stroke(); c.fillStyle = '#efe9d8'; c.beginPath(); c.arc(0, 14, 2.5, 0, 7); c.fill(); c.restore();
        c.fillStyle = '#efe9d8'; c.beginPath(); c.arc(sx, sy - 74, 8, 0, 7); c.fill();
        const jaw = Math.max(0, Math.sin(t * 9)) * 2;
        c.fillRect(sx - 5, sy - 68 + jaw, 10, 3);
        c.fillStyle = '#2b2b2b'; c.beginPath(); c.arc(sx - 3, sy - 75, 2, 0, 7); c.arc(sx + 3, sy - 75, 2, 0, 7); c.fill(); c.fillRect(sx - 0.6, sy - 72, 1.2, 2);
        break; }
    }
  },
  drawChair(ch) {
    const c = ctx, x = ch.x, y = ch.y, d = ch.dir;
    c.strokeStyle = 'rgba(200,210,220,0.5)'; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - d * (26 + i * 8), y - 10 - i * 6); c.lineTo(x - d * (40 + i * 10), y - 10 - i * 6); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x, y + 2, 22, 6, 0, 0, 7); c.fill();
    c.save(); c.translate(x, y); c.scale(d, 1);
    c.strokeStyle = '#3d444d'; c.lineWidth = 3; c.beginPath(); c.arc(-4, -12, 13, 0, 7); c.stroke();
    c.save(); c.translate(-4, -12); c.rotate(ch.t * 9); c.lineWidth = 1; for (let i = 0; i < 6; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 12); c.stroke(); } c.restore();
    c.fillStyle = '#2a4a7a'; c.fillRect(-12, -30, 26, 10); c.fillRect(-14, -46, 6, 20);
    c.strokeStyle = '#9aa6b2'; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, -46); c.lineTo(-20, -50); c.stroke();
    c.fillStyle = '#3d444d'; c.beginPath(); c.arc(14, -4, 4, 0, 7); c.fill();
    c.restore();
  },
  drawQuips() {
    const D = G.decor; if (!D) return;
    for (const q of D.quips) {
      const a = Math.min(1, q.t * 2, (3.4 - q.t) * 5);
      const by = q.wall ? q.y + 70 : q.y - 90;
      ctx.save(); ctx.globalAlpha = a; ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
      const w = Math.min(260, ctx.measureText(q.text).width + 18), h = 24;
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; roundRect(q.x - w / 2, by - h / 2, w, h, 10); ctx.fill();
      ctx.beginPath(); if (q.wall) { ctx.moveTo(q.x - 6, by - h / 2); ctx.lineTo(q.x, by - h / 2 - 8); ctx.lineTo(q.x + 6, by - h / 2); } else { ctx.moveTo(q.x - 6, by + h / 2); ctx.lineTo(q.x, by + h / 2 + 8); ctx.lineTo(q.x + 6, by + h / 2); } ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; roundRect(q.x - w / 2, by - h / 2, w, h, 10); ctx.stroke();
      ctx.fillStyle = '#1d2733'; ctx.fillText(q.text, q.x, by + 4);
      ctx.restore();
    }
  },
};
