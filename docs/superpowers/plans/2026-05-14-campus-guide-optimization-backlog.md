# Campus Guide Optimization Backlog

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prioritize the next round of improvements so the Mini Program gains stronger product feel, safer data behavior, and better demo value without changing its overall architecture.

**Architecture:** This backlog keeps the current native WeChat Mini Program structure, Mock request layer, and local cache approach. P0 focuses on visible polish and low-risk behavior fixes, P1 extends interaction value, and P2 prepares the project for stronger maintainability and expansion.

**Tech Stack:** WeChat Mini Program native framework, WXML, WXSS, JavaScript, local Mock data, local storage

---

## P0

- [x] Add local `tabBar` icons and wire them in `app.json`
- [x] Isolate favorites and study history by logged-in user instead of using one shared cache bucket
- [x] Add a lightweight `继续学习` entry on the homepage based on existing study history

## P1

- [x] Add search for campus places and study titles
- [x] Store map pin positions with place data instead of distributing them from a fixed hard-coded array
- [x] Add compact “最近学习” / “推荐学习” linkage on the study page
- [x] Show notice sort state more clearly, including highlighted pinned notices

## P2

- [x] Split `utils/request.js` into smaller service modules
- [x] Add a Node-based smoke test set for pure utility modules
- [x] Expand README and delivery docs with a demo script, highlight list, and troubleshooting notes
- [x] Add richer real media assets for campus and module screenshots
