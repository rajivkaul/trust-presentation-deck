# AGENTS.md — "Nobody Trusts Your AI" (ProductCamp RTP) deck

Instructions for any coding agent (Hermes, Claude, GPT/Codex) and for people editing this repo.
Hermes, Codex and most agents load this file automatically. `CLAUDE.md` points here.

## What this repo is

A single-page HTML slide deck. `index.html` is the whole deck (HTML, CSS and JS in one file). Images sit next to it in the repo root.
There is no framework, no npm and no build step for most slides. Open `index.html` in a browser, or serve it locally:

```bash
python3 -m http.server 8765   # then open http://127.0.0.1:8765
```

Keys: → / ← (or a clicker) move forward/back, Home / End jump to first/last slide, `V` opens the principle cards, Esc closes overlays. Drawing tools are on the bottom toolbar.

## Where each slide's content lives

| Slides | What | Edit here |
|---|---|---|
| 1–13 | Story, autopsies, trust framework, five-steps carousel | the `SLIDES` array in `index.html` (search `const SLIDES` / each `{h:'…'}` object) |
| 14–18 | **Processes 1–5** (wireframe case study with numbered pointers) | `deck-src/` (generated, see below) |
| 19 | Ten questions / cards | `SLIDES` array in `index.html` |
| 20 | **Key Takeaways** (sketch cards, quote, principles, CTA) | `deck-src/content/key-takeaways.json` (generated) |

Each slide object has `notes:"…"` = speaker notes.

## Generated parts: always edit `deck-src/`, then rebuild

Two parts of `index.html` are generated from `deck-src/`. Anything between these markers is overwritten on every build, so never hand-edit it:

- `/* PROCESS-SLIDES:START */ … /* PROCESS-SLIDES:END */` (slides 14–18)
- `/* TAKEAWAYS:START */ … /* TAKEAWAYS:END */` (slide 20)
- `<style id="process-css">`, `<style id="takeaways-css">`, `<script id="process-js">`

```
deck-src/
  build.py                     # rebuild script (Python 3, standard library only)
  content/process-slides.json  # all text for processes 1–5: attributes, principles, tooltips, captions, notes, roles
  content/key-takeaways.json   # title, sketch slot, quote, byline, step cards, principles, CTA
  screens/p1.html … p5.html    # the wireframe UI for each process (HTML stencils)
  styles/process.css           # wireframe + pointer + tooltip styles
  styles/takeaways.css         # Key Takeaways styles
  scripts/process.js           # pointer/step engine (arrows, pins, tooltips, spotlight)
```

Rebuild and validate after every change:

```bash
python3 deck-src/build.py --check   # validates JSON, pin ids, image files; changes nothing
python3 deck-src/build.py           # writes index.html
```

`--check` fails loudly if a pointer refers to an element id that is not in the screen HTML, or if an image file is missing.

## Common edits (recipes)

**Change a tooltip (pointer explanation).** `content/process-slides.json` → `processes[n].pins["<attribute number>"]`: `t` = tooltip title, `b` = tooltip body. Process 1 groups pins by role: `pins.assistant`, `pins.coach`, `pins.collaborator`.

**Change a supporting attribute or its principles.** `processes[n].attributes[i].title` / `.principles` (e.g. `"Capability · Honesty"`). Attribute *i* (1-based) is pointer number *i*. Keep 4 attributes per process.

**Change the caption above a screen (processes 2–5).** `processes[n].captions["<attribute number>"]`.

**Change speaker notes.** `processes[n].speaker_notes`, or `speaker_notes` in key-takeaways.json.

**Change which element a pointer highlights.** Set `pins[...].el` to the `id` of an element in `screens/pN.html`. Pins, spotlight and tooltip position themselves automatically, so no coordinates are needed.

**Change the UI on a screen (UI patterns).** Edit `screens/pN.html`. Each `<div class="wf-scr">` is one screen:
- Processes 2–5: `data-on="1"` / `data-on="1 2"` / … = the attribute numbers that show this screen.
- Process 1: `data-role="assistant|coach|collaborator"` = the role tab.
- Keep the `id`s that pins reference. If you rename one, update `el` in the JSON.
- The screen canvas is 1000×700 px inside a browser frame (`.wf-win`). It scales to fit.

**Change an illustration.** Replace the image file in the repo root with the same name, or point the JSON at a new file:
- Process sketches: `sketch-step1-define-role.jpg` … `sketch-step5-measure-directions.jpg` (`processes[n].sketch`).
- Role tab icons: `role-assistant.png`, `role-coach.png`, `role-collaborator.png` (`processes[0].roles[].icon`).
- Key Takeaways: the sketch slot is `kt-sketch.svg` (hand-drawn style, replaceable). The five cards are `kt-s1.jpg` … `kt-s5.jpg` (tightly cropped copies of the step sketches).

**Change the Key Takeaways text or CTA.** `content/key-takeaways.json`: `title`, `quote`, `byline`, `principles_heading`, `principles[]`, `cta.title`, `cta.subtitle`, `cta.url` (currently https://www.intelligaia.com/contact/).

**Change slides 1–13 / 19.** Edit the matching object in the `SLIDES` array in `index.html` directly (text, `notes`, image `src`).

## Wireframe design rules (keep these when changing screens)

These are agreed decisions. Do not undo them without asking.

- **Wireframes, not real UI.** Use the browser frame and no left nav. Use grey stencil bars (`<i class="ln">`; `.ln.d` darker, `.ln.l` lighter) instead of text. The only real words allowed are "How can I help you?", "Customer name", "Total agreements: 16", "AI summary" labels, "Try asking", and numbers (e.g. 790, 3.2K, 97). Page titles are big stencils (`<i class="ln d ttl">`), not words.
- **Colour.** Yellow (`.btn.y`) only for the main or AI action (approve, allow, send, run, AI buttons). Everything else is black, greys and white: icons grey, cards white, stencils light grey, background light grey.
- **AI summary.** Wherever an AI summary appears, show the AI sparkle icon + the label "AI summary" above it.
- **Buttons without words.** Icon + stencil (e.g. tick + bar for approve), or icon-only buttons (`.btn.ib`).
- **Agentic search is one component everywhere:** `+` button, source chips, mic and send, no text. In the assistant side panel it sits at the top. On full-page (immersive) chat screens it sits at the bottom.
- **Naming.** No Cisco or Atlas names. Use plain parallels ("Hardware Licensing Management", "device inventory", "coverage rules"). The only customer name is **Northwind Labs**.
- **Pointer numbering** reads top to bottom on each screen (1, 2, 3, 4). On process 1, an attribute with no pin on the current role tab is greyed out automatically.

## Presenter behaviour (implemented in `scripts/process.js`)

- A slide opens clean: no fade, pins shown as outlines.
- → / clicker: highlights the next pointer (fades the screen, lifts the element, shows the tooltip beside it). After the last pointer, it moves to the next slide. Process 1 runs Assistant 1→3, Coach 1→4, Collaborator 1→4 and switches tabs automatically.
- ←: steps back one pointer, or goes to the previous slide from a clean screen.
- Clicking a pin or an attribute jumps to it. Clicking it again, or anywhere on the screen, clears it.

## Verify before committing

1. `python3 deck-src/build.py --check` passes, then run `python3 deck-src/build.py`.
2. Open the deck and walk slides 14–18 with → only: every pointer appears in order, tooltips sit beside the element and never under the toolbar.
3. Check at 1366×768 and 1920×1080 that nothing overlaps the bottom toolbar.
4. No console errors.

## Housekeeping

- `index.html` also contains older, unused CSS/JS blocks from earlier iterations of slides 14–18 (classes `stx`, `mk-`, `s2`, `px`). They are harmless. Leave them unless you are doing a careful cleanup, and test navigation afterwards. The `stx-on` body toggle in that code is still used.
- Commit images together with the change that uses them. Keep image file names stable, because the JSON and `index.html` refer to them by name.
