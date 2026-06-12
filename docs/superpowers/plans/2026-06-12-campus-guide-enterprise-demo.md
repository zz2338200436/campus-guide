# Campus Guide Enterprise Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the project into an enterprise-demo WeChat Mini Program where product experience is the focus and backend/API readiness is lightweight.

**Architecture:** Keep the existing native WeChat Mini Program and Mock service architecture. Improve primary product-facing docs, add a simple test entry point, introduce a request adapter boundary, and polish core student-facing pages without building a Web admin or full Spring Boot backend.

**Tech Stack:** WeChat Mini Program native framework, JavaScript CommonJS modules, WXML/WXSS, Node smoke tests, local Mock data.

---

## File Structure

- Modify `README.md`: product-first enterprise demo positioning and simple verification command.
- Create `package.json`: unified `npm test` script for all existing smoke tests.
- Create `tests/run-all.js`: Node test runner that executes each smoke test in order.
- Create `utils/apiConfig.js`: request mode, base URL, timeout, and API prefix configuration.
- Create `utils/requestAdapter.js`: adapter boundary that currently delegates to Mock handlers and reserves HTTP mode.
- Modify `utils/request.js`: use the adapter while preserving the existing page-facing method names.
- Create `docs/校园通_企业演示指南.md`: product demo path, acceptance checklist, and future API notes.
- Modify selected WXML/JS files only where needed for product wording and visibility:
  - `pages/index/index.wxml`
  - `pages/map/map.js`
  - `pages/map/map.wxml`
  - `pages/service/service.wxml`
  - `pages/user/user.wxml`

## Task 1: Product-Facing Documentation

**Files:**
- Modify: `README.md`
- Create: `docs/校园通_企业演示指南.md`

- [x] Rewrite README around the enterprise demo product position.
- [x] Keep setup, feature list, account list, and verification instructions.
- [x] Add a concise architecture section explaining Mock now and API later.
- [x] Create a demo guide with the 3-5 minute path.
- [x] Run a documentation sanity check with `Select-String` for stale primary wording.

## Task 2: Unified Smoke Test Entry

**Files:**
- Create: `package.json`
- Create: `tests/run-all.js`
- Use: existing `tests/*.test.js`

- [x] Add `package.json` with `npm test`.
- [x] Add `tests/run-all.js` that runs every existing smoke test as a child process.
- [x] Run `npm test` and verify all tests pass.

## Task 3: Lightweight Request Adapter

**Files:**
- Create: `utils/apiConfig.js`
- Create: `utils/requestAdapter.js`
- Modify: `utils/request.js`
- Test: `tests/request-services.test.js`

- [x] Add configuration for `mock` mode and future HTTP mode.
- [x] Add adapter methods `mock(handler, options)` and `http(endpoint, payload, options)`.
- [x] Make `request.js` call `adapter.mock` for existing methods.
- [x] Preserve every exported request method name and response shape.
- [x] Run `node tests/request-services.test.js`.

## Task 4: Student-Facing Wording and Visibility

**Files:**
- Modify: `pages/index/index.wxml`
- Modify: `pages/map/map.js`
- Modify: `pages/map/map.wxml`
- Modify: `pages/service/service.wxml`
- Modify: `pages/user/user.wxml`

- [x] Update homepage wording to "校园行动台" product language.
- [x] Gate coordinate-review controls on the map page behind admin/internal state.
- [x] Reword service center as a problem-solving support desk.
- [x] Reword user center as a campus identity and progress hub.
- [x] Preserve bindings and data names unless a test requires a JS update.

## Task 5: Verification

**Files:**
- Read: `README.md`
- Run: `npm test`
- Run: key string searches

- [x] Run `npm test`.
- [x] Search product-facing files for stale "作业", "评分表", "模拟登录", and "本地模拟" wording.
- [x] Confirm `utils/request.js` still exports all expected request methods.
- [x] Summarize completed slices and remaining page polish.
