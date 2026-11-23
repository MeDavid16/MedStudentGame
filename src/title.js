// ===================== RESIDENCY — ANIMATED TITLE SCREEN =====================
// A hospital corridor rushing past, a live ECG that drives the logo's heartbeat,
// sweeping spotlights, drifting pills, and a chase: your student doctor sprinting
// ahead of a mob of nurses, lawyers, families and patients — firing back as they run.
'use strict';
const TitleFX = {
  cv: null, c: null, running: false, t: 0, last: 0, W: 0, H: 0, dpr: 1,
  ecg: [], ecgX: 0, beatT: 0, nextBeat: 0.6, parts: [], runners: [], shots: [], texts: [], lights: [], tickerI: 0, tickerT: 0,
  reduce: false,

  init() {
    this.cv = document.getElementById('title-bg'); this.c = this.cv.getContext('2d');
    try { this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    window.addEventListener('resize', () => this.resize());
    this.resize();
    for (let i = 0; i < 38; i++) this.parts.push(this.newPart(true));
    for (let i = 0; i < 7; i++) this.lights.push({ z: i / 7 });
    this.buildLetters();
    this.tick = this.tick.bind(this);
  },
  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.W = window.innerWidth; this.H = window.innerHeight;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.cv.style.width = this.W + 'px'; this.cv.style.height = this.H + 'px';
    this.ecg = new Array(Math.ceil(this.W / 3) + 2).fill(0);
  },
  buildLetters() {
    const el = document.querySelector('.logo'); if (!el || el.dataset.split) return;
    el.dataset.split = '1';
    el.innerHTML = el.textContent.split('').map((ch, i) => `<span class="lt" style="--i:${i}">${ch}</span>`).join('');
  },
  start() {
    if (!this.cv) this.init();
    const logo = document.querySelector('.logo');
    if (logo) { logo.classList.remove('intro'); void logo.offsetWidth; logo.classList.add('intro'); }
    this.newChase(true);
    this.updateTicker(true);
    if (this.running) return;
    this.running = true; this.last = performance.now(); requestAnimationFrame(this.tick);
  },
  stop() { this.running = false; },

  newPart(anywhere) {
    return { x: Math.random() * this.W, y: anywhere ? Math.random() * this.H : this.H + 20, vy: -(12 + Math.random() * 30), vx: (Math.random() - 0.5) * 10,
      r: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 1.5, kind: Math.random() < 0.55 ? 'pill' : Math.random() < 0.6 ? 'cross' : 'dot',
      s: 0.6 + Math.random() * 1.1, hue: ['#7fe3ff', '#b57bff', '#ff7ad9', '#7dffb0', '#ffd54a'][Math.floor(Math.random() * 5)], a: 0.15 + Math.random() * 0.3 };
  },
  playerLookForTitle() {
    let sv = null; try { sv = loadGame(); } catch (e) {}
    if (sv) return { top: sv.scrub, bottom: shade(sv.scrub, -0.1), skin: sv.skin, hair: sv.hair, female: sv.gender === 'f', style: sv.hairStyle || (sv.gender === 'f' ? 'ponytail' : 'short'), steth: '#2a2d33', shoe: '#eef1f4' };
    const f = Math.random() < 0.5;
    return { top: pick(['#2a7fa8', '#2b8a5e', '#6a3fa0', '#a83a5a']), bottom: '#1f4f6a', skin: pick(['#f1c9a5', '#e0ac85', '#c68642', '#8d5524']), hair: pick(['#111', '#2b1b10', '#5a3a20', '#d9b56a']), female: f, style: f ? 'ponytail' : 'short', steth: '#2a2d33', shoe: '#eef1f4' };
  },
  newChase(first) {
    const look = this.playerLookForTitle();
    look.top = look.top || '#2a7fa8';
    const types = shuffle(['nurse', 'lawyer', 'casemgr', 'patient', 'exec', 'phleb', 'pharmacist', 'radtech', 'insurance', 'transporter', 'patient']).slice(0, 5);
    const start = first ? -80 : -120;
    this.runners = [{ me: true, x: start, look, spd: 0, walk: 0, face: 1, a: 1 }];
    types.forEach((t, i) => {
      const d = ENEMIES[t]; const L = Object.assign({}, d.look);
      if (L.top === 'random') L.top = pick(['#c0392b', '#2e86de', '#e67e22', '#8e44ad']);
      L.skin = pick(['#f1c9a5', '#e0ac85', '#c68642', '#8d5524', '#ffdbac']); L.hair = pick(['#2b1b10', '#4a3020', '#8a6a3a', '#111', '#c9b48a', '#777']);
      L.female = Math.random() < 0.5; L.style = pick(HAIR_STYLES[L.female ? 'f' : 'm'])[0];
      L.glasses = Math.random() < 0.25; L.shoe = L.gown ? null : '#1c1f25';
      this.runners.push({ type: t, def: d, x: start - 150 - i * rand(95, 130), look: L, walk: Math.random() * 6, face: 1, a: 1, cured: 0, label: t === 'patient' ? pick(SPECIALTIES[pick(Object.keys(SPECIALTIES))].diseases) : d.name });
    });
    this.shotT = 1.2;
  },
  updateTicker(now) {
    const el = document.getElementById('title-ticker'); if (!el) return;
    const keys = Object.keys(SPECIALTIES);
    const lines = keys.map(k => [SPECIALTIES[k].boss, SPECIALTIES[k].name, !!SPECIALTIES[k].final]);
    const [b, n, f] = lines[this.tickerI % lines.length];
    el.classList.remove('show'); void el.offsetWidth;
    el.innerHTML = `<span class="oncall"><i></i>${f ? 'FINAL BOSS' : 'ON CALL'}</span> <b>${b}</b> · ${n} attending ${f ? 'is scrubbing in for you' : 'is waiting on the wards'}`;
    el.classList.add('show');
    this.tickerI++;
  },

  tick(now) {
    if (!this.running) return;
    const title = document.getElementById('title');
    if (!title || title.classList.contains('hidden')) { this.running = false; return; }
    const dt = clamp((now - this.last) / 1000, 0, 0.05); this.last = Math.max(this.last, now);
    const sp = this.reduce ? 0.15 : 1;
    this.t += dt * sp;
    this.update(dt * sp);
    this.draw();
    requestAnimationFrame(this.tick);
  },

  update(dt) {
    const W = this.W, H = this.H;
    // heartbeat
    this.nextBeat -= dt;
    if (this.nextBeat <= 0) {
      this.nextBeat = 0.86; this.beatT = 0;
      const logo = document.querySelector('.logo');
      if (logo) { logo.classList.remove('beat'); void logo.offsetWidth; logo.classList.add('beat'); }
    }
    this.beatT += dt;
    // ECG trace: write new samples at the sweep head
    const pxPerSec = 260, n = this.ecg.length;
    const prev = this.ecgX; this.ecgX = (this.ecgX + pxPerSec * dt / 3) % n;
    const steps = Math.max(1, Math.round(((this.ecgX - prev + n) % n)));
    for (let k = 0; k < steps; k++) {
      const i = (Math.floor(prev) + k + 1) % n;
      const tb = this.beatT - (steps - k) * (3 / pxPerSec);
      this.ecg[i] = this.ecgShape(tb);
    }
    // particles
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y < -30) Object.assign(p, this.newPart(false)); }
    // corridor lights
    for (const l of this.lights) { l.z += dt * 0.32; if (l.z > 1) l.z -= 1; }
    // chase
    const lead = this.runners[0];
    const runSpd = Math.max(150, W * 0.16);
    for (const r of this.runners) {
      if (r.cured) { r.cured += dt; r.a = Math.max(0, 1 - r.cured / 1.2); r.x += runSpd * 0.25 * dt; r.walk += dt * 4; continue; }
      r.x += runSpd * dt * (r.me ? 1 : 1.02); r.walk += dt * 13;
    }
    if (lead.me) {
      lead.turnT = Math.max(0, (lead.turnT || 0) - dt);
      lead.face = lead.turnT > 0 ? -1 : 1;
      this.shotT -= dt;
      const chasers = this.runners.filter(r => !r.me && !r.cured && r.x > -40 && r.x < lead.x - 40);
      if (this.shotT <= 0 && chasers.length && lead.x > 120 && lead.x < W - 60) {
        this.shotT = rand(0.9, 1.6); lead.turnT = 0.35;
        const tgt = chasers[0];
        this.shots.push({ x: lead.x - 10, y: this.floorY() - 46 * this.sc(), tgt, life: 1.2 });
      }
    }
    for (const s of this.shots) {
      const tx = s.tgt.x, ty = this.floorY() - 46 * this.sc();
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
      const v = 900 * dt; if (d < v + 6) { s.life = 0; if (!s.tgt.cured) { s.tgt.cured = 0.001; s.tgt.flash = 0.2; this.texts.push({ x: tx, y: ty - 50 * this.sc(), text: s.tgt.def.cured || 'Resolved ✓', t: 1.3 }); } }
      else { s.x += dx / d * v; s.y += dy / d * v; s.life -= dt; }
    }
    this.shots = this.shots.filter(s => s.life > 0);
    for (const r of this.runners) if (r.flash) r.flash = Math.max(0, r.flash - dt);
    for (const t of this.texts) { t.t -= dt; t.y -= 30 * dt; }
    this.texts = this.texts.filter(t => t.t > 0);
    const last = this.runners[this.runners.length - 1];
    if (lead.x > W + 120 && (last.x > W + 60 || last.cured || this.runners.every(r => r.me || r.cured || r.x > W + 60))) this.newChase(false);
    // ticker
    this.tickerT += dt; if (this.tickerT > 3.2) { this.tickerT = 0; this.updateTicker(); }
  },
  ecgShape(tb) { // P-QRS-T complex, seconds since beat
    if (tb < 0) return 0;
    const g = (mu, s, a) => a * Math.exp(-((tb - mu) ** 2) / (2 * s * s));
    return g(0.05, 0.025, 0.12) - g(0.15, 0.008, 0.18) + g(0.17, 0.010, 1.0) - g(0.195, 0.010, 0.32) + g(0.38, 0.045, 0.25);
  },
  floorY() { return this.H - Math.max(26, this.H * 0.045); },
  sc() { return clamp(this.H / 430, 1.25, 2.3); },

  draw() {
    const c = this.c, W = this.W, H = this.H;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // backdrop
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#07111c'); bg.addColorStop(0.55, '#0b1b2b'); bg.addColorStop(1, '#050a10');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const vx = W / 2, vy = H * 0.46;
    // corridor: walls fade, ceiling light panels rushing toward viewer
    c.save();
    for (const l of this.lights) {
      const z = l.z, p = z * z;
      // pairs of ceiling light panels converging on the vanishing point
      const y = vy - (vy + 40) * p - 2, gap = 6 + W * 0.42 * p, pw = 4 + W * 0.16 * p, ph2 = 1 + 9 * p;
      c.fillStyle = `rgba(210,245,255,${0.03 + 0.22 * p})`;
      for (const sx of [-1, 1]) { const x0 = vx + sx * gap - pw / 2; c.fillRect(x0, y, pw, ph2); }
      const glow = c.createRadialGradient(vx, y, 0, vx, y, gap + pw); glow.addColorStop(0, `rgba(120,220,255,${0.05 * p})`); glow.addColorStop(1, 'rgba(120,220,255,0)');
      c.fillStyle = glow; c.fillRect(vx - gap - pw, y - 10, (gap + pw) * 2, (gap + pw));
    }
    // corridor walls: door frames streaming past on both sides
    for (const l of this.lights) {
      const p = ((l.z + 0.5) % 1) ** 2;
      const top = vy - (vy + 40) * p * 0.9, bot = vy + 6 + (H - vy) * p, half = 8 + W * 0.62 * p;
      c.strokeStyle = `rgba(143,217,230,${0.03 + 0.18 * p})`; c.lineWidth = 1 + 2 * p;
      for (const sx of [-1, 1]) { const x = vx + sx * half; c.beginPath(); c.moveTo(x, bot); c.lineTo(x, top); c.stroke(); const x2 = vx + sx * half * 0.88; c.beginPath(); c.moveTo(x2, bot - (bot - top) * 0.02); c.lineTo(x2, top + (bot - top) * 0.12); c.lineTo(x, top + (bot - top) * 0.1); c.stroke(); }
    }
    // floor grid in perspective
    c.strokeStyle = 'rgba(56,198,217,0.16)'; c.lineWidth = 1;
    for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(vx + i * 6, vy + 6); c.lineTo(vx + i * W * 0.18, H); c.stroke(); }
    const off = (this.t * 0.9) % 1;
    for (let k = 0; k < 14; k++) {
      const z = ((k + off) / 14); const p = z * z * z;
      const y = vy + 6 + (H - vy) * p;
      c.strokeStyle = `rgba(56,198,217,${0.04 + 0.22 * p})`; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
    }
    // floor wayfinding stripe
    c.fillStyle = 'rgba(255,179,71,0.10)'; c.beginPath(); c.moveTo(vx - 3, vy + 6); c.lineTo(vx + 3, vy + 6); c.lineTo(vx + W * 0.05, H); c.lineTo(vx - W * 0.05, H); c.fill();
    c.restore();
    // horizon glow
    const hg = c.createRadialGradient(vx, vy, 0, vx, vy, W * 0.5); hg.addColorStop(0, 'rgba(56,198,217,0.18)'); hg.addColorStop(1, 'rgba(56,198,217,0)');
    c.fillStyle = hg; c.fillRect(0, 0, W, H);
    // sweeping spotlights
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const [ox, ph, col] of [[W * 0.12, 0, '120,200,255'], [W * 0.88, 2.1, '200,140,255']]) {
      const a = -Math.PI / 2 + Math.sin(this.t * 0.6 + ph) * 0.55;
      const len = H * 1.2, spread = 0.16;
      const gr = c.createLinearGradient(ox, H, ox + Math.cos(a) * len, H + Math.sin(a) * len);
      gr.addColorStop(0, `rgba(${col},0.16)`); gr.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = gr; c.beginPath(); c.moveTo(ox, H);
      c.lineTo(ox + Math.cos(a - spread) * len, H + Math.sin(a - spread) * len); c.lineTo(ox + Math.cos(a + spread) * len, H + Math.sin(a + spread) * len); c.closePath(); c.fill();
    }
    c.restore();
    // particles
    for (const p of this.parts) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.globalAlpha = p.a; c.fillStyle = p.hue;
      if (p.kind === 'pill') { const w = 12 * p.s, h = 5 * p.s; c.beginPath(); c.arc(-w / 2 + h / 2, 0, h / 2, Math.PI / 2, Math.PI * 1.5); c.lineTo(w / 2 - h / 2, -h / 2); c.arc(w / 2 - h / 2, 0, h / 2, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(0, -h / 2, w / 2 - h / 2, h); }
      else if (p.kind === 'cross') { const s = 5 * p.s; c.fillRect(-s, -s / 3, s * 2, s * 2 / 3); c.fillRect(-s / 3, -s, s * 2 / 3, s * 2); }
      else { c.beginPath(); c.arc(0, 0, 2 * p.s, 0, 7); c.fill(); }
      c.restore();
    }
    // ECG monitor line behind the logo
    const logo = document.querySelector('.logo');
    let ey = H * 0.24;
    if (logo) { const r = logo.getBoundingClientRect(); if (r.height) ey = r.top + r.height * 0.55; }
    const amp = Math.min(70, H * 0.09), n = this.ecg.length, head = Math.floor(this.ecgX);
    c.save(); c.lineJoin = 'round';
    for (const [lw, col] of [[7, 'rgba(60,255,170,0.10)'], [3.5, 'rgba(60,255,170,0.25)'], [1.6, 'rgba(160,255,210,0.95)']]) {
      c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
      let started = false;
      for (let i = 0; i < n; i++) {
        const age = (head - i + n) % n; if (age < 6) { started = false; continue; } // erase gap ahead of the sweep
        const x = i * 3, y = ey - this.ecg[i] * amp;
        if (!started) { c.moveTo(x, y); started = true; } else c.lineTo(x, y);
      }
      c.stroke();
    }
    const hx = head * 3, hy = ey - this.ecg[head] * amp;
    const dot = c.createRadialGradient(hx, hy, 0, hx, hy, 16); dot.addColorStop(0, 'rgba(200,255,230,1)'); dot.addColorStop(1, 'rgba(60,255,170,0)');
    c.fillStyle = dot; c.beginPath(); c.arc(hx, hy, 16, 0, 7); c.fill();
    c.restore();
    // beat flash
    if (this.beatT < 0.25) { c.fillStyle = `rgba(60,255,170,${0.05 * (1 - this.beatT / 0.25)})`; c.fillRect(0, 0, W, H); }
    // chase
    const fy = this.floorY(), sc = this.sc();
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, fy + 2, W, H - fy);
    const old = ctx; ctx = c;
    try {
      const order = this.runners.slice().sort((a, b) => a.x - b.x);
      for (const r of order) {
        if (r.x < -80 || r.x > W + 80) continue;
        c.globalAlpha = r.a;
        drawPerson(r.x, fy, Object.assign({}, r.look, { scale: sc, face: r.face, walk: r.walk, flash: r.flash || 0 }));
        c.globalAlpha = 1;
        if (!r.me && !r.cured && r.def.elite) { c.font = `700 ${11 + sc * 2}px Inter, system-ui, sans-serif`; c.textAlign = 'center'; c.fillStyle = 'rgba(255,210,122,0.85)'; c.fillText('⚖ ' + r.def.name, r.x, fy - 82 * sc); }
      }
      for (const s of this.shots) {
        const g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, 14); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#7fe3ff'); g.addColorStop(1, 'rgba(127,227,255,0)');
        c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, 14, 0, 7); c.fill();
      }
      for (const t of this.texts) { c.globalAlpha = Math.min(1, t.t * 1.5); c.font = `800 ${12 + sc * 3}px Inter, system-ui, sans-serif`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.strokeText(t.text, t.x, t.y); c.fillStyle = '#7dffb0'; c.fillText(t.text, t.x, t.y); }
      c.globalAlpha = 1;
    } finally { ctx = old; }
    // vignette
    const vg = c.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  },
};
