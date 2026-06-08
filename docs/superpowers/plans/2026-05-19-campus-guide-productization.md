# Campus Guide Productization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the mini program from a course-oriented demo into a freshman-facing campus assistant MVP.

**Architecture:** Keep the current native WeChat Mini Program structure. Extend `utils/explorationCheckinHelper.js` as the single source of truth for route progress, next stop, and check-in history, then consume those fields from home, map, and user pages.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JS, CommonJS utility modules, Node-based smoke tests.

---

### Task 1: Exploration Mission Data

**Files:**
- Modify: `tests/exploration-checkin.test.js`
- Modify: `utils/explorationCheckinHelper.js`

- [ ] Add failing tests for route tasks, next route place, and enriched check-in history.
- [ ] Run `node tests/exploration-checkin.test.js` and verify the new tests fail because the helper API does not exist yet.
- [ ] Implement `getRouteTasks`, `getNextRoutePlace`, `getCheckinHistory`, and summary fields.
- [ ] Run `node tests/exploration-checkin.test.js` and verify all exploration tests pass.

### Task 2: Product Copy Guard

**Files:**
- Create: `tests/product-copy.test.js`
- Modify: runtime copy under `pages/`, `utils/*Data.js`, `utils/services/homeService.js`, and `README.md`

- [ ] Add a failing copy guard for course-assignment language in runtime-facing files.
- [ ] Run `node tests/product-copy.test.js` and verify it fails on current copy.
- [ ] Replace course-assignment wording with product language.
- [ ] Run `node tests/product-copy.test.js` and verify it passes.

### Task 3: Productized Page Flow

**Files:**
- Modify: `utils/services/homeService.js`
- Modify: `pages/index/index.js`
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`
- Modify: `pages/map/map.js`
- Modify: `pages/map/map.wxml`
- Modify: `pages/map/map.wxss`
- Modify: `pages/user/user.js`
- Modify: `pages/user/user.wxml`
- Modify: `pages/user/user.wxss`

- [ ] Feed route tasks, next place, and check-in history into relevant pages.
- [ ] Make the homepage show the next campus stop and current mission state.
- [ ] Make the map route panel show progress status and completion feedback.
- [ ] Make the user page show exploration footprint and badge state.
- [ ] Run the full Node smoke test set.

