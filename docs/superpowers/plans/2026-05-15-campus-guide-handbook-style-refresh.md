# Campus Guide Handbook Style Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-theme the flagship campus mini program from aqua campus cards into a warm handbook / guidebook visual system while preserving the current richer product structure.

**Architecture:** Keep the current page structure, request facade, and flagship information architecture intact, but replace the global visual tokens, surface hierarchy, and key page-specific layout rhythms with a handbook-style system. Start from shared global styles and anchor pages (`home`, `map`, `study`), then carry the new system through details, personal center, and secondary pages.

**Tech Stack:** WeChat Mini Program native framework, WXML, WXSS, JavaScript, local Mock data, Node smoke tests

---

## File Structure

### Global visual system

- Modify: `app.wxss`
  Replace aqua-first tokens with warm handbook palette and new shared surfaces.
- Modify: `components/place-card/place-card.wxss`
  Shift cards from glossy aqua cards to paper-guide cards.
- Modify: `components/study-card/study-card.wxss`
  Shift to handbook learning-card identity.
- Modify: `components/notice-item/notice-item.wxss`
  Shift to notice-board rhythm.

### Core page anchors

- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`
- Modify: `pages/map/map.wxml`
- Modify: `pages/map/map.wxss`
- Modify: `pages/study/study.wxml`
- Modify: `pages/study/study.wxss`

### Follow-through pages

- Modify: `pages/placeDetail/placeDetail.wxss`
- Modify: `pages/studyDetail/studyDetail.wxss`
- Modify: `pages/user/user.wxss`
- Modify: `pages/service/service.wxss`
- Modify: `pages/notice/notice.wxss`
- Modify: `pages/noticeDetail/noticeDetail.wxss`
- Modify: `pages/favorite/favorite.wxss`
- Modify: `pages/studyHistory/studyHistory.wxss`

### Verification

- Reuse existing tests:
  - `tests/content-filter.test.js`
  - `tests/flagship-selectors.test.js`
  - `tests/request-services.test.js`
  - `tests/utils-smoke.test.js`

---

### Task 1: Switch Global Palette and Shared Surfaces

**Files:**
- Modify: `app.wxss`
- Modify: `components/place-card/place-card.wxss`
- Modify: `components/study-card/study-card.wxss`
- Modify: `components/notice-item/notice-item.wxss`

- [ ] **Step 1: Write a failing quick style assertion**

Append a minimal regression check to `tests/utils-smoke.test.js` or create a tiny style smoke test that asserts the old dominant aqua tokens no longer remain as the primary page background. Because this repo does not currently test WXSS semantically, use a lightweight string check script:

```js
const fs = require('fs');
const text = fs.readFileSync('app.wxss', 'utf8');
if (text.includes('#f4fcff') || text.includes('#0891b2')) {
  console.error('FAIL old aqua-dominant palette still present');
  process.exit(1);
}
console.log('PASS handbook palette check');
```

- [ ] **Step 2: Run the palette check to verify it fails**

Run:

```powershell
@'
const fs = require('fs');
const text = fs.readFileSync('app.wxss', 'utf8');
if (text.includes('#f4fcff') || text.includes('#0891b2')) {
  console.error('FAIL old aqua-dominant palette still present');
  process.exit(1);
}
console.log('PASS handbook palette check');
'@ | node -
```

Expected:
- FAIL because the old aqua palette is still present

- [ ] **Step 3: Replace global tokens with handbook palette**

Update `app.wxss` so the dominant system uses:

```css
page {
  background: linear-gradient(180deg, #f6f0e6 0%, #f3eadf 45%, #fbf7f1 100%);
  color: #23354d;
}

.page {
  background:
    linear-gradient(180deg, rgba(140, 83, 62, 0.08), rgba(255, 255, 255, 0) 360rpx),
    linear-gradient(135deg, rgba(201, 138, 76, 0.08), rgba(255, 255, 255, 0) 60%);
}

.card {
  background: rgba(255, 251, 245, 0.96);
  border: 1rpx solid rgba(126, 94, 76, 0.12);
  box-shadow: 0 14rpx 30rpx rgba(73, 52, 39, 0.05);
}
```

Replace the shared aqua behaviors for:

- `.section-title__text`
- `.section-title__action`
- `.guide-chip`
- `.link-row__action`
- `.tag`
- `.type-pill`
- `.btn-primary`
- `.board-card`
- `.feature-place`

Target palette:

- ink blue: `#24364b`
- slate text: `#5f6f80`
- brick accent: `#a5533a`
- warm amber: `#c48a4d`
- paper: `#fffaf3`
- paper-alt: `#f6efe4`

Also restyle:

- `components/place-card/place-card.wxss`
- `components/study-card/study-card.wxss`
- `components/notice-item/notice-item.wxss`

to match the new paper-card / handbook look.

- [ ] **Step 4: Run verification for the shared style layer**

Run:

```powershell
@'
const fs = require('fs');
const text = fs.readFileSync('app.wxss', 'utf8');
if (text.includes('#f4fcff') || text.includes('#0891b2')) {
  console.error('FAIL old aqua-dominant palette still present');
  process.exit(1);
}
console.log('PASS handbook palette check');
'@ | node -
```

and:

```powershell
@'
const fs = require('fs');
for (const path of [
  'app.wxss',
  'components/place-card/place-card.wxss',
  'components/study-card/study-card.wxss',
  'components/notice-item/notice-item.wxss'
]) {
  const text = fs.readFileSync(path, 'utf8');
  let depth = 0;
  for (const ch of text) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth < 0) throw new Error('brace imbalance in ' + path);
  }
  if (depth !== 0) throw new Error('final brace depth ' + depth + ' in ' + path);
  console.log('PASS WXSS', path);
}
'@ | node -
```

Expected:
- handbook palette check PASS
- WXSS balance PASS

---

### Task 2: Re-theme Home, Map, and Study as Handbook Anchor Pages

**Files:**
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`
- Modify: `pages/map/map.wxml`
- Modify: `pages/map/map.wxss`
- Modify: `pages/study/study.wxml`
- Modify: `pages/study/study.wxss`

- [ ] **Step 1: Write a failing page-style smoke check**

Create a lightweight script that expects the core page styles to contain handbook signals after implementation, for example:

```js
const fs = require('fs');
const files = ['pages/index/index.wxss', 'pages/map/map.wxss', 'pages/study/study.wxss'];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('#24364b') && !text.includes('#a5533a')) {
    console.error('FAIL handbook palette missing in ' + file);
    process.exit(1);
  }
}
console.log('PASS anchor page handbook palette');
```

- [ ] **Step 2: Run the smoke check to verify it fails**

Run:

```powershell
@'
const fs = require('fs');
const files = ['pages/index/index.wxss', 'pages/map/map.wxss', 'pages/study/study.wxss'];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('#24364b') && !text.includes('#a5533a')) {
    console.error('FAIL handbook palette missing in ' + file);
    process.exit(1);
  }
}
console.log('PASS anchor page handbook palette');
'@ | node -
```

Expected:
- FAIL before the core pages are re-themed

- [ ] **Step 3: Re-theme the homepage**

Adjust `pages/index/index.wxss` and, where useful, `pages/index/index.wxml`:

- hero becomes a handbook cover block, likely ink-blue / brick / warm gradient instead of aqua
- quick actions become tighter and more like handbook index entries
- recommendation areas should use a paper-strip rhythm
- notices should feel more like bulletin excerpts than generic cards

Recommended visual changes:

```css
.dashboard-hero {
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 38%),
    linear-gradient(145deg, #24364b, #3d4e63, #8f563d);
  color: #fff8ef;
}
```

- [ ] **Step 4: Re-theme the map page**

Adjust `pages/map/map.wxss` and, where useful, `pages/map/map.wxml`:

- route panel should feel like a printed route guide
- static map should become flatter and more diagram-like
- search and filters should inherit handbook tabs instead of aqua pills
- list rhythm should separate route, highlights, map board, and list sections more clearly

- [ ] **Step 5: Re-theme the study page**

Adjust `pages/study/study.wxss` and, where useful, `pages/study/study.wxml`:

- progress panels should feel like course-book sections
- stage selectors should feel like handbook tabs
- featured topics should look like reading recommendations
- knowledge feed should feel more like article cards than soft SaaS cards

- [ ] **Step 6: Run verification for anchor pages**

Run:

```powershell
@'
const fs = require('fs');
const files = ['pages/index/index.wxss', 'pages/map/map.wxss', 'pages/study/study.wxss'];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('#24364b') && !text.includes('#a5533a')) {
    console.error('FAIL handbook palette missing in ' + file);
    process.exit(1);
  }
  console.log('PASS handbook palette', file);
}
'@ | node -
```

and:

```powershell
@'
const fs = require('fs');
for (const path of [
  'pages/index/index.wxml',
  'pages/map/map.wxml',
  'pages/study/study.wxml'
]) {
  const text = fs.readFileSync(path, 'utf8');
  console.log('PASS WXML read', path, text.length);
}
'@ | node -
```

Expected:
- palette check PASS
- WXML read PASS

---

### Task 3: Carry Handbook Style Through Detail and Personal Pages

**Files:**
- Modify: `pages/placeDetail/placeDetail.wxss`
- Modify: `pages/studyDetail/studyDetail.wxss`
- Modify: `pages/user/user.wxss`

- [ ] **Step 1: Write a failing quick follow-through check**

Use a lightweight script checking that detail and user pages adopt the handbook palette:

```js
const fs = require('fs');
for (const file of ['pages/placeDetail/placeDetail.wxss', 'pages/studyDetail/studyDetail.wxss', 'pages/user/user.wxss']) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('#24364b') && !text.includes('#a5533a')) {
    console.error('FAIL handbook palette missing in ' + file);
    process.exit(1);
  }
}
console.log('PASS handbook follow-through');
```

- [ ] **Step 2: Run the follow-through check to verify it fails**

Run the above script and confirm FAIL before implementation.

- [ ] **Step 3: Re-theme details and user**

Update:

- `pages/placeDetail/placeDetail.wxss`
- `pages/studyDetail/studyDetail.wxss`
- `pages/user/user.wxss`

to shift:

- detail heroes from aqua gradients to handbook hero blocks
- summary / guide / next-step blocks to paper or route-note surfaces
- user profile hero from soft aqua panel to profile-sheet treatment
- momentum / tool blocks to a stronger dashboard-paper hierarchy

- [ ] **Step 4: Run follow-through verification**

Run the quick palette check script again plus:

```powershell
@'
const fs = require('fs');
for (const file of [
  'pages/placeDetail/placeDetail.wxss',
  'pages/studyDetail/studyDetail.wxss',
  'pages/user/user.wxss'
]) {
  const text = fs.readFileSync(file, 'utf8');
  let depth = 0;
  for (const ch of text) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
  }
  if (depth !== 0) throw new Error('brace imbalance in ' + file);
  console.log('PASS WXSS', file);
}
'@ | node -
```

Expected:
- palette follow-through PASS
- WXSS balance PASS

---

### Task 4: Unify Secondary Pages Under the Handbook System

**Files:**
- Modify: `pages/service/service.wxss`
- Modify: `pages/notice/notice.wxss`
- Modify: `pages/noticeDetail/noticeDetail.wxss`
- Modify: `pages/favorite/favorite.wxss`
- Modify: `pages/studyHistory/studyHistory.wxss`

- [ ] **Step 1: Write a failing secondary-page style check**

Use a quick script:

```js
const fs = require('fs');
const files = [
  'pages/service/service.wxss',
  'pages/notice/notice.wxss',
  'pages/noticeDetail/noticeDetail.wxss',
  'pages/favorite/favorite.wxss',
  'pages/studyHistory/studyHistory.wxss'
];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('#24364b') && !text.includes('#a5533a')) {
    console.error('FAIL handbook palette missing in ' + file);
    process.exit(1);
  }
}
console.log('PASS secondary handbook palette');
```

- [ ] **Step 2: Run the secondary-page check to verify it fails**

Run the script and confirm FAIL before implementation.

- [ ] **Step 3: Re-theme the secondary pages**

Adjust the secondary WXSS files so:

- service feels like a service directory
- notice feels like a notice board
- notice detail feels like a printed notice sheet
- favorite feels like saved handbook bookmarks
- history feels like a learning timeline

This step is mostly WXSS, with only minimal WXML changes if absolutely necessary.

- [ ] **Step 4: Run the secondary-page verification**

Run the quick palette script again plus a WXSS brace check across those files.

Expected:
- secondary handbook palette PASS
- WXSS balance PASS

---

### Task 5: Run Full Verification and Capture Remaining Polish Gaps

**Files:**
- No new implementation files required
- Verification touches all updated files

- [ ] **Step 1: Run the full automated verification set**

Run:

```powershell
node tests/content-filter.test.js
node tests/flagship-selectors.test.js
node tests/request-services.test.js
node tests/utils-smoke.test.js
```

Expected:
- all test files PASS

- [ ] **Step 2: Run JS, WXML, and WXSS structural checks**

Run:

```powershell
@'
const fs = require('fs');
const jsFiles = [
  'pages/index/index.js',
  'pages/map/map.js',
  'pages/placeDetail/placeDetail.js',
  'pages/study/study.js',
  'pages/studyDetail/studyDetail.js',
  'pages/user/user.js',
  'pages/service/service.js',
  'pages/notice/notice.js',
  'pages/noticeDetail/noticeDetail.js',
  'utils/contentFilter.js',
  'utils/flagshipSelectors.js'
];
for (const file of jsFiles) {
  new Function(fs.readFileSync(file, 'utf8'));
  console.log('PASS JS', file);
}
'@ | node -
```

and:

```powershell
@'
const fs = require('fs');
const files = [
  'app.wxss',
  'pages/index/index.wxss',
  'pages/map/map.wxss',
  'pages/placeDetail/placeDetail.wxss',
  'pages/study/study.wxss',
  'pages/studyDetail/studyDetail.wxss',
  'pages/user/user.wxss',
  'pages/service/service.wxss',
  'pages/notice/notice.wxss',
  'pages/noticeDetail/noticeDetail.wxss',
  'pages/favorite/favorite.wxss',
  'pages/studyHistory/studyHistory.wxss',
  'components/place-card/place-card.wxss',
  'components/study-card/study-card.wxss',
  'components/notice-item/notice-item.wxss'
];
for (const path of files) {
  const text = fs.readFileSync(path, 'utf8');
  let depth = 0;
  for (const ch of text) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth < 0) throw new Error('brace imbalance in ' + path);
  }
  if (depth !== 0) throw new Error('final brace depth ' + depth + ' in ' + path);
  console.log('PASS WXSS', path);
}
'@ | node -
```

Expected:
- all JS checks PASS
- all WXSS checks PASS

- [ ] **Step 3: Record remaining optional polish points**

After verification, note any residual optional polish items such as:

- tighter notice typography
- richer bulletin dividers
- further compacting long lists
- image or illustration assets if the user wants another round later

No extra code in this step unless verification exposes a real issue.

---

## Self-Review

### Spec coverage

- style pivot to warm handbook palette: covered by Task 1
- homepage / map / study anchor-page re-theme: covered by Task 2
- detail / user follow-through: covered by Task 3
- secondary-page unification: covered by Task 4
- full verification after palette migration: covered by Task 5

### Placeholder scan

- No `TODO` or `TBD` placeholders remain
- Each task has explicit files, commands, and expected outcomes
- Verification commands are concrete and repo-appropriate

### Type consistency

- The plan avoids introducing new behavior-layer types unnecessarily
- Existing page data models stay intact while visual tokens and WXSS treatment change
- Shared file names and page paths match the current repo structure
