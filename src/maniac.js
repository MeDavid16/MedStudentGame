// ===================== RESIDENCY — THE MANIACAL ATTENDING (title backdrop) =====================
// A giant, under-lit attending face that cackles, twitches and darts its eyes. Drawn in a
// 200×200 design space centered on (0,0) and scaled to the screen.
'use strict';
function maniacLaugh(t) {
  const cyc = t % 4.2, laughing = cyc < 2.7;
  const open = laughing ? 0.3 + 0.7 * Math.abs(Math.sin(cyc * Math.PI * 2.6)) : 0.12 + 0.05 * Math.sin(t * 3);
  return { laughing, open, cyc };
}
function drawManiacFace(c, cx, cy, R, t, alpha) {
  const L = maniacLaugh(t);
  const shake = L.laughing ? Math.sin(t * 38) * 0.025 : Math.sin(t * 0.8) * 0.01;
  const bob = L.laughing ? Math.abs(Math.sin(L.cyc * Math.PI * 2.6)) * -4 : 0;
  const s = R / 100;
  const lgc = (x0, y0, x1, y1, st) => { const g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const rgc = (x, y, r0, r1, st) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  c.save(); c.globalAlpha = alpha;
  c.translate(cx, cy); c.scale(s, s); c.translate(0, bob); c.rotate(shake);

  // eerie aura
  c.fillStyle = rgc(0, 0, 40, 190, [[0, 'rgba(60,255,170,0.22)'], [0.5, 'rgba(120,60,200,0.10)'], [1, 'rgba(0,0,0,0)']]);
  c.beginPath(); c.arc(0, 0, 190, 0, Math.PI * 2); c.fill();

  // white coat, collar and stethoscope
  c.fillStyle = lgc(-120, 100, 120, 200, [[0, '#9aa6b2'], [0.5, '#e9eef3'], [1, '#8d99a6']]);
  c.beginPath(); c.moveTo(-130, 200); c.quadraticCurveTo(-110, 108, -36, 96); c.lineTo(36, 96); c.quadraticCurveTo(110, 108, 130, 200); c.closePath(); c.fill();
  c.fillStyle = '#b8c9dc'; c.beginPath(); c.moveTo(-34, 96); c.lineTo(0, 150); c.lineTo(34, 96); c.closePath(); c.fill();
  c.fillStyle = '#a3172d'; c.beginPath(); c.moveTo(-7, 104); c.lineTo(7, 104); c.lineTo(10, 150); c.lineTo(0, 160); c.lineTo(-10, 150); c.closePath(); c.fill();
  c.strokeStyle = '#6f7c89'; c.lineWidth = 2; c.beginPath(); c.moveTo(-36, 97); c.lineTo(-58, 160); c.moveTo(36, 97); c.lineTo(58, 160); c.stroke();
  c.strokeStyle = '#1e2228'; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-40, 92); c.bezierCurveTo(-62, 130, -40, 160, -20, 168); c.stroke();
  c.beginPath(); c.moveTo(40, 92); c.bezierCurveTo(60, 125, 48, 150, 30, 160); c.stroke();
  c.fillStyle = rgc(28, 162, 1, 12, [[0, '#ffffff'], [1, '#7e8a96']]); c.beginPath(); c.arc(28, 164, 10, 0, Math.PI * 2); c.fill();
  // neck
  c.fillStyle = lgc(-22, 70, 22, 70, [[0, '#3e281f'], [0.5, '#8a5f48'], [1, '#3e281f']]); c.fillRect(-22, 68, 44, 34);

  // wild hair behind the head
  const tuft = (ang, len, w, col) => {
    const bx = Math.cos(ang) * 70, by = Math.sin(ang) * 86 - 6;
    const j = Math.sin(t * 9 + ang * 7) * 3;
    const tx = Math.cos(ang) * (70 + len) + j, ty = Math.sin(ang) * (86 + len) - 6 + j;
    c.fillStyle = col; c.beginPath();
    c.moveTo(bx - Math.sin(ang) * w, by + Math.cos(ang) * w); c.quadraticCurveTo((bx + tx) / 2 + j, (by + ty) / 2 - 6, tx, ty);
    c.lineTo(bx + Math.sin(ang) * w, by - Math.cos(ang) * w); c.closePath(); c.fill();
  };
  for (let i = 0; i < 26; i++) {
    const ang = Math.PI * (0.92 + i * 0.045 + (i % 2) * 0.01), side = ang < Math.PI * 1.15 || ang > Math.PI * 1.85;
    tuft(ang, (side ? 26 : 38) + (i * 37 % 17), 9, i % 3 ? '#d7dce2' : '#a9b1bb');
  }

  // ears
  for (const sx of [-1, 1]) {
    c.fillStyle = rgc(sx * 74, 0, 2, 20, [[0, '#d9a27d'], [1, '#8a5a44']]);
    c.beginPath(); c.ellipse(sx * 74, 2, 12, 21, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(80,40,30,0.5)'; c.lineWidth = 2; c.beginPath(); c.ellipse(sx * 74, 2, 6, 13, 0, sx > 0 ? -1.4 : 1.7, sx > 0 ? 1.4 : 4.6); c.stroke();
  }

  // head, lit from below like a flashlight under the chin
  c.fillStyle = rgc(0, 70, 10, 120, [[0, '#ffe0c0'], [0.45, '#d7a07a'], [0.8, '#8e5d45'], [1, '#4a2e25']]);
  c.beginPath(); c.ellipse(0, 0, 72, 92, 0, 0, Math.PI * 2); c.fill();
  c.save(); c.beginPath(); c.ellipse(0, 0, 72, 92, 0, 0, Math.PI * 2); c.clip();
  c.fillStyle = lgc(0, 0, 0, 92, [[0, 'rgba(60,255,170,0)'], [1, 'rgba(60,255,170,0.16)']]); c.fillRect(-80, 0, 160, 95);
  c.restore();
  // forehead wrinkles
  c.strokeStyle = 'rgba(70,35,25,0.45)'; c.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-36, -58 + i * 7); c.quadraticCurveTo(0, -64 + i * 7 - (L.laughing ? 2 : 0), 36, -58 + i * 7); c.stroke(); }

  // head mirror with a rotating glint
  c.fillStyle = '#20242b'; c.beginPath(); c.moveTo(-72, -52); c.quadraticCurveTo(0, -76, 72, -52); c.lineTo(72, -45); c.quadraticCurveTo(0, -69, -72, -45); c.closePath(); c.fill();
  c.fillStyle = rgc(-4, -78, 2, 22, [[0, '#ffffff'], [0.6, '#b9c7d6'], [1, '#5d6b7a']]); c.beginPath(); c.arc(0, -74, 19, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1e2228'; c.beginPath(); c.arc(0, -74, 4, 0, Math.PI * 2); c.fill();
  c.save(); c.translate(0, -74); c.rotate(t * 2); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(-1.5, -18, 3, 10); c.restore();

  // eyebrows: one furious, one sky-high and twitching
  const tw = Math.max(0, Math.sin(t * 7)) * 5;
  c.strokeStyle = '#c6ccd3'; c.lineWidth = 9; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-58, -36); c.quadraticCurveTo(-36, -44, -12, -26); c.stroke();
  c.beginPath(); c.moveTo(12, -34 - tw); c.quadraticCurveTo(36, -60 - tw, 60, -48 - tw); c.stroke();

  // eyes: bloodshot, mismatched, with jittering pin-point pupils
  const eye = (ex, ey, rx, ry, dart) => {
    c.fillStyle = 'rgba(60,30,60,0.45)'; c.beginPath(); c.ellipse(ex, ey + ry * 0.75, rx * 1.05, ry * 0.6, 0, 0, Math.PI); c.fill(); // dark circles
    c.fillStyle = rgc(ex, ey, 2, rx, [[0, '#fffdf2'], [1, '#e8d6c8']]); c.beginPath(); c.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(200,30,40,0.6)'; c.lineWidth = 0.9;
    for (let k = 0; k < 7; k++) { const a = k * 0.9 + 0.3, r0 = rx * 0.95; c.beginPath(); c.moveTo(ex + Math.cos(a) * r0, ey + Math.sin(a) * ry * 0.95); c.quadraticCurveTo(ex + Math.cos(a + 0.2) * r0 * 0.7, ey + Math.sin(a + 0.3) * ry * 0.6, ex + Math.cos(a) * r0 * 0.5, ey + Math.sin(a) * ry * 0.45); c.stroke(); }
    const px = ex + dart.x, py = ey + dart.y;
    c.fillStyle = rgc(px, py, 1, 8, [[0, '#8ff7d6'], [1, '#1f8a72']]); c.beginPath(); c.arc(px, py, 7.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#05080a'; c.beginPath(); c.arc(px, py, 2.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(px - 2.4, py - 2.6, 1.6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(60,25,20,0.7)'; c.lineWidth = 2.2; c.beginPath(); c.ellipse(ex, ey, rx, ry, 0, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
  };
  const dart = L.laughing ? { x: Math.sin(t * 31) * 2.2, y: Math.cos(t * 27) * 1.8 } : { x: Math.sin(Math.floor(t * 1.5) * 2.1) * 7, y: Math.cos(Math.floor(t * 1.5) * 1.3) * 3 };
  eye(-31, -12, 19, 14 + (L.laughing ? -2 : 0), dart);
  eye(33, -15 - tw * 0.4, 24, 20 + tw * 0.3, { x: dart.x * 1.2, y: dart.y });

  // nose
  c.fillStyle = 'rgba(90,50,35,0.35)'; c.beginPath(); c.moveTo(-2, -6); c.quadraticCurveTo(-14, 16, -12, 22); c.quadraticCurveTo(0, 28, 12, 22); c.quadraticCurveTo(10, 12, 2, -6); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,225,195,0.6)'; c.beginPath(); c.ellipse(1, 14, 5, 9, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(50,20,15,0.6)'; c.beginPath(); c.ellipse(-7, 22, 3.5, 2, 0.3, 0, Math.PI * 2); c.ellipse(7, 22, 3.5, 2, -0.3, 0, Math.PI * 2); c.fill();

  // cheeks pushed up by the grin + smile lines
  c.fillStyle = 'rgba(210,80,70,0.20)'; c.beginPath(); c.ellipse(-44, 20, 16, 11, 0, 0, Math.PI * 2); c.ellipse(44, 18, 16, 11, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(70,35,25,0.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-30, 12); c.quadraticCurveTo(-52, 30, -50, 46); c.moveTo(30, 10); c.quadraticCurveTo(52, 28, 50, 44); c.stroke();

  // the grin
  const o = L.open, mw = 46, top = 33, bot = 40 + 34 * o;
  const mouth = () => { c.beginPath(); c.moveTo(-mw, 28); c.quadraticCurveTo(0, top + 6, mw, 26); c.quadraticCurveTo(mw * 0.75, bot, 0, bot + 2); c.quadraticCurveTo(-mw * 0.75, bot, -mw, 28); c.closePath(); };
  mouth(); c.fillStyle = '#2a070c'; c.fill();
  c.save(); mouth(); c.clip();
  c.fillStyle = '#b0303f'; c.beginPath(); c.ellipse(0, bot + 2, 24, 12 + 8 * o, 0, 0, Math.PI * 2); c.fill(); // tongue
  for (let i = -5; i <= 5; i++) { // upper teeth
    const x = i * 8.2, y = 28 + Math.abs(i) * -0.3 + 4;
    c.fillStyle = lgc(0, y, 0, y + 11, [[0, '#fbf7e6'], [1, '#d9cfae']]); c.fillRect(x - 3.7, y - 4, 7.4, 11 - Math.abs(i) * 0.6);
  }
  if (o > 0.35) for (let i = -4; i <= 4; i++) { const x = i * 8.4, y = bot - 6; c.fillStyle = lgc(0, y - 6, 0, y + 4, [[0, '#d9cfae'], [1, '#fbf7e6']]); c.fillRect(x - 3.6, y - 7 + Math.abs(i) * 0.5, 7.2, 8 - Math.abs(i) * 0.5); }
  c.restore();
  mouth(); c.strokeStyle = '#5b1219'; c.lineWidth = 2.6; c.stroke();

  // stubble and a nervous bead of sweat
  c.save(); c.beginPath(); c.ellipse(0, 0, 71, 91, 0, 0, Math.PI * 2); c.clip();
  c.fillStyle = 'rgba(60,40,35,0.18)';
  for (let i = 0; i < 70; i++) { const a = Math.PI * (0.1 + (i * 0.618) % 0.8), r = 70 + (i * 13 % 18); const x = Math.cos(a) * r * 0.82, y = Math.sin(a) * r; if (y > 50) c.fillRect(x, y, 1, 1); }
  c.restore();
  const sw = (t * 0.45) % 1;
  c.fillStyle = `rgba(200,235,255,${0.85 * (1 - sw)})`; c.beginPath(); c.ellipse(52, -40 + sw * 50, 3.4, 5, 0, 0, Math.PI * 2); c.fill();
  c.restore();
  return L;
}
// Render the face into an offscreen canvas ~20 times a second and scale it each frame:
// keeps the title smooth on slower machines while the face still laughs and pulses.
const ManiacCache = { cv: null, size: 0, lastT: -1, L: null };
function drawManiacCached(c, cx, cy, R, baseR, t, alpha) {
  const M = ManiacCache, dpr = 0.7; // rendered a bit under screen resolution: it sits softly behind the UI anyway
  const size = Math.ceil(baseR * 2 * 2.05 * dpr);
  if (!M.cv || M.size !== size) { M.cv = document.createElement('canvas'); M.cv.width = M.cv.height = size; M.size = size; M.lastT = -1; }
  if (M.lastT < 0 || t - M.lastT > 0.066 || t < M.lastT) {
    const g = M.cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, size, size);
    M.L = drawManiacFace(g, size / 2, size / 2, baseR * dpr, t, 1); M.lastT = t;
  }
  const k = R / baseR, w = size / dpr * k;
  c.save(); c.globalAlpha = alpha; c.drawImage(M.cv, cx - w / 2, cy - w / 2, w, w); c.restore();
  return M.L;
}
