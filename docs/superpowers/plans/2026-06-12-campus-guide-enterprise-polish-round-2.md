# Campus Guide Enterprise Polish Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strengthen the enterprise-demo Mini Program experience after the first product-positioning pass, focusing on homepage clarity, student-first guide flow, service desk scanability, user identity summary, and demo readiness.

**Architecture:** Keep the existing native Mini Program pages and local service data. Add only small view-model fields where a page needs stronger presentation, and prefer WXML/WXSS polish over broad logic changes.

**Tech Stack:** WeChat Mini Program native WXML/WXSS/JavaScript, existing CommonJS utility modules, Node smoke tests.

---

## File Structure

- Modify `pages/index/index.wxml`: add a next-stop CTA and clearer action route surface.
- Modify `pages/index/index.wxss`: style the CTA and compact action route.
- Modify `pages/map/map.wxml`: add student-facing guide hints and hide coordinate source copy from ordinary users.
- Modify `pages/map/map.wxss`: style guide hint and compact ordinary directory rows.
- Modify `pages/service/service.wxml`: add service promise strip and improve support desk scanability.
- Modify `pages/service/service.wxss`: style service promise strip.
- Modify `pages/user/user.wxml`: add recent activity/identity summary surfaces.
- Modify `pages/user/user.wxss`: style identity summary surfaces.
- Modify `docs/校园通_企业演示指南.md`: update demo path to match the polished experience.

## Task 1: Homepage First-Screen Action

- [x] Add a primary "下一站" CTA that links to the next route place when available.
- [x] Add compact action chips for route progress, services, and continue learning.
- [x] Keep required copy tested by existing smoke tests: "今天先去哪", "常用入口", "最近通知".

## Task 2: Student-First Guide Page

- [x] Add a short guide hint near the map explaining search/category/navigation.
- [x] Show coordinate trust source only for internal users; ordinary users keep status and navigation only.
- [x] Preserve required map copy tested by existing smoke tests.

## Task 3: Service Desk Scanability

- [x] Add a service promise strip: "去哪办 / 带什么 / 联系谁".
- [x] Keep service issue cards and emergency rows unchanged in behavior.
- [x] Preserve required service copy tested by existing smoke tests.

## Task 4: Identity Hub Summary

- [x] Add a compact recent activity strip using existing `checkinHistory` and learning state.
- [x] Keep quick links and admin entry behavior unchanged.
- [x] Preserve login and local state behavior.

## Task 5: Demo Guide and Verification

- [x] Update enterprise demo guide with the new first-screen and guide-page talking points.
- [x] Run focused tests for homepage copy, map page, service page, user/page slimming, and product copy.
- [x] Run `npm test`.
- [x] Commit the second-round polish.
