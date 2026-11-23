# Residency — The Long Call

A browser action RPG about a medical student fighting their way from the lecture hall, through clinics and hospital wards, to becoming a doctor.

**Play:** open `index.html` in any modern browser. It's a single self-contained file with no install and no server.

## Features
- Male or female student doctor with customizable skin tone, hair color, scrubs and 6 hair styles per gender
- 10 primary weapons (penlight, syringe launcher, reflex hammer, scalpels, defibrillator, surgical stapler, cryo spray, pill blaster, ultrasound wand, cast saw); one is chosen at random each playthrough, and a second random weapon unlocks at max level
- Real-time action combat against patients (labeled with their disease), nurses, pharmacists, lab and radiology techs, phlebotomists, executives, insurance reviewers, malpractice attorneys and more
- 15 stages: MS1 Lecture Hall → Pediatrics → Psychiatry → Family Medicine → 10 randomized specialties → Neurosurgery (final boss)
- 2 waves of patients and staff per rotation (3 for the Neurosurgery finale), then an attending boss with unique attack patterns who stops mid-fight to "pimp" you with board-style questions (~170 high-yield questions; repeats are avoided until a specialty's bank is used up)
- Two currencies: **Money** (gear and coffee) and **Brain Power** (talents and skills)
- 4 talent trees (Diagnostician, Surgeon, Bedside Manner, Pharmacology), each with 15 ranks and 2 active skills; the level-30 cap lets you complete exactly 2 trees
- 8 gear slots (Head, Shirt, Pants, Shoes, Stethoscope, Wrist, Left Ring, Right Ring); items roll random stats by rarity (Normal 2, Magic 3, Rare 4, Legendary 5)
- 4 rarity tiers with drop odds of Normal 73 / Magic 12 / Rare 8 / Legendary 4. Each shop restock holds at most 1 Legendary, 2 Rare and 2 Magic
- Adaptive procedural music: coffee-shop jazz in the halls, driving combat music in waves, and an orchestral choir duel for attending bosses
- Animated title screen, stat guide, saves to browser local storage, keyboard/mouse and touch controls

## Controls
| Key | Action |
|---|---|
| WASD / arrows | Move |
| Hold left mouse / Space | Attack |
| 1–4 | Active skills |
| Q | Drink coffee (heal) |
| I | Character & gear |
| T | Talents |
| Esc | Pause |

## Project layout
```
index.html        Built, playable game (generated — do not edit by hand)
build.py          Inlines src/ into index.html
src/
  shell.html      Page markup
  style.css       Styles
  data.js         Stats, gear, talents, enemies, specialties, weapons, hair styles
  questions.js    Expanded attending question bank
  weapons.js      Primary weapons and their effects
  game.js         Engine: world, combat, AI, bosses, rendering, HUD
  person.js       Character renderer
  music.js        Adaptive WebAudio music
  title.js        Animated title screen
  ui.js           Menus, shop, talents, gear, quizzes
```

To rebuild after editing `src/`:
```
python3 build.py
```

## Support
If you enjoy the game: https://paypal.me/medavid16
