// ===================== RESIDENCY — NAMED SAVE SLOTS, SCORE & LEADERBOARD =====================
'use strict';
const SLOTS_KEY = 'residency_saves_v2', BOARD_KEY = 'residency_board_v1', SEENQ_KEY = 'residency_seenq_v1';

const Saves = {
  read() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(SLOTS_KEY) || 'null'); } catch (e) {}
    if (!d || typeof d !== 'object' || !d.slots) d = { slots: {}, last: null };
    // migrate the old single-save format once
    try {
      const old = localStorage.getItem('residency_save_v1');
      if (old && !d.migrated) { const o = JSON.parse(old); if (o && o.name) { o.id = o.id || 's' + Date.now(); d.slots[o.id] = o; d.last = o.id; } d.migrated = true; this.write(d); }
    } catch (e) {}
    return d;
  },
  write(d) { try { localStorage.setItem(SLOTS_KEY, JSON.stringify(d)); return true; } catch (e) { return false; } },
  list() { const d = this.read(); return Object.values(d.slots).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)); },
  get(id) { return this.read().slots[id] || null; },
  last() { const d = this.read(); return (d.last && d.slots[d.last]) || this.list()[0] || null; },
  nameTaken(name, exceptId) { const n = name.trim().toLowerCase(); return this.list().some(s => s.name.trim().toLowerCase() === n && s.id !== exceptId); },
  put(save) {
    const d = this.read();
    save.id = save.id || ('s' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    save.savedAt = Date.now();
    d.slots[save.id] = save; d.last = save.id;
    return this.write(d);
  },
  remove(id) { const d = this.read(); delete d.slots[id]; if (d.last === id) d.last = null; this.write(d); },
};

// ---------- score ----------
function scoreOf(s) {
  if (!s) return 0;
  return Math.max(0, Math.round(
    (s.cleared || 0) * 1000 + (s.correct || 0) * 100 + (s.kills || 0) * 5 + (s.level || 1) * 50
    + (s.finished ? 5000 : 0) - (s.deaths || 0) * 100));
}

// ---------- leaderboard: this device always; shared across players on the Claude-hosted page ----------
const Board = {
  shared: null, uid: null, sharedRows: null, ready: false, sub: null,
  localRows() {
    let rows = {};
    try { rows = JSON.parse(localStorage.getItem(BOARD_KEY) || '{}') || {}; } catch (e) {}
    for (const s of Saves.list()) { const sc = scoreOf(s); const k = s.name.trim().toLowerCase(); if (!rows[k] || rows[k].score < sc) rows[k] = { name: s.name, score: sc, level: s.level, cleared: s.cleared, finished: !!s.finished }; }
    return Object.values(rows);
  },
  recordLocal(s) {
    let rows = {};
    try { rows = JSON.parse(localStorage.getItem(BOARD_KEY) || '{}') || {}; } catch (e) {}
    const k = s.name.trim().toLowerCase(), sc = scoreOf(s);
    if (!rows[k] || rows[k].score < sc) { rows[k] = { name: s.name, score: sc, level: s.level, cleared: s.cleared, finished: !!s.finished }; try { localStorage.setItem(BOARD_KEY, JSON.stringify(rows)); } catch (e) {} }
  },
  async init() {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      const db = await window.claude.use('db'); if (!db) return;
      const user = await window.claude.use('user');
      this.shared = db; this.uid = user ? await user.id() : null;
      const q = db.collection('leaderboard');
      const timer = setTimeout(() => { if (!this.sharedRows) this.sharedRows = []; UI.renderBoard && UI.renderBoard(); }, 10000);
      this.sub = q.onSnapshot(snap => {
        clearTimeout(timer);
        const rows = [];
        snap.forEach(doc => { const v = doc.data ? doc.data() : doc; if (v && typeof v.score === 'number' && typeof v.name === 'string') rows.push({ name: v.name.slice(0, 22), score: v.score, level: v.level | 0, cleared: v.cleared | 0, finished: !!v.finished }); });
        this.sharedRows = rows; UI.renderBoard && UI.renderBoard();
      }, () => { clearTimeout(timer); this.shared = null; UI.renderBoard && UI.renderBoard(); });
    } catch (e) { this.shared = null; }
  },
  lastPushed: 0,
  async pushShared(s) {
    if (!this.shared || !this.uid) return;
    const sc = scoreOf(s);
    const mine = (this.sharedMine || 0);
    if (sc <= mine || Date.now() - this.lastPushed < 4000) return;
    this.lastPushed = Date.now(); this.sharedMine = sc;
    try { await this.shared.collection('leaderboard').doc(this.uid).set({ name: s.name, score: sc, level: s.level, cleared: s.cleared, finished: !!s.finished, at: Date.now() }); } catch (e) { /* view-only viewers can't write */ }
  },
  top(n) {
    const rows = (this.shared && this.sharedRows) ? this.sharedRows : this.localRows();
    return rows.slice().sort((a, b) => b.score - a.score).slice(0, n);
  },
  label() { return this.shared && this.sharedRows ? 'All players' : 'This device'; },
};

// ---------- device-wide question rotation (new characters also get fresh questions) ----------
const SeenQ = {
  get() { try { return JSON.parse(localStorage.getItem(SEENQ_KEY) || '{}') || {}; } catch (e) { return {}; } },
  mark(key) { const m = this.get(); m[key] = 1; try { localStorage.setItem(SEENQ_KEY, JSON.stringify(m)); } catch (e) {} },
  clear(keys) { const m = this.get(); for (const k of keys) delete m[k]; try { localStorage.setItem(SEENQ_KEY, JSON.stringify(m)); } catch (e) {} },
};
