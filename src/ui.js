// ===================== RESIDENCY — UI =====================
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const UI = {
  panelTab: null, selected: null, fromPause: false,
  screens: ['#title', '#create', '#campus', '#hud-layer'],
  show(id) { for (const s of this.screens) $(s).classList.toggle('hidden', s !== id); $('#music-btn').classList.toggle('hidden', id === '#hud-layer'); },
  modal(html) { $('#modal').innerHTML = `<div class="modal-card">${html}</div>`; $('#modal').classList.remove('hidden'); },
  closeModal() { $('#modal').classList.add('hidden'); $('#modal').innerHTML = ''; },

  // ---------- TITLE ----------
  showTitle() {
    if (G) G.running = false;
    const sv = loadGame();
    $('#title-continue').classList.toggle('hidden', !sv);
    if (sv) $('#title-continue').textContent = `Continue — ${sv.name} (Lv ${sv.level})`;
    this.show('#title');
    TitleFX.start();
  },

  // ---------- CREATE ----------
  cr: { gender: 'f', skin: '#e0ac85', hair: '#2b1b10', scrub: '#2a7fa8', hs: 'ponytail' },
  showCreate() {
    this.show('#create');
    this.cr.last = pick(['Chen', 'Patel', 'Garcia', 'Nguyen', 'Johnson', 'Kim', 'Okoye', 'Silva', 'Wu']);
    $('#cr-name').value = this.autoName = pick(this.cr.gender === 'f' ? FIRST_NAMES_F : FIRST_NAMES_M) + ' ' + this.cr.last;
    this.renderCreate();
  },
  renderCreate() {
    const c = this.cr;
    const sw = (arr, key) => arr.map(v => `<button class="swatch ${c[key] === v ? 'on' : ''}" style="background:${v}" data-k="${key}" data-v="${v}" aria-label="${v}"></button>`).join('');
    $('#cr-gender').innerHTML = ['f', 'm'].map(g => `<button class="seg ${c.gender === g ? 'on' : ''}" data-k="gender" data-v="${g}">${g === 'f' ? '♀ Female' : '♂ Male'}</button>`).join('');
    $('#cr-skin').innerHTML = sw(['#ffdbac', '#f1c9a5', '#e0ac85', '#c68642', '#8d5524', '#5c3a1e'], 'skin');
    $('#cr-hair').innerHTML = sw(['#111111', '#2b1b10', '#5a3a20', '#a0703a', '#d9b56a', '#8a8a8a', '#a8322a'], 'hair');
    $('#cr-style').innerHTML = HAIR_STYLES[c.gender].map(([k, l]) => `<button class="seg sm ${c.hs === k ? 'on' : ''}" data-k="hs" data-v="${k}">${l}</button>`).join('');
    $('#cr-scrub').innerHTML = sw(['#2a7fa8', '#1f3a6b', '#2b8a5e', '#6a3fa0', '#a83a5a', '#3a4450', '#c46a2a'], 'scrub');
    document.querySelectorAll('#create [data-k]').forEach(b => b.onclick = () => {
      c[b.dataset.k] = b.dataset.v;
      if (b.dataset.k === 'gender') c.hs = c.gender === 'f' ? 'ponytail' : 'short';
      if (b.dataset.k === 'gender' && $('#cr-name').value === this.autoName) $('#cr-name').value = this.autoName = pick(c.gender === 'f' ? FIRST_NAMES_F : FIRST_NAMES_M) + ' ' + c.last;
      this.renderCreate(); });
    previewChar($('#cr-preview'), { top: c.scrub, bottom: shade(c.scrub, -0.1), skin: c.skin, hair: c.hair, female: c.gender === 'f', style: c.hs, steth: '#2a2d33', shoe: '#eef1f4', eye: '#3b2a1e' });
  },
  finishCreate() {
    const name = ($('#cr-name').value || '').trim().slice(0, 22) || 'Student Doctor';
    const c = this.cr;
    S = newSave(name, c.gender, c.skin, c.scrub, c.hair); S.hairStyle = c.hs;
    S.equip.shirt = genItem('shirt', 1, 0); S.equip.shirt.name = 'Student Scrub Top'; S.equip.shirt.base = 'Student Scrub Top';
    S.equip.stethoscope = genItem('stethoscope', 1, 0); S.equip.stethoscope.name = 'Disposable Stethoscope'; S.equip.stethoscope.base = 'Disposable Stethoscope';
    restockShop(); saveGame();
    this.showCampus();
    this.modal(`<h2>Welcome, Student Doctor ${esc(name)}</h2>
      <p>Your path: <b>Lecture Hall → Pediatrics → Psychiatry → Family Medicine →</b> ten more rotations in a random order <b>→ Neurosurgery</b>.</p>
      <ul class="tips"><li><b>WASD</b> to move, <b>hold left mouse</b> (or Space) to attack, <b>1–4</b> skills, <b>Q</b> coffee.</li>
      <li><b>Money 💵</b> buys gear and coffee. <b>Brain Power 🧠</b> buys talent ranks and skills.</li>
      <li>You earn one talent rank per level. At the level cap (${MAX_LEVEL}) you can complete exactly two of the four trees.</li>
      <li>Attendings will stop and quiz you (they call it "pimping"). Answer right to stun them.</li></ul>
      <p class="muted">You start with ${S.bp} Brain Power, enough for your first talent rank. Press <b>Talents</b>.</p>
      <div class="weapon-reveal"><div class="muted small">YOUR RANDOM STARTING WEAPON</div><div class="wr-name">${weaponLine(S.weapons[0])}</div><div class="muted small">${WEAPONS[S.weapons[0]].desc} You'll get a second random weapon at level ${MAX_LEVEL}.</div></div>
      <div class="row end"><button class="btn primary" onclick="UI.closeModal()">Let's go</button></div>`);
  },

  // ---------- CAMPUS ----------
  showCampus() {
    if (G) { G.running = false; }
    G = null;
    this.closeModal();
    this.show('#campus');
    $('#cp-name').textContent = (S.finished ? 'Dr. ' : 'Student Doctor ') + S.name;
    ensureWeapons();
    $('#cp-sub').textContent = `Level ${S.level}${S.level >= MAX_LEVEL ? ' (MAX)' : ''} • ${S.cleared}/${S.order.length} rotations complete • ${S.weapons.map(weaponLine).join(' + ')}`;
    $('#cp-money').textContent = '$ ' + fmt(S.money);
    $('#cp-bp').textContent = '🧠 ' + fmt(S.bp);
    $('#cp-xp').style.width = (S.level >= MAX_LEVEL ? 100 : S.xp / xpNeeded(S.level) * 100) + '%';
    const unspent = Math.min(S.level - ranksSpent(), 99);
    $('#btn-talents').innerHTML = 'Talents' + (unspent > 0 ? ` <span class="pip">${unspent}</span>` : '');
    previewChar($('#cp-avatar'), playerLook());
    // map
    const nodes = S.order.map((k, i) => {
      const Z = zoneInfo(i);
      const state = i < S.cleared ? 'done' : i === S.cleared ? 'next' : 'locked';
      const revealed = state !== 'locked' || i <= 3 || Z.final;
      const setting = { classroom: 'Classroom', clinic: 'Clinic', hospital: 'Hospital', or: 'Hospital OR' }[Z.setting];
      return `<button class="node ${state} ${Z.final ? 'final' : ''}" data-i="${i}" ${state === 'locked' ? 'disabled' : ''} style="--acc:${Z.accent}">
        <span class="n-idx">${i === 0 ? 'MS1' : 'R' + i}</span>
        <span class="n-title">${revealed ? esc(Z.boss ? Z.name : Z.place) : 'Unknown rotation'}</span>
        <span class="n-sub">${revealed ? (Z.boss ? esc(Z.boss) + ' • ' + setting : 'Orientation • ' + setting) : 'Order revealed as you progress'}</span>
        <span class="n-state">${state === 'done' ? '✓ Cleared — replay' : state === 'next' ? '▶ Enter' : '🔒'}</span></button>`;
    }).join('');
    $('#map').innerHTML = nodes;
    document.querySelectorAll('#map .node:not([disabled])').forEach(b => b.onclick = () => this.enterZone(+b.dataset.i));
    const nx = $('#map .node.next'); if (nx) nx.scrollIntoView({ block: 'nearest', inline: 'center' });
  },
  enterZone(i) {
    const Z = zoneInfo(i);
    this.modal(`<h2>${esc(Z.boss ? Z.name + ' Rotation' : Z.place)}</h2>
      <p>${esc(Z.place)} • ${Z.boss ? 'Attending: <b>' + esc(Z.boss) + '</b>' : 'Survive orientation week to unlock clinical rotations.'}</p>
      <p class="muted">Three waves of ${Z.boss ? 'patients and staff, then the attending' : 'standardized patients, classmates and lab staff'}. Recommended level: ${Math.max(1, Math.round(i * 2))}+.</p>
      ${S.coffee < 5 ? `<p class="muted">You have ${S.coffee} coffee. Stock up at the shop first?</p>` : ''}
      <div class="row end"><button class="btn" onclick="UI.closeModal()">Not yet</button><button class="btn primary" onclick="UI.closeModal();startZone(${i})">Begin shift</button></div>`);
  },
  showGame() { this.show('#hud-layer'); this.closeModal(); this.closePanel(true); },

  // ---------- PAUSE / OUTCOMES ----------
  pause() {
    this.modal(`<h2>Paused</h2><p class="muted">${esc(G.zone.place)} — wave ${G.wave + 1}/${G.waves.length}</p>
      <div class="col">
        <button class="btn primary" onclick="UI.closeModal();resumeGame()">Resume</button>
        <button class="btn" onclick="UI.openPanel('gear')">Character & Gear</button>
        <button class="btn" onclick="UI.openPanel('talents')">Talents</button>
        <button class="btn music-label" onclick="Music.toggle()">${Music.on ? '♪ Music: on' : '♪ Music: off'}</button>
        <button class="btn" onclick="UI.toggleMute(this)">${muted ? 'Sound effects: off' : 'Sound effects: on'}</button>
        <button class="btn danger" onclick="saveGame();UI.showCampus()">Leave rotation (keep loot)</button>
      </div>`);
  },
  toggleMute(b) { muted = !muted; b.textContent = muted ? 'Sound effects: off' : 'Sound effects: on'; },
  askQuestion(boss, q, time, ruleout, done) {
    const correct = q.a[0];
    let opts = shuffle(q.a);
    const wrong = shuffle(q.a.slice(1)).slice(0, ruleout);
    let left = time, answered = false;
    const finish = (choice) => {
      if (answered) return; answered = true; clearInterval(timer);
      const ok = choice === correct;
      document.querySelectorAll('.qopt').forEach(b => { b.disabled = true; if (b.dataset.a === correct) b.classList.add('right'); else if (b.dataset.a === choice) b.classList.add('wrong'); });
      $('#q-result').innerHTML = `<div class="${ok ? 'good' : 'bad'}"><b>${ok ? 'Correct!' : choice === null ? "Time's up!" : 'Incorrect.'}</b> ${esc(q.why)}</div>
        <div class="row end"><button class="btn primary" id="q-cont">${ok ? 'Continue (attending stunned)' : 'Continue'}</button></div>`;
      $('#q-cont').onclick = () => { this.closeModal(); done(ok); };
      $('#q-cont').focus();
    };
    this.modal(`<div class="q-head" style="--acc:${boss.spec.accent}"><span class="q-badge">PIMPED</span><b>${esc(boss.def.name)}</b> <span class="muted">— ${esc(boss.spec.name)}</span></div>
      <p class="q-text">"${esc(q.q)}"</p>
      <div class="q-timer"><div id="q-bar"></div></div>
      <div class="q-opts">${opts.map((o, i) => `<button class="qopt ${wrong.includes(o) ? 'ruled' : ''}" data-a="${esc(o)}" ${wrong.includes(o) ? 'disabled' : ''}><span class="k">${'ABCD'[i]}</span>${esc(o)}${wrong.includes(o) ? ' <em>(ruled out)</em>' : ''}</button>`).join('')}</div>
      <div id="q-result"></div>`);
    document.querySelectorAll('.qopt').forEach(b => b.onclick = () => finish(b.dataset.a));
    const timer = setInterval(() => { left -= 0.1; const bar = $('#q-bar'); if (bar) bar.style.width = Math.max(0, left / time * 100) + '%'; if (left <= 0) finish(null); }, 100);
  },
  zoneComplete(Z, earned, first, finale) {
    const items = earned.items.map(it => `<li style="color:${TIERS[it.tier].color}">${esc(it.name)} <span class="muted">(${TIERS[it.tier].name} ${SLOT_NAMES[it.type] || 'Ring'})</span></li>`).join('') || '<li class="muted">No gear this time</li>';
    const pct = S.asked ? Math.round(S.correct / S.asked * 100) : 0;
    this.modal(finale ? `<h1 class="finale">Board Certified</h1>
      <p>You defeated <b>${esc(Z.boss)}</b>, the Neurosurgery attending, and finished training.</p>
      <p>Congratulations, <b>Dr. ${esc(S.name)}</b>. Pimping record: ${S.correct}/${S.asked} (${pct}%). Shifts lost: ${S.deaths}.</p>
      <p class="muted">Your character stays saved. Replay any rotation to farm Legendary gear and finish your two talent trees.</p>
      ${this.rewardsHtml(earned, items)}
      <div class="row end"><button class="btn primary" onclick="UI.showCampus()">Return to campus</button></div>`
      : `<h2>${Z.boss ? 'Rotation complete — ' + esc(Z.name) : 'Orientation complete'}</h2>
      ${Z.boss ? `<p>${esc(Z.boss)} signs your evaluation: <i>"${pick(['Meets expectations. Read more.', 'Strong fund of knowledge.', 'Would rank to match.', 'Good bedside manner, work on efficiency.', 'Exceeds expectations.'])}"</i></p>` : '<p>Clinical rotations are now open.</p>'}
      ${first && S.cleared < S.order.length ? `<p>Next up: <b>${esc(zoneInfo(S.cleared).boss ? zoneInfo(S.cleared).name : '')}</b></p>` : ''}
      ${this.rewardsHtml(earned, items)}
      <p class="muted">The shop has restocked.</p>
      <div class="row end"><button class="btn primary" onclick="UI.showCampus()">Return to campus</button></div>`);
  },
  rewardsHtml(e, items) {
    return `<div class="rewards"><div><span>Money</span><b class="gold">+$${fmt(e.money)}</b></div><div><span>Brain Power</span><b class="bp">+${fmt(e.bp)}</b></div><div><span>Experience</span><b>+${fmt(e.xp)}</b></div></div><ul class="loot">${items}</ul>`;
  },
  died(Z, lost) {
    this.modal(`<h2>You've been sent home to rest</h2><p>The ${esc(Z.place)} was too much this shift. You lost <b>$${fmt(lost)}</b> on takeout and a cab ride home.</p>
      <p class="muted">Tips: drink coffee (Q) below half health, upgrade gear at the shop, and spend Brain Power in Bedside Manner if you keep running out of health.</p>
      <div class="row end"><button class="btn primary" onclick="UI.showCampus()">Back to campus</button></div>`);
  },

  // ---------- PANELS ----------
  openPanel(tab) {
    this.panelTab = tab; this.selected = null;
    this.fromPause = !!(G && G.state === 'pause');
    if (this.fromPause) this.closeModal();
    $('#panel').classList.remove('hidden');
    this.renderPanel();
  },
  closePanel(silent) {
    $('#panel').classList.add('hidden');
    if (silent) return;
    if (this.fromPause && G && G.state === 'pause') { this.fromPause = false; resumeGame(); }
    else if (!G) this.showCampus();
    saveGame();
  },
  renderPanel() {
    const tabs = [['gear', 'Character & Gear'], ['talents', 'Talents'], ...(G ? [] : [['shop', 'Hospital Supply Shop']]), ['guide', 'Stat Guide']];
    $('#panel-tabs').innerHTML = tabs.map(([k, l]) => `<button class="tab ${this.panelTab === k ? 'on' : ''}" onclick="UI.panelTab='${k}';UI.selected=null;UI.renderPanel()">${l}</button>`).join('')
      + `<span class="grow"></span><span class="cur gold">$ ${fmt(S.money)}</span><span class="cur bp">🧠 ${fmt(S.bp)}</span><button class="btn" onclick="UI.closePanel()">Close ✕</button>`;
    const body = $('#panel-body');
    if (this.panelTab === 'gear') body.innerHTML = this.gearHtml();
    if (this.panelTab === 'talents') body.innerHTML = this.talentHtml();
    if (this.panelTab === 'shop') body.innerHTML = this.shopHtml();
    if (this.panelTab === 'guide') body.innerHTML = this.guideHtml();
    if (this.panelTab === 'gear') previewChar($('#gear-avatar'), playerLook());
  },
  itemCard(it, extra) {
    const t = TIERS[it.tier];
    const typeName = it.type === 'ring' ? 'Ring (left or right)' : SLOT_NAMES[it.type];
    return `<div class="icard" style="--tc:${t.color}"><div class="iname">${esc(it.name)}</div>
      <div class="imeta">${t.name} ${typeName} • Item level ${it.ilvl}</div>
      <ul class="istats">${Object.entries(it.stats).map(([k, v]) => `<li title="${esc(STAT_INFO[k].does)}">+${v} ${STATS[k].name} <span class="eff">${STAT_INFO[k].effect(v)}</span></li>`).join('')}</ul>${extra || ''}</div>`;
  },
  gearHtml() {
    const st = calcStats();
    const sel = this.selected;
    const slotBox = s => { const it = S.equip[s]; return `<button class="slot ${sel && sel.slot === s ? 'sel' : ''}" style="--tc:${it ? TIERS[it.tier].color : '#3a4656'}" onclick="UI.selectSlot('${s}')"><span class="sl">${SLOT_NAMES[s]}</span><span class="sn">${it ? esc(it.name) : '— empty —'}</span></button>`; };
    let detail = '<p class="muted">Select an equipped slot or an item in your bag.</p>';
    if (sel && sel.slot && S.equip[sel.slot]) detail = this.itemCard(S.equip[sel.slot], `<div class="row"><button class="btn" onclick="UI.unequip('${sel.slot}')">Unequip</button></div>`);
    if (sel && sel.uid) {
      const it = S.inv.find(x => x.uid === sel.uid);
      if (it) {
        const T = ITEM_TYPES[it.type];
        const btns = T.slots.map(s => `<button class="btn primary" onclick="UI.equip(${it.uid},'${s}')">Equip${T.slots.length > 1 ? ' ' + SLOT_NAMES[s] : ''}</button>`).join('');
        const cmp = T.slots.map(s => S.equip[s] ? `<div class="cmp"><div class="muted small">Currently in ${SLOT_NAMES[s]}:</div>${this.itemCard(S.equip[s])}</div>` : '').join('');
        detail = this.itemCard(it, `<div class="row">${btns}<button class="btn" onclick="UI.sell(${it.uid})">Sell $${Math.round(it.price * 0.25)}</button></div>`) + cmp;
      }
    }
    const inv = S.inv.slice().sort((a, b) => b.tier - a.tier || b.ilvl - a.ilvl).map(it => `<button class="bagitem ${sel && sel.uid === it.uid ? 'sel' : ''}" style="--tc:${TIERS[it.tier].color}" onclick="UI.selectItem(${it.uid})"><span>${esc(it.name)}</span><small>${it.type === 'ring' ? 'Ring' : SLOT_NAMES[it.type]} • i${it.ilvl}</small></button>`).join('') || '<p class="muted">Your bag is empty. Defeat enemies or visit the shop.</p>';
    const row = (l, v) => `<div class="srow"><span>${l}</span><b>${v}</b></div>`;
    const g = st.gear;
    return `<div class="gear-grid">
      <div class="paper"><canvas id="gear-avatar" width="160" height="200"></canvas>
        <div class="slots">${SLOTS.map(slotBox).join('')}</div></div>
      <div class="detail">${detail}</div>
      <div class="bag"><h3>Bag (${S.inv.length}/40) ${S.inv.some(i => i.tier === 0) ? `<button class="btn small" onclick="UI.sellNormals()">Sell all Normal</button>` : ''}</h3><div class="baglist">${inv}</div></div>
      <div class="sheet"><h3>Character sheet</h3>
        ${row('Level', S.level + (S.level >= MAX_LEVEL ? ' (max)' : ` (${fmt(S.xp)}/${fmt(xpNeeded(S.level))} XP)`))}${row('Max HP', fmt(st.maxHp))}${S.weapons.map((id, i) => row(i ? 'Second weapon' : 'Primary weapon', `${weaponLine(id)}`) + row('&nbsp;&nbsp;Damage per hit / attacks per sec', `${fmt(st.baseDmg * st.dmgMult * st.basicMult * WEAPONS[id].dmg * (WEAPONS[id].kind === 'proj' ? 1 : 1 + 0.2 * st.extraProj))} / ${(WEAPONS[id].rate * st.atkRate / 3).toFixed(1)}`)).join('')}${S.weapons.length < 2 ? row('Second weapon', `Unlocks at level ${MAX_LEVEL}`) : ''}
        ${row('Critical chance', Math.round(st.crit * 100) + '%')}${row('Critical damage', Math.round(st.critDmg * 100) + '%')}${row('Attacks per second', st.atkRate.toFixed(2))}
        ${row('Cooldown reduction', Math.round(st.cdr * 100) + '%')}${row('Damage reduction', Math.round(st.dr * 100) + '%')}${row('Move speed', Math.round(st.move))}
        ${row('Money found', '+' + Math.round((st.moneyMult - 1) * 100) + '%')}${row('HP regen / sec', st.regen.toFixed(1))}${row('Coffee', S.coffee + ' / 5')}
        <h4>Gear stat totals <button class="btn small" onclick="UI.panelTab='guide';UI.renderPanel()">What do these do?</button></h4><div class="stat-chips">${STAT_KEYS.map(k => `<span title="${esc(STAT_INFO[k].does)}">${STATS[k].name} <b>${g[k]}</b>${g[k] ? ` <i>${STAT_INFO[k].effect(g[k])}</i>` : ''}</span>`).join('')}</div></div>
    </div>`;
  },
  selectSlot(s) { this.selected = { slot: s }; this.renderPanel(); },
  selectItem(uid) { this.selected = { uid }; this.renderPanel(); },
  equip(uid, slot) {
    const i = S.inv.findIndex(x => x.uid === uid); if (i < 0) return;
    const it = S.inv.splice(i, 1)[0];
    if (S.equip[slot]) S.inv.push(S.equip[slot]);
    S.equip[slot] = it; this.selected = { slot }; this.afterGearChange();
  },
  unequip(slot) { if (S.inv.length >= 40) return; S.inv.push(S.equip[slot]); S.equip[slot] = null; this.selected = null; this.afterGearChange(); },
  sell(uid) { const i = S.inv.findIndex(x => x.uid === uid); if (i < 0) return; S.money += Math.round(S.inv[i].price * 0.25); S.inv.splice(i, 1); this.selected = null; this.afterGearChange(); },
  sellNormals() { S.inv = S.inv.filter(it => { if (it.tier === 0) { S.money += Math.round(it.price * 0.25); return false; } return true; }); this.selected = null; this.afterGearChange(); },
  afterGearChange() { if (G) { G.stats = calcStats(); G.player.hp = Math.min(G.player.hp, G.stats.maxHp); } saveGame(); this.renderPanel(); },

  talentHtml() {
    const spent = ranksSpent(), cap = S.level;
    const trees = TREES.map(t => {
      const ts = treeSpent(t.id);
      const rows = [0, 1, 2, 3].map(r => {
        const locked = ts < ROW_REQ[r];
        const nodes = t.nodes.filter(n => n.row === r).map(n => {
          const rk = tr(n.id), maxed = rk >= n.max, cost = ROW_COST[r];
          const can = !locked && !maxed && S.bp >= cost && spent < cap;
          const why = maxed ? 'Maxed' : locked ? `Needs ${ROW_REQ[r]} ranks in ${t.name}` : spent >= cap ? 'Level up for more ranks' : S.bp < cost ? `Need ${cost} 🧠` : `Learn — ${cost} 🧠`;
          const slotted = n.active && rk > 0 ? S.slotted.includes(n.id) : false;
          return `<div class="tnode ${n.active ? 'active' : ''} ${rk ? 'has' : ''} ${locked ? 'locked' : ''}" style="--tc:${t.color}">
            <div class="tn-top"><b>${n.active ? ACTIVE_SKILLS[n.id].icon + ' ' : ''}${esc(n.name)}</b><span class="rk">${rk}/${n.max}</span></div>
            <div class="tn-desc">${esc(n.desc(Math.max(1, rk)))}</div>
            <div class="row"><button class="btn small ${can ? 'primary' : ''}" ${can ? '' : 'disabled'} onclick="UI.buyTalent('${n.id}')">${why}</button>
            ${n.active && rk ? `<button class="btn small ${slotted ? 'on' : ''}" onclick="UI.toggleSlot('${n.id}')">${slotted ? 'On hotbar ' + (S.slotted.indexOf(n.id) + 1) : 'Add to hotbar'}</button>` : ''}</div></div>`;
        }).join('');
        return `<div class="trow"><div class="treq">${r ? `Row ${r + 1} · ${ROW_REQ[r]} ranks` : 'Row 1'}</div>${nodes}</div>`;
      }).join('');
      return `<div class="tree ${ts >= TREE_POINTS ? 'complete' : ''}" style="--tc:${t.color}"><div class="th"><span class="ti">${t.icon}</span><div><b>${t.name}</b><div class="muted small">${esc(t.blurb)}</div></div><span class="tpts">${ts}/${TREE_POINTS}</span></div>${rows}</div>`;
    }).join('');
    const respec = 40 * S.level;
    return `<div class="talent-head"><div><b>Talent ranks: ${spent} / ${cap}</b> <span class="muted">(1 rank per level, max ${MAX_LEVEL} — enough to complete 2 of 4 trees)</span></div>
      <div class="muted small">Hotbar: ${S.slotted.length ? S.slotted.map((id, i) => `${i + 1}. ${ACTIVE_SKILLS[id].name}`).join(' · ') : 'no active skills yet — they unlock in row 2 and row 4 of each tree'}</div>
      ${spent ? `<button class="btn small danger" onclick="UI.respec()" ${S.money < respec ? 'disabled' : ''}>Unlearn all talents ($${fmt(respec)}, refunds Brain Power)</button>` : ''}</div>
      <div class="trees">${trees}</div>`;
  },
  buyTalent(id) {
    const t = TREES.find(t => t.nodes.some(n => n.id === id)), n = t.nodes.find(n => n.id === id);
    const cost = ROW_COST[n.row];
    if (tr(id) >= n.max || treeSpent(t.id) < ROW_REQ[n.row] || S.bp < cost || ranksSpent() >= S.level) return;
    S.bp -= cost; S.talents[id] = tr(id) + 1;
    if (n.active && S.slotted.length < 4 && !S.slotted.includes(id)) S.slotted.push(id);
    if (G) { G.stats = calcStats(); }
    saveGame(); this.renderPanel();
  },
  toggleSlot(id) {
    const i = S.slotted.indexOf(id);
    if (i >= 0) S.slotted.splice(i, 1); else if (S.slotted.length < 4) S.slotted.push(id); else { S.slotted.shift(); S.slotted.push(id); }
    if (G) G.player.cds = [0, 0, 0, 0];
    saveGame(); this.renderPanel();
  },
  respec() {
    const cost = 40 * S.level; if (S.money < cost) return;
    let refund = 0;
    for (const t of TREES) for (const n of t.nodes) refund += tr(n.id) * ROW_COST[n.row];
    S.money -= cost; S.bp += refund; S.talents = {}; S.slotted = [];
    if (G) G.stats = calcStats();
    saveGame(); this.renderPanel();
  },

  shopHtml() {
    const stock = S.shop.map((it, i) => this.itemCard(it, `<div class="row"><b class="gold">$${fmt(it.price)}</b><button class="btn small primary" ${S.money < it.price || S.inv.length >= 40 ? 'disabled' : ''} onclick="UI.buy(${i})">Buy</button></div>`)).join('');
    const c = CONSUMABLES[0];
    const sell = S.inv.slice().sort((a, b) => a.tier - b.tier).map(it => `<div class="sellrow" style="--tc:${TIERS[it.tier].color}"><span>${esc(it.name)}</span><button class="btn small" onclick="UI.sell(${it.uid})">Sell $${Math.round(it.price * 0.25)}</button></div>`).join('') || '<p class="muted">Nothing to sell.</p>';
    return `<div class="shop">
      <div class="shop-main"><div class="shop-head"><h3>Medical supply — ${S.shop.length} items in stock</h3><span class="grow"></span>
          <button class="btn small" onclick="UI.panelTab='guide';UI.renderPanel()">Stat guide</button>
          <button class="btn small" ${S.money < shopRestockCost() ? 'disabled' : ''} onclick="UI.restock()">Restock now ($${fmt(shopRestockCost())})</button></div>
        <p class="muted small">New random stock after every rotation. Each stock holds at most <b style="color:${TIERS[3].color}">1 Legendary</b>, <b style="color:${TIERS[2].color}">2 Rare</b> and <b style="color:${TIERS[1].color}">2 Magic</b>; everything else is <b>Normal</b>.</p>
        <div class="cons"><div><b>☕ ${c.name}</b><div class="muted small">${c.desc}</div></div><span>You have ${S.coffee}/5</span><b class="gold">$${c.price}</b>
          <button class="btn small primary" ${S.money < c.price || S.coffee >= 5 ? 'disabled' : ''} onclick="UI.buyCoffee()">Buy</button></div>
        <div class="stock">${stock}</div></div>
      <div class="shop-sell"><h3>Sell gear (25% value)</h3>${sell}</div></div>`;
  },
  restock() { const c = shopRestockCost(); if (S.money < c) return; S.money -= c; restockShop(); saveGame(); this.renderPanel(); },
  guideHtml() {
    const st = calcStats(), g = st.gear;
    const rows = STAT_KEYS.map(k => `<tr><td><b>${STATS[k].name}</b></td><td>${esc(STAT_INFO[k].does)}</td><td class="nowrap">${esc(STATS[k].desc)}</td><td>${esc(STAT_INFO[k].cap)}</td><td class="muted">${esc(STAT_INFO[k].talents)}</td><td class="nowrap"><b>${g[k]}</b>${g[k] ? ' → ' + STAT_INFO[k].effect(g[k]) : ''}</td></tr>`).join('');
    const total = TIERS.reduce((a, t) => a + t.weight, 0);
    const tiers = TIERS.map(t => `<tr><td><b style="color:${t.color}">${t.name}</b></td><td>${t.weight}%</td><td>${[2, 3, 4, 5][TIERS.indexOf(t)]} stats, ×${t.mult} strength</td><td>×${t.price} price</td></tr>`).join('');
    return `<div class="guide">
      <h3>Stat key</h3><p class="muted small">Gear rolls random stats by rarity: Normal 2, Magic 3, Rare 4, Legendary 5. Hover any stat in the game to see this again.</p>
      <div class="tablewrap"><table class="gtable"><thead><tr><th>Stat</th><th>What it does</th><th>Per point</th><th>Cap</th><th>Talents that stack with it</th><th>You have</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="guide-2">
        <div><h3>Item rarity</h3><div class="tablewrap"><table class="gtable"><thead><tr><th>Tier</th><th>Drop chance</th><th>Stats</th><th>Value</th></tr></thead><tbody>${tiers}</tbody></table></div>
          <p class="muted small">Applies to enemy drops and boss rewards. The shop also caps each restock at 1 Legendary, 2 Rare and 2 Magic. The four odds add up to ${total}%, so they're used as relative weights (Normal ≈ ${(73 / total * 100).toFixed(1)}% in practice). Bosses drop 3 items, elites (attorneys) drop gear often, and anyone else has an 8% chance. Higher item levels have larger stat numbers.</p></div>
        <div><h3>Base character values</h3><ul class="tips small">
          <li>Health: 100 + 12 per level.</li><li>Base damage: 10 + 2.2 per level, multiplied by your weapon (10 weapons, one random at the start; a second random weapon at level 30).</li>
          <li>Critical chance 5%, critical damage 150%.</li><li>Move speed 230.</li>
          <li>Talent ranks: 1 per level (max ${MAX_LEVEL}); a full tree costs ${TREE_POINTS} ranks.</li>
          <li>Money buys gear and coffee. Brain Power buys talent ranks.</li></ul></div>
      </div></div>`;
  },
  buy(i) { const it = S.shop[i]; if (!it || S.money < it.price || S.inv.length >= 40) return; S.money -= it.price; S.inv.push(it); S.shop.splice(i, 1); saveGame(); this.renderPanel(); },
  buyCoffee() { if (S.money < CONSUMABLES[0].price || S.coffee >= 5) return; S.money -= CONSUMABLES[0].price; S.coffee++; saveGame(); this.renderPanel(); },
};

function previewChar(canvas, look) {
  if (!canvas) return;
  const c2 = canvas.getContext('2d'); const old = ctx; ctx = c2;
  c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, canvas.width, canvas.height);
  const g = c2.createRadialGradient(canvas.width / 2, canvas.height * 0.6, 10, canvas.width / 2, canvas.height * 0.6, canvas.width * 0.7);
  g.addColorStop(0, 'rgba(120,170,220,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c2.fillStyle = g; c2.fillRect(0, 0, canvas.width, canvas.height);
  const scale = canvas.height / 82;
  try { drawPerson(canvas.width / 2, canvas.height * 0.92, Object.assign({}, look, { scale, face: 1, walk: 0 })); } finally { ctx = old; }
}
function drawTitleArt() {
  const c = $('#title-art'); if (!c) return;
  const g = c.getContext('2d'); const old = ctx; ctx = g;
  g.clearRect(0, 0, c.width, c.height);
  try {
    const people = [
      [140, { top: '#2f3a4a', bottom: '#2f3a4a', coat: true, longcoat: true, skin: '#c68642', hair: '#9a9a9a', style: 'receding', beard: true, glasses: true, tie: '#c084fc', steth: '#2a2d33', shoe: '#1c1f25', scale: 2.25 }],
      [262, { top: '#2a7fa8', bottom: '#226a8c', skin: '#f1c9a5', hair: '#5a3a20', female: true, style: 'ponytail', steth: '#2a2d33', shoe: '#eef1f4', scale: 2.45 }],
      [372, { top: '#3a3d45', bottom: '#3a3d45', suit: '#2c5aa0', briefcase: true, skin: '#e0ac85', hair: '#555', style: 'short', glasses: true, shoe: '#2a1a10', scale: 2.2, face: -1 }],
      [470, { top: '#1f3a6b', bottom: '#1f3a6b', skin: '#8d5524', hair: '#111', female: true, style: 'bun', shoe: '#e8ebee', scale: 2.2, face: -1 }],
    ];
    for (const [x, o] of people) drawPerson(x, 222, o);
  } finally { ctx = old; }
}

// wire static buttons
window.addEventListener('DOMContentLoaded', () => {});
$('#title-new').onclick = () => {
  if (loadGame()) {
    UI.modal(`<h2>Start over?</h2><p>This replaces your current character.</p><div class="row end"><button class="btn" onclick="UI.closeModal()">Cancel</button><button class="btn danger" onclick="UI.closeModal();UI.showCreate()">Start new</button></div>`);
  } else UI.showCreate();
};
$('#title-continue').onclick = () => { S = loadGame(); if (!S) return; ensureWeapons(); if (!S.shop || !S.shop.length) restockShop(); saveGame(); UI.showCampus(); };
$('#cr-go').onclick = () => UI.finishCreate();
$('#cr-back').onclick = () => document.querySelectorAll('.music-label').forEach(el => el.textContent = Music.on ? '♪ Music: on' : '♪ Music: off');
UI.showTitle();
$('#btn-gear').onclick = () => UI.openPanel('gear');
$('#btn-talents').onclick = () => UI.openPanel('talents');
$('#btn-shop').onclick = () => UI.openPanel('shop');
$('#btn-menu').onclick = () => { saveGame(); UI.showTitle(); };
$('#btn-next').onclick = () => UI.enterZone(Math.min(S.cleared, S.order.length - 1));
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!$('#panel').classList.contains('hidden')) { UI.closePanel(); e.stopImmediatePropagation(); }
    else if (G && G.state === 'pause') { UI.closeModal(); resumeGame(); e.stopImmediatePropagation(); }
  }
}, true);
document.querySelectorAll('.music-label').forEach(el => el.textContent = Music.on ? '♪ Music: on' : '♪ Music: off');
UI.showTitle();
