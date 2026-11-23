// ===================== RESIDENCY — PRIMARY WEAPONS & WEAPON EFFECTS =====================
'use strict';

function ensureWeapons() {
  if (!S) return;
  if (!Array.isArray(S.weapons) || !S.weapons.length || !WEAPONS[S.weapons[0]]) S.weapons = [pick(WEAPON_KEYS)];
  if (S.level >= MAX_LEVEL && S.weapons.length < 2) S.weapons.push(pick(WEAPON_KEYS.filter(k => k !== S.weapons[0])));
}
function grantSecondWeapon() {
  if (S.weapons.length >= 2) return null;
  const id = pick(WEAPON_KEYS.filter(k => k !== S.weapons[0]));
  S.weapons.push(id);
  return id;
}

function handPos(slot) { // muzzle position for weapon slot 0 (front hand) / 1 (back hand)
  const p = G.player, a = aimAngle();
  const off = slot ? -7 : 7;
  return { x: p.x + Math.cos(a) * 22 - Math.sin(a) * off * 0.4, y: p.y - 30 + Math.sin(a) * 18 + Math.cos(a) * off * 0.3, a };
}
function weaponDamage(W) {
  const bonus = W.kind === 'proj' ? 1 : 1 + 0.2 * G.stats.extraProj;
  return playerDamage(G.stats.basicMult * W.dmg * bonus);
}
function enemyAimY(e) { return e.y - (e.boss ? 46 : 32); }
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); }

function fireWeapon(id, slot) {
  const W = WEAPONS[id]; const h = handPos(slot); const a = h.a;
  const dmg = weaponDamage(W);
  G.flashes.push({ x: h.x, y: h.y, a, t: 0.07, kind: id });
  switch (W.kind) {
    case 'proj': {
      const n = (W.count || 1) + G.stats.extraProj;
      for (let i = 0; i < n; i++) {
        let ang = a;
        if (W.count) ang = a + (Math.random() - 0.5) * W.spread * 2;
        else if (n > 1) ang = a + (i - (n - 1) / 2) * 0.12;
        if (W.spread && !W.count) ang += (Math.random() - 0.5) * W.spread * 2;
        const spd = W.spd * (W.count ? rand(0.85, 1.15) : 1);
        fireProj(h.x, h.y, ang, spd, { dmg, kind: W.proj, life: W.life, pierce: W.pierce || 0, poison: !!W.poison, color: W.color, r: W.r || 6,
          spin: Math.random() * 6, ox: h.x, oy: h.y, boomerang: !!W.boomerang, maxLife: W.life, pillCol: pick([['#ff7ad9', '#ffffff'], ['#5aa2ff', '#ffe066'], ['#7dffb0', '#ffffff'], ['#ff9f43', '#c084fc']]) });
      }
      break; }
    case 'beam': {
      // march along the aim line; stop at props, walls or the first enemy
      let ex = h.x, ey = h.y, hit = null;
      const dx = Math.cos(a), dy = Math.sin(a);
      for (let d = 0; d <= W.range; d += 8) {
        const x = h.x + dx * d, y = h.y + dy * d;
        if (x < WALL || x > WW - WALL || y < WALL - 10 || y > WH - WALL || pointInProp(x, y + 30)) { ex = x; ey = y; break; }
        ex = x; ey = y;
        for (const e of G.enemies) { if (e.dead || e.spawnT > 0.25) continue; if (Math.hypot(e.x - x, enemyAimY(e) - y) < e.r + 10) { hit = e; break; } }
        if (hit) break;
      }
      if (hit) { hitEnemy(hit, dmg, { quiet: Math.random() < 0.5 }); G.sparks.push(...sparkSet(ex, ey, '#ffc830', 5)); }
      G.beams.push({ x1: h.x, y1: h.y, x2: ex, y2: ey, t: 0.09, max: 0.09 });
      break; }
    case 'melee': {
      for (const e of G.enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x - G.player.x, enemyAimY(e) - (G.player.y - 30));
        if (d < W.range + e.r && angDiff(Math.atan2(enemyAimY(e) - (G.player.y - 30), e.x - G.player.x), a) < W.arc / 2) {
          hitEnemy(e, dmg, {});
          if (!e.boss) { const k = 34 / Math.max(1, d); e.x += (e.x - G.player.x) * k; e.y += (e.y - G.player.y) * k; resolveProps(e); e.stunT = Math.max(e.stunT, 0.15); }
          G.sparks.push(...sparkSet(e.x, enemyAimY(e), '#ffb347', 5));
        }
      }
      G.swings.push({ x: G.player.x, y: G.player.y - 30, a, arc: W.arc, range: W.range, t: 0.2, max: 0.2, dir: (G.swingDir = -(G.swingDir || 1)) });
      break; }
    case 'chain': {
      const p = G.player, from = { x: h.x, y: h.y };
      let pool = G.enemies.filter(e => !e.dead && e.spawnT <= 0.25 && Math.hypot(e.x - p.x, e.y - p.y) < W.range);
      if (!pool.length) { G.bolts.push({ pts: [from, { x: h.x + Math.cos(a) * 90, y: h.y + Math.sin(a) * 90 }], t: 0.12, max: 0.12, fizzle: true }); break; }
      pool.sort((A, B) => (angDiff(Math.atan2(A.y - p.y, A.x - p.x), a) * 300 + Math.hypot(A.x - p.x, A.y - p.y)) - (angDiff(Math.atan2(B.y - p.y, B.x - p.x), a) * 300 + Math.hypot(B.x - p.x, B.y - p.y)));
      const pts = [from]; let cur = pool[0], mult = 1; const hitSet = new Set();
      for (let i = 0; i <= W.chains && cur; i++) {
        hitSet.add(cur); pts.push({ x: cur.x, y: enemyAimY(cur) });
        hitEnemy(cur, dmg * mult, { quiet: i > 0 }); G.sparks.push(...sparkSet(cur.x, enemyAimY(cur), '#bfefff', 6));
        mult *= 0.7;
        const last = cur; cur = null; let bd = 220;
        for (const e of G.enemies) { if (e.dead || hitSet.has(e)) continue; const d = Math.hypot(e.x - last.x, e.y - last.y); if (d < bd) { bd = d; cur = e; } }
      }
      G.bolts.push({ pts, t: 0.16, max: 0.16 });
      break; }
    case 'cone': {
      const p = G.player;
      for (const e of G.enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x - p.x, enemyAimY(e) - (p.y - 30));
        if (d < W.range + e.r && angDiff(Math.atan2(enemyAimY(e) - (p.y - 30), e.x - p.x), a) < W.arc / 2) { hitEnemy(e, dmg, { quiet: true }); e.slowT = Math.max(e.slowT, 1.2); e.frostT = 1.2; }
      }
      for (let i = 0; i < 5; i++) { const ang = a + (Math.random() - 0.5) * W.arc * 0.9, s = rand(380, 560); G.mist.push({ x: h.x, y: h.y, vx: Math.cos(ang) * s, vy: Math.sin(ang) * s, r: rand(7, 11), t: 0, max: rand(0.4, 0.55) }); }
      break; }
  }
  if (W.kind !== 'cone' || Math.random() < 0.3) sfx('shoot');
}

function sparkSet(x, y, color, n) { const out = []; for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), s = rand(120, 320); out.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rand(0.12, 0.26), color }); } return out; }

function updateWeaponFx(dt) {
  for (const b of G.beams) b.t -= dt;
  G.beams = G.beams.filter(b => b.t > 0);
  for (const b of G.bolts) b.t -= dt;
  G.bolts = G.bolts.filter(b => b.t > 0);
  for (const s of G.swings) s.t -= dt;
  G.swings = G.swings.filter(s => s.t > 0);
  for (const f of G.flashes) f.t -= dt;
  G.flashes = G.flashes.filter(f => f.t > 0);
  for (const m of G.mist) { m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt; m.vx *= 0.9; m.vy *= 0.9; m.r += 70 * dt; }
  G.mist = G.mist.filter(m => m.t < m.max);
  for (const s of G.sparks) { s.t -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.88; s.vy = s.vy * 0.88 + 260 * dt; }
  G.sparks = G.sparks.filter(s => s.t > 0);
  for (const e of G.enemies) if (e.frostT > 0) e.frostT -= dt;
}
function updateWeaponProj(pr, dt) { // called for player projectiles before movement
  pr.spin = (pr.spin || 0) + dt * (pr.kind === 'saw' ? 34 : pr.kind === 'scalpel' ? 24 : pr.kind === 'pill' ? 9 : 0);
  if (pr.kind === 'wave') pr.r = (pr.r || 18) + 34 * dt;
  if (pr.boomerang && pr.life < pr.maxLife * 0.5) {
    const p = G.player, tx = p.x, ty = p.y - 30, d = Math.hypot(tx - pr.x, ty - pr.y) || 1;
    if (!pr.returning) { pr.returning = true; pr.hits = new Set(); }
    pr.vx = (tx - pr.x) / d * 680; pr.vy = (ty - pr.y) / d * 680;
    if (d < 24) pr.life = 0;
  }
  if (pr.boomerang && pr.kind === 'saw' && Math.random() < 0.25) G.sparks.push(...sparkSet(pr.x, pr.y + 6, '#ffcf6b', 1));
}

// ---------- rendering ----------
function drawPlayerProjectile(pr) {
  const ang = Math.atan2(pr.vy, pr.vx);
  ctx.save(); ctx.translate(pr.x, pr.y);
  const SC = { syringe: 1.6, scalpel: 1.6, staple: 1.7, pill: 1.5, saw: 1.25, wave: 1.15 }[pr.kind] || 1; ctx.scale(SC, SC);
  switch (pr.kind) {
    case 'syringe': {
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(127,227,255,0.18)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-12, 0); ctx.stroke();
      ctx.fillStyle = 'rgba(235,245,255,0.55)'; roundRect(-11, -3.2, 17, 6.4, 1.5); ctx.fill();          // barrel
      ctx.fillStyle = '#3fc6e6'; ctx.fillRect(-4, -2.4, 10, 4.8);                                        // medication
      ctx.strokeStyle = 'rgba(40,60,80,0.6)'; ctx.lineWidth = 0.6; for (let i = -8; i < 6; i += 3) { ctx.beginPath(); ctx.moveTo(i, -3.2); ctx.lineTo(i, -1.6); ctx.stroke(); }
      ctx.fillStyle = '#4a5563'; ctx.fillRect(-12, -2.6, 2.4, 5.2); ctx.fillRect(-17, -0.9, 5, 1.8); ctx.fillRect(-18.5, -3.4, 1.6, 6.8); // plunger
      ctx.fillStyle = '#c9d2dc'; ctx.fillRect(-12.4, -4.4, 1.2, 8.8);                                    // flange
      ctx.fillStyle = '#e5ebf1'; ctx.fillRect(6, -1.2, 2.4, 2.4);                                        // hub
      ctx.strokeStyle = '#dfe6ee'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(8.4, 0); ctx.lineTo(17, 0); ctx.stroke(); // needle
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(-9, -2.6, 12, 0.8);
      break; }
    case 'scalpel': {
      ctx.rotate(pr.spin);
      for (let g = 2; g >= 1; g--) { ctx.globalAlpha = 0.18 / g; ctx.rotate(-0.35); drawScalpelShape(); }
      ctx.globalAlpha = 1; ctx.rotate(0.7); drawScalpelShape();
      break; }
    case 'staple': {
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(213,221,230,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-4, 0); ctx.stroke();
      ctx.strokeStyle = '#e9eef3'; ctx.lineWidth = 1.5; ctx.lineJoin = 'miter';
      ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(3, -4); ctx.lineTo(3, 4); ctx.lineTo(-3, 4); ctx.stroke();
      ctx.strokeStyle = '#7d8996'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(3.6, -4); ctx.lineTo(3.6, 4); ctx.stroke();
      break; }
    case 'pill': {
      ctx.rotate(pr.spin);
      const [c1, c2] = pr.pillCol || ['#ff7ad9', '#ffffff'];
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(1.5, 5, 7, 2, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(-4, 0, 3.6, Math.PI / 2, Math.PI * 1.5); ctx.lineTo(4, -3.6); ctx.arc(4, 0, 3.6, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.clip();
      ctx.fillStyle = c1; ctx.fillRect(-8, -4, 8, 8); ctx.fillStyle = c2; ctx.fillRect(0, -4, 8, 8);
      ctx.fillStyle = lg(0, -4, 0, 4, [[0, 'rgba(255,255,255,0.55)'], [0.45, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fillRect(-8, -4, 16, 8);
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0, -3.6); ctx.lineTo(0, 3.6); ctx.stroke();
      break; }
    case 'wave': {
      ctx.rotate(ang);
      const R = pr.r || 18, fade = clamp(pr.life / 0.62, 0, 1);
      for (let i = 0; i < 3; i++) {
        const rr = R - i * 7; if (rr < 4) continue;
        ctx.strokeStyle = `rgba(160,215,255,${(0.75 - i * 0.22) * fade})`; ctx.lineWidth = 4 - i;
        ctx.beginPath(); ctx.arc(-R, 0, rr + R * 0.0, -0.75, 0.75); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * fade})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-R, 0, R, -0.6, 0.6); ctx.stroke();
      break; }
    case 'saw': {
      for (let g = 3; g >= 1; g--) { ctx.globalAlpha = 0.12; drawSawBlade(pr.spin - g * 0.25, pr.r || 14, -pr.vx / 680 * g * 5, -pr.vy / 680 * g * 5); }
      ctx.globalAlpha = 1; drawSawBlade(pr.spin, pr.r || 14, 0, 0);
      break; }
    case 'bolt': { // Grand Rounds knowledge bolts
      ctx.rotate(ang);
      const g = ctx.createLinearGradient(-30, 0, 8, 0); g.addColorStop(0, 'rgba(159,208,255,0)'); g.addColorStop(1, 'rgba(159,208,255,0.85)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-10, 0, 22, 4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(2, 0, 6, 3, 0, 0, 7); ctx.fill();
      break; }
    default: {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, pr.r * 2.2); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, pr.color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, pr.r * 2.2, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
}
function drawScalpelShape() {
  ctx.fillStyle = lg(-10, 0, 0, 0, [[0, '#7c8a97'], [1, '#b9c4cf']]); roundRect(-11, -1.6, 10, 3.2, 1); ctx.fill(); // handle
  ctx.fillStyle = lg(0, -3, 0, 3, [[0, '#ffffff'], [0.5, '#cfd8e2'], [1, '#8796a5']]);
  ctx.beginPath(); ctx.moveTo(-1, -1.6); ctx.lineTo(6, -1.8); ctx.quadraticCurveTo(11, -0.6, 12, 1.6); ctx.lineTo(-1, 1.6); ctx.closePath(); ctx.fill(); // blade
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(1, 1.3); ctx.lineTo(11, 1.4); ctx.stroke();
}
function drawSawBlade(rot, R, dx, dy) {
  ctx.save(); ctx.translate(dx, dy); ctx.rotate(rot);
  ctx.beginPath();
  const teeth = 16;
  for (let i = 0; i < teeth; i++) { const a0 = i / teeth * Math.PI * 2, a1 = (i + 0.5) / teeth * Math.PI * 2; ctx.lineTo(Math.cos(a0) * R, Math.sin(a0) * R); ctx.lineTo(Math.cos(a1) * (R - 3.2), Math.sin(a1) * (R - 3.2)); }
  ctx.closePath();
  const sg = ctx.createRadialGradient(-3, -3, 1, 0, 0, R); sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.5, '#c2ccd6'); sg.addColorStop(1, '#6f7c89'); ctx.fillStyle = sg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0.3, 1.6); ctx.stroke();
  ctx.fillStyle = '#3a4450'; ctx.beginPath(); ctx.arc(0, 0, R * 0.3, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.arc(0, 0, R * 0.14, 0, 7); ctx.fill();
  ctx.restore();
}
function jagged(x1, y1, x2, y2, amp, segs) {
  const pts = [[x1, y1]]; const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  for (let i = 1; i < segs; i++) { const t = i / segs, o = (Math.random() - 0.5) * amp * 2 * Math.sin(Math.PI * t); pts.push([x1 + dx * t + nx * o, y1 + dy * t + ny * o]); }
  pts.push([x2, y2]); return pts;
}
function strokePts(pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); }
function drawWeaponFx() {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // cryo mist (normal blend, soft)
  for (const m of G.mist) {
    const k = m.t / m.max, a = (1 - k) * 0.8;
    const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r); g.addColorStop(0, `rgba(240,250,255,${a})`); g.addColorStop(0.6, `rgba(190,230,255,${a * 0.6})`); g.addColorStop(1, 'rgba(190,230,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
    if (Math.random() < 0.3) { ctx.fillStyle = `rgba(255,255,255,${1 - k})`; ctx.fillRect(m.x + rand(-m.r, m.r) * 0.6, m.y + rand(-m.r, m.r) * 0.6, 1.6, 1.6); }
  }
  // reflex hammer swings: motion-blur crescent + hammer head
  for (const s of G.swings) {
    const k = 1 - s.t / s.max, a0 = s.a - s.arc / 2 * s.dir, sweep = s.arc * s.dir * Math.min(1, k * 1.8), aNow = a0 + sweep;
    ctx.globalAlpha = (1 - k) * 0.85;
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const t0 = a0 + sweep * (i / steps), t1 = a0 + sweep * ((i + 1) / steps);
      ctx.strokeStyle = `rgba(150,175,205,${0.08 + 0.45 * (i / steps)})`; ctx.lineWidth = 6 + 18 * (i / steps);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.range * 0.78, Math.min(t0, t1), Math.max(t0, t1)); ctx.stroke();
    }
    ctx.globalAlpha = 1 - k * 0.6;
    ctx.save(); ctx.translate(s.x + Math.cos(aNow) * s.range * 0.78, s.y + Math.sin(aNow) * s.range * 0.78); ctx.rotate(aNow + Math.PI / 2);
    ctx.fillStyle = '#7a4f2a'; ctx.fillRect(-1.4, 0, 2.8, 20);                         // handle toward player
    ctx.fillStyle = lg(-9, 0, 9, 0, [[0, '#a5332b'], [0.5, '#d9534f'], [1, '#8f2a23']]);
    ctx.beginPath(); ctx.moveTo(-10, -3); ctx.lineTo(10, -4.5); ctx.quadraticCurveTo(12, 0, 10, 4.5); ctx.lineTo(-10, 3); ctx.quadraticCurveTo(-12, 0, -10, -3); ctx.fill(); // Taylor hammer head
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  // penlight beams
  for (const b of G.beams) {
    const k = b.t / b.max;
    ctx.strokeStyle = `rgba(255,190,40,${0.28 * k})`; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.strokeStyle = `rgba(255,214,90,${0.85 * k})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.95 * k})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    const g = ctx.createRadialGradient(b.x2, b.y2, 0, b.x2, b.y2, 16); g.addColorStop(0, `rgba(255,255,240,${k})`); g.addColorStop(0.35, `rgba(255,200,60,${0.7 * k})`); g.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x2, b.y2, 16, 0, 7); ctx.fill();
  }
  ctx.globalCompositeOperation = 'lighter';
  // defibrillator arcs
  for (const b of G.bolts) {
    const k = b.t / b.max;
    for (let i = 0; i < b.pts.length - 1; i++) {
      const A = b.pts[i], B = b.pts[i + 1];
      const main = jagged(A.x, A.y, B.x, B.y, 14, 9);
      ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = `rgba(40,120,255,${0.35 * k})`; ctx.lineWidth = 9; strokePts(main); ctx.strokeStyle = `rgba(30,110,240,${0.8 * k})`; ctx.lineWidth = 3.4; strokePts(main); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(170,225,255,${0.8 * k})`; ctx.lineWidth = 3; strokePts(main);
      ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 1.2; strokePts(main);
      if (!b.fizzle) for (let j = 0; j < 2; j++) { const m = main[1 + Math.floor(Math.random() * (main.length - 2))]; const br = jagged(m[0], m[1], m[0] + rand(-34, 34), m[1] + rand(-34, 34), 6, 4); ctx.strokeStyle = `rgba(170,225,255,${0.6 * k})`; ctx.lineWidth = 1; strokePts(br); }
    }
  }
  // muzzle flashes
  for (const f of G.flashes) {
    const W = WEAPONS[f.kind]; if (!W) continue;
    const k = f.t / 0.07, col = { penlight: '255,240,190', defib: '150,210,255', cryo: '210,240,255', castsaw: '255,200,120', syringe: '160,230,255', ultrasound: '160,215,255' }[f.kind] || '255,255,255';
    const R = (W.kind === 'melee' ? 0 : 14) * k; if (!R) continue;
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, R); g.addColorStop(0, `rgba(${col},${0.9 * k})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, R, 0, 7); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // impact sparks
  for (const s of G.sparks) {
    ctx.globalAlpha = Math.min(1, s.t * 5);
    ctx.strokeStyle = 'rgba(60,40,10,0.35)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.025, s.y - s.vy * 0.025); ctx.stroke();
    ctx.strokeStyle = s.color; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.025, s.y - s.vy * 0.025); ctx.stroke();
  }
  ctx.restore();
  // frost on slowed enemies
  for (const e of G.enemies) if (e.frostT > 0 && !e.dead) { ctx.fillStyle = `rgba(200,235,255,${0.25 * Math.min(1, e.frostT)})`; ctx.beginPath(); ctx.ellipse(e.x, e.y - 34, 14, 30, 0, 0, 7); ctx.fill(); }
}

// the weapon in the player's hand(s)
function drawHeldWeapons() {
  const P = G.player; if (!S.weapons) return;
  const a = aimAngle();
  S.weapons.forEach((id, slot) => {
    const h = { x: P.x + Math.cos(a) * 14 - Math.sin(a) * (slot ? -6 : 6) * 0.4, y: P.y - 30 + Math.sin(a) * 10 + (slot ? 3 : 0) };
    ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(a); if (Math.cos(a) < 0) ctx.scale(1.35, -1.35); else ctx.scale(1.35, 1.35);
    const sw = G.swings.length && id === 'hammer' ? 0 : 1;
    drawWeaponModel(id, sw);
    ctx.restore();
  });
}
function drawWeaponModel(id, visible) {
  if (!visible) return;
  switch (id) {
    case 'penlight': ctx.fillStyle = lg(0, -2, 0, 2, [[0, '#d7dde4'], [1, '#7f8a96']]); roundRect(-4, -2, 16, 4, 1.5); ctx.fill(); ctx.fillStyle = '#2b6cb0'; ctx.fillRect(2, -2.2, 1.4, 4.4); ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(12, 0, 1.8, 0, 7); ctx.fill(); break;
    case 'syringe': ctx.fillStyle = 'rgba(235,245,255,0.8)'; roundRect(-4, -2.6, 15, 5.2, 1); ctx.fill(); ctx.fillStyle = '#3fc6e6'; ctx.fillRect(3, -2, 7, 4); ctx.fillStyle = '#4a5563'; ctx.fillRect(-9, -0.8, 5, 1.6); ctx.strokeStyle = '#dfe6ee'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(18, 0); ctx.stroke(); break;
    case 'hammer': ctx.fillStyle = '#7a4f2a'; ctx.fillRect(-4, -1.2, 18, 2.4); ctx.fillStyle = '#c0453d'; ctx.beginPath(); ctx.ellipse(14, 0, 2.8, 7, 0, 0, 7); ctx.fill(); break;
    case 'scalpel': ctx.save(); ctx.translate(2, 0); drawScalpelShape(); ctx.restore(); break;
    case 'defib': ctx.fillStyle = '#e8b400'; roundRect(-2, -5, 12, 10, 2); ctx.fill(); ctx.fillStyle = '#2b2f36'; ctx.fillRect(10, -5.5, 3, 11); ctx.fillStyle = '#222'; ctx.fillRect(-6, -1.5, 5, 3); if (Math.random() < 0.3) { ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 0.8; strokePts(jagged(13, -4, 13, 4, 3, 4)); } break;
    case 'stapler': ctx.fillStyle = lg(0, -4, 0, 4, [[0, '#9aa6b2'], [1, '#4f5964']]); roundRect(-4, -3.5, 18, 7, 2); ctx.fill(); ctx.fillStyle = '#2f8f6a'; ctx.fillRect(-4, 2, 8, 5); break;
    case 'cryo': ctx.fillStyle = lg(0, -4, 0, 4, [[0, '#e9f4fb'], [1, '#8fb3c9']]); roundRect(-4, -4, 11, 8, 3); ctx.fill(); ctx.fillStyle = '#5b6b78'; ctx.fillRect(7, -1.5, 8, 3); ctx.fillStyle = '#1f6fb2'; ctx.fillRect(-2, -1, 7, 2); break;
    case 'pills': ctx.fillStyle = '#f39c12'; roundRect(-3, -4.5, 12, 9, 1.5); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(9, -5, 3, 10); ctx.fillStyle = '#fff'; ctx.fillRect(0, -2, 6, 4); break;
    case 'ultrasound': ctx.fillStyle = lg(0, -3, 0, 3, [[0, '#f2f4f7'], [1, '#aab4bf']]); roundRect(-5, -2.4, 13, 4.8, 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(10, 0, 3.4, 5.2, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#4b5563'; ctx.fillRect(-9, -0.6, 4, 1.2); break;
    case 'castsaw': ctx.fillStyle = '#3a6fb0'; roundRect(-5, -3.5, 14, 7, 2.5); ctx.fill(); drawSawBlade((G ? G.t : 0) * 40, 6, 12, 0); break;
  }
}
function weaponLine(id) { const W = WEAPONS[id]; return `${W.icon} ${W.name}`; }
