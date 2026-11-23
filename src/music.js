// ===================== RESIDENCY — ADAPTIVE MUSIC (procedural WebAudio) =====================
// Three original tracks that crossfade with the intensity of play:
//   calm   — light coffee-shop jazz (campus, hallways, between waves)
//   combat — driving minor-key pulse (waves of patients and staff)
//   boss   — choir, strings, brass and timpani for attending duels
'use strict';
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

const Music = {
  ctx: null, out: null, rev: null, noise: null, on: true, vol: 0.55, tracks: {}, mode: 'calm', timer: null, duck: 1,

  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = AC || new (window.AudioContext || window.webkitAudioContext)();
      AC = this.ctx;
    } catch (e) { return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(c.destination);
    this.out = c.createGain(); this.out.gain.value = this.on ? this.vol : 0; this.out.connect(comp);
    // reverb
    this.rev = c.createConvolver(); this.rev.buffer = this.impulse(2.8); const rg = c.createGain(); rg.gain.value = 0.5; this.rev.connect(rg); rg.connect(this.out);
    // shared noise
    this.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const nd = this.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    for (const [k, def] of Object.entries(TRACKS)) {
      const bus = c.createGain(); bus.gain.value = 0; bus.connect(this.out);
      const send = c.createGain(); send.gain.value = def.reverb; bus.connect(send); send.connect(this.rev);
      this.tracks[k] = { def, bus, target: 0, step: 0, next: 0, active: false };
    }
    this.timer = setInterval(() => this.tick(), 40);
    this.setMode(this.mode, true);
  },
  impulse(sec) {
    const c = this.ctx, len = c.sampleRate * sec, b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    return b;
  },
  setMode(mode, force) {
    if (!this.ctx) { this.mode = mode; return; }
    if (mode === this.mode && !force) return;
    this.mode = mode;
    const now = this.ctx.currentTime;
    for (const [k, t] of Object.entries(this.tracks)) {
      t.target = k === mode ? t.def.level : 0;
      t.bus.gain.cancelScheduledValues(now);
      t.bus.gain.setTargetAtTime(t.target * this.duck, now, k === mode ? (mode === 'boss' ? 0.35 : 0.9) : 0.6);
      if (k === mode && !t.active) { t.active = true; t.step = 0; t.next = now + 0.08; }
    }
  },
  setDuck(d) {
    if (!this.ctx || d === this.duck) return; this.duck = d;
    const now = this.ctx.currentTime;
    for (const t of Object.values(this.tracks)) t.bus.gain.setTargetAtTime(t.target * d, now, 0.3);
  },
  toggle() {
    this.on = !this.on;
    try { localStorage.setItem('residency_music', this.on ? '1' : '0'); } catch (e) {}
    if (this.out) this.out.gain.setTargetAtTime(this.on ? this.vol : 0, this.ctx.currentTime, 0.2);
    document.querySelectorAll('.music-label').forEach(el => el.textContent = this.on ? '♪ Music: on' : '♪ Music: off');
  },
  tick() {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    for (const t of Object.values(this.tracks)) {
      if (!t.active) continue;
      if (t.target === 0 && t.bus.gain.value < 0.002) { t.active = false; continue; }
      const def = t.def, stepDur = 60 / def.bpm / def.perBeat;
      while (t.next < c.currentTime + 0.18) {
        let time = t.next;
        if (def.swing && t.step % 2 === 1) time += stepDur * def.swing;
        try { def.play(this, t.bus, t.step, time, stepDur); } catch (e) { /* skip a note */ }
        t.next += stepDur; t.step++;
      }
    }
  },

  // ---------- instruments ----------
  env(g, t, a, peak, d, end) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  osc(type, f, t, dur, out) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(out); o.start(t); o.stop(t + dur + 0.05); return o; },
  ep(out, t, m, dur, v) { // electric piano
    const c = this.ctx, g = c.createGain(); g.connect(out); this.env(g, t, 0.006, v, dur);
    this.osc('sine', mtof(m), t, dur, g);
    const g2 = c.createGain(); g2.gain.value = 0.18; g2.connect(g); this.osc('sine', mtof(m) * 2, t, dur * 0.4, g2);
    const g3 = c.createGain(); g3.gain.value = 0.05; g3.connect(g); this.osc('triangle', mtof(m) * 3, t, 0.15, g3);
  },
  vibe(out, t, m, v) { const g = this.ctx.createGain(); g.connect(out); this.env(g, t, 0.004, v, 1.4); this.osc('sine', mtof(m), t, 1.5, g); const g2 = this.ctx.createGain(); g2.gain.value = 0.25; g2.connect(g); this.osc('sine', mtof(m) * 4, t, 0.3, g2); },
  bass(out, t, m, dur, v, type) {
    const c = this.ctx, f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = type === 'sawtooth' ? 520 : 700; f.connect(out);
    const g = c.createGain(); g.connect(f); this.env(g, t, 0.01, v, dur);
    this.osc(type || 'triangle', mtof(m), t, dur, g); this.osc('sine', mtof(m), t, dur, g);
  },
  noiseHit(out, t, type, freq, q, v, dur) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); s.connect(f); f.connect(g); g.connect(out); this.env(g, t, 0.002, v, dur);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  },
  kick(out, t, v) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(out);
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    this.env(g, t, 0.002, v, 0.32); o.start(t); o.stop(t + 0.4);
  },
  timpani(out, t, m, v) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.connect(g); g.connect(out);
    o.frequency.setValueAtTime(mtof(m) * 1.08, t); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.08);
    this.env(g, t, 0.004, v, 1.1); o.start(t); o.stop(t + 1.2);
    const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'triangle'; o2.frequency.value = mtof(m) * 1.5; o2.connect(g2); g2.connect(out); this.env(g2, t, 0.003, v * 0.25, 0.4); o2.start(t); o2.stop(t + 0.5);
    this.noiseHit(out, t, 'lowpass', 300, 1, v * 0.6, 0.12);
  },
  strings(out, t, m, dur, v, bright, attack) { // detuned saw ensemble
    const c = this.ctx, f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = bright || 1600; f.Q.value = 0.7; f.connect(out);
    const g = c.createGain(); g.connect(f);
    const a = attack || 0.01;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, t + Math.max(a, dur * 0.6)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    for (const det of [-9, 0, 8]) { const o = this.osc('sawtooth', mtof(m), t, dur + 0.15, g); o.detune.value = det; }
  },
  choir(out, t, notes, dur, v, attack) { // saw voices through "ah" formants
    const c = this.ctx, g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + attack); g.gain.setValueAtTime(v, t + Math.max(attack, dur * 0.7)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    const mix = c.createGain(); mix.gain.value = 1;
    for (const [fr, q, lv] of [[730, 7, 1], [1090, 8, 0.6], [2440, 9, 0.2]]) { const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fr; f.Q.value = q; const fg = c.createGain(); fg.gain.value = lv * 3; mix.connect(f); f.connect(fg); fg.connect(g); }
    g.connect(out);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.2; lg.gain.value = 6; lfo.connect(lg); lfo.start(t); lfo.stop(t + dur + 0.3);
    for (const m of notes) for (const det of [-7, 6]) { const o = this.osc('sawtooth', mtof(m), t, dur + 0.3, mix); o.detune.value = det; lg.connect(o.detune); }
  },
  brass(out, t, m, dur, v) {
    const c = this.ctx, f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(350, t); f.frequency.linearRampToValueAtTime(2600, t + 0.07); f.frequency.exponentialRampToValueAtTime(1100, t + dur);
    const g = c.createGain(); f.connect(g); g.connect(out);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.04); g.gain.setValueAtTime(v * 0.8, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
    for (const det of [-5, 5]) { const o = this.osc('sawtooth', mtof(m), t, dur + 0.2, f); o.detune.value = det; }
  },
  swell(out, t, dur, v) { const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise; s.loop = true; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000; const g = c.createGain(); s.connect(f); f.connect(g); g.connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6); s.start(t); s.stop(t + dur + 0.7); },
};

// ---------- TRACKS ----------
const COFFEE_PROG = [ // F major ii–V–I–vi with extensions
  { root: 43, chord: [58, 62, 65, 69] }, // Gm9
  { root: 36, chord: [58, 64, 69, 74] }, // C13
  { root: 41, chord: [57, 60, 64, 67] }, // Fmaj9
  { root: 38, chord: [60, 64, 65, 69] }, // Dm9
];
const PENTA = [72, 74, 77, 79, 81, 84, 86];
const BOSS_PROG = [
  { root: 38, chord: [62, 65, 69] }, { root: 38, chord: [62, 65, 69] }, { root: 34, chord: [58, 62, 65] }, { root: 33, chord: [61, 64, 69] },
  { root: 38, chord: [62, 65, 69] }, { root: 31, chord: [55, 58, 62] }, { root: 34, chord: [58, 62, 65] }, { root: 33, chord: [61, 64, 69] },
];
const BOSS_MELODY = [ // original theme in D harmonic minor: [bar, step, midi, lengthInSteps]
  [0, 0, 69, 3], [0, 3, 74, 3], [0, 6, 77, 2], [1, 0, 76, 2], [1, 2, 74, 2], [1, 4, 73, 4],
  [2, 0, 74, 3], [2, 3, 77, 3], [2, 6, 82, 2], [3, 0, 81, 4], [3, 4, 79, 2], [3, 6, 76, 2],
  [4, 0, 77, 2], [4, 2, 76, 2], [4, 4, 74, 4], [5, 0, 70, 3], [5, 3, 74, 3], [5, 6, 79, 2],
  [6, 0, 77, 3], [6, 3, 74, 3], [6, 6, 77, 2], [7, 0, 76, 4], [7, 4, 73, 4],
];
const COMBAT_PROG = [{ root: 38, chord: [62, 65, 69] }, { root: 34, chord: [58, 62, 65] }, { root: 31, chord: [55, 58, 62] }, { root: 33, chord: [57, 61, 64] }];

const TRACKS = {
  calm: { bpm: 84, perBeat: 2, swing: 0.33, level: 1.2, reverb: 0.35,
    play(M, out, step, t, sd) {
      const s = step % 8, bar = Math.floor(step / 8), P = COFFEE_PROG[bar % 4], NP = COFFEE_PROG[(bar + 1) % 4];
      if (s === 0) for (const m of P.chord) M.ep(out, t + Math.random() * 0.012, m, sd * 3.5, 0.06);
      if (s === 3 && Math.random() < 0.7) for (const m of P.chord.slice(1)) M.ep(out, t, m, sd * 1.2, 0.035);
      if (s === 6 && bar % 2 === 1) for (const m of P.chord) M.ep(out, t, m, sd * 1.8, 0.04);
      if (s % 2 === 0) { const walk = [P.root, P.root + pick([3, 4, 7]), P.root + 7, NP.root + pick([-1, 1])][s / 2]; M.bass(out, t, walk, sd * 1.8, 0.16); }
      if (s === 2 || s === 6) M.noiseHit(out, t, 'bandpass', 2600, 0.8, 0.05, 0.16); // brushes
      M.noiseHit(out, t, 'highpass', 8000, 1, s % 2 ? 0.012 : 0.022, 0.05);           // soft ride
      if (Math.random() < 0.22 && bar % 4 !== 3) M.vibe(out, t, pick(PENTA), 0.045);
    } },
  combat: { bpm: 126, perBeat: 4, swing: 0, level: 1.05, reverb: 0.18,
    play(M, out, step, t, sd) {
      const s = step % 16, bar = Math.floor(step / 16), P = COMBAT_PROG[bar % 4];
      if (s % 2 === 0) M.bass(out, t, P.root + (s % 8 === 6 ? 12 : 0), sd * 1.6, 0.17, 'sawtooth');
      if (s === 0 || s === 8 || (s === 10 && bar % 2)) M.kick(out, t, 0.45);
      if (s === 4 || s === 12) { M.noiseHit(out, t, 'bandpass', 1800, 0.9, 0.16, 0.14); M.noiseHit(out, t, 'lowpass', 400, 1, 0.08, 0.08); }
      if (s % 2 === 0) M.noiseHit(out, t, 'highpass', 7500, 1, s % 4 ? 0.025 : 0.04, 0.04);
      const arp = P.chord.concat(P.chord.map(m => m + 12)); M.strings(out, t, arp[(s * 3) % arp.length], sd * 0.7, 0.028, 2400);
      if (s === 8 && bar % 4 === 3) M.swell(out, t, sd * 8, 0.025);
      if (s === 0) M.strings(out, t, P.chord[0] - 12, sd * 15, 0.03, 900, 0.4);
    } },
  boss: { bpm: 150, perBeat: 2, swing: 0, level: 0.62, reverb: 0.5,
    play(M, out, step, t, sd) {
      const s = step % 8, bar = Math.floor(step / 8), b8 = bar % 8, cycle = Math.floor(bar / 8), P = BOSS_PROG[b8];
      // low strings ostinato
      const ost = [0, 0, 12, 0, 7, 0, 12, 7][s];
      M.strings(out, t, P.root + 12 + ost, sd * 0.85, 0.05, 1500);
      M.bass(out, t, P.root, sd * 0.9, 0.08, 'sawtooth');
      // timpani + roll into each phrase
      if (s === 0 || s === 3 || s === 6) M.timpani(out, t, P.root + (s === 3 ? 7 : 0), s === 0 ? 0.5 : 0.32);
      if (b8 % 4 === 3 && s >= 4) { M.timpani(out, t, P.root, 0.22); M.timpani(out, t + sd / 2, P.root, 0.26); }
      // syncopated choir stabs (the "duel" chant) + sustained choir pad
      if (s === 0 || s === 3 || s === 6) M.choir(out, t, P.chord, sd * (s === 6 ? 1.6 : 1.1), 0.05, 0.02);
      if (s === 0) M.choir(out, t, P.chord.map(m => m - 12), sd * 7.5, 0.035, 0.5);
      // brass on downbeats
      if (s === 0) { M.brass(out, t, P.chord[0] - 12, sd * 2.5, 0.07); M.brass(out, t, P.chord[2] - 12, sd * 2.5, 0.05); }
      // theme: high strings, doubled by brass on alternate cycles
      for (const [mb, ms, mm, ml] of BOSS_MELODY) if (mb === b8 && ms === s) {
        M.strings(out, t, mm, sd * ml * 0.95, 0.055, 3400, 0.03);
        if (cycle % 2 === 1) M.brass(out, t, mm - 12, sd * ml * 0.9, 0.05);
      }
      if (s === 0 && b8 === 7) M.swell(out, t, sd * 8, 0.05);
      if (s === 0 && b8 === 0) M.noiseHit(out, t, 'highpass', 4000, 0.5, 0.12, 1.6); // crash
    } },
};

function musicMode() {
  if (!G || !G.running) return 'calm';
  if (G.state === 'dead' || G.state === 'won') return 'calm';
  if (G.boss && !G.boss.dead) return 'boss';
  if (G.enemies.length > 0 || G.queue.length > 0) return 'combat';
  return 'calm';
}
try { Music.on = localStorage.getItem('residency_music') !== '0'; } catch (e) {}
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => Music.start(), { passive: true }));
setInterval(() => {
  const onTitle = !document.getElementById('title').classList.contains('hidden');
  Music.setMode(onTitle ? 'boss' : musicMode());
  Music.setDuck(onTitle ? 0.7 : G && (G.state === 'pause' || G.state === 'question') ? 0.45 : 1);
}, 250);
