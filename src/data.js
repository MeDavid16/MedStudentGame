// ===================== RESIDENCY — GAME DATA =====================
'use strict';

const MAX_LEVEL = 30;           // level cap; 1 talent rank per level -> 30 ranks = 2 full trees
const TREE_POINTS = 15;         // ranks to complete one tree

// ---------- STATS (every gear piece rolls exactly 3) ----------
const STATS = {
  knowledge: { name: 'Knowledge', desc: '+1% damage per point', per: 1.0 },
  stamina:   { name: 'Stamina',   desc: '+5 max HP per point', per: 3.0 },
  insight:   { name: 'Insight',   desc: '+0.5% critical chance per point', per: 0.8 },
  dexterity: { name: 'Dexterity', desc: '+1% attack speed per point', per: 0.9 },
  focus:     { name: 'Focus',     desc: '+0.7% cooldown reduction per point (max 50%)', per: 0.8 },
  composure: { name: 'Composure', desc: '+0.5% damage reduction per point (max 60%)', per: 0.8 },
  reflexes:  { name: 'Reflexes',  desc: '+0.6% move speed per point', per: 0.8 },
  charisma:  { name: 'Charisma',  desc: '+1% money found per point', per: 1.2 },
  empathy:   { name: 'Empathy',   desc: '+0.15 HP regenerated per second per point', per: 1.0 },
};
const STAT_KEYS = Object.keys(STATS);
const STAT_INFO = {
  knowledge: { effect: v => `+${v}% damage`, does: 'Raises the damage of every attack and skill.', cap: 'None', talents: 'Evidence-Based, Sharp Scalpel' },
  stamina:   { effect: v => `+${v * 5} max HP`, does: 'Adds maximum health.', cap: 'None', talents: 'Empathy (+% max HP)' },
  insight:   { effect: v => `+${(v * 0.5).toFixed(1)}% crit chance`, does: 'Chance for a hit to critically strike (150% damage by default).', cap: '75% total crit chance', talents: 'Pattern Recognition, Lucid Recall (crit damage)' },
  dexterity: { effect: v => `+${v}% attack speed`, does: 'Fires your basic attack faster (base: 3 per second).', cap: 'None', talents: 'Steady Hands' },
  focus:     { effect: v => `+${(v * 0.7).toFixed(1)}% cooldown reduction`, does: 'Shortens skill cooldowns.', cap: '50% from gear, 60% with talents', talents: 'Pharmacokinetics' },
  composure: { effect: v => `+${(v * 0.5).toFixed(1)}% damage reduction`, does: 'Reduces all damage you take.', cap: '60% from gear, 70% with talents', talents: 'Sterile Field, Unflappable, Healing Presence' },
  reflexes:  { effect: v => `+${(v * 0.6).toFixed(1)}% move speed`, does: 'Makes you move faster, which helps you dodge.', cap: 'None', talents: 'Scrubbed In' },
  charisma:  { effect: v => `+${v}% money found`, does: 'Increases money dropped by enemies and bosses.', cap: 'None', talents: 'Shared Decision-Making' },
  empathy:   { effect: v => `+${(v * 0.15).toFixed(1)} HP/sec regen`, does: 'Regenerates health every second.', cap: 'None', talents: 'Active Listening' },
};

// ---------- GEAR ----------
const SLOTS = ['head', 'shirt', 'pants', 'shoes', 'stethoscope', 'wrist', 'ringL', 'ringR'];
const SLOT_NAMES = { head: 'Head', shirt: 'Shirt', pants: 'Pants', shoes: 'Shoes', stethoscope: 'Stethoscope', wrist: 'Wrist', ringL: 'Left Ring', ringR: 'Right Ring' };
// item "type" -> which slot(s) accept it
const ITEM_TYPES = {
  head:        { slots: ['head'],        bases: ['Bouffant Cap', 'Surgical Scrub Cap', 'LED Headlamp', 'ENT Head Mirror', 'Surgical Loupes'], favored: ['insight', 'focus', 'knowledge'] },
  shirt:       { slots: ['shirt'],       bases: ['Student Scrub Top', 'Short White Coat', 'Fluid-Resistant Scrub Top', 'Long White Coat', 'Lead Apron'], favored: ['stamina', 'composure', 'empathy'] },
  pants:       { slots: ['pants'],       bases: ['Drawstring Scrub Pants', 'Jogger Scrub Pants', 'Cargo Scrub Pants', 'Antimicrobial Scrub Pants', 'Isolation-Grade Scrub Pants'], favored: ['stamina', 'reflexes', 'composure'] },
  shoes:       { slots: ['shoes'],       bases: ['Disposable Shoe Covers', 'Nursing Sneakers', 'Hospital Clogs', 'Compression-Sock Runners', 'Orthopedic OR Clogs'], favored: ['reflexes', 'dexterity', 'stamina'] },
  stethoscope: { slots: ['stethoscope'], bases: ['Disposable Stethoscope', 'Single-Head Stethoscope', 'Dual-Head Stethoscope', 'Cardiology Stethoscope', 'Electronic Stethoscope'], favored: ['knowledge', 'insight', 'dexterity'] },
  wrist:       { slots: ['wrist'],       bases: ['Silicone Wristband', 'Watch with Second Hand', 'Activity Tracker', 'Carpal Tunnel Brace', 'Pager-Sync Smartwatch'], favored: ['dexterity', 'focus', 'reflexes'] },
  ring:        { slots: ['ringL', 'ringR'], bases: ['Silicone Surgeon Band', 'Caduceus Ring', 'Pulse-Oximeter Ring', 'Rod of Asclepius Ring', 'Sleep-Tracking Smart Ring'], favored: ['charisma', 'empathy', 'insight'] },
};
const LEGENDARIES = {
  head: ["Cushing's Loupes"], shirt: ["Osler's White Coat"], pants: ["Halsted's Residency Scrubs"],
  shoes: ['Clogs of the 36-Hour Call'], stethoscope: ["Laennec's Wooden Cylinder"],
  wrist: ["Apgar's Stopwatch"], ring: ['Signet of Asclepius', "Hygieia's Band"],
};
const MAGIC_PREFIX = ['Sterile', 'Autoclaved', 'Hypoallergenic', 'Antimicrobial', 'Ergonomic', 'Evidence-Based', 'Fluid-Resistant', 'Latex-Free'];
const RARE_SUFFIX = ['of the Night Float', 'of Grand Rounds', 'of the Chief Resident', 'of Triage', 'of the Code Team', 'of Clinical Excellence', 'of the Golden Hour', 'of Morbidity & Mortality'];
const TIERS = [
  { name: 'Normal',    color: '#c9ced6', mult: 1.0, price: 1,   weight: 73 },
  { name: 'Magic',     color: '#5aa2ff', mult: 1.5, price: 2.6, weight: 12 },
  { name: 'Rare',      color: '#ffd54a', mult: 2.2, price: 6,   weight: 8 },
  { name: 'Legendary', color: '#ff8a2a', mult: 3.2, price: 16,  weight: 4 },
];

// ---------- CONSUMABLES (bought with money) ----------
const CONSUMABLES = [
  { id: 'coffee', name: 'Call-Room Coffee', desc: 'Restores 35% HP (press Q). Carry up to 5.', price: 25 },
];

// ---------- TALENT TREES (bought with Brain Power) ----------
// Row requirement = ranks already spent in that tree. Costs rise per row.
const ROW_REQ = [0, 3, 7, 14];
const ROW_COST = [2, 3, 4, 6];
const TREES = [
  { id: 'diag', name: 'Diagnostician', color: '#4fa3ff', icon: '🧠', blurb: 'Critical hits, damage, and an edge when attendings pimp you.',
    nodes: [
      { id: 'pattern', row: 0, name: 'Pattern Recognition', max: 3, desc: r => `+${5*r}% critical chance` },
      { id: 'ebm',     row: 0, name: 'Evidence-Based',      max: 3, desc: r => `+${6*r}% all damage` },
      { id: 'ddx',     row: 1, name: 'Differential Diagnosis', max: 1, active: true, desc: () => 'ACTIVE: Mark every enemy near you for 6s. Marked enemies take +40% damage. 14s cooldown.' },
      { id: 'pearls',  row: 1, name: 'Clinical Pearls',     max: 3, desc: r => `+${10*r}% Brain Power found, +${4*r}s to answer attending questions` },
      { id: 'ruleout', row: 2, name: 'Rule Out',            max: 2, desc: r => `Eliminate ${r} wrong answer${r>1?'s':''} on every attending question` },
      { id: 'recall',  row: 2, name: 'Lucid Recall',        max: 2, desc: r => `+${25*r}% critical damage` },
      { id: 'grand',   row: 3, name: 'Grand Rounds',        max: 1, active: true, desc: () => 'ULTIMATE: Fire 18 piercing knowledge bolts in every direction (300% damage each). 20s cooldown.' },
    ] },
  { id: 'surg', name: 'Surgeon', color: '#ff5a5a', icon: '🔪', blurb: 'Fast hands, dashes, and close-quarters scalpel work.',
    nodes: [
      { id: 'steady',  row: 0, name: 'Steady Hands',   max: 3, desc: r => `+${8*r}% attack speed` },
      { id: 'sharp',   row: 0, name: 'Sharp Scalpel',  max: 3, desc: r => `+${12*r}% scalpel skill damage, +${4*r}% all damage` },
      { id: 'incision',row: 1, name: 'Incision',       max: 1, active: true, desc: () => 'ACTIVE: Dash toward the cursor, slicing everything in your path (250% damage). 6s cooldown.' },
      { id: 'sterile', row: 1, name: 'Sterile Field',  max: 3, desc: r => `+${4*r}% damage reduction` },
      { id: 'hemo',    row: 2, name: 'Hemostasis',     max: 2, desc: r => `Scalpel hits heal you for ${1.5*r}% max HP` },
      { id: 'scrubbed',row: 2, name: 'Scrubbed In',    max: 2, desc: r => `+${8*r}% move speed` },
      { id: 'suture',  row: 3, name: 'Suture Storm',   max: 1, active: true, desc: () => 'ULTIMATE: Spin for 3s, slashing all nearby enemies 8 times per second. 18s cooldown.' },
    ] },
  { id: 'bed', name: 'Bedside Manner', color: '#42d392', icon: '🤝', blurb: 'Survive the long shifts: health, healing, and calming the crowd.',
    nodes: [
      { id: 'empath',  row: 0, name: 'Empathy',            max: 3, desc: r => `+${10*r}% max HP` },
      { id: 'listen',  row: 0, name: 'Active Listening',   max: 3, desc: r => `Regenerate ${(0.4*r).toFixed(1)}% max HP per second` },
      { id: 'reassure',row: 1, name: 'Reassurance',        max: 1, active: true, desc: () => 'ACTIVE: Calm everyone near you — enemies are stunned for 2.5s. 12s cooldown.' },
      { id: 'sdm',     row: 1, name: 'Shared Decision-Making', max: 3, desc: r => `+${10*r}% money found` },
      { id: 'alliance',row: 2, name: 'Therapeutic Alliance', max: 2, desc: r => `Coffee heals ${25*r}% more` },
      { id: 'compose', row: 2, name: 'Unflappable',        max: 2, desc: r => `${10*r}% chance to ignore incoming damage` },
      { id: 'presence',row: 3, name: 'Healing Presence',   max: 1, active: true, desc: () => 'ULTIMATE: Heal 40% HP and take 50% less damage for 6s. 25s cooldown.' },
    ] },
  { id: 'pharm', name: 'Pharmacology', color: '#b57bff', icon: '💊', blurb: 'Ranged spread, damage over time, and shorter cooldowns.',
    nodes: [
      { id: 'pk',      row: 0, name: 'Pharmacokinetics', max: 3, desc: r => `-${6*r}% skill cooldowns` },
      { id: 'bioavail',row: 0, name: 'Bioavailability',  max: 3, desc: r => `+${8*r}% basic attack damage` },
      { id: 'spray',   row: 1, name: 'Broad-Spectrum Spray', max: 1, active: true, desc: () => 'ACTIVE: Fire a cone of 9 pills (90% damage each) that poison targets for 3s. 5s cooldown.' },
      { id: 'halflife',row: 1, name: 'Half-Life',        max: 3, desc: r => `Poison deals +${20*r}% damage and lasts longer` },
      { id: 'loading', row: 2, name: 'Loading Dose',     max: 2, desc: r => `Projectile weapons fire ${r} extra shot${r>1?'s':''}; beam, shock, spray and melee weapons deal +${20*r}% damage` },
      { id: 'synergy', row: 2, name: 'Drug Synergy',     max: 2, desc: r => `+${10*r}% damage to poisoned enemies` },
      { id: 'codecart',row: 3, name: 'Code Cart',        max: 1, active: true, desc: () => 'ULTIMATE: Drop a medication cloud at the cursor for 5s that damages and slows enemies. 20s cooldown.' },
    ] },
];
const ACTIVE_SKILLS = {
  ddx:      { name: 'Differential Diagnosis', cd: 14, icon: '🔍', tree: 'diag' },
  grand:    { name: 'Grand Rounds',           cd: 20, icon: '📚', tree: 'diag' },
  incision: { name: 'Incision',               cd: 6,  icon: '🔪', tree: 'surg' },
  suture:   { name: 'Suture Storm',           cd: 18, icon: '🌀', tree: 'surg' },
  reassure: { name: 'Reassurance',            cd: 12, icon: '🫶', tree: 'bed' },
  presence: { name: 'Healing Presence',       cd: 25, icon: '✚',  tree: 'bed' },
  spray:    { name: 'Broad-Spectrum Spray',   cd: 5,  icon: '💊', tree: 'pharm' },
  codecart: { name: 'Code Cart',              cd: 20, icon: '🧪', tree: 'pharm' },
};

// ---------- ENEMIES (hospital personnel, patients) ----------
// look: palette used by the renderer. beh: AI behavior.
const ENEMIES = {
  patient:     { name: 'Patient',               hp: 34, spd: 70,  dmg: 8,  beh: 'melee', look: { top: '#a9c8e8', bottom: '#a9c8e8', gown: true }, xp: 10, cash: 4, cured: 'Treated ✓' },
  stdpatient:  { name: 'Standardized Patient',  hp: 28, spd: 80,  dmg: 6,  beh: 'melee', look: { top: '#7a8a9e', bottom: '#3b4250' }, xp: 8, cash: 3, cured: 'Case closed ✓', attack: 'Vague History' },
  classmate:   { name: 'Gunner Classmate',      hp: 24, spd: 85,  dmg: 6,  beh: 'ranged', range: 260, rate: 1.8, proj: { name: 'Gunner Question', color: '#ffd54a', spd: 300, r: 6 }, look: { top: '#4b6b4f', bottom: '#2f3540', backpack: true }, xp: 8, cash: 3, cured: 'Out-studied ✓' },
  nurse:       { name: 'Charge Nurse',          hp: 30, spd: 95,  dmg: 6,  beh: 'ranged', range: 280, rate: 1.4, proj: { name: 'Page', color: '#7fe3ff', spd: 420, r: 5 }, look: { top: '#1f3a6b', bottom: '#1f3a6b' }, xp: 11, cash: 4, cured: 'Orders clarified ✓' },
  ma:          { name: 'Medical Assistant',     hp: 26, spd: 100, dmg: 5,  beh: 'melee', look: { top: '#6a4a9e', bottom: '#6a4a9e' }, xp: 9, cash: 3, cured: 'Rooming done ✓', attack: 'Patient Roomed!' },
  family:      { name: 'Family Member',         hp: 60, spd: 65,  dmg: 11, beh: 'melee', look: { top: 'random', bottom: '#384152' }, xp: 14, cash: 6, cured: 'Updated & satisfied ✓', attack: 'Demands an Update!' },
  pharmacist:  { name: 'Pharmacist',            hp: 32, spd: 80,  dmg: 7,  beh: 'ranged', range: 300, rate: 2.0, proj: { name: 'Drug Interaction Alert', color: '#7dff9b', spd: 300, r: 7, slow: 0.5 }, look: { top: '#f2f4f7', bottom: '#2b5c45', coat: true }, xp: 12, cash: 5, cured: 'Order verified ✓' },
  labtech:     { name: 'Lab Technician',        hp: 30, spd: 80,  dmg: 9,  beh: 'lobber', range: 320, rate: 2.4, proj: { name: 'Hemolyzed Sample', color: '#d0304a', spd: 260, r: 7 }, look: { top: '#7b3fa0', bottom: '#7b3fa0' }, xp: 12, cash: 5, cured: 'Sample accepted ✓' },
  radtech:     { name: 'Radiology Technician',  hp: 38, spd: 70,  dmg: 14, beh: 'zoner', range: 360, rate: 3.0, look: { top: '#5d6670', bottom: '#2c3e5c', apron: true }, xp: 14, cash: 5, cured: 'Images acquired ✓', attack: 'Radiation Zone' },
  phleb:       { name: 'Phlebotomist',          hp: 26, spd: 125, dmg: 7,  beh: 'melee', drain: true, look: { top: '#7a1f2b', bottom: '#7a1f2b' }, xp: 11, cash: 4, cured: 'Draw complete ✓', attack: 'Needle Stick' },
  exec:        { name: 'Hospital Executive',    hp: 44, spd: 75,  dmg: 8,  beh: 'ranged', range: 300, rate: 2.2, proj: { name: 'Budget Cut', color: '#9cff6b', spd: 330, r: 8, steal: true }, look: { top: '#1c1f26', bottom: '#1c1f26', suit: '#b3202a' }, xp: 16, cash: 12, cured: 'Metrics met ✓' },
  lawyer:      { name: 'Malpractice Attorney',  hp: 70, spd: 70,  dmg: 9,  beh: 'ranged', range: 320, rate: 2.0, proj: { name: 'Subpoena', color: '#fff3c4', spd: 360, r: 7, root: 0.9 }, look: { top: '#3a3d45', bottom: '#3a3d45', suit: '#2c5aa0', briefcase: true }, xp: 22, cash: 10, cured: 'Case dismissed ✓', elite: true },
  insurance:   { name: 'Insurance Reviewer',    hp: 36, spd: 65,  dmg: 4,  beh: 'ranged', range: 300, rate: 3.0, proj: { name: 'Prior Auth Denied', color: '#ff9f43', spd: 280, r: 8, root: 1.4 }, look: { top: '#c9b48a', bottom: '#4a4237' }, xp: 13, cash: 5, cured: 'Approved ✓' },
  casemgr:     { name: 'Case Manager',          hp: 40, spd: 90,  dmg: 8,  beh: 'melee', look: { top: '#1f7f7a', bottom: '#2a2f3a' }, xp: 12, cash: 5, cured: 'Discharge planned ✓', attack: 'Discharge by Noon!' },
  rt:          { name: 'Respiratory Therapist', hp: 32, spd: 85,  dmg: 7,  beh: 'ranged', range: 260, rate: 1.6, proj: { name: 'Nebulizer Mist', color: '#c8f0ff', spd: 260, r: 9 }, look: { top: '#3c7a5a', bottom: '#3c7a5a' }, xp: 12, cash: 4, cured: 'Airway secured ✓' },
  transporter: { name: 'Patient Transporter',   hp: 40, spd: 80,  dmg: 12, beh: 'charger', look: { top: '#6b7280', bottom: '#2a2f3a' }, xp: 13, cash: 4, cured: 'Transport done ✓', attack: 'Gurney Rush' },
  clerk:       { name: 'Unit Clerk',            hp: 28, spd: 80,  dmg: 5,  beh: 'ranged', range: 280, rate: 1.5, proj: { name: 'Missing Signature', color: '#ffffff', spd: 340, r: 5 }, look: { top: '#8a5a8f', bottom: '#2a2f3a' }, xp: 10, cash: 4, cured: 'Chart signed ✓' },
  // ----- newer staff with unique skills -----
  security:    { name: 'Security Officer',      hp: 95, spd: 72,  dmg: 16, beh: 'slammer', look: { top: '#1d2433', bottom: '#1d2433', head: 'guardcap', badgeGold: true }, xp: 18, cash: 7, cured: 'All clear ✓', attack: 'Code Gray!' },
  dietitian:   { name: 'Dietitian',             hp: 34, spd: 85,  dmg: 6,  beh: 'ranged', range: 300, rate: 2.6, proj: { name: 'NPO Order', color: '#ff6b81', spd: 320, r: 8, silence: 2.5 }, look: { top: '#a7d8b8', bottom: '#3a4450', coat: true }, xp: 14, cash: 5, cured: 'Diet advanced ✓' },
  pt:          { name: 'Physical Therapist',    hp: 42, spd: 95,  dmg: 7,  beh: 'ranged', range: 330, rate: 3.0, proj: { name: 'Gait Belt', color: '#f5d76e', spd: 420, r: 7, pull: 150 }, look: { top: '#24456e', bottom: '#c8b48a' }, xp: 14, cash: 5, cured: 'Ambulating ✓' },
  infection:   { name: 'Infection Preventionist', hp: 40, spd: 80, dmg: 7, beh: 'isolator', range: 340, rate: 3.2, look: { top: '#3a4450', bottom: '#3a4450', coat: true, longcoat: true, coatColor: '#f2d35b', mask: true }, xp: 15, cash: 5, cured: 'Precautions lifted ✓', attack: 'Isolation Zone' },
  pharmarep:   { name: 'Pharmaceutical Rep',    hp: 30, spd: 95,  dmg: 4,  beh: 'support', range: 360, rate: 5.0, look: { top: '#2b2f3a', bottom: '#2b2f3a', suit: '#c0392b', briefcase: true }, xp: 16, cash: 14, cured: 'Samples confiscated ✓', attack: 'Free Samples!' },
  resident:    { name: 'Resident',              hp: 40, spd: 100, dmg: 8,  beh: 'melee', look: { top: '#7fb2d9', bottom: '#7fb2d9' }, xp: 10, cash: 3, cured: 'Signed out ✓', attack: 'Scut Work' },
};

// ---------- SPECIALTIES / BOSSES ----------
// patterns: ring, volley, dash, summon, zones, spiral
const SPECIALTIES = {
  peds: { name: 'Pediatrics', boss: 'Dr. Rosa Alvarez', setting: 'clinic', place: "Children's Clinic", accent: '#ffb347',
    diseases: ['Croup', 'RSV Bronchiolitis', 'Acute Otitis Media', 'Hand-Foot-Mouth', 'Strep Pharyngitis', 'Gastroenteritis'],
    staff: ['patient', 'patient', 'ma', 'nurse', 'phleb', 'infection'],
    attacks: { ring: 'Vaccine Schedule', volley: 'Growth Chart Volley', summon: 'Toddler Tantrum', zones: 'Sticker Reward' },
    q: [
      { q: 'Most common cause of bronchiolitis in infants?', a: ['Respiratory syncytial virus', 'Influenza A', 'Haemophilus influenzae type b', 'Mycoplasma pneumoniae'], why: 'RSV is the leading cause of bronchiolitis in infants.' },
      { q: 'A "steeple sign" on AP neck X-ray suggests:', a: ['Croup', 'Epiglottitis', 'Foreign body aspiration', 'Retropharyngeal abscess'], why: 'Subglottic narrowing (steeple sign) is classic for croup; epiglottitis shows a "thumbprint" sign.' },
      { q: 'First-line antibiotic for acute otitis media in a healthy toddler with no allergies?', a: ['High-dose amoxicillin', 'Azithromycin', 'Ciprofloxacin drops', 'Doxycycline'], why: 'High-dose amoxicillin is first-line for AOM when antibiotics are indicated.' },
      { q: 'Initial treatment for Kawasaki disease?', a: ['IVIG plus aspirin', 'Oral prednisone alone', 'Penicillin G', 'Observation only'], why: 'IVIG with aspirin reduces the risk of coronary artery aneurysms.' },
    ] },
  psych: { name: 'Psychiatry', boss: 'Dr. Malcolm Reyes', setting: 'clinic', place: 'Behavioral Health Unit', accent: '#9fa8ff',
    diseases: ['Delirium', 'Alcohol Withdrawal', 'Panic Attack', 'Serotonin Syndrome', 'Lithium Toxicity', 'Catatonia'],
    staff: ['patient', 'patient', 'nurse', 'pharmacist', 'casemgr', 'security', 'dietitian'],
    attacks: { ring: 'Mental Status Exam', spiral: 'Flight of Ideas', summon: 'Group Therapy', volley: 'Free Association' },
    q: [
      { q: 'Clozapine requires regular monitoring of:', a: ['Absolute neutrophil count', 'Serum amylase', 'Vitamin B12', 'Urine osmolality'], why: 'Clozapine can cause agranulocytosis, so the ANC is monitored.' },
      { q: 'Hyperreflexia and inducible clonus after starting a new serotonergic drug suggest:', a: ['Serotonin syndrome', 'Neuroleptic malignant syndrome', 'Malignant hyperthermia', 'Anticholinergic toxicity'], why: 'Clonus/hyperreflexia with rapid onset favors serotonin syndrome; NMS shows lead-pipe rigidity.' },
      { q: 'Preferred drug class for acute alcohol withdrawal?', a: ['Benzodiazepines', 'Typical antipsychotics', 'Opioids', 'SSRIs'], why: 'Benzodiazepines treat withdrawal symptoms and prevent seizures and DTs.' },
      { q: 'Besides lithium levels, which labs are monitored on long-term lithium?', a: ['Renal and thyroid function', 'Liver enzymes and lipase', 'CK and troponin', 'Ferritin and B12'], why: 'Lithium can cause hypothyroidism and nephrogenic diabetes insipidus/CKD.' },
    ] },
  fm: { name: 'Family Medicine', boss: 'Dr. Linda Park', setting: 'clinic', place: 'Family Health Center', accent: '#6fd18f',
    diseases: ['Hypertension', 'Type 2 Diabetes', 'COPD Exacerbation', 'Low Back Pain', 'Acute Sinusitis', 'Gout Flare'],
    staff: ['patient', 'patient', 'ma', 'insurance', 'pharmacist', 'clerk', 'dietitian', 'pharmarep'],
    attacks: { ring: 'Preventive Screening', volley: 'Fifteen-Minute Visit', zones: 'Annual Wellness Check', summon: 'Walk-In Rush', dash: 'Continuity of Care' },
    q: [
      { q: 'Per USPSTF, average-risk colorectal cancer screening begins at age:', a: ['45', '40', '50', '55'], why: 'USPSTF lowered the starting age to 45 in 2021.' },
      { q: 'HbA1c threshold diagnostic of diabetes:', a: ['≥ 6.5%', '≥ 5.7%', '≥ 6.0%', '≥ 7.0%'], why: '5.7–6.4% is prediabetes; ≥6.5% (confirmed) is diabetes.' },
      { q: 'Under the Ottawa ankle rules, an X-ray is indicated for:', a: ['Bone tenderness at the posterior edge or tip of a malleolus', 'Any ankle swelling', 'Bruising over the lateral ankle', 'Pain with passive dorsiflexion only'], why: 'Malleolar-zone pain plus posterior-edge/tip tenderness or inability to bear weight for 4 steps.' },
      { q: '2017 ACC/AHA definition of stage 1 hypertension:', a: ['130–139 / 80–89 mmHg', '120–129 / <80 mmHg', '140–159 / 90–99 mmHg', '≥ 160 / ≥ 100 mmHg'], why: 'Stage 1 is 130–139 systolic or 80–89 diastolic.' },
    ] },
  ent: { name: 'Otolaryngology (ENT)', boss: 'Dr. Arjun Mehta', setting: 'hospital', place: 'ENT Clinic & OR', accent: '#ffd36b',
    diseases: ['Epistaxis', 'Peritonsillar Abscess', 'Otitis Externa', 'BPPV', 'Chronic Sinusitis'],
    staff: ['patient', 'patient', 'nurse', 'radtech', 'clerk', 'pt', 'infection'],
    attacks: { ring: 'Weber & Rinne', volley: 'Nasal Packing', zones: 'Tympanometry', spiral: 'Vertigo Spin' },
    q: [
      { q: 'Most common site of anterior epistaxis?', a: ["Kiesselbach's plexus", 'Sphenopalatine artery', 'Inferior turbinate', 'Posterior ethmoid artery'], why: "Kiesselbach's plexus on the anterior septum causes ~90% of nosebleeds." },
      { q: 'Weber test lateralizes to the affected ear in:', a: ['Conductive hearing loss', 'Sensorineural hearing loss', 'Normal hearing', 'Presbycusis'], why: 'In conductive loss, bone-conducted sound is heard louder in the affected ear.' },
      { q: 'Classic exam finding in peritonsillar abscess:', a: ['Uvula deviated away from the affected side', 'Bilateral tonsillar exudates only', 'Drooling with tripod position', 'Uvula deviated toward the affected side'], why: 'The abscess pushes the uvula to the contralateral side; trismus and "hot potato" voice are common.' },
      { q: 'Most common organism in acute otitis externa?', a: ['Pseudomonas aeruginosa', 'Streptococcus pneumoniae', 'Moraxella catarrhalis', 'Candida albicans'], why: 'Pseudomonas and S. aureus dominate "swimmer\'s ear".' },
    ] },
  obgyn: { name: 'Obstetrics & Gynecology', boss: 'Dr. Grace Okafor', setting: 'hospital', place: 'Labor & Delivery', accent: '#ff8fc8',
    diseases: ['Preeclampsia', 'Hyperemesis Gravidarum', 'Ectopic Pregnancy', 'PCOS', 'Gestational Diabetes'],
    staff: ['patient', 'patient', 'nurse', 'labtech', 'lawyer', 'security', 'dietitian'],
    attacks: { ring: 'Contraction Wave', volley: 'Fundal Height', summon: 'Family Waiting Room', zones: 'Fetal Monitoring' },
    q: [
      { q: 'First-line agent for seizure prophylaxis in preeclampsia with severe features?', a: ['Magnesium sulfate', 'Phenytoin', 'Lorazepam', 'Levetiracetam'], why: 'Magnesium sulfate prevents and treats eclamptic seizures.' },
      { q: 'Periconceptional folic acid reduces the risk of:', a: ['Neural tube defects', 'Cleft lip only', 'Congenital heart block', 'Down syndrome'], why: 'Folic acid supplementation reduces neural tube defects.' },
      { q: 'Routine screening for gestational diabetes is usually performed at:', a: ['24–28 weeks', '8–12 weeks', '32–36 weeks', 'At delivery'], why: 'Routine screening happens at 24–28 weeks (earlier if high risk).' },
      { q: 'An Rh-negative, unsensitized patient routinely receives anti-D immune globulin at:', a: ['28 weeks and within 72 h after delivery of an Rh+ infant', 'Only at the first prenatal visit', '12 weeks only', 'Only if the father is Rh-negative'], why: 'Prophylaxis at ~28 weeks and postpartum prevents alloimmunization.' },
    ] },
  cards: { name: 'Cardiology', boss: 'Dr. Henry Castellano', setting: 'hospital', place: 'Cardiac Cath Lab', accent: '#ff5d6c',
    diseases: ['Atrial Fibrillation', 'STEMI', 'CHF Exacerbation', 'Pericarditis', 'Aortic Stenosis'],
    staff: ['patient', 'patient', 'nurse', 'radtech', 'pharmacist', 'exec', 'dietitian', 'pharmarep', 'pt'],
    attacks: { ring: 'Twelve-Lead Burst', spiral: 'Torsades Spiral', dash: 'Door-to-Balloon', volley: 'Ejection Fraction' },
    q: [
      { q: 'ST elevation in leads II, III and aVF indicates which MI territory?', a: ['Inferior', 'Anterior', 'Lateral', 'Posterior only'], why: 'II, III, aVF look at the inferior wall (usually the RCA).' },
      { q: 'Which drug has a proven mortality benefit in HFrEF?', a: ['Spironolactone', 'Furosemide', 'Digoxin', 'Amlodipine'], why: 'MRAs reduce mortality; loop diuretics relieve symptoms only.' },
      { q: 'The CHA₂DS₂-VASc score estimates:', a: ['Stroke risk in atrial fibrillation', 'Bleeding risk on warfarin', '10-year ASCVD risk', 'Pretest probability of PE'], why: 'It guides anticoagulation in AF; HAS-BLED estimates bleeding risk.' },
      { q: 'Most common sustained cardiac arrhythmia in adults?', a: ['Atrial fibrillation', 'Ventricular tachycardia', 'Atrial flutter', 'Wolff-Parkinson-White'], why: 'AF is the most common sustained arrhythmia.' },
    ] },
  em: { name: 'Emergency Medicine', boss: 'Dr. Tasha Brooks', setting: 'hospital', place: 'Emergency Department', accent: '#ff7a3d',
    diseases: ['Anaphylaxis', 'Opioid Overdose', 'DKA', 'Sepsis', 'Acetaminophen Overdose'],
    staff: ['patient', 'patient', 'patient', 'nurse', 'transporter', 'rt', 'lawyer', 'security', 'infection', 'security'],
    attacks: { ring: 'Mass Casualty', dash: 'Trauma Activation', summon: 'Waiting Room Surge', zones: 'Triage Zones', volley: 'Rapid Sequence' },
    q: [
      { q: 'Antidote for acetaminophen overdose?', a: ['N-acetylcysteine', 'Flumazenil', 'Fomepizole', 'Deferoxamine'], why: 'NAC replenishes glutathione; best within 8 hours of ingestion.' },
      { q: 'First-line treatment for anaphylaxis?', a: ['Intramuscular epinephrine', 'IV diphenhydramine', 'Oral prednisone', 'Inhaled albuterol'], why: 'IM epinephrine in the anterolateral thigh is first-line; delays increase mortality.' },
      { q: 'Which rhythms are shockable in cardiac arrest?', a: ['VF and pulseless VT', 'Asystole and PEA', 'Sinus bradycardia', 'All of the above'], why: 'Only VF and pulseless VT are shockable.' },
      { q: 'Reversal agent for opioid overdose?', a: ['Naloxone', 'Atropine', 'Physostigmine', 'Protamine'], why: 'Naloxone is a competitive opioid receptor antagonist.' },
    ] },
  surg: { name: 'General Surgery', boss: 'Dr. Victor Hale', setting: 'hospital', place: 'Surgical Ward & OR', accent: '#4fd1c5',
    diseases: ['Appendicitis', 'Cholecystitis', 'Small Bowel Obstruction', 'Incarcerated Hernia', 'Diverticulitis'],
    staff: ['patient', 'patient', 'nurse', 'transporter', 'labtech', 'exec', 'resident', 'infection', 'pt', 'security'],
    attacks: { dash: 'Midline Laparotomy', ring: 'Retractor Sweep', volley: 'Bovie Bolts', summon: 'Scrub Team' },
    q: [
      { q: "Positive Murphy's sign is most associated with:", a: ['Acute cholecystitis', 'Appendicitis', 'Pancreatitis', 'Diverticulitis'], why: 'Inspiratory arrest on RUQ palpation suggests cholecystitis.' },
      { q: 'Most common cause of small bowel obstruction in adults (developed countries)?', a: ['Postoperative adhesions', 'Hernias', 'Malignancy', 'Volvulus'], why: 'Adhesions from prior surgery cause most SBOs.' },
      { q: "Fever, RUQ pain and jaundice (Charcot's triad) suggest:", a: ['Ascending cholangitis', 'Biliary colic', 'Acute hepatitis', 'Pancreatic cancer'], why: "Add hypotension and confusion for Reynolds' pentad." },
      { q: "Tenderness at McBurney's point suggests:", a: ['Appendicitis', 'Ovarian torsion only', 'Cholecystitis', 'Peptic ulcer'], why: "McBurney's point is one-third from the ASIS to the umbilicus." },
    ] },
  derm: { name: 'Dermatology', boss: 'Dr. Naomi Sato', setting: 'hospital', place: 'Dermatology Suite', accent: '#f6a6b2',
    diseases: ['Cellulitis', 'Psoriasis', 'Melanoma', 'Herpes Zoster', 'Stevens-Johnson Syndrome'],
    staff: ['patient', 'patient', 'ma', 'pharmacist', 'insurance', 'labtech', 'pharmarep', 'infection'],
    attacks: { ring: 'Dermatome Ring', zones: 'Cryotherapy', volley: 'Punch Biopsy', spiral: 'Christmas-Tree Spiral' },
    q: [
      { q: 'In the ABCDEs of melanoma, "E" stands for:', a: ['Evolving', 'Elevated', 'Erythematous', 'Eczematous'], why: 'Change in size, shape or color over time is a key warning sign.' },
      { q: 'Most common skin cancer overall?', a: ['Basal cell carcinoma', 'Squamous cell carcinoma', 'Melanoma', 'Merkel cell carcinoma'], why: 'BCC is the most common, and rarely metastasizes.' },
      { q: 'Herald patch followed by a "Christmas-tree" truncal rash:', a: ['Pityriasis rosea', 'Tinea versicolor', 'Guttate psoriasis', 'Secondary syphilis'], why: 'Classic pityriasis rosea; it is self-limited.' },
      { q: 'Flaccid intraepidermal bullae with a positive Nikolsky sign:', a: ['Pemphigus vulgaris', 'Bullous pemphigoid', 'Dermatitis herpetiformis', 'Porphyria cutanea tarda'], why: 'Pemphigus is intraepidermal (Nikolsky +); pemphigoid is subepidermal with tense bullae.' },
    ] },
  ortho: { name: 'Orthopedic Surgery', boss: 'Dr. Marcus Strand', setting: 'hospital', place: 'Ortho Trauma Bay', accent: '#c7d0dc',
    diseases: ['Scaphoid Fracture', 'ACL Tear', 'Hip Fracture', 'Compartment Syndrome', 'Septic Arthritis'],
    staff: ['patient', 'patient', 'radtech', 'radtech', 'transporter', 'nurse', 'lawyer', 'pt', 'pt', 'security'],
    attacks: { dash: 'Closed Reduction', zones: 'Bone Saw', ring: 'Cast Room', volley: 'Ortho Hammer' },
    q: [
      { q: 'Most commonly fractured carpal bone?', a: ['Scaphoid', 'Lunate', 'Hamate', 'Trapezium'], why: 'Snuffbox tenderness after a FOOSH = scaphoid until proven otherwise.' },
      { q: 'Snuffbox tenderness after a fall with a normal initial X-ray — best management?', a: ['Thumb spica splint and repeat imaging', 'Reassure and discharge', 'Elastic bandage only', 'Immediate ORIF'], why: 'Occult scaphoid fractures risk avascular necrosis; immobilize and re-image.' },
      { q: 'The Lachman test primarily evaluates the:', a: ['Anterior cruciate ligament', 'Posterior cruciate ligament', 'Medial meniscus', 'Lateral collateral ligament'], why: 'Lachman is the most sensitive exam maneuver for ACL tears.' },
      { q: 'Earliest, most sensitive sign of compartment syndrome?', a: ['Pain out of proportion / pain with passive stretch', 'Pulselessness', 'Paralysis', 'Pallor'], why: 'Pulselessness is a late finding; pain with passive stretch comes first.' },
    ] },
  anes: { name: 'Anesthesiology', boss: 'Dr. Ingrid Larsen', setting: 'or', place: 'Pre-Op & PACU', accent: '#8be0ff',
    diseases: ['Malignant Hyperthermia', 'Difficult Airway', 'Postop Nausea', 'Local Anesthetic Toxicity'],
    staff: ['patient', 'nurse', 'rt', 'pharmacist', 'transporter', 'resident', 'infection', 'security'],
    attacks: { ring: 'Induction', spiral: 'Sevoflurane Swirl', zones: 'Nerve Block', summon: 'PACU Rush' },
    q: [
      { q: 'Specific treatment for malignant hyperthermia?', a: ['Dantrolene', 'Succinylcholine', 'Propofol', 'Neostigmine'], why: 'Dantrolene blocks calcium release from the sarcoplasmic reticulum.' },
      { q: 'Selective reversal agent for rocuronium?', a: ['Sugammadex', 'Naloxone', 'Flumazenil', 'Atropine'], why: 'Sugammadex encapsulates aminosteroid neuromuscular blockers.' },
      { q: 'The Mallampati classification assesses:', a: ['Anticipated difficulty of intubation', 'Cardiac risk', 'Depth of anesthesia', 'Postoperative nausea risk'], why: 'It grades oropharyngeal visibility to predict a difficult airway.' },
      { q: 'Succinylcholine is classically avoided (hyperkalemia risk) in patients with:', a: ['Major burns more than 24–48 hours old', 'Mild asthma', 'Well-controlled hypertension', 'Seasonal allergies'], why: 'Upregulated receptors after burns, crush injury or denervation cause K⁺ surges.' },
    ] },
  rads: { name: 'Radiology', boss: 'Dr. Owen Fitzgerald', setting: 'hospital', place: 'Imaging Department', accent: '#a0b4c8',
    diseases: ['Pneumothorax', 'Kidney Stone', 'Pulmonary Embolism', 'Pneumoperitoneum', 'Bowel Obstruction'],
    staff: ['patient', 'radtech', 'radtech', 'radtech', 'transporter', 'clerk', 'security', 'pharmarep'],
    attacks: { zones: 'Contrast Bolus', ring: 'CT Gantry', spiral: 'MRI Gradient', volley: 'Wet Read' },
    q: [
      { q: 'Preferred imaging for suspected kidney stone in a non-pregnant adult?', a: ['Non-contrast CT abdomen/pelvis', 'Contrast-enhanced MRI', 'Plain KUB only', 'Nuclear renal scan'], why: 'Low-dose non-contrast CT is most sensitive and specific.' },
      { q: 'Free air under the diaphragm on an upright chest X-ray suggests:', a: ['Perforated hollow viscus', 'Pleural effusion', 'Hiatal hernia', 'Atelectasis'], why: 'Pneumoperitoneum usually means perforation (or recent surgery).' },
      { q: 'Initial imaging of choice for suspected acute cholecystitis?', a: ['Right upper quadrant ultrasound', 'CT with contrast', 'HIDA scan first', 'ERCP'], why: 'Ultrasound first; HIDA if equivocal.' },
      { q: 'After an inconclusive ultrasound, best imaging for suspected appendicitis in pregnancy?', a: ['MRI without gadolinium', 'CT with IV contrast', 'Barium enema', 'Abdominal X-ray'], why: 'MRI avoids ionizing radiation and gadolinium is generally avoided in pregnancy.' },
    ] },
  im: { name: 'Internal Medicine', boss: 'Dr. Eleanor Whitfield', setting: 'hospital', place: 'Medicine Wards', accent: '#7fb2ff',
    diseases: ['Pneumonia', 'Hyperkalemia', 'Thyroid Storm', 'Acute Kidney Injury', 'Upper GI Bleed'],
    staff: ['patient', 'patient', 'nurse', 'pharmacist', 'casemgr', 'labtech', 'exec', 'dietitian', 'pharmarep', 'pt', 'infection'],
    attacks: { ring: 'Morning Rounds', volley: 'Admission Orders', summon: 'Overnight Admits', spiral: 'Differential Spiral', zones: 'Problem List' },
    q: [
      { q: 'Hyperkalemia with peaked T waves — the first drug to give?', a: ['IV calcium gluconate', 'Sodium polystyrene sulfonate', 'Furosemide', 'Oral potassium binder only'], why: 'Calcium stabilizes the cardiac membrane; insulin/glucose then shift K⁺.' },
      { q: 'Most common bacterial cause of community-acquired pneumonia?', a: ['Streptococcus pneumoniae', 'Klebsiella pneumoniae', 'Pseudomonas aeruginosa', 'Legionella'], why: 'Pneumococcus remains the most commonly identified bacterial cause.' },
      { q: 'Low TSH with elevated free T4 indicates:', a: ['Primary hyperthyroidism', 'Primary hypothyroidism', 'Subclinical hypothyroidism', 'Euthyroid sick syndrome'], why: 'Excess thyroid hormone suppresses pituitary TSH.' },
      { q: 'Serum anion gap is calculated as:', a: ['Na⁺ − (Cl⁻ + HCO₃⁻)', 'Na⁺ + K⁺ − Cl⁻', '(Cl⁻ + HCO₃⁻) − Na⁺', '2 × Na⁺ + glucose/18'], why: 'Normal is roughly 8–12 mEq/L.' },
    ] },
  neuro: { name: 'Neurosurgery', boss: 'Dr. Adrian Voss', setting: 'or', place: 'Neurosurgical OR', accent: '#c084fc', final: true,
    diseases: ['Epidural Hematoma', 'Subdural Hematoma', 'Subarachnoid Hemorrhage', 'Hydrocephalus', 'Cauda Equina', 'Glioblastoma'],
    staff: ['patient', 'nurse', 'radtech', 'lawyer', 'exec', 'resident', 'security', 'infection', 'pharmarep', 'pt', 'dietitian'],
    attacks: { ring: 'Craniotomy', spiral: 'Stereotactic Spiral', dash: 'Burr Hole Rush', zones: 'Gamma Knife', summon: 'Neuro ICU Team', volley: 'Glasgow Barrage' },
    q: [
      { q: 'Lucid interval with a biconvex (lens-shaped) hematoma on CT:', a: ['Epidural hematoma', 'Subdural hematoma', 'Subarachnoid hemorrhage', 'Intraparenchymal hemorrhage'], why: 'Usually middle meningeal artery injury; does not cross suture lines.' },
      { q: 'A crescent-shaped hematoma that crosses suture lines is typically from:', a: ['Torn bridging veins (subdural)', 'Middle meningeal artery', 'Ruptured berry aneurysm', 'Lenticulostriate arteries'], why: 'Subdural hematomas arise from bridging veins; common in elderly and alcohol use.' },
      { q: "Cushing's triad of raised intracranial pressure:", a: ['Hypertension, bradycardia, irregular respirations', 'Hypotension, tachycardia, fever', 'Hypertension, tachycardia, hyperthermia', 'Miosis, ptosis, anhidrosis'], why: 'It signals impending herniation.' },
      { q: '"Worst headache of my life" — first test?', a: ['Non-contrast head CT', 'MRI brain with gadolinium', 'EEG', 'Carotid ultrasound'], why: 'Non-contrast CT first; LP if negative and suspicion remains.' },
      { q: 'Saddle anesthesia with urinary retention and leg weakness — next step?', a: ['Emergent MRI and surgical decompression', 'NSAIDs and follow-up in 2 weeks', 'Physical therapy referral', 'Lumbar epidural steroid injection'], why: 'Cauda equina syndrome is a surgical emergency.' },
      { q: 'The lowest possible Glasgow Coma Scale score is:', a: ['3', '0', '1', '5'], why: 'GCS ranges from 3 to 15.' },
    ] },
};
const FIXED_ORDER = ['peds', 'psych', 'fm'];
const RANDOM_POOL = ['ent', 'obgyn', 'cards', 'em', 'surg', 'derm', 'ortho', 'anes', 'rads', 'im'];

const CLASSROOM = { name: 'Medical School', place: 'MS1 Lecture Hall', setting: 'classroom', accent: '#e0b070',
  diseases: [], staff: ['stdpatient', 'stdpatient', 'classmate', 'labtech', 'phleb'] };

const FIRST_NAMES_F = ['Avery', 'Maya', 'Sofia', 'Priya', 'Chloe', 'Leah', 'Nora', 'Grace'];
const FIRST_NAMES_M = ['Ethan', 'Noah', 'Daniel', 'Lucas', 'Omar', 'Kenji', 'Mateo', 'Ryan'];

// ---------- PRIMARY WEAPONS (one random at the start; a second random one at max level) ----------
// rate = attacks/sec, dmg = multiplier on basic damage. kind: proj | beam | melee | chain | cone
const WEAPONS = {
  penlight:   { name: 'Diagnostic Penlight',  icon: '🔦', kind: 'beam',  rate: 5.0, dmg: 0.62, range: 520, desc: 'Rapid beams of focused light that hit instantly.' },
  syringe:    { name: 'Syringe Launcher',     icon: '💉', kind: 'proj',  rate: 2.6, dmg: 1.0, spd: 720, proj: 'syringe', life: 0.95, poison: true, color: '#7fe3ff', desc: 'Fires loaded syringes that leave a lingering toxin.' },
  hammer:     { name: 'Reflex Hammer',        icon: '🔨', kind: 'melee', rate: 2.0, dmg: 1.9, range: 118, arc: 1.9, desc: 'Heavy close-range swings that knock enemies back.' },
  scalpel:    { name: 'Scalpel Throwers',     icon: '🔪', kind: 'proj',  rate: 3.0, dmg: 0.95, spd: 840, proj: 'scalpel', life: 0.8, pierce: 1, color: '#e8eef5', desc: 'Spinning scalpels that slice through two targets.' },
  defib:      { name: 'Defibrillator Paddles', icon: '⚡', kind: 'chain', rate: 1.4, dmg: 2.0, range: 430, chains: 2, desc: 'Electric shocks that arc between up to three enemies.' },
  stapler:    { name: 'Surgical Stapler',     icon: '📎', kind: 'proj',  rate: 7.0, dmg: 0.45, spd: 940, proj: 'staple', life: 0.7, spread: 0.09, color: '#d5dde6', desc: 'A rapid stream of steel surgical staples.' },
  cryo:       { name: 'Cryo Spray',           icon: '❄️', kind: 'cone',  rate: 6.5, dmg: 0.5, range: 235, arc: 0.75, desc: 'A liquid-nitrogen cone that slows everything it touches.' },
  pills:      { name: 'Pill Bottle Blaster',  icon: '💊', kind: 'proj',  rate: 1.3, dmg: 0.55, spd: 660, proj: 'pill', life: 0.55, count: 6, spread: 0.5, color: '#ff7ad9', desc: 'A shotgun burst of six tumbling pills.' },
  ultrasound: { name: 'Ultrasound Wand',      icon: '〰️', kind: 'proj',  rate: 1.6, dmg: 1.6, spd: 540, proj: 'wave', life: 0.62, pierce: 99, r: 18, color: '#9fd0ff', desc: 'Sound-wave arcs that pass through every enemy in a line.' },
  castsaw:    { name: 'Cast Saw',             icon: '⚙️', kind: 'proj',  rate: 1.1, dmg: 1.3, spd: 640, proj: 'saw', life: 1.25, pierce: 99, r: 14, boomerang: true, color: '#ffd08a', desc: 'An oscillating saw blade that flies out and returns.' },
};
const WEAPON_KEYS = Object.keys(WEAPONS);
const HAIR_STYLES = {
  m: [['short', 'Short'], ['buzz', 'Buzz'], ['receding', 'Receding'], ['sidepart', 'Side Part'], ['curly', 'Curly Top'], ['spiky', 'Spiky']],
  f: [['ponytail', 'Ponytail'], ['long', 'Long'], ['bun', 'Bun'], ['bob', 'Bob'], ['braid', 'Braid'], ['afro', 'Curly']],
};
