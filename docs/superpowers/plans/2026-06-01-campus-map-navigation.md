# Campus Map Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users view campus map navigation directly in WeChat DevTools from the guide page and place detail page.

**Architecture:** Keep the native mini program `<map>` as the display surface. Use `locationMapHelper` to build reusable navigation markers, route polyline, include points, and distance text; page code only handles user actions and WeChat API calls.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JavaScript, Node smoke tests.

---

### Task 1: Navigation Layer Helper Coverage

**Files:**
- Modify: `tests/location-map.test.js`
- Modify: `utils/locationMapHelper.js`

- [ ] Add tests for building a complete navigation state from origin and destination.
- [ ] Run `node tests/location-map.test.js` and confirm the new test fails before implementation.
- [ ] Add a helper that returns markers, polyline, include points, distance text, and center.
- [ ] Re-run `node tests/location-map.test.js`.

### Task 2: Map Page Navigation UX

**Files:**
- Modify: `pages/map/map.js`
- Modify: `pages/map/map.wxml`
- Modify: `pages/map/map.wxss`
- Modify: `app.json`

- [ ] Add `openLocation` to `requiredPrivateInfos`.
- [ ] Defer pending detail-page navigation until place data is loaded and map context is ready.
- [ ] Merge normal map layers with navigation layers in one method so filters do not erase navigation.
- [ ] Add direct navigation buttons to recommended cards and directory rows.
- [ ] Keep event propagation from opening the detail page when tapping a navigation button.

### Task 3: Verification

**Files:**
- Test: `tests/location-map.test.js`

- [ ] Run `node tests/location-map.test.js`.
- [ ] Run the existing helper tests most relevant to campus navigation data: `node tests/utils-smoke.test.js` and `node tests/request-services.test.js`.
- [ ] Report that WeChat DevTools still needs manual Compile/Preview because this environment cannot launch the IDE.
