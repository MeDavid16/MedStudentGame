// ===================== RESIDENCY — ENGINE =====================
'use strict';

const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = n => Math.round(n).toLocaleString();

// ---------------- SAVE ----------------
let S = null; // save data
const SAVE_KEY = 'residency_save_v1';
function newSave(name, gender, skin, scrub, hair) {
  return {
    name, gender, skin, scrub, hair,
    level: 1, xp: 0, money: 40, bp: 2, coffee: 2,
    talents: {}, slotted: [],
    equip: { head: null, shirt: null, pants: null, shoes: null, stethoscope: null, wrist: null, ringL: null, ringR: null },
    inv: [],
    order: ['classroom', ...FIXED_ORDER, ...shuffle(RANDOM_POOL), 'neuro'],
    cleared: 0, shop: [], finished: false, deaths: 0, correct: 0, asked: 0,
    weapons: [pick(WEAPON_KEYS)], seenQ: {},
  };
}
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
function loadGame() { try { const t = localStorage.getItem(SAVE_KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function zoneInfo(idx) {
  const key = S.order[idx];
  if (key === 'classroom') return Object.assign({ key, idx, boss: null }, CLASSROOM);
  return Object.assign({ key, idx }, SPECIALTIES[key]);
}

// ---------------- ITEMS ----------------
let itemUid = Date.now();
function rollTier() {
  // Normal 73 : Magic 12 : Rare 8 : Legendary 4 (relative weights)
  const total = TIERS.reduce((a, t) => a + t.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < TIERS.length; i++) { r -= TIERS[i].weight; if (r < 0) return i; }
  return 0;
}
function genItem(type, ilvl, tier) {
  const T = ITEM_TYPES[type];
  let name;
  const baseIdx = clamp(Math.floor(ilvl / 6) + randi(-1, 1), 0, T.bases.length - 1);
  const base = T.bases[baseIdx];
  if (tier === 3) name = pick(LEGENDARIES[type]);
  else if (tier === 2) name = `${base} ${pick(RARE_SUFFIX)}`;
  else if (tier === 1) name = `${pick(MAGIC_PREFIX)} ${base}`;
  else name = base;
  const keys = shuffle(STAT_KEYS).slice(0, [2, 3, 4, 5][tier]); // Normal 2, Magic 3, Rare 4, Legendary 5 random stats
  const stats = {};
  for (const k of keys) stats[k] = Math.max(1, Math.round((2 + ilvl * 0.75) * TIERS[tier].mult * STATS[k].per * rand(0.65, 1.35)));
  const price = Math.round(18 * (1 + ilvl * 0.45) * TIERS[tier].price * rand(0.9, 1.15));
  return { uid: ++itemUid, type, name, base, tier, ilvl, stats, price };
}
function randomItem(ilvl) { return genItem(pick(Object.keys(ITEM_TYPES)), Math.max(1, ilvl + randi(-1, 1)), rollTier()); }
function zoneIlvl(idx) { return 1 + idx * 2; }
function restockShop() {
  const ilvl = zoneIlvl(Math.min(S.cleared, S.order.length - 1)) + 1;
  const n = randi(14, 22);
  S.shop = [];
  const cap = [Infinity, 2, 2, 1]; // max Magic 2, Rare 2, Legendary 1; everything else Normal
  const count = [0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    let tier = rollTier();
    if (count[tier] >= cap[tier]) tier = 0;
    count[tier]++;
    S.shop.push(genItem(pick(Object.keys(ITEM_TYPES)), Math.max(1, ilvl + randi(-2, 2)), tier));
  }
  S.shop.sort((a, b) => b.tier - a.tier || a.price - b.price);
}
function shopRestockCost() { return Math.round(15 + 12 * S.cleared); }

// ---------------- DERIVED STATS ----------------
const tr = id => S.talents[id] || 0;
function gearStats() {
  const g = {}; STAT_KEYS.forEach(k => g[k] = 0);
  for (const s of SLOTS) { const it = S.equip[s]; if (it) for (const k in it.stats) g[k] += it.stats[k]; }
  return g;
}
function calcStats() {
  const g = gearStats();
  const L = S.level;
  const c = {};
  c.gear = g;
  c.maxHp = Math.round((100 + 12 * (L - 1) + 5 * g.stamina) * (1 + 0.10 * tr('empath')));
  c.baseDmg = 10 + 2.2 * (L - 1);
  c.dmgMult = 1 + g.knowledge * 0.01 + 0.06 * tr('ebm') + 0.04 * tr('sharp');
  c.crit = Math.min(0.75, 0.05 + g.insight * 0.005 + 0.05 * tr('pattern'));
  c.critDmg = 1.5 + 0.25 * tr('recall');
  c.atkRate = 3 * (1 + g.dexterity * 0.01 + 0.08 * tr('steady'));
  c.cdr = Math.min(0.6, Math.min(0.5, g.focus * 0.007) + 0.06 * tr('pk'));
  c.dr = Math.min(0.7, Math.min(0.6, g.composure * 0.005) + 0.04 * tr('sterile'));
  c.move = 230 * (1 + g.reflexes * 0.006 + 0.08 * tr('scrubbed'));
  c.moneyMult = 1 + g.charisma * 0.01 + 0.10 * tr('sdm');
  c.regen = g.empathy * 0.15 + c.maxHp * 0.004 * tr('listen');
  c.dodge = 0.10 * tr('compose');
  c.bpMult = 1 + 0.10 * tr('pearls');
  c.basicMult = 1 + 0.08 * tr('bioavail');
  c.extraProj = tr('loading');
  c.poisonMult = 1 + 0.20 * tr('halflife');
  c.synergy = 0.10 * tr('synergy');
  c.scalpelMult = 1 + 0.12 * tr('sharp');
  c.hemo = 0.015 * tr('hemo');
  c.coffeeHeal = 0.35 * (1 + 0.25 * tr('alliance'));
  c.qTime = 20 + 4 * tr('pearls');
  c.ruleout = tr('ruleout');
  return c;
}
function xpNeeded(L) { return Math.round(80 + 50 * L + 2 * L * L); }
function ranksSpent() { let n = 0; for (const k in S.talents) n += S.talents[k]; return n; }
function treeSpent(tid) { const t = TREES.find(t => t.id === tid); return t.nodes.reduce((a, n) => a + tr(n.id), 0); }

// ---------------- CANVAS ----------------
const cv = document.getElementById('game');
let ctx = cv.getContext('2d');
let VW = 0, VH = 0, DPR = 1, ZOOM = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  VW = window.innerWidth; VH = window.innerHeight;
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
  ZOOM = clamp(Math.min(VW / 1000, VH / 640), 0.55, 1.5);
}
window.addEventListener('resize', resize); resize();

// ---------------- INPUT ----------------
const keys = {};
const mouse = { x: 0, y: 0, down: false, wx: 0, wy: 0 };
let touchMode = false;
const touch = { stickId: null, sx: 0, sy: 0, dx: 0, dy: 0 };
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (G && G.running && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (keys[k]) return;
  keys[k] = true;
  if (!G || !G.running) return;
  if (G.state === 'play') {
    if (['1', '2', '3', '4'].includes(k)) useSkill(+k - 1);
    if (k === 'q') drinkCoffee();
    if (k === 'escape' || k === 'p') openPause();
    if (k === 'i' || k === 'c') { openPause(); UI.openPanel('gear'); }
    if (k === 't') { openPause(); UI.openPanel('talents'); }
  }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
cv.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; touchMode = false; });
cv.addEventListener('mousedown', e => { if (e.button === 0) mouse.down = true; mouse.x = e.clientX; mouse.y = e.clientY; touchMode = false; });
window.addEventListener('mouseup', () => { mouse.down = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
// touch: left half = joystick, buttons drawn bottom-right
cv.addEventListener('touchstart', e => {
  e.preventDefault(); touchMode = true;
  for (const t of e.changedTouches) {
    const b = touchButtonAt(t.clientX, t.clientY);
    if (b) { b.fn(); continue; }
    if (t.clientX < VW * 0.5 && touch.stickId === null) { touch.stickId = t.identifier; touch.sx = t.clientX; touch.sy = t.clientY; touch.dx = 0; touch.dy = 0; }
  }
}, { passive: false });
cv.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) if (t.identifier === touch.stickId) { touch.dx = t.clientX - touch.sx; touch.dy = t.clientY - touch.sy; }
}, { passive: false });
cv.addEventListener('touchend', e => { for (const t of e.changedTouches) if (t.identifier === touch.stickId) { touch.stickId = null; touch.dx = touch.dy = 0; } });
function touchButtons() {
  const s = 58, pad = 14, bx = VW - pad - s, by = VH - pad - s;
  const btns = [{ x: bx - s - 10, y: by - s - 10, label: '☕', fn: drinkCoffee }, { x: VW - pad - s, y: pad + 40, label: '❚❚', fn: openPause }];
  for (let i = 0; i < 4; i++) {
    const pos = [[bx, by], [bx - s - 10, by], [bx, by - s - 10], [bx - (s + 10) * 2, by]][i];
    btns.push({ x: pos[0], y: pos[1], label: String(i + 1), fn: () => useSkill(i), skill: i });
  }
  return btns.map(b => Object.assign(b, { w: s, h: s }));
}
function touchButtonAt(x, y) { if (!G || G.state !== 'play') return null; return touchButtons().find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h); }

// ---------------- AUDIO (tiny synth) ----------------
let AC = null, muted = false;
const _sfxLast = {};
function sfx(type) {
  if (muted) return;
  const now = performance.now(); if (now - (_sfxLast[type] || 0) < (type === 'hit' || type === 'shoot' ? 45 : 25)) return; _sfxLast[type] = now;
  try {
    if (!AC) return;
    const o = AC.createOscillator(), g = AC.createGain(); o.connect(g); g.connect(AC.destination);
    const t = AC.currentTime;
    const P = { shoot: [880, 0.03, 'triangle', 0.025], hit: [220, 0.05, 'square', 0.03], hurt: [120, 0.12, 'sawtooth', 0.05], coin: [1320, 0.06, 'sine', 0.04], level: [660, 0.35, 'triangle', 0.08], skill: [440, 0.15, 'sine', 0.06], boss: [90, 0.6, 'sawtooth', 0.08], right: [990, 0.3, 'sine', 0.08], wrong: [150, 0.4, 'square', 0.06] }[type];
    if (!P) return;
    o.type = P[2]; o.frequency.setValueAtTime(P[0], t);
    if (type === 'level' || type === 'right') o.frequency.exponentialRampToValueAtTime(P[0] * 2, t + P[1]);
    if (type === 'hurt' || type === 'wrong' || type === 'boss') o.frequency.exponentialRampToValueAtTime(P[0] * 0.5, t + P[1]);
    g.gain.setValueAtTime(P[3], t); g.gain.exponentialRampToValueAtTime(0.0001, t + P[1]);
    o.start(t); o.stop(t + P[1] + 0.02);
  } catch (e) { /* audio unavailable */ }
}

// ---------------- WORLD / ZONE ----------------
let G = null; // live game state
const WW = 2000, WH = 1400, WALL = 60;
const PROP_SETS = {
  classroom: [['desk', 120, 50, 18], ['desk', 120, 50, 0], ['podium', 60, 46, 1], ['plant', 34, 34, 3], ['skeleton', 40, 30, 1], ['cabinet', 90, 40, 2]],
  clinic:    [['examtable', 110, 52, 8], ['chair', 34, 34, 8], ['cart', 50, 40, 4], ['counter', 220, 56, 1], ['plant', 34, 34, 3], ['curtain', 130, 14, 4], ['scale', 34, 34, 2]],
  hospital:  [['bed', 70, 120, 8], ['ivpole', 18, 18, 8], ['cart', 50, 40, 5], ['counter', 260, 60, 1], ['monitor', 44, 30, 4], ['wheelchair', 40, 40, 3], ['plant', 34, 34, 2]],
  or:        [['ortable', 70, 150, 2], ['monitor', 44, 30, 6], ['ivpole', 18, 18, 6], ['cart', 60, 40, 6], ['anesmachine', 70, 60, 2], ['backtable', 120, 50, 3]],
};
const FLOORS = {
  classroom: { a: '#8a6a4a', b: '#7d5f42', tile: 0, wall: '#d9d2c3', trim: '#6b5038' },
  clinic:    { a: '#c9ced5', b: '#bac0c8', tile: 64, wall: '#eef0f2', trim: '#7d8fa3' },
  hospital:  { a: '#b9c6d2', b: '#acbac8', tile: 80, wall: '#e3e9ee', trim: '#4b6a8a' },
  or:        { a: '#7fa79b', b: '#729a8e', tile: 40, wall: '#cfe0da', trim: '#3c6b5f' },
};

function buildFloor(setting, accent) {
  const F = FLOORS[setting];
  const c = document.createElement('canvas'); c.width = WW; c.height = WH;
  const g = c.getContext('2d');
  g.fillStyle = F.a; g.fillRect(0, 0, WW, WH);
  if (setting === 'classroom') { // wood planks
    for (let y = 0; y < WH; y += 28) for (let x = (y / 28 % 2) * 90; x < WW; x += 180) {
      g.fillStyle = Math.random() < 0.5 ? F.a : F.b; g.fillRect(x, y, 178, 26);
      g.fillStyle = 'rgba(0,0,0,0.05)'; for (let k = 0; k < 4; k++) g.fillRect(x + rand(0, 160), y + rand(4, 22), rand(20, 60), 1);
    }
  } else {
    const s = F.tile;
    for (let y = 0; y < WH; y += s) for (let x = 0; x < WW; x += s) {
      g.fillStyle = ((x / s + y / s) % 2 === 0) ? F.a : F.b; g.fillRect(x, y, s, s);
      g.fillStyle = `rgba(255,255,255,${rand(0, 0.04)})`; g.fillRect(x, y, s, s);
    }
    g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 1;
    for (let x = 0; x < WW; x += s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, WH); g.stroke(); }
    for (let y = 0; y < WH; y += s) { g.beginPath(); g.moveTo(0, y); g.lineTo(WW, y); g.stroke(); }
  }
  // accent floor stripe (wayfinding line)
  if (setting !== 'classroom') { g.fillStyle = accent; g.globalAlpha = 0.35; g.fillRect(WALL + 30, WH / 2 - 6, WW - WALL * 2 - 60, 12); g.globalAlpha = 1; }
  // ceiling light pools
  const lights = setting === 'or' ? [[WW / 2, WH / 2, 520]] : [];
  for (let x = 250; x < WW; x += 380) for (let y = 260; y < WH; y += 380) lights.push([x, y, 230]);
  for (const [x, y, r] of lights) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,252,235,0.22)'); gr.addColorStop(1, 'rgba(255,252,235,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // walls
  g.fillStyle = F.wall; g.fillRect(0, 0, WW, WALL); g.fillRect(0, WH - WALL, WW, WALL); g.fillRect(0, 0, WALL, WH); g.fillRect(WW - WALL, 0, WALL, WH);
  g.fillStyle = F.trim; g.fillRect(WALL, WALL - 10, WW - WALL * 2, 10); g.fillRect(WALL, WH - WALL, WW - WALL * 2, 6);
  g.fillRect(WALL - 6, WALL, 6, WH - WALL * 2); g.fillRect(WW - WALL, WALL, 6, WH - WALL * 2);
  // wall decorations on top wall
  for (let x = 180; x < WW - 200; x += 300) {
    if (setting === 'classroom') { g.fillStyle = '#f7f7f2'; g.fillRect(x, 6, 220, 44); g.strokeStyle = '#999'; g.strokeRect(x, 6, 220, 44); g.fillStyle = '#c33'; g.font = '10px sans-serif'; g.fillText('Krebs cycle → ATP', x + 10, 24); g.fillStyle = '#336'; g.fillText('CN I–XII: Oh Oh Oh…', x + 10, 40); }
    else { g.fillStyle = '#2b3442'; g.fillRect(x, 10, 60, 36); g.fillStyle = accent; g.fillRect(x + 4, 14, 52, 4); g.fillStyle = '#7ff0a0'; g.beginPath(); g.moveTo(x + 4, 34); for (let i = 0; i < 52; i += 4) g.lineTo(x + 4 + i, 34 - (i % 16 === 8 ? 12 : 0)); g.stroke(); }
  }
  // shadow under top wall
  const sh = g.createLinearGradient(0, WALL, 0, WALL + 40); sh.addColorStop(0, 'rgba(0,0,0,0.25)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.fillRect(WALL, WALL, WW - WALL * 2, 40);
  return c;
}

function placeProps(setting) {
  const props = [];
  const set = PROP_SETS[setting];
  const ok = (x, y, w, h) => {
    if (x < WALL + 20 || y < WALL + 30 || x + w > WW - WALL - 20 || y + h > WH - WALL - 20) return false;
    if (Math.abs(x + w / 2 - WW / 2) < 220 && Math.abs(y + h / 2 - WH / 2) < 180) return false; // keep center clear
    for (const p of props) if (x < p.x + p.w + 70 && x + w + 70 > p.x && y < p.y + p.h + 70 && y + h + 70 > p.y) return false;
    return true;
  };
  if (setting === 'classroom') { // rows of desks
    for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) {
      if (Math.random() < 0.3) continue;
      const x = 180 + col * 250, y = 260 + row * 260;
      if (ok(x, y, 120, 50)) props.push({ kind: 'desk', x, y, w: 120, h: 50 });
    }
  }
  for (const [kind, w, h, n] of set) {
    let placed = 0, tries = 0;
    while (placed < n && tries++ < 300) {
      const x = rand(WALL, WW - WALL - w), y = rand(WALL, WH - WALL - h);
      if (ok(x, y, w, h)) { props.push({ kind, x, y, w, h, seed: Math.random() }); placed++; }
    }
  }
  return props;
}

function startZone(idx) {
  const Z = zoneInfo(idx);
  const stats = calcStats();
  const bump = Math.floor(idx * 0.8);
  G = {
    running: true, state: 'play', zone: Z, idx, t: 0,
    floor: buildFloor(Z.setting, Z.accent), props: placeProps(Z.setting),
    player: { x: WW / 2, y: WH / 2 + 40, r: 14, hp: stats.maxHp, atkT: 0, face: 1, walk: 0, iframe: 0, rootT: 0, slowT: 0, dash: null, spin: 0, spinTick: 0, shield: 0, cds: [0, 0, 0, 0], moving: false },
    stats, enemies: [], projs: [], hazards: [], pickups: [], floaters: [], parts: [], rings: [],
    waves: [10 + Math.floor(idx * 1.3), 13 + Math.floor(idx * 1.4)], wave: 0, queue: [], spawnT: 0, waveDelay: 1.5,
    beams: [], bolts: [], swings: [], mist: [], flashes: [], sparks: [], wcd: {},
    boss: null, bossSpawned: false, qIdx: 0, shake: 0, banner: { text: Z.place, sub: Z.boss ? `${Z.name} rotation` : 'Orientation week', t: 3.5 },
    earned: { money: 0, bp: 0, xp: 0, items: [] }, cam: { x: WW / 2, y: WH / 2 },
  };
  queueWave();
  UI.showGame();
}
function queueWave() {
  const n = G.waves[G.wave];
  G.queue = [];
  for (let i = 0; i < n; i++) G.queue.push(pick(G.zone.staff));
  if (G.wave === 1 && G.idx >= 3) G.queue.push('lawyer');
  if (G.wave === 0 && G.idx >= 5) G.queue.push(pick(['exec', 'insurance', 'lawyer']));
  G.spawnT = 0;
}
function freeSpot(minDistFromPlayer) {
  for (let tries = 0; tries < 60; tries++) {
    const x = rand(WALL + 40, WW - WALL - 40), y = rand(WALL + 50, WH - WALL - 40);
    if (G.player && Math.hypot(x - G.player.x, y - G.player.y) < minDistFromPlayer) continue;
    if (G.props.some(p => x > p.x - 25 && x < p.x + p.w + 25 && y > p.y - 25 && y < p.y + p.h + 25)) continue;
    return { x, y };
  }
  return { x: WALL + 80, y: WALL + 80 };
}
function spawnEnemy(type, at) {
  const d = ENEMIES[type];
  const sc = 1 + G.idx * 0.5, dsc = 1 + G.idx * 0.28;
  const p = at || freeSpot(420);
  const look = Object.assign({}, d.look);
  if (look.top === 'random') look.top = pick(['#c0392b', '#2e86de', '#e67e22', '#8e44ad', '#16a085', '#d35400', '#7f8c8d']);
  look.skin = pick(['#f1c9a5', '#e0ac85', '#c68642', '#8d5524', '#ffdbac']);
  look.hair = pick(['#2b1b10', '#4a3020', '#8a6a3a', '#111', '#c9b48a', '#777']);
  look.female = Math.random() < 0.5;
  look.style = pick(HAIR_STYLES[look.female ? 'f' : 'm'])[0];
  look.beard = !look.female && Math.random() < 0.25;
  look.glasses = Math.random() < (type === 'pharmacist' || type === 'exec' || type === 'labtech' ? 0.5 : 0.15);
  look.eye = pick(['#4a3222', '#2d1f16', '#3b5a7a', '#4a6b3a']);
  look.shoe = look.gown ? null : pick(['#1c1f25', '#e8ebee', '#3a2a1e', '#2b3a55']);
  look.sock = pick(['#e9c46a', '#5fb3d9', '#e07a8a']);
  if (look.gown) look.badge = false;
  const e = {
    type, def: d, x: p.x, y: p.y, r: d.elite ? 16 : 13, hp: d.hp * sc * (d.elite ? 1.3 : 1), maxHp: d.hp * sc * (d.elite ? 1.3 : 1),
    spd: d.spd * rand(0.9, 1.1), dmg: d.dmg * dsc, atkT: rand(0.5, 1.5), stunT: 0, markT: 0, poisonT: 0, poisonDps: 0, slowT: 0,
    face: 1, walk: Math.random() * 6, look, flash: 0, label: null, spawnT: 0.5, state: 'move', chargeT: 0, strafe: Math.random() < 0.5 ? 1 : -1,
  };
  if (type === 'patient') e.label = G.zone.diseases.length ? pick(G.zone.diseases) : 'Chest Pain';
  if (type === 'stdpatient') e.label = pick(['Case: Chest Pain', 'Case: Abdominal Pain', 'Case: Headache', 'Case: Fatigue']);
  G.enemies.push(e);
  burst(e.x, e.y, '#ffffff', 10);
  return e;
}
function pickQuestions(key, bank) {
  S.seenQ = S.seenQ || {};
  let fresh = bank.filter(q => !S.seenQ[key + ':' + q.q]);
  if (fresh.length < 4) { for (const q of bank) delete S.seenQ[key + ':' + q.q]; fresh = bank.slice(); } // whole bank seen: start a new cycle
  const seen = bank.filter(q => !fresh.includes(q));
  return shuffle(fresh).concat(shuffle(seen));
}
function spawnBoss() {
  const Z = G.zone;
  const pos = { x: clamp(G.player.x, WALL + 120, WW - WALL - 120), y: clamp(G.player.y - 300, WALL + 120, WH - WALL - 120) };
  const hp = 700 * (1 + G.idx * 0.75) * (Z.final ? 1.5 : 1);
  const patterns = Object.keys(Z.attacks);
  const b = {
    type: 'boss', boss: true, def: { name: Z.boss, beh: 'boss' }, spec: Z, x: pos.x, y: pos.y, r: 24, hp, maxHp: hp,
    spd: 75 + G.idx * 2, dmg: 14 * (1 + G.idx * 0.28), atkT: 2.0, stunT: 0, markT: 0, poisonT: 0, poisonDps: 0, slowT: 0,
    face: 1, walk: 0, flash: 0, spawnT: 1, patterns, pat: null, patT: 0, patData: {}, enrageT: 0,
    thresholds: Z.final ? [0.8, 0.6, 0.4, 0.2] : [0.75, 0.5, 0.25],
    questions: pickQuestions(Z.key, Z.q), look: (() => { const f = /Rosa|Linda|Grace|Tasha|Naomi|Ingrid|Eleanor/.test(Z.boss); return { top: '#2f3a4a', bottom: '#2f3a4a', coat: true, longcoat: true, female: f, style: pick(HAIR_STYLES[f ? 'f' : 'm'])[0], beard: !f && Math.random() < 0.4, glasses: Math.random() < 0.45, skin: pick(['#f1c9a5', '#e0ac85', '#c68642', '#8d5524']), hair: pick(['#222', '#555', '#9a9a9a', '#3a2a1a', '#c8c8c8']), tie: f ? null : Z.accent, shoe: '#1c1f25', steth: '#2a2d33' }; })(),
  };
  G.boss = b; G.enemies.push(b); G.bossSpawned = true;
  G.banner = { text: `ATTENDING: ${Z.boss}`, sub: Z.final ? 'FINAL BOSS — Neurosurgery' : Z.name, t: 3, boss: true };
  G.shake = 0.6; sfx('boss');
}

// ---------------- COMBAT HELPERS ----------------
function floater(x, y, text, color, size) { G.floaters.push({ x: x + rand(-8, 8), y, text, color: color || '#fff', t: 1.0, size: size || 14 }); }
function burst(x, y, color, n, spd) { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), s = rand(40, spd || 180); G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rand(0.3, 0.7), color, r: rand(1.5, 3.5) }); } }
function playerDamage(mult) { return G.stats.baseDmg * G.stats.dmgMult * mult; }
function hitEnemy(e, dmg, o = {}) {
  if (e.dead || e.spawnT > 0.25) return false;
  let d = dmg;
  if (e.markT > 0) d *= 1.4;
  if (e.poisonT > 0) d *= 1 + G.stats.synergy;
  let crit = false;
  if (!o.noCrit && Math.random() < G.stats.crit) { crit = true; d *= G.stats.critDmg; }
  if (o.scalpel) d *= G.stats.scalpelMult;
  e.hp -= d; e.flash = 0.1;
  if (o.poison) { e.poisonT = 3 * (1 + 0.2 * tr('halflife')); e.poisonDps = Math.max(e.poisonDps, playerDamage(0.35) * G.stats.poisonMult); }
  floater(e.x, e.y - 70, (crit ? '✦' : '') + fmt(d), crit ? '#ffd54a' : (o.poisonTick ? '#b57bff' : '#ffffff'), crit ? 18 : 13);
  if (o.scalpel && G.stats.hemo > 0) healPlayer(G.stats.maxHp * G.stats.hemo, true);
  if (!o.quiet) sfx('hit');
  if (e.boss) checkBossQuestion(e);
  if (e.hp <= 0) killEnemy(e);
  return true;
}
function healPlayer(n, quiet) {
  const p = G.player, before = p.hp;
  p.hp = Math.min(G.stats.maxHp, p.hp + n);
  if (!quiet && p.hp - before >= 1) floater(p.x, p.y - 46, '+' + fmt(p.hp - before), '#42d392', 15);
}
function hurtPlayer(dmg, src) {
  const p = G.player;
  if (p.iframe > 0 || p.dash || G.state !== 'play') return;
  if (Math.random() < G.stats.dodge) { floater(p.x, p.y - 46, 'Unflappable!', '#9fe8c4', 13); p.iframe = 0.2; return; }
  let d = dmg * (1 - G.stats.dr);
  if (p.shield > 0) d *= 0.5;
  p.hp -= d; p.iframe = 0.25; G.shake = Math.max(G.shake, 0.15);
  floater(p.x, p.y - 46, '-' + fmt(d), '#ff6b6b', 14);
  sfx('hurt');
  if (src && src.steal && S.money > 0) { const s = Math.max(1, Math.round(S.money * 0.02)); S.money -= s; floater(p.x, p.y - 62, `-$${s} budget cut`, '#9cff6b', 12); }
  if (src && src.root) { p.rootT = src.root; floater(p.x, p.y - 62, src.name + '!', '#fff3c4', 12); }
  if (src && src.slow) { p.slowT = 1.5; }
  if (p.hp <= 0) { p.hp = 0; playerDied(); }
}
function killEnemy(e) {
  e.dead = true;
  const Z = G.zone;
  if (e.boss) return bossDefeated(e);
  const d = e.def;
  floater(e.x, e.y - 56, d.cured || 'Resolved ✓', '#7dffb0', 13);
  burst(e.x, e.y, '#7dffb0', 14);
  const xp = Math.round(d.xp * (1 + G.idx * 0.35));
  gainXp(xp);
  const cash = Math.max(1, Math.round(d.cash * (1 + G.idx * 0.4) * G.stats.moneyMult * rand(0.7, 1.3)));
  G.pickups.push({ kind: 'cash', x: e.x + rand(-10, 10), y: e.y + rand(-10, 10), amount: cash, t: 0 });
  if (Math.random() < (d.elite ? 1 : 0.06)) G.pickups.push({ kind: 'bp', x: e.x + rand(-12, 12), y: e.y + rand(-12, 12), amount: d.elite ? 2 : 1, t: 0 });
  if (Math.random() < (d.elite ? 0.35 : 0.08)) G.pickups.push({ kind: 'item', x: e.x, y: e.y, item: randomItem(zoneIlvl(G.idx)), t: 0 });
}
function gainXp(n) {
  if (S.level >= MAX_LEVEL) return;
  S.xp += n; G && (G.earned.xp += n);
  while (S.level < MAX_LEVEL && S.xp >= xpNeeded(S.level)) {
    S.xp -= xpNeeded(S.level); S.level++;
    G.stats = calcStats(); G.player.hp = G.stats.maxHp;
    G.banner = { text: `LEVEL ${S.level}`, sub: 'New talent rank available — press T', t: 2.2, lvl: true };
    if (S.level >= MAX_LEVEL) { const w2 = grantSecondWeapon(); if (w2) G.banner = { text: `MAX LEVEL — SECOND WEAPON!`, sub: `${WEAPONS[w2].icon} ${WEAPONS[w2].name} now fires alongside your ${WEAPONS[S.weapons[0]].name}`, t: 4.5, lvl: true }; }
    sfx('level'); burst(G.player.x, G.player.y, '#ffd54a', 40, 260);
  }
  if (S.level >= MAX_LEVEL) S.xp = 0;
}
function gainBp(n) { const v = Math.max(1, Math.round(n * G.stats.bpMult)); S.bp += v; G.earned.bp += v; return v; }
function gainMoney(n) { S.money += n; G.earned.money += n; }

// ---------------- PLAYER ACTIONS ----------------
function aimAngle() {
  const p = G.player;
  if (touchMode) {
    let best = null, bd = 1e12;
    for (const e of G.enemies) { if (e.dead) continue; const d = dist2(e, p); if (d < bd) { bd = d; best = e; } }
    if (best) return Math.atan2(best.y - p.y - 2, best.x - p.x);
    return p.face > 0 ? 0 : Math.PI;
  }
  return Math.atan2(mouse.wy - (p.y - 30), mouse.wx - p.x);
}
function fireProj(x, y, ang, spd, o) {
  G.projs.push(Object.assign({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, r: 5, life: 1.4, from: 'p', color: '#7fe3ff', dmg: 10, pierce: 0, hits: new Set() }, o));
}
function basicAttack() {
  const p = G.player, a = aimAngle();
  const n = 1 + G.stats.extraProj;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * 0.13;
    fireProj(p.x + Math.cos(a) * 16, p.y - 30 + Math.sin(a) * 16, a + off, 640, { dmg: playerDamage(G.stats.basicMult), kind: 'pulse' });
  }
  sfx('shoot');
}
function cdFor(id) { return ACTIVE_SKILLS[id].cd * (1 - G.stats.cdr); }
function useSkill(slot) {
  if (G.state !== 'play') return;
  const id = S.slotted[slot]; if (!id) return;
  const p = G.player;
  if (p.cds[slot] > 0) return;
  const a = aimAngle();
  const enemiesNear = r => G.enemies.filter(e => !e.dead && dist2(e, p) < r * r);
  switch (id) {
    case 'ddx':
      enemiesNear(340).forEach(e => { e.markT = 6; floater(e.x, e.y - 60, 'DDx!', '#4fa3ff', 12); });
      G.rings.push({ x: p.x, y: p.y, r: 0, max: 340, t: 0.5, color: '#4fa3ff' }); break;
    case 'grand':
      for (let i = 0; i < 18; i++) fireProj(p.x, p.y - 30, i / 18 * Math.PI * 2, 520, { dmg: playerDamage(3), pierce: 99, r: 8, color: '#9fd0ff', life: 1.6, kind: 'bolt' });
      G.rings.push({ x: p.x, y: p.y, r: 0, max: 200, t: 0.4, color: '#9fd0ff' }); break;
    case 'incision': {
      const tx = mouse.wx, ty = mouse.wy; const ang = touchMode ? a : Math.atan2(ty - p.y, tx - p.x);
      p.dash = { vx: Math.cos(ang) * 1500, vy: Math.sin(ang) * 1500, t: 0.18, hit: new Set() };
      break; }
    case 'suture': p.spin = 3; p.spinTick = 0; break;
    case 'reassure':
      enemiesNear(250).forEach(e => { e.stunT = e.boss ? 1.0 : 2.5; floater(e.x, e.y - 60, e.boss ? 'Hmph.' : 'Calmed', '#42d392', 12); });
      G.rings.push({ x: p.x, y: p.y, r: 0, max: 250, t: 0.5, color: '#42d392' }); break;
    case 'presence':
      healPlayer(G.stats.maxHp * 0.4); p.shield = 6;
      G.rings.push({ x: p.x, y: p.y, r: 0, max: 160, t: 0.6, color: '#42d392' }); break;
    case 'spray':
      for (let i = 0; i < 9; i++) fireProj(p.x, p.y - 30, a + (i - 4) * 0.075, rand(480, 600), { dmg: playerDamage(0.9), poison: true, r: 5, color: pick(['#b57bff', '#ff7ad9', '#ffffff']), life: 0.7, kind: 'pill' });
      break;
    case 'codecart': {
      const cx = touchMode ? p.x + Math.cos(a) * 200 : mouse.wx, cy = touchMode ? p.y + Math.sin(a) * 200 : mouse.wy;
      G.hazards.push({ x: cx, y: cy, r: 140, t: 5, tick: 0, from: 'p', kind: 'cloud', delay: 0 }); break; }
  }
  p.cds[slot] = cdFor(id);
  sfx('skill');
}
function drinkCoffee() {
  if (!G || G.state !== 'play' || S.coffee <= 0) return;
  if (G.player.hp >= G.stats.maxHp) { floater(G.player.x, G.player.y - 46, 'Already caffeinated', '#ccc', 12); return; }
  S.coffee--; healPlayer(G.stats.maxHp * G.stats.coffeeHeal);
  floater(G.player.x, G.player.y - 64, '☕', '#fff', 18);
}

// ---------------- BOSS ----------------
function checkBossQuestion(b) {
  if (G.state !== 'play' || b.dead) return;
  const th = b.thresholds[G.qIdx];
  if (th !== undefined && b.hp / b.maxHp <= th && b.hp > 0) {
    b.hp = Math.max(b.hp, 1);
    G.qIdx++;
    const q = b.questions[(G.qIdx - 1) % b.questions.length];
    S.seenQ = S.seenQ || {}; S.seenQ[b.spec.key + ':' + q.q] = 1;
    G.state = 'question';
    UI.askQuestion(b, q, G.stats.qTime, G.stats.ruleout, correct => {
      S.asked++;
      if (correct) {
        S.correct++;
        const v = gainBp(2);
        b.stunT = 3; b.hp -= b.maxHp * 0.12; b.flash = 0.3;
        floater(b.x, b.y - 70, 'Correct! Stunned', '#7dffb0', 18); floater(G.player.x, G.player.y - 60, `+${v} Brain Power`, '#d6a6ff', 14);
        sfx('right');
      } else {
        const p = G.player; const d = G.stats.maxHp * 0.2;
        p.hp = Math.max(1, p.hp - d); b.enrageT = 6;
        floater(p.x, p.y - 60, 'Pimped! -' + fmt(d), '#ff6b6b', 16); G.shake = 0.4;
        sfx('wrong');
      }
      G.state = 'play';
      if (b.hp <= 0) killEnemy(b);
    });
  }
}
function bossPattern(b, dt) {
  const p = G.player;
  const d = b.patData;
  const ang = Math.atan2(p.y - b.y, p.x - b.x);
  const tier = Math.min(10, G.idx);
  const shoot = (a, spd, o) => G.projs.push(Object.assign({ x: b.x, y: b.y - 50, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 8, life: 4, from: 'e', color: b.spec.accent, dmg: b.dmg * 0.8, name: b.spec.attacks[b.pat] }, o || {}));
  switch (b.pat) {
    case 'ring': {
      if (!d.done) { const n = 14 + tier; const off = rand(0, 1); for (let i = 0; i < n; i++) shoot((i + off) / n * Math.PI * 2, 210 + tier * 8); d.done = true; if (G.idx >= 6) d.second = 0.5; }
      if (d.second !== undefined) { d.second -= dt; if (d.second <= 0) { const n = 14 + tier; for (let i = 0; i < n; i++) shoot((i + 0.5) / n * Math.PI * 2, 230 + tier * 8); delete d.second; } }
      return b.patT > 1.0; }
    case 'volley': {
      d.n = d.n || 0; d.cd = (d.cd || 0) - dt;
      if (d.cd <= 0 && d.n < 3 + Math.floor(tier / 4)) { for (let i = -2; i <= 2; i++) shoot(ang + i * 0.16, 330 + tier * 10, { r: 7 }); d.n++; d.cd = 0.3; }
      return b.patT > 1.4; }
    case 'spiral': {
      d.a = (d.a || 0) + dt * 4.2; d.cd = (d.cd || 0) - dt;
      if (d.cd <= 0) { const arms = 2 + Math.floor(tier / 4); for (let k = 0; k < arms; k++) shoot(d.a + k * Math.PI * 2 / arms, 230, { r: 7 }); d.cd = 0.09; }
      return b.patT > 2.4; }
    case 'dash': {
      if (!d.phase) { d.phase = 'tele'; d.a = ang; d.t = 0.8; }
      if (d.phase === 'tele') { d.t -= dt; if (d.t <= 0) { d.phase = 'go'; d.t = 0.55; } return false; }
      if (d.phase === 'go') { d.t -= dt; b.x += Math.cos(d.a) * 720 * dt; b.y += Math.sin(d.a) * 720 * dt; resolveProps(b); burst(b.x, b.y, b.spec.accent, 2, 60); if (d.t <= 0) return true; }
      return false; }
    case 'summon': {
      if (!d.done) {
        const pool = b.spec.staff.filter(s => s !== 'patient' && s !== 'lawyer'); const n = 2 + Math.floor(tier / 4);
        for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2); spawnEnemy(pick(pool.length ? pool : ['resident']), { x: clamp(b.x + Math.cos(a) * 80, WALL + 30, WW - WALL - 30), y: clamp(b.y + Math.sin(a) * 80, WALL + 40, WH - WALL - 30) }); }
        d.done = true; }
      return b.patT > 0.8; }
    case 'zones': {
      if (!d.done) {
        const n = 4 + Math.floor(tier / 3);
        G.hazards.push({ x: p.x, y: p.y, r: 80, delay: 1.1, t: 0.25, from: 'e', kind: 'blast', dmg: b.dmg * 1.5, color: b.spec.accent, name: b.spec.attacks.zones });
        for (let i = 1; i < n; i++) { const a = rand(0, Math.PI * 2), r = rand(90, 240); G.hazards.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, r: 75, delay: 1.1 + i * 0.12, t: 0.25, from: 'e', kind: 'blast', dmg: b.dmg * 1.5, color: b.spec.accent }); }
        d.done = true; }
      return b.patT > 1.3; }
  }
  return true;
}

function bossDefeated(b) {
  G.state = 'won';
  burst(b.x, b.y, b.spec.accent, 80, 320); G.shake = 0.8;
  const items = [0, 1, 2].map(() => randomItem(zoneIlvl(G.idx) + 1));
  const v = gainBp(5);
  const cash = Math.round((60 + G.idx * 45) * G.stats.moneyMult); gainMoney(cash);
  gainXp(150 + G.idx * 90);
  G.enemies.forEach(e => e.dead = true);
  finishZone(items);
}
function finishZone(items) {
  G.state = 'won';
  const first = G.idx === S.cleared;
  if (G.zone.key === 'classroom' && first) { S.bp += 6; G.earned.bp += 6; }
  for (const it of items) { if (S.inv.length < 40) S.inv.push(it); else gainMoney(Math.round(it.price * 0.25)); G.earned.items.push(it); }
  if (first) S.cleared++;
  const finale = G.zone.final && first;
  if (finale) S.finished = true;
  restockShop();
  saveGame();
  setTimeout(() => UI.zoneComplete(G.zone, G.earned, first, finale), 900);
}
function playerDied() {
  G.state = 'dead';
  S.deaths++;
  const lost = Math.round(S.money * 0.1); S.money -= lost;
  saveGame();
  setTimeout(() => UI.died(G.zone, lost), 700);
}
function openPause() { if (G && G.state === 'play') { G.state = 'pause'; UI.pause(); } }
function resumeGame() { if (G && G.state === 'pause') { G.stats = calcStats(); G.player.hp = Math.min(G.player.hp, G.stats.maxHp); G.state = 'play'; } }

// ---------------- PHYSICS ----------------
function resolveProps(o) {
  let hit = false;
  for (const p of G.props) {
    const cx = clamp(o.x, p.x, p.x + p.w), cy = clamp(o.y, p.y, p.y + p.h);
    const dx = o.x - cx, dy = o.y - cy, d = Math.hypot(dx, dy);
    if (d < o.r) {
      hit = true;
      if (d > 0.01) { o.x = cx + dx / d * o.r; o.y = cy + dy / d * o.r; }
      else { o.y = p.y - o.r; }
    }
  }
  o.x = clamp(o.x, WALL + o.r, WW - WALL - o.r); o.y = clamp(o.y, WALL + o.r + 6, WH - WALL - o.r);
  return hit;
}
function pointInProp(x, y) { return G.props.some(p => x > p.x && x < p.x + p.w && y > p.y && y < p.y + p.h); }

// ---------------- UPDATE ----------------
function update(dt) {
  if (!G || !G.running) return;
  G.t += dt;
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  G.shake = Math.max(0, G.shake - dt);
  // effects always tick for visual
  for (const f of G.floaters) { f.t -= dt * 0.9; f.y -= 34 * dt; }
  G.floaters = G.floaters.filter(f => f.t > 0);
  for (const q of G.parts) { q.t -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.92; q.vy *= 0.92; }
  G.parts = G.parts.filter(q => q.t > 0);
  for (const r of G.rings) { r.t -= dt; r.r += (r.max - r.r) * Math.min(1, dt * 10); }
  G.rings = G.rings.filter(r => r.t > 0);
  updateWeaponFx(dt);
  if (G.state !== 'play' && G.state !== 'won') return;

  const p = G.player, st = G.stats;
  // camera + mouse world
  mouse.wx = G.cam.x + (mouse.x - VW / 2) / ZOOM; mouse.wy = G.cam.y + (mouse.y - VH / 2) / ZOOM;

  if (G.state === 'play') {
    // timers
    p.iframe = Math.max(0, p.iframe - dt); p.rootT = Math.max(0, p.rootT - dt); p.slowT = Math.max(0, p.slowT - dt); p.shield = Math.max(0, p.shield - dt);
    for (let i = 0; i < 4; i++) p.cds[i] = Math.max(0, p.cds[i] - dt);
    if (st.regen > 0) p.hp = Math.min(st.maxHp, p.hp + st.regen * dt);
    // movement
    let mx = 0, my = 0;
    if (keys['w'] || keys['arrowup']) my -= 1; if (keys['s'] || keys['arrowdown']) my += 1;
    if (keys['a'] || keys['arrowleft']) mx -= 1; if (keys['d'] || keys['arrowright']) mx += 1;
    if (touch.stickId !== null) { const m = Math.hypot(touch.dx, touch.dy); if (m > 8) { mx = touch.dx / Math.max(m, 50); my = touch.dy / Math.max(m, 50); } }
    const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
    if (p.dash) {
      p.x += p.dash.vx * dt; p.y += p.dash.vy * dt; p.dash.t -= dt;
      burst(p.x, p.y - 16, '#ff9a9a', 3, 80);
      for (const e of G.enemies) if (!e.dead && !p.dash.hit.has(e) && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 30) { p.dash.hit.add(e); hitEnemy(e, playerDamage(2.5), { scalpel: true }); }
      if (p.dash.t <= 0) { p.dash = null; p.iframe = 0.2; }
    } else if (p.rootT <= 0) {
      const spd = st.move * (p.slowT > 0 ? 0.55 : 1);
      p.x += mx * spd * dt; p.y += my * spd * dt;
    }
    p.moving = ml > 0.1 && p.rootT <= 0;
    if (p.moving) p.walk += dt * 10;
    resolveProps(p);
    const a = aimAngle(); p.face = Math.cos(a) >= 0 ? 1 : -1;
    // spin
    if (p.spin > 0) {
      p.spin -= dt; p.spinTick -= dt;
      if (p.spinTick <= 0) {
        p.spinTick = 0.125; let healed = false;
        for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 115 + e.r) {
          const before = G.stats.hemo; if (healed) G.stats.hemo = 0;
          hitEnemy(e, playerDamage(0.6), { scalpel: true, quiet: true }); G.stats.hemo = before; healed = true;
        }
      }
    }
    // attack
    p.atkT -= dt;
    const wantFire = mouse.down || keys[' '] || (touchMode && G.enemies.some(e => !e.dead && dist2(e, p) < 560 * 560));
    const rateMult = st.atkRate / 3;
    S.weapons.forEach((id, slot) => {
      G.wcd[id] = (G.wcd[id] || 0) - dt;
      if (wantFire && G.wcd[id] <= 0 && !p.dash) { fireWeapon(id, slot); G.wcd[id] = 1 / (WEAPONS[id].rate * rateMult); }
    });
  }

  // camera
  G.cam.x += (p.x - G.cam.x) * Math.min(1, dt * 8); G.cam.y += (p.y - 20 - G.cam.y) * Math.min(1, dt * 8);
  const hw = VW / 2 / ZOOM, hh = VH / 2 / ZOOM;
  G.cam.x = WW > hw * 2 ? clamp(G.cam.x, hw, WW - hw) : WW / 2; G.cam.y = WH > hh * 2 ? clamp(G.cam.y, hh, WH - hh) : WH / 2;

  // waves
  if (G.state === 'play') {
    if (G.queue.length) {
      G.spawnT -= dt;
      if (G.spawnT <= 0) { spawnEnemy(G.queue.shift()); if (G.queue.length && Math.random() < 0.5) spawnEnemy(G.queue.shift()); G.spawnT = 0.32; }
    } else if (!G.enemies.some(e => !e.dead)) {
      G.waveDelay -= dt;
      if (G.waveDelay <= 0) {
        if (G.wave < G.waves.length - 1) { G.wave++; queueWave(); G.waveDelay = 1.5; G.banner = { text: `Wave ${G.wave + 1} / ${G.waves.length}`, sub: G.zone.place, t: 1.6 }; }
        else if (G.zone.boss && !G.bossSpawned) { spawnBoss(); }
        else if (!G.zone.boss) { G.banner = { text: 'Orientation Complete', sub: 'Clinical rotations unlocked', t: 3 }; finishZone([randomItem(2)]); }
      }
    }
  }

  // enemies
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.flash = Math.max(0, e.flash - dt); e.markT = Math.max(0, e.markT - dt); e.slowT = Math.max(0, e.slowT - dt);
    if (e.spawnT > 0) { e.spawnT -= dt; continue; }
    if (e.poisonT > 0) { e.poisonT -= dt; e.pTick = (e.pTick || 0) - dt; if (e.pTick <= 0) { e.pTick = 0.5; hitEnemy(e, e.poisonDps * 0.5, { noCrit: true, poisonTick: true, quiet: true }); if (e.dead) continue; } }
    if (G.state !== 'play') continue;
    if (e.stunT > 0) { e.stunT -= dt; continue; }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    let ux = dx / d, uy = dy / d;
    if (e.detourT > 0) { e.detourT -= dt; const sgn = e.strafe; const tx = -uy * sgn, ty = ux * sgn; ux = ux * 0.25 + tx; uy = uy * 0.25 + ty; const m = Math.hypot(ux, uy); ux /= m; uy /= m; }
    let spd = e.spd * (e.slowT > 0 ? 0.5 : 1);
    let vx = 0, vy = 0;
    e.atkT -= dt;
    e.face = dx >= 0 ? 1 : -1;
    const beh = e.def.beh;
    if (beh === 'boss') {
      if (e.enrageT > 0) { e.enrageT -= dt; spd *= 1.4; }
      if (e.pat) {
        e.patT += dt;
        if (bossPattern(e, dt * (e.enrageT > 0 ? 1.3 : 1))) { e.pat = null; e.atkT = Math.max(0.9, 2.4 - G.idx * 0.08) * (e.enrageT > 0 ? 0.6 : 1); }
      } else {
        vx = ux * spd; vy = uy * spd;
        if (d < 120) { vx = -ux * spd * 0.3; vy = -uy * spd * 0.3; }
        if (e.atkT <= 0) {
          e.pat = pick(e.patterns); e.patT = 0; e.patData = {};
          floater(e.x, e.y - 140, e.spec.attacks[e.pat] + '!', e.spec.accent, 16);
        }
      }
      if (d < e.r + p.r + 4) hurtPlayer(e.dmg, null);
    } else if (beh === 'melee') {
      vx = ux * spd; vy = uy * spd;
      if (d < e.r + p.r + 8 && e.atkT <= 0) {
        hurtPlayer(e.dmg, e.def); e.atkT = 1.0;
        if (e.def.attack && Math.random() < 0.35) floater(e.x, e.y - 52, e.def.attack, '#ffc4c4', 11);
        if (e.def.drain) { e.hp = Math.min(e.maxHp, e.hp + e.dmg); }
      }
    } else if (beh === 'charger') {
      if (e.state === 'wind') { e.chargeT -= dt; if (e.chargeT <= 0) { e.state = 'charge'; e.chargeT = 0.6; } }
      else if (e.state === 'charge') {
        vx = e.cx * spd * 4; vy = e.cy * spd * 4; e.chargeT -= dt;
        if (d < e.r + p.r + 6 && e.atkT <= 0) { hurtPlayer(e.dmg * 1.4, e.def); e.atkT = 0.8; }
        if (e.chargeT <= 0) { e.state = 'move'; e.atkT = 2.0; }
      } else {
        vx = ux * spd; vy = uy * spd;
        if (d < 320 && e.atkT <= 0) { e.state = 'wind'; e.chargeT = 0.55; e.cx = ux; e.cy = uy; floater(e.x, e.y - 52, e.def.attack, '#ffc4c4', 11); }
      }
    } else { // ranged, lobber, zoner
      const R = e.def.range;
      if (d > R) { vx = ux * spd; vy = uy * spd; }
      else if (d < R * 0.55) { vx = -ux * spd; vy = -uy * spd; }
      else { vx = -uy * spd * 0.5 * e.strafe; vy = ux * spd * 0.5 * e.strafe; if (Math.random() < 0.005) e.strafe *= -1; }
      if (d < R * 1.15 && e.atkT <= 0) {
        e.atkT = e.def.rate * rand(0.8, 1.2);
        if (beh === 'ranged') {
          const pr = e.def.proj, ang = Math.atan2(dy, dx) + rand(-0.06, 0.06);
          G.projs.push({ x: e.x, y: e.y - 30, vx: Math.cos(ang) * pr.spd, vy: Math.sin(ang) * pr.spd, r: pr.r, life: 2.5, from: 'e', color: pr.color, dmg: e.dmg, name: pr.name, root: pr.root, slow: pr.slow, steal: pr.steal });
        } else if (beh === 'lobber') {
          G.hazards.push({ x: p.x + rand(-20, 20), y: p.y + rand(-20, 20), r: 55, delay: 1.0, t: 0.2, from: 'e', kind: 'blast', dmg: e.dmg * 1.3, color: e.def.proj.color, name: e.def.proj.name });
        } else if (beh === 'zoner') {
          for (let i = 0; i < 3; i++) { const a = rand(0, Math.PI * 2), r = i === 0 ? 0 : rand(60, 140); G.hazards.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, r: 65, delay: 1.25, t: 0.25, from: 'e', kind: 'blast', dmg: e.dmg, color: '#e8ff5a', name: 'Radiation Zone' }); }
        }
      }
    }
    // separation
    for (const o of G.enemies) {
      if (o === e || o.dead) continue;
      const sx = e.x - o.x, sy = e.y - o.y, sd = Math.hypot(sx, sy), min = e.r + o.r + 4;
      if (sd < min && sd > 0.01) { vx += sx / sd * 90; vy += sy / sd * 90; }
    }
    e.x += vx * dt; e.y += vy * dt;
    if (Math.abs(vx) + Math.abs(vy) > 5) e.walk += dt * 9;
    if (resolveProps(e) && !e.boss && !(e.detourT > 0)) { e.detourT = 0.7; if (Math.random() < 0.3) e.strafe *= -1; }
  }
  G.enemies = G.enemies.filter(e => !e.dead);

  // projectiles
  for (const pr of G.projs) {
    if (pr.from === 'p') updateWeaponProj(pr, dt);
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    if (pr.boomerang && !pr.returning && (pr.x < WALL || pr.x > WW - WALL || pr.y < WALL - 10 || pr.y > WH - WALL || pointInProp(pr.x, pr.y + 30))) { pr.life = Math.min(pr.life, pr.maxLife * 0.49); continue; }
    if (pr.x < WALL || pr.x > WW - WALL || pr.y < WALL - 10 || pr.y > WH - WALL || pointInProp(pr.x, pr.y + 30)) { pr.life = 0; burst(pr.x, pr.y, pr.color, 3, 60); continue; }
    if (pr.from === 'p') {
      for (const e of G.enemies) {
        if (e.dead || pr.hits.has(e)) continue;
        if (Math.hypot(e.x - pr.x, e.y - (e.boss ? 40 : 28) - pr.y) < e.r + pr.r + 8) {
          pr.hits.add(e); hitEnemy(e, pr.dmg, { poison: pr.poison, quiet: pr.kind === 'staple' && Math.random() < 0.6 });
          G.sparks.push(...sparkSet(pr.x, pr.y, pr.color, pr.kind === 'saw' ? 6 : 3));
          if (pr.pierce-- <= 0) { pr.life = 0; break; }
        }
      }
    } else if (G.state === 'play') {
      if (Math.hypot(p.x - pr.x, p.y - 28 - pr.y) < p.r + pr.r) { hurtPlayer(pr.dmg, pr); pr.life = 0; }
    }
  }
  G.projs = G.projs.filter(pr => pr.life > 0);

  // hazards
  for (const h of G.hazards) {
    if (h.delay > 0) { h.delay -= dt; if (h.delay <= 0 && h.kind === 'blast') { burst(h.x, h.y, h.color, 18, 200); if (G.state === 'play' && Math.hypot(p.x - h.x, p.y - h.y) < h.r) { hurtPlayer(h.dmg, h); if (h.name) floater(p.x, p.y - 64, h.name, h.color, 11); } } continue; }
    h.t -= dt;
    if (h.kind === 'cloud') {
      h.tick -= dt;
      for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - h.x, e.y - h.y) < h.r) e.slowT = 0.3;
      if (h.tick <= 0) { h.tick = 0.5; for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - h.x, e.y - h.y) < h.r) hitEnemy(e, playerDamage(0.8), { poison: true, quiet: true }); }
    }
  }
  G.hazards = G.hazards.filter(h => h.delay > 0 || h.t > 0);

  // pickups (magnet)
  for (const k of G.pickups) {
    k.t += dt;
    const d = Math.hypot(p.x - k.x, p.y - k.y);
    const range = k.kind === 'item' ? 26 : (G.state === 'won' ? 4000 : 120);
    if (d < range && k.t > 0.35) { const s = (G.state === 'won' ? 900 : 520) * dt; k.x += (p.x - k.x) / d * Math.min(s, d); k.y += (p.y - k.y) / d * Math.min(s, d); }
    if (d < 20 && k.t > 0.35) {
      k.got = true;
      if (k.kind === 'cash') { gainMoney(k.amount); floater(p.x, p.y - 50, `+$${k.amount}`, '#ffe066', 12); sfx('coin'); }
      else if (k.kind === 'bp') { const v = gainBp(k.amount); floater(p.x, p.y - 50, `+${v} Brain Power`, '#d6a6ff', 13); sfx('coin'); }
      else if (k.kind === 'item') {
        if (S.inv.length < 40) { S.inv.push(k.item); G.earned.items.push(k.item); floater(p.x, p.y - 58, k.item.name, TIERS[k.item.tier].color, 13); }
        else { const v = Math.round(k.item.price * 0.25); gainMoney(v); floater(p.x, p.y - 58, `Bag full: sold for $${v}`, '#ccc', 12); }
        sfx('coin');
      }
    }
  }
  G.pickups = G.pickups.filter(k => !k.got);
}

// ---------------- RENDER ----------------
const _shadeCache = new Map();
function shade(hex, amt) {
  const key = hex + '|' + amt; const hit = _shadeCache.get(key); if (hit) return hit;
  let r, g, b;
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(hex);
  if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
  else { let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); const n = parseInt(c, 16); r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255; }
  r = clamp(Math.round(r + amt * 255), 0, 255); g = clamp(Math.round(g + amt * 255), 0, 255); b = clamp(Math.round(b + amt * 255), 0, 255);
  const out = `rgb(${r},${g},${b})`; if (_shadeCache.size > 4000) _shadeCache.clear(); _shadeCache.set(key, out); return out;
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function box(x, y, w, h, hgt, top, front) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + 4, y + 6, w, h);
  ctx.fillStyle = front; ctx.fillRect(x, y + h - hgt, w, hgt);
  const g = ctx.createLinearGradient(x, y - hgt, x, y + h - hgt); g.addColorStop(0, shade(top, 0.06)); g.addColorStop(1, shade(top, -0.04));
  ctx.fillStyle = g; ctx.fillRect(x, y - hgt, w, h);
}
function drawProp(p) {
  const { x, y, w, h } = p;
  switch (p.kind) {
    case 'desk': box(x, y, w, h, 18, '#b88a5a', '#7a5a38'); ctx.fillStyle = '#eee'; ctx.fillRect(x + 14, y - 12, 26, 18); ctx.fillStyle = '#334'; ctx.fillRect(x + 60, y - 12, 34, 20); ctx.fillStyle = '#6cf'; ctx.fillRect(x + 62, y - 10, 30, 14); break;
    case 'podium': box(x, y, w, h, 30, '#8a6440', '#5e4229'); break;
    case 'cabinet': box(x, y, w, h, 40, '#9aa3ad', '#6f7882'); break;
    case 'skeleton': ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h, 16, 5, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#efe9d8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w / 2, y + h); ctx.lineTo(x + w / 2, y - 30); ctx.stroke(); ctx.fillStyle = '#efe9d8'; ctx.beginPath(); ctx.arc(x + w / 2, y - 38, 8, 0, 7); ctx.fill(); for (let i = 0; i < 4; i++) ctx.fillRect(x + w / 2 - 9, y - 26 + i * 5, 18, 2); break;
    case 'examtable': box(x, y, w, h, 22, '#6e8fb0', '#3d566e'); ctx.fillStyle = '#f4f4f0'; ctx.fillRect(x + 6, y - 22 + 4, w - 12, h - 8); break;
    case 'chair': box(x, y, w, h, 14, '#52657a', '#36444f'); ctx.fillStyle = '#52657a'; ctx.fillRect(x, y - 30, w, 10); break;
    case 'cart': box(x, y, w, h, 26, '#d8dde3', '#9aa3ad'); ctx.fillStyle = '#e74c3c'; ctx.fillRect(x + 6, y - 22, 12, 8); ctx.fillStyle = '#3498db'; ctx.fillRect(x + 22, y - 22, 12, 8); break;
    case 'counter': box(x, y, w, h, 34, '#c9b79a', '#8a7a62'); for (let i = 20; i < w - 30; i += 70) { ctx.fillStyle = '#223'; ctx.fillRect(x + i, y - 46, 30, 20); ctx.fillStyle = '#5bd'; ctx.fillRect(x + i + 2, y - 44, 26, 15); } break;
    case 'plant': ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h - 2, 16, 6, 0, 0, 7); ctx.fill(); box(x + 6, y + 8, w - 12, h - 12, 16, '#9a5a3a', '#6e3e26'); ctx.fillStyle = '#3d8b4a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(x + w / 2 + Math.cos(i) * 9, y - 14 + Math.sin(i * 2) * 6, 9, 5, i, 0, 7); ctx.fill(); } break;
    case 'curtain': ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + 3, y + 6, w, h); ctx.fillStyle = '#8fb3c9'; for (let i = 0; i < w; i += 14) { ctx.fillStyle = i % 28 ? '#8fb3c9' : '#7da2b8'; ctx.fillRect(x + i, y - 60, 14, 60 + h); } ctx.fillStyle = '#999'; ctx.fillRect(x, y - 62, w, 3); break;
    case 'scale': box(x, y, w, h, 6, '#ddd', '#aaa'); ctx.fillStyle = '#ccc'; ctx.fillRect(x + w / 2 - 2, y - 50, 4, 46); ctx.fillRect(x + 4, y - 52, w - 8, 6); break;
    case 'bed':
      box(x, y, w, h, 22, '#e8ecef', '#9aa3ad'); ctx.fillStyle = '#fafafa'; ctx.fillRect(x + 6, y - 18, w - 12, 24); ctx.fillStyle = '#9ec5e8'; ctx.fillRect(x + 4, y + 14, w - 8, h - 42);
      ctx.fillStyle = '#6b7c8f'; ctx.fillRect(x, y - 30, w, 6); break;
    case 'ivpole': ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 9, y + 14, 12, 4, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#bbb'; ctx.fillRect(x + 8, y - 60, 2, 74); ctx.fillRect(x, y - 60, 18, 2); ctx.fillStyle = 'rgba(200,230,255,0.85)'; roundRect(x + 11, y - 58, 8, 14, 2); ctx.fill(); break;
    case 'monitor': box(x, y, w, h, 40, '#333a44', '#22272e'); ctx.fillStyle = '#0b1f14'; ctx.fillRect(x + 4, y - 38, w - 8, h - 8); ctx.strokeStyle = '#3f6'; ctx.lineWidth = 1.5; ctx.beginPath(); const ph = (G.t * 60 + p.seed * 100) % 40; for (let i = 0; i < w - 10; i += 2) ctx.lineTo(x + 5 + i, y - 22 - (Math.abs(i - ph) < 2 ? 10 : 0)); ctx.stroke(); break;
    case 'wheelchair': ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 20, y + 38, 20, 6, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 12, y + 26, 12, 0, 7); ctx.stroke(); ctx.fillStyle = '#2a4a7a'; ctx.fillRect(x + 8, y + 2, 26, 14); ctx.fillRect(x + 26, y - 14, 8, 18); break;
    case 'ortable': box(x, y, w, h, 26, '#2a3a4a', '#1a2530'); ctx.fillStyle = '#4a8fbf'; ctx.fillRect(x + 6, y - 22, w - 12, h - 10); break;
    case 'anesmachine': box(x, y, w, h, 56, '#d9dde2', '#a3abb3'); ctx.fillStyle = '#143'; ctx.fillRect(x + 8, y - 50, 30, 20); ctx.fillStyle = '#3f6'; ctx.fillRect(x + 10, y - 44, 26, 2); ctx.fillStyle = '#2b6cb0'; ctx.beginPath(); ctx.arc(x + w - 14, y - 36, 6, 0, 7); ctx.fill(); break;
    case 'backtable': box(x, y, w, h, 24, '#4a8fbf', '#2f6a94'); ctx.fillStyle = '#c0c6cc'; for (let i = 8; i < w - 8; i += 12) ctx.fillRect(x + i, y - 16, 3, 20); break;
  }
}
function drawEnemy(e) {
  const L = e.look;
  const alpha = e.spawnT > 0 ? 1 - e.spawnT * 1.6 : 1;
  ctx.globalAlpha = clamp(alpha, 0.1, 1);
  if (e.boss) {
    // aura
    const g = ctx.createRadialGradient(e.x, e.y - 60, 6, e.x, e.y - 60, 90); g.addColorStop(0, e.spec.accent + '55'); g.addColorStop(1, e.spec.accent + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y - 60, 90, 0, 7); ctx.fill();
    if (e.pat === 'dash' && e.patData.phase === 'tele') { ctx.strokeStyle = 'rgba(255,60,60,0.6)'; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.patData.a) * 400, e.y + Math.sin(e.patData.a) * 400); ctx.stroke(); }
  }
  if (e.markT > 0) { ctx.strokeStyle = '#4fa3ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, 20, 7, 0, 0, 7); ctx.stroke(); }
  if (e.poisonT > 0) { ctx.fillStyle = 'rgba(181,123,255,0.25)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, 18, 6, 0, 0, 7); ctx.fill(); }
  if (e.type === 'patient') { ctx.fillStyle = 'rgba(120,255,120,0.10)'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 40, 26, 46, 0, 0, 7); ctx.fill(); }
  if (e.state === 'wind') { ctx.strokeStyle = 'rgba(255,80,80,0.5)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + e.cx * 280, e.y + e.cy * 280); ctx.stroke(); }
  const SC = e.boss ? 1.75 : (e.def.elite ? 1.3 : 1.18);
  drawPerson(e.x, e.y, Object.assign({}, L, { face: e.face, walk: e.walk, flash: e.flash, scale: SC }));
  if (e.stunT > 0) { ctx.fillStyle = '#ffe066'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💤', e.x + 12, e.y - 74 * SC - 6); }
  ctx.globalAlpha = 1;
  if (!e.boss) {
    const bw = 34, bh = 4, by = e.y - 74 * SC - 2;
    if (e.hp < e.maxHp) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - bw / 2, by, bw, bh); ctx.fillStyle = e.def.elite ? '#ffb02e' : '#ff5a5a'; ctx.fillRect(e.x - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), bh); }
    ctx.font = '600 10px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
    const lbl = e.label || e.def.name;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; const tw = ctx.measureText(lbl).width + 8; ctx.fillRect(e.x - tw / 2, by - 15, tw, 13);
    ctx.fillStyle = e.label ? '#a6ffb5' : (e.def.elite ? '#ffd27a' : '#e8edf3'); ctx.fillText(lbl, e.x, by - 5);
  }
}
function playerLook() {
  const eq = S.equip;
  const shirt = eq.shirt ? eq.shirt.base : '';
  const coat = /Coat/.test(shirt), apron = /Apron/.test(shirt);
  const head = eq.head ? (/Lamp/.test(eq.head.base) ? 'lamp' : /Mirror/.test(eq.head.base) ? 'mirror' : /Loupes/.test(eq.head.base) || eq.head.tier === 3 ? 'loupes' : 'cap') : null;
  return {
    top: S.scrub, bottom: shade(S.scrub, -0.1), skin: S.skin, hair: S.hair, female: S.gender === 'f', style: S.hairStyle || (S.gender === 'f' ? 'ponytail' : 'short'),
    shoe: eq.shoes ? (/Clog/.test(eq.shoes.base) || eq.shoes.tier === 3 ? '#2f6fd6' : /Cover/.test(eq.shoes.base) ? '#9fc3dc' : '#eef1f4') : '#eef1f4', eye: '#3b2a1e',
    coat: coat || (eq.shirt && eq.shirt.tier === 3), longcoat: /Long/.test(shirt) || (eq.shirt && eq.shirt.tier === 3), apron,
    steth: eq.stethoscope ? TIERS[eq.stethoscope.tier].color : null, head, capColor: shade(S.scrub, 0.15),
  };
}
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#0b0f14'; ctx.fillRect(0, 0, VW, VH);
  if (!G) return;
  const sx = G.shake > 0 ? rand(-6, 6) * G.shake : 0, sy = G.shake > 0 ? rand(-6, 6) * G.shake : 0;
  ctx.setTransform(DPR * ZOOM, 0, 0, DPR * ZOOM, DPR * (VW / 2 - G.cam.x * ZOOM + sx), DPR * (VH / 2 - G.cam.y * ZOOM + sy));
  ctx.drawImage(G.floor, 0, 0);
  // hazards (ground)
  for (const h of G.hazards) {
    if (h.from === 'p') {
      const g = ctx.createRadialGradient(h.x, h.y, 10, h.x, h.y, h.r); g.addColorStop(0, 'rgba(181,123,255,0.45)'); g.addColorStop(1, 'rgba(181,123,255,0.05)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, 7); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(230,200,255,0.3)'; ctx.beginPath(); ctx.arc(h.x + Math.cos(G.t * 2 + i * 2) * h.r * 0.5, h.y + Math.sin(G.t * 2 + i * 2) * h.r * 0.4, 20, 0, 7); ctx.fill(); }
    } else if (h.delay > 0) {
      ctx.strokeStyle = h.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, 7); ctx.stroke();
      ctx.fillStyle = h.color; ctx.globalAlpha = 0.18 + 0.25 * (1 - Math.min(1, h.delay)); ctx.beginPath(); ctx.arc(h.x, h.y, h.r * (1 - Math.min(1, h.delay) * 0.6), 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    } else { ctx.fillStyle = h.color; ctx.globalAlpha = 0.5 * h.t / 0.25; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  }
  // pickups
  for (const k of G.pickups) {
    const bob = Math.sin(G.t * 5 + k.x) * 2;
    if (k.kind === 'cash') { ctx.fillStyle = '#2e7d32'; ctx.fillRect(k.x - 7, k.y - 5 + bob, 14, 9); ctx.fillStyle = '#9be59f'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', k.x, k.y + 3 + bob); }
    else if (k.kind === 'bp') { const g = ctx.createRadialGradient(k.x, k.y + bob, 1, k.x, k.y + bob, 12); g.addColorStop(0, '#f3e1ff'); g.addColorStop(1, 'rgba(181,123,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(k.x, k.y + bob, 12, 0, 7); ctx.fill(); ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🧠', k.x, k.y + 5 + bob); }
    else { const c = TIERS[k.item.tier].color; ctx.fillStyle = c; ctx.globalAlpha = 0.25 + 0.15 * Math.sin(G.t * 6); ctx.beginPath(); ctx.arc(k.x, k.y, 22, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = c; ctx.fillRect(k.x - 1, k.y - 60, 2, 50); ctx.fillStyle = '#3a2a1a'; roundRect(k.x - 9, k.y - 10 + bob, 18, 14, 3); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke(); }
  }
  // y-sorted drawables
  const list = [];
  for (const p of G.props) list.push({ y: p.y + p.h, f: () => drawProp(p) });
  for (const e of G.enemies) list.push({ y: e.y, f: () => drawEnemy(e) });
  const P = G.player;
  if (G.state !== 'dead') list.push({ y: P.y, f: () => {
    if (P.shield > 0) { ctx.strokeStyle = 'rgba(66,211,146,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(P.x, P.y - 40, 32, 48, 0, 0, 7); ctx.stroke(); }
    if (P.spin > 0) { ctx.strokeStyle = 'rgba(255,120,120,0.6)'; ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { const a = G.t * 14 + i * 2.1; ctx.beginPath(); ctx.arc(P.x, P.y - 20, 105, a, a + 0.8); ctx.stroke(); } }
    ctx.globalAlpha = P.iframe > 0 && !P.dash ? 0.6 : 1;
    drawPerson(P.x, P.y, Object.assign(playerLook(), { face: P.face, walk: P.moving ? P.walk : 0, scale: 1.25 }));
    drawHeldWeapons();
    ctx.globalAlpha = 1;
    if (P.rootT > 0) { ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(P.x, P.y, 20, 7, 0, 0, 7); ctx.stroke(); }
  } });
  list.sort((a, b) => a.y - b.y);
  for (const d of list) d.f();
  // projectiles
  for (const pr of G.projs) {
    ctx.fillStyle = pr.color;
    if (pr.from === 'e') { ctx.shadowColor = pr.color; ctx.shadowBlur = 10; }
    if (pr.from === 'p' && pr.kind !== 'pulse') { drawPlayerProjectile(pr); }
    else if (pr.from === 'p') { const g = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, pr.r * 2.2); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, pr.color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r * 2.2, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(pr.x - pr.r * 0.3, pr.y - pr.r * 0.3, pr.r * 0.35, 0, 7); ctx.fill(); }
    ctx.shadowBlur = 0;
  }
  drawWeaponFx();
  for (const q of G.parts) { ctx.globalAlpha = Math.min(1, q.t * 2); ctx.fillStyle = q.color; ctx.fillRect(q.x - q.r / 2, q.y - q.r / 2, q.r, q.r); }
  ctx.globalAlpha = 1;
  for (const r of G.rings) { ctx.strokeStyle = r.color; ctx.globalAlpha = r.t * 2; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke(); }
  ctx.globalAlpha = 1;
  for (const f of G.floaters) { ctx.globalAlpha = clamp(f.t * 1.5, 0, 1); ctx.font = `800 ${f.size}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y); }
  ctx.globalAlpha = 1;
  // screen-space lighting vignette
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const vg = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.35, VW / 2, VH / 2, Math.max(VW, VH) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
  if (P.hp / G.stats.maxHp < 0.3 && G.state === 'play') { ctx.fillStyle = `rgba(200,0,0,${0.12 + 0.08 * Math.sin(G.t * 6)})`; ctx.fillRect(0, 0, VW, VH); }
  drawHUD();
}
function bar(x, y, w, h, frac, c1, c2, label) {
  ctx.fillStyle = 'rgba(8,12,18,0.75)'; roundRect(x - 2, y - 2, w + 4, h + 4, 6); ctx.fill();
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; roundRect(x, y, Math.max(0, w * clamp(frac, 0, 1)), h, 4); ctx.fill();
  if (label) { ctx.fillStyle = '#fff'; ctx.font = '700 11px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x + w / 2, y + h - 3); }
}
function drawHUD() {
  const P = G.player, st = G.stats;
  ctx.textAlign = 'left';
  // top-left: portrait-ish info
  ctx.fillStyle = 'rgba(8,12,18,0.72)'; roundRect(12, 12, 290, 86, 10); ctx.fill();
  ctx.fillStyle = '#e8edf3'; ctx.font = '700 14px Inter, system-ui, sans-serif'; ctx.fillText(`${S.name}`, 24, 32);
  ctx.fillStyle = '#9fb0c3'; ctx.font = '600 11px Inter, system-ui, sans-serif'; ctx.fillText(`Lv ${S.level}  •  ${G.zone.place}`, 24, 47);
  bar(24, 54, 266, 15, P.hp / st.maxHp, '#ff6b6b', '#c0392b', `${fmt(P.hp)} / ${fmt(st.maxHp)}`);
  bar(24, 76, 266, 9, S.level >= MAX_LEVEL ? 1 : S.xp / xpNeeded(S.level), '#ffe08a', '#d4a017');
  // top-right currencies
  const cw = 230; ctx.fillStyle = 'rgba(8,12,18,0.72)'; roundRect(VW - cw - 12, 12, cw, 40, 10); ctx.fill();
  ctx.font = '700 15px Inter, system-ui, sans-serif'; ctx.fillStyle = '#ffe066'; ctx.textAlign = 'left'; ctx.fillText(`$ ${fmt(S.money)}`, VW - cw, 38);
  ctx.fillStyle = '#d6a6ff'; ctx.fillText(`🧠 ${fmt(S.bp)}`, VW - cw + 110, 38);
  if (!touchMode) { ctx.fillStyle = '#7b8a9c'; ctx.font = '600 10px Inter, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('Esc pause • I gear • T talents', VW - 14, 66); }
  // wave / boss
  if (G.boss && !G.boss.dead) {
    const b = G.boss, w = Math.min(560, VW - 340), x = VW / 2 - w / 2;
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '800 14px Inter, system-ui, sans-serif'; ctx.fillText(`${b.def.name} — ${b.spec.name} Attending`, VW / 2, 26);
    bar(x, 34, w, 14, b.hp / b.maxHp, b.spec.accent, shade(b.spec.accent, -0.25));
    ctx.fillStyle = '#fff'; for (const t of b.thresholds) ctx.fillRect(x + w * t - 1, 32, 2, 18);
    if (b.enrageT > 0) { ctx.fillStyle = '#ff6b6b'; ctx.font = '800 11px Inter'; ctx.fillText('ENRAGED', VW / 2, 64); }
  } else if (G.state === 'play') {
    const left = G.enemies.length + G.queue.length;
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(8,12,18,0.6)'; roundRect(VW / 2 - 100, 12, 200, 28, 8); ctx.fill();
    ctx.fillStyle = '#e8edf3'; ctx.font = '700 12px Inter, system-ui, sans-serif'; ctx.fillText(`Wave ${G.wave + 1}/${G.waves.length} • ${left} remaining`, VW / 2, 31);
  }
  // hotbar
  if (!touchMode) {
    const n = 5, s = 52, gap = 8, tw = n * s + (n - 1) * gap, x0 = VW / 2 - tw / 2, y0 = VH - s - 16;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (s + gap);
      ctx.fillStyle = 'rgba(8,12,18,0.8)'; roundRect(x, y0, s, s, 8); ctx.fill();
      if (i < 4) {
        const id = S.slotted[i];
        ctx.strokeStyle = id ? TREES.find(t => t.id === ACTIVE_SKILLS[id].tree).color : '#2a3442'; ctx.lineWidth = 2; roundRect(x, y0, s, s, 8); ctx.stroke();
        if (id) {
          ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ACTIVE_SKILLS[id].icon, x + s / 2, y0 + 34);
          const cd = P.cds[i]; if (cd > 0) { const f = cd / cdFor(id); ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(x, y0 + s * (1 - f), s, s * f); ctx.fillStyle = '#fff'; ctx.font = '800 14px Inter'; ctx.fillText(cd.toFixed(1), x + s / 2, y0 + 32); }
        }
        ctx.fillStyle = '#9fb0c3'; ctx.font = '700 10px Inter'; ctx.textAlign = 'left'; ctx.fillText(String(i + 1), x + 5, y0 + 13);
      } else {
        ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 2; roundRect(x, y0, s, s, 8); ctx.stroke();
        ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('☕', x + s / 2, y0 + 34);
        ctx.fillStyle = '#fff'; ctx.font = '800 12px Inter'; ctx.textAlign = 'right'; ctx.fillText('×' + S.coffee, x + s - 5, y0 + s - 6);
        ctx.fillStyle = '#9fb0c3'; ctx.font = '700 10px Inter'; ctx.textAlign = 'left'; ctx.fillText('Q', x + 5, y0 + 13);
      }
    }
    if (!S.slotted.length && S.level <= 3) { ctx.fillStyle = '#9fb0c3'; ctx.font = '600 11px Inter'; ctx.textAlign = 'center'; ctx.fillText('WASD move • Hold left mouse to attack • Unlock active skills in the talent trees (T)', VW / 2, y0 - 10); }
  } else {
    for (const b of touchButtons()) {
      ctx.fillStyle = 'rgba(8,12,18,0.7)'; roundRect(b.x, b.y, b.w, b.h, 12); ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      if (b.skill !== undefined) { const id = S.slotted[b.skill]; ctx.font = '24px sans-serif'; ctx.fillText(id ? ACTIVE_SKILLS[id].icon : '·', b.x + b.w / 2, b.y + 38); const cd = P.cds[b.skill]; if (id && cd > 0) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; const f = cd / cdFor(id); ctx.fillRect(b.x, b.y + b.h * (1 - f), b.w, b.h * f); } }
      else { ctx.font = '22px sans-serif'; ctx.fillText(b.label, b.x + b.w / 2, b.y + 37); if (b.label === '☕') { ctx.font = '800 11px Inter'; ctx.fillText('×' + S.coffee, b.x + b.w - 12, b.y + b.h - 6); } }
    }
    if (touch.stickId !== null) { ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(touch.sx, touch.sy, 50, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(touch.sx + clamp(touch.dx, -50, 50), touch.sy + clamp(touch.dy, -50, 50), 22, 0, 7); ctx.fill(); }
  }
  // banner
  if (G.banner) {
    const b = G.banner, a = clamp(b.t * 2, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(8,12,18,0.7)'; ctx.fillRect(0, VH * 0.26 - 44, VW, 76);
    ctx.fillStyle = b.boss ? '#ff8a8a' : b.lvl ? '#ffe066' : '#ffffff'; ctx.font = `900 ${Math.min(34, VW / 20)}px Inter, system-ui, sans-serif`; ctx.fillText(b.text, VW / 2, VH * 0.26);
    ctx.fillStyle = '#b9c6d3'; ctx.font = '600 14px Inter, system-ui, sans-serif'; ctx.fillText(b.sub || '', VW / 2, VH * 0.26 + 22);
    ctx.globalAlpha = 1;
  }
  // crosshair
  if (!touchMode && G.state === 'play') { ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 9, 0, 7); ctx.moveTo(mouse.x - 14, mouse.y); ctx.lineTo(mouse.x - 5, mouse.y); ctx.moveTo(mouse.x + 5, mouse.y); ctx.lineTo(mouse.x + 14, mouse.y); ctx.moveTo(mouse.x, mouse.y - 14); ctx.lineTo(mouse.x, mouse.y - 5); ctx.moveTo(mouse.x, mouse.y + 5); ctx.lineTo(mouse.x, mouse.y + 14); ctx.stroke(); }
}

// ---------------- LOOP ----------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  try { update(Math.max(0, dt)); render(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
