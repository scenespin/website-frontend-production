# EXAMPLES Media Production Tracker

Status: Active execution runbook
Owner: Marketing + Creative + Product
Scope: `website-frontend-production/app/examples/page.js`

## Objective

Produce a cohesive, screenplay-first showcase for `/examples` that is visually polished, truthful to current behavior, and fast for your team to execute.

Primary workflow on page:
1. Start With the Script
2. Auto-Detect Story Elements
3. Wryda AI Agents
4. Character Workflow (Virtual Try-On)
5. Location Workflow
6. Prop Workflow
7. Shots (Scene Builder + Shot Board)

Supporting surfaces (not primary steps):
- Final Generated Library (Live)
- Media Deep Dive (tabs)

---

## 0) Streamlined v2 Blueprint (Least-Change Plan)

Use this as the implementation target for a less crowded, writing-first story.

### Final section hierarchy (v2)
1. Write the Script
2. Auto-Detect Story Elements
3. Wryda AI Agents
4. Characters (Clothing References)
5. Locations (Angles, Backgrounds, Close-Ups)
6. Props
7. Shots

### Keep vs change (minimal engineering)
- Keep existing card components, 16:9 framing, and lightbox behavior.
- Add one new Agents card block between Step 2 and current Character block.
- Renumber visible headings/copy only.
- Keep Final Generated Library and Media Deep Dive as secondary sections below the primary 1-7 flow.
- Do not add a primary Videos step.

### Model-flexibility footer line (under Shots)
`Model-agnostic by design: take approved shots into your preferred video workflow.`

---

## 1) Story World Lock (Do This First)

Story world: `The Last Witness` (neo-noir detective thriller)

Visual style lock (all outputs):
- low-key cinematic lighting
- rainy night atmosphere
- grounded realism (no stylized fantasy drift)
- restrained palette: charcoal, steel blue, warm practical highlights

If an output breaks this style lock, reject and regenerate.

---

## 1A) Universal Prompt Macro (Copy/Paste)

Use this as the first line in every generation prompt (character, location, and prop):

`Neo-noir cinematic realism, grounded production design, low-key lighting, rainy-night atmosphere, restrained palette (charcoal, steel blue, warm practical highlights), natural skin/material detail, continuity-safe output, no fantasy/anime/stylized drift, no surreal elements, no exaggerated proportions.`

Usage:
- Paste this macro first.
- Then append the section-specific prompt (character/location/prop instructions below).
- Keep this macro unchanged across the full run so style remains consistent.

---

## 2) Launch Asset Targets (Exact Counts)

Total launch target: **26 images**

- Characters: 8
  - 2 reference images
  - 6 generated outputs (3 per character)
- Location: 8
  - 1 reference image
  - 3 angle outputs
  - 3 background outputs
  - 1 extreme close-up background plate
- Props: 10
  - 2 reference images
  - 6 angle outputs (3 per prop)
  - 2 macro detail plates (1 per prop)

---

## 3) UI Slot Map (Exact)

| Slot ID | Section | UI placement | Asset type | What to place |
|---|---|---|---|---|
| `S1_SCRIPT_CAPTURE` | 1) Start With the Script | right card in 2-column row | screenshot | screenplay workspace with canonical scene loaded |
| `S2A_SCRIPT_CONTEXT_CAPTURE` | 2) Auto-Detect Story Elements | card 1 of 3 | screenshot | script context showing heading + names |
| `S2B_CHARACTER_DETECT_CAPTURE` | 2) Auto-Detect Story Elements | card 2 of 3 | screenshot | detected character list |
| `S2C_LOCATION_DETECT_CAPTURE` | 2) Auto-Detect Story Elements | card 3 of 3 | screenshot | detected location list |
| `S3_AGENTS_CAPTURE` | 3) Wryda AI Agents | hero card | screenshot | script + agent result in one frame |
| `S3_AGENTS_OUTPUT_STRIP` | 3) Wryda AI Agents | supporting row | screenshot/image | 1-3 concise output examples (optional) |
| `S3_CHAR_REFERENCE` | 4) Character Workflow | card 1 of 4 | image | reference image |
| `S3_CLOTHING_INPUT` | 4) Character Workflow | card 2 of 4 | image | clothing reference |
| `S3_TRYON_RESULT` | 4) Character Workflow | card 3 of 4 | image | try-on output |
| `S3_FINAL_POSES` | 4) Character Workflow | card 4 of 4 | image | final generated pose sample (single image accepted) |
| `S4_LOCATION_REFERENCE` | 5) Location Workflow | card 1 of 4 | image | reference image |
| `S4_LOCATION_ANGLES` | 5) Location Workflow | card 2 of 4 | image | angle output sample (single image accepted) |
| `S4_LOCATION_BACKGROUNDS` | 5) Location Workflow | card 3 of 4 | image | background output sample (single image accepted) |
| `S4_LOCATION_XCU` | 5) Location Workflow | card 4 of 4 | image | close-up texture plate |
| `S5_PROP_REFERENCE` | 6) Prop Workflow | card 1 of 3 | image | reference image |
| `S5_PROP_ANGLES` | 6) Prop Workflow | card 2 of 3 | image | angle output sample (single image accepted) |
| `S5_PROP_MACRO` | 6) Prop Workflow | card 3 of 3 | image | macro detail output |
| `S7_SCENEBUILDER_CAPTURE` | 7) Shots | card 1 of 2-3 | screenshot | Scene Builder overview |
| `S7_SHOTBOARD_CAPTURE` | 7) Shots | card 2 of 2-3 | screenshot | Shot Board overview |
| `S7_TEASER_CAPTURE` | 7) Shots (optional) | card 3 (optional) | image/frame | strongest teaser frame |

Important:
- Section 6 (`Final Generated Library`) is live API content (`ShowcaseGallery`) from demo account data, not static file replacement.
- Collages are optional across walkthrough cards; one strong sample image per slot is acceptable.
- Keep existing filename conventions where possible for minimal migration effort.

---

## 3A) Wryda AI Agents Capture SOP (5 Agents, No Clutter)

You do not need 5 separate giant screenshots.

### Recommended single-screenshot method (best)
- Capture one frame showing:
  - script panel (left or top)
  - AI agent panel/result (right or bottom)
  - a visible control/context element indicating agent choice (tab, dropdown, selector, or list)
- Goal: prove both "agent choice" + "scene transformation" in one image.
- Slot: `S3_AGENTS_CAPTURE`
- Filename: `cap_s3_agents_capture_01.jpg`

### Optional supporting strip (1-3 mini examples)
- Add up to 3 small examples only if needed:
  - rewrite tone
  - scene extension
  - dialogue polish
- Slot: `S3_AGENTS_OUTPUT_STRIP` (optional)
- Filename: `cap_s3_agents_output_strip_01.jpg`

Pass/fail:
- PASS: one glance shows script -> AI-assisted output and agent choice context.
- FAIL: pure text wall, no clear "before/after" relation, or no agent UI context.

---

## 4) Canonical Script Block (Use For Capture Consistency)

```fountain
Title: The Last Witness

INT. INTERROGATION ROOM - NIGHT

Rain taps the narrow window. A steel table sits under a hard overhead light.

DETECTIVE MARA VOSS enters, sets a CASE FILE and a DIGITAL VOICE RECORDER on the table, then sits across from ELI TRENT.

MARA
Let's start again. From the beginning.

Eli avoids her eyes. His hands shake.

ELI
I already told patrol everything.

Mara presses RECORD on the voice recorder.

MARA
Not everything.
```

---

## 5) Step 2 Auto-Detect Capture Checklist (A/B/C Exact)

Step 2 is a true 3-card proof sequence. No collage slot.

### A) `S2A_SCRIPT_CONTEXT_CAPTURE`
- Source: script editor
- Must show:
  - `INT. INTERROGATION ROOM - NIGHT`
  - `DETECTIVE MARA VOSS`
  - `ELI TRENT`
- Crop target: heading + relevant action lines + at least one dialogue line

### B) `S2B_CHARACTER_DETECT_CAPTURE`
- Source: characters panel/list
- Must show:
  - `Mara Voss`
  - `Eli Trent`
- Crop target: panel title/header + both names in one frame

### C) `S2C_LOCATION_DETECT_CAPTURE`
- Source: locations panel/list
- Must show:
  - `Interrogation Room`
- Crop target: header + row/card containing location name

Step 2 footer text (must match page):

`Script context auto-drives character and location setup. Props are manually added and attached per scene for production control.`

---

## 6) Character Plan (Exact)

### Character set
- C1: Detective Mara Voss (lead)
- C2: Eli Trent (witness)

### Outfit execution matrix

| Character | O1 (baseline) | O2 (variation) |
|---|---|---|
| Mara | charcoal blazer + white collared shirt | black raincoat layered over O1 |
| Eli | dark hoodie + light jacket | same silhouette with rain/damp texture |

### Character generation sequence
1. Upload 2 character references (Mara and Eli)
2. Generate A/B/C poses for each character (6 outputs)
3. Run try-on for Mara O2 and Eli O2
4. Build `S3_FINAL_POSES` collage from the strongest 2-3 approved outputs

### Character prompt pack (starter)

Base identity prompt:
`Use provided character reference as identity anchor. Preserve face geometry, age range, proportions, hairstyle, and realism. Maintain neo-noir cinematic tone and grounded wardrobe.`

Pose A add-on:
`front-facing, neutral stance, controlled expression, cinematic key light`

Pose B add-on:
`3/4 profile, camera-left, subtle tension in posture, continuity-safe wardrobe`

Pose C add-on:
`tight close-up, heightened emotional intensity, realistic skin detail`

Try-on prompt:
`Apply provided clothing to the same identity. Preserve face, body proportions, and realism. Change wardrobe only; no identity drift.`

Try-on pass/fail:
- PASS: same person, wardrobe clearly changed, style consistent
- FAIL: changed face, changed body type, stylized drift

---

## 7) Location Plan (Exact)

### Location set
- L1 Interrogation Room

### Generation sequence
1. Upload reference
2. Generate 3 angle outputs
3. Generate 3 background variants
4. Generate 1 close-up texture plate

### Location prompt pack (starter)

Base prompt:
`Use provided location reference as structural anchor. Preserve spatial identity and realistic materials. Keep neo-noir lighting and continuity.`

Angle variants:
- wide establishing
- medium alternative camera position
- deeper perspective / over-shoulder-style framing

Background variants:
- neutral practical lighting
- rain-reflective mood
- higher-contrast dramatic mood

XCU plate direction:
- emphasize texture continuity (glass, brick, table grain, concrete moisture)

Location-specific direction:
- L1 Interrogation Room:
  - steel table, hard overhead practical, narrow window with rain cues
  - keep interrogation geometry consistent across all variants

---

## 8) Prop Plan (Exact)

### Prop set
- P1 Digital voice recorder
- P2 Case file folder

### Generation sequence per prop
1. Upload reference
2. Generate 3 angles (top, 3/4, side)
3. Generate 1 macro detail output

### Prop prompt pack (starter)

Base prompt:
`Use provided prop reference as identity lock. Preserve shape, material cues, and realistic scale. Keep lighting style grounded and cinematic.`

Macro detail direction examples:
- recorder LED and button detail
- brass key teeth through bag plastic
- phone screen/caller ID glow
- case file stamp and tab texture

---

## 9) Section 6 vs Section 8 (Important Distinction)

### Section 6: `Final Generated Library (Live)`
- Source: demo account API (`ShowcaseGallery`)
- Content: real characters/locations/props in live order
- Use case: proof of live data quality + curation impact

### Section 8: `Media Deep Dive`
- Source: tabbed explanatory interface
- Content: workflow context + secondary visual drill-down
- Use case: explain process, not replace library

---

## 10) Drop-In Filenames (Exact Paths)

Place all files here:
`website-frontend-production/public/examples/captures/`

Extension support on `/examples`:
- The page now auto-tries each slot as `.jpg`, then `.jpeg`, then `.png`.
- Keep the same base filename (example: `cap_s3_tryon_result_01`) and any of those 3 extensions will load.

- `cap_s1_script_capture_01.jpg`
- `cap_s2a_script_context_01.jpg`
- `cap_s2b_characters_detected_01.jpg`
- `cap_s2c_location_detected_01.jpg`
- `cap_s3_agents_capture_01.jpg`
- `cap_s3_agents_output_strip_01.jpg` (optional)
- `cap_s3_character_reference_01.jpg`
- `cap_s3_clothing_input_01.jpg`
- `cap_s3_tryon_result_01.jpg`
- `cap_s3_final_poses_01.jpg`
- `cap_s4_location_reference_01.jpg`
- `cap_s4_location_angles_01.jpg`
- `cap_s4_location_backgrounds_01.jpg`
- `cap_s4_location_xcu_01.jpg`
- `cap_s5_prop_reference_01.jpg`
- `cap_s5_prop_angles_01.jpg`
- `cap_s5_prop_macro_01.jpg`
- `cap_s7_scenebuilder_capture_01.jpg`
- `cap_s7_shotboard_capture_01.jpg`
- `cap_s7_teaser_capture_01.jpg`

---

## 11) End-to-End Execution Order (Strict)

### Phase A — Script + entity lock
1. Open/create screenplay
2. Write directly in Wryda (or paste/import/scan)
3. Verify auto-detected characters + location
4. Add props manually and attach to scene

### Phase B — Characters
5. Capture `S3_AGENTS_CAPTURE` (and optional output strip)
6. Upload 2 character references
7. Generate 6 character outputs
8. Run try-on passes
9. Build Character slot images

### Phase C — Locations
10. Complete L1 set
11. Build Location slot images

### Phase D — Props
12. Complete P1 set
13. Complete P2 set
14. Build Prop slot images

### Phase E — Captures
15. Capture S1
16. Capture S2A
17. Capture S2B
18. Capture S2C
19. Capture S7 Scene Builder
20. Capture S7 Shot Board
21. Capture S7 Teaser (optional)

### Phase F — Live library curation
22. Curate first 2 characters (strongest first)
23. Curate strongest location outputs first (single-location variants)
24. Curate first 2 props (strongest first)
25. Verify `/examples` live sequencing

---

## 12) Screenshot Quality Standards

Every screenshot should:
- be taken at desktop width
- avoid dev overlays/loaders/tooltips blocking key text
- keep labels and entity names readable at card size
- match the same screenplay/project context

Reject screenshots if:
- key names are cropped or blurry
- they show unrelated projects/assets
- they conflict with the style lock

---

## 13) Final QA Gate (Release Blocker Checklist)

- Step 2 is truthful: auto-detect covers characters + location only
- Step 2 shows 3 discrete cards (script / characters / location)
- Agents section clearly demonstrates script + AI-assisted output with visible agent selection context
- Props are represented in Step 5 and Section 6 live gallery
- Character identity continuity is stable across try-on and poses
- Location and prop continuity sets are complete
- Section 7 has Scene Builder + Shot Board + teaser frame
- Section 6 character ordering is curated (top 2), with strongest single-location variants and top-2 prop ordering first

If any line fails, fix before publish.

---

## 14) Fillable Production Board

| Task | Owner | Status (TODO / IN_PROGRESS / DONE) | Notes |
|---|---|---|---|
| Script lock complete |  | TODO |  |
| Auto-detect verified (char + loc) |  | TODO |  |
| Agents capture complete |  | TODO |  |
| Props manually attached |  | TODO |  |
| Character set complete |  | TODO |  |
| Location set complete (single location) |  | TODO |  |
| Prop set complete (2 props) |  | TODO |  |
| S1 + S2A/S2B/S2C captured |  | TODO |  |
| Section 4 cards populated (Characters) |  | TODO |  |
| Section 5 cards populated (Locations) |  | TODO |  |
| Section 6 cards populated (Props) |  | TODO |  |
| Section 7 cards populated |  | TODO |  |
| Section 6 curation finalized |  | TODO |  |
| Final QA gate passed |  | TODO |  |
