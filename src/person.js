// ===================== RESIDENCY — CHARACTER RENDERER (v2) =====================
// Shaded 3/4-view people: proportioned bodies, faces with eyes/brows/nose, hair styles,
// clothing detail (scrub V-necks, white-coat lapels, suits, gowns, lead aprons), walk cycle.
'use strict';
function lg(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function rg(x, y, r0, r1, stops, x1, y1) { const g = ctx.createRadialGradient(x, y, r0, x1 === undefined ? x : x1, y1 === undefined ? y : y1, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function withAlpha(hex, a) { const c = shade(hex, 0); return c.replace('rgb(', 'rgba(').replace(')', `,${a})`); }

function drawPerson(x, y, o) {
  const s = o.scale || 1, ph = o.walk || 0, w = Math.sin(ph);
  const bob = o.walk ? Math.abs(Math.cos(ph)) * 1.1 : 0;
  const female = !!o.female, sk = o.skin || '#e0ac85';
  const top = o.top || '#888', bottom = o.bottom || '#334';
  const SH = female ? 9.0 : 10.6, HIP = female ? 8.8 : 8.0;
  const style = o.style || (female ? 'ponytail' : 'short');
  const hair = o.hair || '#2b1b10';
  const longSleeve = o.coat || o.suit;
  const coatCol = o.coatColor || '#f7f8fa';
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face || 1), s);

  // ---------- ground shadow ----------
  ctx.fillStyle = rg(0, 0, 1, 16, [[0, 'rgba(0,0,0,0.42)'], [1, 'rgba(0,0,0,0)']]);
  ctx.beginPath(); ctx.ellipse(0, 0, 17, 5.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(0, -bob);

  // ---------- back hair (long styles fall behind body) ----------
  if (style === 'long') {
    ctx.fillStyle = lg(-9, -66, -4, -42, [[0, shade(hair, 0.05)], [1, shade(hair, -0.15)]]);
    ctx.beginPath(); ctx.moveTo(-6.5, -64); ctx.bezierCurveTo(-11.5, -60, -11, -48, -9, -43); ctx.quadraticCurveTo(-4, -41.5, -1.5, -45); ctx.lineTo(-1, -56); ctx.closePath(); ctx.fill();
  }

  if (style === 'bob') {
    ctx.fillStyle = lg(-9, -66, -2, -50, [[0, shade(hair, 0.05)], [1, shade(hair, -0.18)]]);
    ctx.beginPath(); ctx.moveTo(-6.5, -64.5); ctx.bezierCurveTo(-11, -61, -10.6, -55, -9.6, -51); ctx.lineTo(-2.2, -50.6); ctx.lineTo(-1, -57); ctx.closePath(); ctx.fill();
  }
  if (style === 'afro') {
    ctx.fillStyle = rg(-1, -64, 2, 14, [[0, shade(hair, 0.1)], [1, shade(hair, -0.2)]]);
    for (const [cx, cy, r] of [[-6.5, -55.5, 5], [-8, -60.5, 5.6], [-6, -66, 5.6], [0, -68.6, 5.8], [5.8, -67, 5], [-3, -51.5, 3.6]]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
  }
  if (style === 'braid') {
    for (let i = 0; i < 6; i++) {
      const by = -58 + i * 3.1, bx = -7.6 - i * 0.35;
      ctx.fillStyle = lg(bx - 2.6, by, bx + 2.6, by, [[0, shade(hair, -0.15)], [0.5, shade(hair, 0.1)], [1, shade(hair, -0.2)]]);
      ctx.beginPath(); ctx.ellipse(bx + (i % 2 ? 0.7 : -0.7), by, 2.5 - i * 0.12, 2.1, i % 2 ? 0.5 : -0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#d34b6a'; ctx.fillRect(-10.4, -40.6, 2.4, 1.3);
    ctx.fillStyle = shade(hair, -0.05); ctx.beginPath(); ctx.moveTo(-10.2, -39.4); ctx.lineTo(-8, -39.4); ctx.lineTo(-9.6, -36.2); ctx.closePath(); ctx.fill();
  }

  // ---------- back arm ----------
  drawArm(-1, -w * 0.42, o, longSleeve ? (o.coat ? coatCol : top) : top, sk, true, SH);

  // ---------- legs ----------
  drawLeg(-2.4, w * 0.36, o, bottom, sk, true);
  drawLeg(2.6, -w * 0.36, o, bottom, sk, false);

  // ---------- torso ----------
  const torso = () => {
    ctx.beginPath();
    ctx.moveTo(-SH + 2.5, -49.5);
    ctx.quadraticCurveTo(-SH - 0.6, -49, -SH, -44.5);
    ctx.quadraticCurveTo(-SH + (female ? 2.2 : 1.2), -36, -HIP, -25.5);
    ctx.quadraticCurveTo(0, -23.6, HIP, -25.5);
    ctx.quadraticCurveTo(SH - (female ? 2.2 : 1.2), -36, SH, -44.5);
    ctx.quadraticCurveTo(SH + 0.6, -49, SH - 2.5, -49.5);
    ctx.quadraticCurveTo(0, -51, -SH + 2.5, -49.5);
    ctx.closePath();
  };
  const bodyCol = o.apron ? top : top;
  torso();
  ctx.fillStyle = lg(-SH, 0, SH, 0, [[0, shade(bodyCol, -0.16)], [0.35, shade(bodyCol, 0.02)], [0.7, shade(bodyCol, 0.07)], [1, shade(bodyCol, -0.08)]]); ctx.fill();
  ctx.fillStyle = lg(0, -50, 0, -24, [[0, 'rgba(255,255,255,0.10)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.18)']]); torso(); ctx.fill();
  // fabric folds
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(-4, -34); ctx.quadraticCurveTo(-2, -30, -4.5, -27); ctx.moveTo(4.5, -37); ctx.quadraticCurveTo(3, -32, 5, -28); ctx.stroke();

  if (o.gown) {
    // hospital gown: knee-length with print and ties
    ctx.fillStyle = lg(-HIP, 0, HIP, 0, [[0, shade(top, -0.12)], [0.6, shade(top, 0.06)], [1, shade(top, -0.05)]]);
    ctx.beginPath(); ctx.moveTo(-HIP, -26.5); ctx.lineTo(-HIP - 1.8, -12); ctx.quadraticCurveTo(0, -10.5, HIP + 1.8, -12); ctx.lineTo(HIP, -26.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(40,70,120,0.35)';
    for (let i = -8; i <= 8; i += 3.2) for (let j = -47; j < -13; j += 3.4) { if (Math.abs(i) > (j < -26 ? SH - 1.5 : HIP + 1)) continue; ctx.beginPath(); ctx.moveTo(i, j - 0.9); ctx.lineTo(i + 0.9, j); ctx.lineTo(i, j + 0.9); ctx.lineTo(i - 0.9, j); ctx.fill(); }
    ctx.strokeStyle = shade(top, -0.3); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-2.5, -49.5); ctx.lineTo(0.5, -45); ctx.lineTo(3, -49.5); ctx.stroke();
  } else if (!o.suit) {
    // scrub V-neck with undershirt shadow + chest pocket + badge
    ctx.fillStyle = shade(sk, -0.1); ctx.beginPath(); ctx.moveTo(-3.2, -50); ctx.lineTo(0.6, -43.2); ctx.lineTo(4.2, -50); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(top, -0.28); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-3.4, -50); ctx.lineTo(0.6, -43); ctx.lineTo(4.4, -50); ctx.stroke();
    if (!o.coat && !o.apron) {
      ctx.strokeStyle = shade(top, -0.22); ctx.lineWidth = 0.6; ctx.strokeRect(2.2, -41, 5, 4.4);
      if (o.badgeGold) { ctx.fillStyle = '#e6b422'; ctx.beginPath(); ctx.moveTo(4.6, -43.6); ctx.lineTo(7, -42.6); ctx.lineTo(6.6, -39.6); ctx.lineTo(4.6, -38.4); ctx.lineTo(2.6, -39.6); ctx.lineTo(2.2, -42.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff6c4'; ctx.fillRect(4.2, -42, 0.8, 2); }
      else if (o.badge !== false) { ctx.fillStyle = '#f4f6f8'; ctx.fillRect(3.2, -43.2, 3, 4); ctx.fillStyle = '#2b7bd6'; ctx.fillRect(3.2, -43.2, 3, 1); ctx.fillStyle = '#9aa6b2'; ctx.fillRect(3.7, -41.4, 2, 0.5); }
      ctx.fillStyle = shade(top, -0.2); ctx.fillRect(-HIP + 0.5, -27, HIP * 2 - 1, 1.2); // hem
    }
  }
  if (o.suit) {
    // dress shirt, tie, jacket with lapels
    ctx.fillStyle = '#eef1f4'; ctx.beginPath(); ctx.moveTo(-3.4, -50); ctx.lineTo(0.6, -38); ctx.lineTo(4.6, -50); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.suit; ctx.beginPath(); ctx.moveTo(-0.4, -48.6); ctx.lineTo(1.6, -48.6); ctx.lineTo(2.2, -40); ctx.lineTo(0.6, -38.2); ctx.lineTo(-1, -40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(top, 0.12); ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-3.6, -50); ctx.lineTo(-1.5, -43); ctx.lineTo(0.4, -37.5); ctx.moveTo(4.8, -50); ctx.lineTo(2.7, -43); ctx.lineTo(0.8, -37.5); ctx.stroke();
    ctx.fillStyle = shade(top, 0.25); [[0.7, -34], [0.7, -30]].forEach(([bx, by]) => { ctx.beginPath(); ctx.arc(bx, by, 0.6, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#f4f6f8'; ctx.fillRect(4.5, -45.5, 2.6, 0.8); // pocket square
  }
  if (o.apron) {
    // lead apron + thyroid collar
    ctx.fillStyle = lg(-SH, 0, SH, 0, [[0, '#3c4651'], [0.5, '#5a6672'], [1, '#3a434d']]);
    ctx.beginPath(); ctx.moveTo(-SH + 1.2, -47.5); ctx.lineTo(SH - 1.2, -47.5); ctx.lineTo(HIP + 1.2, -16); ctx.quadraticCurveTo(0, -14.5, -HIP - 1.2, -16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4d5965'; ctx.beginPath(); ctx.ellipse(0.6, -50.5, 4.4, 1.8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f5c518'; ctx.beginPath(); ctx.moveTo(1, -40); ctx.lineTo(4, -40); ctx.lineTo(2.5, -37.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-6, -31, 13, 0.8);
  }
  if (o.coat) drawCoat(o, SH, HIP, coatCol);
  if (o.backpack) { ctx.fillStyle = '#23262e'; ctx.beginPath(); ctx.moveTo(-SH - 0.5, -47); ctx.lineTo(-SH - 4.5, -44); ctx.lineTo(-SH - 4, -30); ctx.lineTo(-SH + 0.5, -29); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-SH + 2.5, -49); ctx.lineTo(-SH + 2, -36); ctx.stroke(); }

  // ---------- neck ----------
  ctx.fillStyle = lg(-3, 0, 3, 0, [[0, shade(sk, -0.18)], [1, shade(sk, -0.05)]]);
  ctx.beginPath(); ctx.moveTo(-2.7, -49.8); ctx.lineTo(-2.4, -54.5); ctx.lineTo(3.4, -54.5); ctx.lineTo(3.6, -49.8); ctx.closePath(); ctx.fill();
  if (o.apron) { ctx.fillStyle = '#4d5965'; ctx.beginPath(); ctx.ellipse(0.6, -50.8, 4.2, 1.6, 0, Math.PI, 0); ctx.fill(); }

  // ---------- stethoscope ----------
  if (o.steth) drawSteth(o.steth);

  // ---------- head ----------
  drawHead(o, sk, hair, style, female);

  // ---------- front arm ----------
  drawArm(1, w * 0.42, o, longSleeve ? (o.coat ? coatCol : top) : top, sk, false, SH);

  // ---------- hit flash: cheap additive silhouette (no canvas filters) ----------
  if (o.flash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, o.flash * 6) * 0.55;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(1, -59, 7.6, 8.8, 0, 0, Math.PI * 2); ctx.fill();
    torso(); ctx.fill();
    ctx.fillRect(-6.5, -27, 13, 25);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

function drawLeg(hx, ang, o, col, sk, back) {
  ctx.save(); ctx.translate(hx, -26.5); ctx.rotate(ang);
  const c = back ? shade(col, -0.12) : col;
  const bare = o.gown; // patients: bare legs + grip socks
  const legCol = bare ? (back ? shade(sk, -0.12) : sk) : c;
  ctx.fillStyle = lg(-4, 0, 4, 0, [[0, shade(legCol, 0.06)], [0.55, legCol], [1, shade(legCol, -0.2)]]);
  ctx.beginPath(); ctx.moveTo(-4.3, 0); ctx.lineTo(4.3, 0); ctx.quadraticCurveTo(4.1, 11, 3.2, 22.5); ctx.lineTo(-2.9, 22.5); ctx.quadraticCurveTo(-3.8, 11, -4.3, 0); ctx.closePath(); ctx.fill();
  if (!bare) { ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0.6, 2); ctx.lineTo(0.2, 21); ctx.stroke(); }
  // shoe / sock
  const shoe = bare ? (o.sock || '#e9c46a') : (o.shoe || '#1c1f25');
  ctx.fillStyle = lg(0, 20, 0, 26, [[0, shade(shoe, 0.12)], [1, shade(shoe, -0.18)]]);
  ctx.beginPath(); ctx.moveTo(-3.4, 20.5); ctx.quadraticCurveTo(-4.4, 25.6, -1.6, 25.8); ctx.lineTo(6.2, 25.8); ctx.quadraticCurveTo(8, 25.2, 6.6, 23.2); ctx.quadraticCurveTo(4.5, 21.6, 3.2, 20.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = bare ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.22)'; ctx.fillRect(-1.8, 25, 8, 0.8);
  ctx.restore();
}

function drawArm(side, swing, o, sleeve, sk, back, SH) {
  ctx.save(); ctx.translate(side * (SH - 1.6), -46.8); ctx.rotate(swing);
  const dim = back ? -0.16 : 0;
  const sl = shade(sleeve, dim), skc = shade(sk, dim * 0.9);
  const long = o.coat || o.suit;
  ctx.lineCap = 'round';
  // upper arm (sleeve)
  ctx.strokeStyle = sl; ctx.lineWidth = 6.2; ctx.beginPath(); ctx.moveTo(0, 0.5); ctx.lineTo(0.6, long ? 11 : 7.5); ctx.stroke();
  ctx.strokeStyle = shade(sl, -0.14); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1.6, 1.5); ctx.lineTo(2, long ? 11 : 7); ctx.stroke();
  if (long) {
    ctx.strokeStyle = sl; ctx.lineWidth = 5.4; ctx.beginPath(); ctx.moveTo(0.6, 11); ctx.lineTo(2.6, 20.5); ctx.stroke();
    ctx.strokeStyle = shade(sl, -0.14); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(2, 12); ctx.lineTo(3.8, 20); ctx.stroke();
    ctx.strokeStyle = shade(sl, -0.2); ctx.lineWidth = 5.6; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(2.4, 19.6); ctx.lineTo(2.7, 21); ctx.stroke(); ctx.lineCap = 'round';
  } else {
    ctx.strokeStyle = skc; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(0.6, 7.6); ctx.lineTo(0.8, 11); ctx.lineTo(2.6, 20.5); ctx.stroke();
    ctx.strokeStyle = shade(skc, -0.12); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(1.9, 9); ctx.lineTo(3.6, 20); ctx.stroke();
    ctx.strokeStyle = shade(sl, -0.1); ctx.lineWidth = 6.6; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(0.5, 6.6); ctx.lineTo(0.6, 8); ctx.stroke(); ctx.lineCap = 'round';
  }
  // hand
  ctx.fillStyle = rg(2.4, 22, 0.5, 3.4, [[0, shade(skc, 0.05)], [1, shade(skc, -0.12)]]);
  ctx.beginPath(); ctx.ellipse(3, 23.2, 2.4, 2.9, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = shade(skc, -0.06); ctx.beginPath(); ctx.ellipse(4.7, 22.2, 0.9, 1.6, 0.4, 0, 7); ctx.fill(); // thumb
  if (o.briefcase && !back) {
    ctx.rotate(-swing);
    ctx.fillStyle = lg(0, 24, 0, 34, [[0, '#6b4524'], [1, '#3f2712']]); roundRect(-3, 24.5, 13, 9.5, 1.4); ctx.fill();
    ctx.strokeStyle = '#2b190a'; ctx.lineWidth = 0.6; ctx.strokeRect(-3, 27.5, 13, 0.1);
    ctx.fillStyle = '#d4b062'; ctx.fillRect(2.5, 26.6, 2, 1.2);
    ctx.strokeStyle = '#3f2712'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(1.5, 24.5); ctx.lineTo(2, 22.6); ctx.lineTo(5, 22.6); ctx.lineTo(5.5, 24.5); ctx.stroke();
  }
  ctx.restore();
}

function drawCoat(o, SH, HIP, col) {
  const bottom = o.longcoat ? -12.5 : -21;
  const flare = o.longcoat ? 2.6 : 1.4;
  const panel = (side) => {
    ctx.beginPath();
    ctx.moveTo(side * (SH + 0.6), -45);
    ctx.quadraticCurveTo(side * (SH + 0.8), -49.6, side * (SH - 2.6), -50.2);
    ctx.lineTo(side * 3.6, -50.6);
    ctx.lineTo(side * 1.1, -39);
    ctx.lineTo(side * 0.6, bottom);
    ctx.lineTo(side * (HIP + flare), bottom + 0.4);
    ctx.quadraticCurveTo(side * (SH - 0.4), -34, side * (SH + 0.6), -45);
    ctx.closePath();
  };
  // inner shirt between lapels
  ctx.fillStyle = o.tie ? '#cfe0f0' : shade(o.top || '#2a7fa8', -0.05);
  ctx.beginPath(); ctx.moveTo(-3.6, -50.6); ctx.lineTo(4.4, -50.6); ctx.lineTo(1, -38); ctx.closePath(); ctx.fill();
  if (o.tie) { ctx.fillStyle = o.tie; ctx.beginPath(); ctx.moveTo(0, -49.5); ctx.lineTo(1.8, -49.5); ctx.lineTo(2.2, -40.5); ctx.lineTo(0.9, -38.6); ctx.lineTo(-0.4, -40.5); ctx.closePath(); ctx.fill(); }
  for (const side of [-1, 1]) {
    panel(side);
    ctx.fillStyle = lg(-SH - 2, 0, SH + 2, 0, [[0, shade(col, -0.18)], [0.45, shade(col, 0.03)], [0.8, col], [1, shade(col, -0.11)]]); ctx.fill();
    ctx.fillStyle = lg(0, -50, 0, bottom, [[0, 'rgba(255,255,255,0.15)'], [1, 'rgba(70,90,110,0.18)']]); panel(side); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(60,80,100,0.35)'; ctx.lineWidth = 0.7;
  // lapels
  ctx.beginPath(); ctx.moveTo(-3.6, -50.4); ctx.lineTo(-5.4, -45.5); ctx.lineTo(-2.6, -44.2); ctx.lineTo(1, -38.5);
  ctx.moveTo(4.4, -50.4); ctx.lineTo(6.4, -45.5); ctx.lineTo(3.4, -44.2); ctx.lineTo(1.2, -38.5); ctx.stroke();
  // center seam, pockets, buttons
  ctx.beginPath(); ctx.moveTo(0.9, -38.5); ctx.lineTo(0.9, bottom); ctx.stroke();
  ctx.strokeRect(3, bottom + (o.longcoat ? -10 : -6), 4.6, 4.2); ctx.strokeRect(-7.2, bottom + (o.longcoat ? -10 : -6), 4.4, 4.2);
  ctx.strokeRect(-7.4, -42.5, 4, 3.6);
  ctx.fillStyle = '#9aa6b2'; [-33, -27, -21].filter(b => b > bottom + 2).forEach(b => { ctx.beginPath(); ctx.arc(2.4, b, 0.65, 0, 7); ctx.fill(); });
  // pens + embroidered name
  ctx.fillStyle = '#1f4ea8'; ctx.fillRect(-6.8, -44.2, 0.8, 2.6); ctx.fillStyle = '#c0392b'; ctx.fillRect(-5.6, -44.4, 0.8, 2.8);
  ctx.strokeStyle = 'rgba(30,70,150,0.7)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(3, -42.8); ctx.lineTo(7.2, -42.8); ctx.stroke();
  // ID badge
  ctx.fillStyle = '#ffffff'; ctx.fillRect(3.4, -40.6, 3, 4); ctx.fillStyle = '#2b7bd6'; ctx.fillRect(3.4, -40.6, 3, 1);
}

function drawSteth(col) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = shade(col, -0.25); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-3.2, -51.2); ctx.bezierCurveTo(-6.5, -46, -5.5, -40, -3.2, -37.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4.2, -51.2); ctx.bezierCurveTo(6.5, -46, 5.2, -40, 3.4, -36.6); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(-3.2, -51.2); ctx.bezierCurveTo(-6.5, -46, -5.5, -40, -3.2, -37.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4.2, -51.2); ctx.bezierCurveTo(6.5, -46, 5.2, -40, 3.4, -36.6); ctx.stroke();
  // ear tubes + chestpiece
  ctx.strokeStyle = '#b9c2cc'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-3.2, -37.5); ctx.lineTo(-2.4, -34.8); ctx.stroke();
  ctx.fillStyle = rg(3.4, -35.6, 0.3, 2.4, [[0, '#ffffff'], [1, '#8d98a5']]); ctx.beginPath(); ctx.arc(3.6, -35.2, 2.1, 0, 7); ctx.fill();
  ctx.fillStyle = '#6d7884'; ctx.beginPath(); ctx.arc(-2.2, -34.4, 0.9, 0, 7); ctx.fill();
}

function drawHead(o, sk, hair, style, female) {
  const cx = 1, cy = -59;
  // ear (behind face)
  ctx.fillStyle = shade(sk, -0.12); ctx.beginPath(); ctx.ellipse(-2.6, -58, 1.8, 2.6, -0.1, 0, 7); ctx.fill();
  ctx.strokeStyle = shade(sk, -0.28); ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(-2.5, -58, 1, -1.2, 1.8); ctx.stroke();
  // skull + jaw
  const face = () => { ctx.beginPath(); ctx.ellipse(cx, cy, 7.3, 8.4, 0, 0, Math.PI * 2); ctx.moveTo(8.4, -56); ctx.ellipse(cx + 2.4, -54.4, 5.2, 3.8, 0.15, 0, Math.PI * 2); };
  face(); ctx.fillStyle = rg(cx + 3, cy - 3, 1, 10, [[0, shade(sk, 0.08)], [0.6, sk], [1, shade(sk, -0.16)]]); ctx.fill();
  // cheek/jaw shading + blush
  ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.beginPath(); ctx.ellipse(-1.8, -55.5, 3, 3.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(210,90,90,0.14)'; ctx.beginPath(); ctx.ellipse(5.4, -55.6, 1.9, 1.2, 0, 0, 7); ctx.fill();
  if (o.beard) { ctx.fillStyle = withAlpha(hair, 0.35); ctx.beginPath(); ctx.ellipse(3.2, -53.6, 5, 3.2, 0.15, 0, Math.PI); ctx.fill(); }
  // nose
  ctx.fillStyle = shade(sk, -0.04); ctx.beginPath(); ctx.moveTo(7.6, -59.4); ctx.quadraticCurveTo(9.9, -55.8, 8.2, -55.2); ctx.lineTo(7.2, -55.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(7.6, -55.4, 0.8, 0.4, 0, 0, 7); ctx.fill();
  // eyes (near + far in 3/4 view)
  const eye = (ex, ey, rx) => {
    ctx.fillStyle = '#f6f3ef'; ctx.beginPath(); ctx.ellipse(ex, ey, rx, 1.05, 0, 0, 7); ctx.fill();
    ctx.fillStyle = o.eye || '#4a3222'; ctx.beginPath(); ctx.arc(ex + rx * 0.35, ey + 0.05, 0.85, 0, 7); ctx.fill();
    ctx.fillStyle = '#0d0d0d'; ctx.beginPath(); ctx.arc(ex + rx * 0.4, ey + 0.05, 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(ex + rx * 0.2, ey - 0.6, 0.45, 0.45);
    ctx.strokeStyle = shade(sk, -0.45); ctx.lineWidth = 0.55; ctx.beginPath(); ctx.ellipse(ex, ey, rx, 1.1, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    if (female) { ctx.beginPath(); ctx.moveTo(ex + rx * 0.9, ey - 0.6); ctx.lineTo(ex + rx * 1.3, ey - 1.1); ctx.stroke(); }
  };
  eye(2.6, -59.3, 1.55); eye(6.5, -59.3, 1.05);
  // brows
  ctx.strokeStyle = shade(hair, -0.05); ctx.lineWidth = female ? 0.65 : 0.95; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(1.2, -61.3); ctx.quadraticCurveTo(2.8, -62.2, 4.2, -61.5); ctx.moveTo(5.7, -61.5); ctx.quadraticCurveTo(6.6, -62, 7.4, -61.4); ctx.stroke();
  // mouth
  ctx.strokeStyle = female ? '#a8505a' : shade(sk, -0.35); ctx.lineWidth = female ? 0.95 : 0.7;
  ctx.beginPath(); ctx.moveTo(3.6, -53.2); ctx.quadraticCurveTo(5.4, -52.6, 6.9, -53.4); ctx.stroke();
  if (o.mask) {
    ctx.fillStyle = lg(0, -57, 0, -50, [[0, '#cfe6f7'], [1, '#8fbcdc']]);
    ctx.beginPath(); ctx.moveTo(-0.6, -57.4); ctx.quadraticCurveTo(5, -58.4, 9.4, -56.6); ctx.quadraticCurveTo(9.6, -52.4, 7, -50.2); ctx.quadraticCurveTo(3, -49.2, -0.2, -51); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(70,110,150,0.55)'; ctx.lineWidth = 0.5; for (const yy of [-55.6, -53.8, -52]) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(9, yy - 0.3); ctx.stroke(); }
    ctx.strokeStyle = '#e8eef4'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-0.4, -56.8); ctx.lineTo(-2.6, -58.6); ctx.moveTo(-0.2, -51.4); ctx.lineTo(-2.4, -56.6); ctx.stroke();
  }
  if (o.glasses) { ctx.strokeStyle = '#1e2228'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(2.7, -59.2, 2.4, 1.8, 0, 0, 7); ctx.moveTo(8.1, -59.2); ctx.ellipse(6.6, -59.2, 1.6, 1.8, 0, 0, 7); ctx.moveTo(5, -59.4); ctx.lineTo(5.1, -59.4); ctx.moveTo(0.3, -59.4); ctx.lineTo(-2.2, -58.6); ctx.stroke(); }

  // hair (on top)
  const hg = lg(-7, -68, 6, -55, [[0, shade(hair, 0.14)], [0.5, hair], [1, shade(hair, -0.18)]]);
  ctx.fillStyle = hg;
  if (style === 'buzz') {
    ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(-6.2, -56.2); ctx.bezierCurveTo(-7.6, -66.5, 4, -69.5, 8, -62.2); ctx.quadraticCurveTo(5, -63, 2.4, -62.8); ctx.quadraticCurveTo(-1.8, -62.6, -3.4, -58.6); ctx.lineTo(-4.4, -55.2); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  } else if (style === 'receding') {
    ctx.beginPath(); ctx.moveTo(-6.4, -55); ctx.bezierCurveTo(-8, -62, -5, -66, -1, -66.6); ctx.quadraticCurveTo(-1.6, -62, -3.4, -58.2); ctx.lineTo(-4.4, -54.6); ctx.closePath(); ctx.fill();
  } else {
    // shared cap of hair with a side-swept fringe
    ctx.beginPath(); ctx.moveTo(-6.9, -54.2); ctx.bezierCurveTo(-9.2, -66.5, 3, -71.6, 8.6, -62.6);
    ctx.quadraticCurveTo(7.2, -61.6, 6.2, -63); ctx.quadraticCurveTo(3.5, -61.2, 0.8, -62.6); ctx.quadraticCurveTo(-1.6, -60.5, -3.4, -58.4);
    ctx.lineTo(-4.4, -54.4); ctx.closePath(); ctx.fill();
    if (style === 'long') { ctx.beginPath(); ctx.moveTo(-3.6, -60); ctx.bezierCurveTo(-5.2, -54, -4, -50, -2.4, -48.5); ctx.lineTo(-1.2, -49.5); ctx.quadraticCurveTo(-2.4, -54, -1.8, -59.5); ctx.closePath(); ctx.fill(); }
    if (style === 'ponytail') { ctx.beginPath(); ctx.moveTo(-6.2, -63); ctx.bezierCurveTo(-11.5, -62, -12, -54, -9.6, -49.5); ctx.quadraticCurveTo(-8.4, -55, -5.4, -59.5); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#d34b6a'; ctx.beginPath(); ctx.ellipse(-6.6, -61.4, 1, 1.4, 0.5, 0, 7); ctx.fill(); ctx.fillStyle = hg; }
    if (style === 'bun') { ctx.beginPath(); ctx.arc(-5.4, -66, 3.6, 0, 7); ctx.fill(); }
    if (style === 'bob') { ctx.beginPath(); ctx.moveTo(-3.8, -60.5); ctx.bezierCurveTo(-5.2, -56, -4.8, -53, -3.6, -51.2); ctx.lineTo(-0.6, -51.4); ctx.quadraticCurveTo(-1.8, -55, -1.6, -60); ctx.closePath(); ctx.fill(); }
    if (style === 'sidepart') {
      ctx.beginPath(); ctx.moveTo(-3.6, -66.4); ctx.bezierCurveTo(1, -70.6, 7.4, -68.8, 9.2, -63.2); ctx.quadraticCurveTo(5.6, -64.6, 1.6, -64.6); ctx.quadraticCurveTo(-1.5, -64.8, -3.6, -66.4); ctx.fill();
      ctx.strokeStyle = shade(hair, -0.3); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-4.4, -62); ctx.quadraticCurveTo(-4.2, -65.5, -3.2, -67.4); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-1.5, -67.6); ctx.quadraticCurveTo(3.5, -69.4, 7.6, -65.4); ctx.stroke();
    }
    if (style === 'curly' || style === 'afro') {
      const big = style === 'afro';
      for (let i = 0; i <= 9; i++) {
        const ang = Math.PI * (1.05 + i * 0.1), R = big ? 8.6 : 7.4;
        const cx = 0.6 + Math.cos(ang) * R, cy = -60.4 + Math.sin(ang) * (R + (big ? 1.4 : 0.6));
        ctx.fillStyle = rg(cx - 0.6, cy - 0.8, 0.2, big ? 3.4 : 2.6, [[0, shade(hair, 0.16)], [1, shade(hair, -0.12)]]);
        ctx.beginPath(); ctx.arc(cx, cy, big ? 3.2 : 2.5, 0, 7); ctx.fill();
      }
      ctx.fillStyle = hg;
    }
    if (style === 'spiky') {
      for (let i = 0; i < 6; i++) {
        const ang = Math.PI * (1.1 + i * 0.15), bx = 0.8 + Math.cos(ang) * 6.6, by = -60.4 + Math.sin(ang) * 7.6;
        const tx = 0.8 + Math.cos(ang - 0.08) * 11.4, ty = -60.4 + Math.sin(ang - 0.08) * 11.6;
        ctx.fillStyle = i % 2 ? shade(hair, 0.08) : hair;
        ctx.beginPath(); ctx.moveTo(bx - 2.4 * Math.sin(ang), by + 2.4 * Math.cos(ang)); ctx.lineTo(tx, ty); ctx.lineTo(bx + 2.4 * Math.sin(ang), by - 2.4 * Math.cos(ang)); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = hg;
    }
    // highlight strands
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-4.5, -63.5); ctx.quadraticCurveTo(0, -67.6, 5, -65); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(-2, -61); ctx.quadraticCurveTo(1, -64.5, 5.4, -63.5); ctx.stroke();
  }

  // headgear
  if (o.head === 'cap') {
    const cc = o.capColor || '#3aa1c9';
    ctx.fillStyle = lg(-8, -70, 8, -58, [[0, shade(cc, 0.12)], [1, shade(cc, -0.14)]]);
    ctx.beginPath(); ctx.moveTo(-7.6, -57.6); ctx.bezierCurveTo(-10.2, -70, 7, -73.4, 9, -61.4); ctx.quadraticCurveTo(1, -63.4, -7.6, -57.6); ctx.fill();
    ctx.strokeStyle = shade(cc, -0.3); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-7.4, -58); ctx.quadraticCurveTo(1, -63.6, 8.8, -61.6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-4 + i * 2.2, -66 + Math.sin(i) * 1.2, 0.45, 0, 7); ctx.fill(); }
  }
  if (o.head === 'guardcap') {
    ctx.fillStyle = lg(-8, -71, 8, -60, [[0, '#2c3550'], [1, '#151a28']]);
    ctx.beginPath(); ctx.moveTo(-7.6, -60.6); ctx.quadraticCurveTo(-8.4, -70.5, 1, -71); ctx.quadraticCurveTo(8.6, -70.6, 8.6, -62); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0d111b'; ctx.beginPath(); ctx.moveTo(3, -62.4); ctx.lineTo(12.6, -61); ctx.quadraticCurveTo(10, -59.6, 3.4, -60.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e6b422'; ctx.beginPath(); ctx.arc(4.4, -66, 1.6, 0, 7); ctx.fill();
  }
  if (o.head === 'lamp') {
    ctx.fillStyle = '#2b2f36'; ctx.beginPath(); ctx.moveTo(-7.4, -62.4); ctx.quadraticCurveTo(1, -65.6, 8.4, -63); ctx.lineTo(8.4, -61.6); ctx.quadraticCurveTo(1, -64.2, -7.4, -61); ctx.fill();
    ctx.fillStyle = '#55606c'; roundRect(5.6, -65.4, 4.2, 3.6, 0.8); ctx.fill();
    ctx.fillStyle = rg(9.8, -63.6, 0.2, 4, [[0, 'rgba(255,250,210,1)'], [1, 'rgba(255,250,210,0)']]); ctx.beginPath(); ctx.arc(9.8, -63.6, 4, 0, 7); ctx.fill();
  }
  if (o.head === 'mirror') {
    ctx.fillStyle = '#2b2f36'; ctx.fillRect(-7.4, -63.2, 16, 1.3);
    ctx.fillStyle = rg(5, -66.5, 0.3, 3.4, [[0, '#ffffff'], [1, '#9fb2c4']]); ctx.beginPath(); ctx.ellipse(5.4, -66.4, 2.4, 3.2, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#1e2228'; ctx.beginPath(); ctx.arc(5.4, -66.4, 0.6, 0, 7); ctx.fill();
  }
  if (o.head === 'loupes') {
    ctx.strokeStyle = '#1e2228'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-2.2, -58.8); ctx.lineTo(7.6, -59.8); ctx.stroke();
    ctx.fillStyle = '#2c3440'; roundRect(2.2, -60.8, 2.8, 2.4, 0.5); ctx.fill(); roundRect(6.2, -60.8, 2.6, 2.4, 0.5); ctx.fill();
    ctx.fillStyle = '#7fd8ff'; ctx.fillRect(4.6, -60.2, 0.8, 1.3); ctx.fillRect(8.4, -60.2, 0.8, 1.3);
  }
}
