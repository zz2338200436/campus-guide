# Campus Guide Enterprise Demo Design

## 1. Background

The current Mini Program is already a complete campus-guide MVP with homepage, map, place detail, service center, study hub, notice, favorites, user center, local cache, request facade, and smoke tests. It also contains many coursework delivery artifacts, including assignment-oriented documents, screenshot checklists, scoring templates, and defense-oriented wording.

The next version should no longer feel like a coursework package. The user has chosen a product direction focused on portfolio and demo quality:

`作品/演示观感优先：重点放小程序 UI 和交互，后端轻一点。`

This means the WeChat Mini Program remains the main product. Backend work is not the center of this round. The project should look and behave like an enterprise-grade campus service product while preserving the lightweight local Mock foundation and leaving a clean path for future Spring Boot API integration.

## 2. Product Position

The upgraded product position is:

`校园通企业演示版：以微信小程序体验为核心，保留轻量后端扩展能力的校园服务平台原型。`

The product should communicate three things quickly:

- it is a real campus service assistant, not a homework demo
- it helps new students complete practical campus tasks
- it has a maintainable API-shaped structure that can later connect to a Java backend

## 3. Goals

- make the Mini Program feel like a polished commercial campus product
- remove or de-emphasize coursework language from user-facing and primary project-facing materials
- improve the first 3-5 minute demo path
- reduce visible complexity in the map page for normal users
- strengthen homepage, guide, service, and user-center product hierarchy
- keep the current native WeChat Mini Program architecture
- preserve current tests and add a simpler verification entry point
- keep Mock data working while shaping APIs for future Spring Boot + MySQL integration

## 4. Non-goals

- no Web admin system in this round
- no full Spring Boot backend implementation in this round
- no real WeChat production login requirement
- no cloud deployment requirement
- no destructive rewrite of existing page flows
- no removal of useful coursework files unless they are clearly replaced or moved out of the primary product path

## 5. Target Experience

### 5.1 Homepage: Campus Action Console

The homepage should feel like the user's daily campus command center.

It should prioritize:

- next campus action
- first-day route progress
- high-frequency services
- latest campus notices
- continue-learning entry
- recommended places

The page should avoid looking like a generic collection of feature blocks. Every block should answer one of three questions:

- what should I do now?
- where should I go next?
- what changed on campus?

### 5.2 Campus Guide: Exploration First

The guide page should serve normal students first.

Default visible priorities:

- search
- categories
- map and important pins
- first-day route
- recommended places
- nearby or emergency places

Coordinate review, operations review, and maintenance-oriented features should be hidden, reduced, or gated behind admin state. They are useful for internal operations but should not dominate the student demo.

### 5.3 Service Center: Problem Solver

The service page should feel like a campus support desk.

It should organize content around real problems:

- enrollment and registration
- network and repair
- lost and found
- student affairs
- emergency contacts
- location-linked services

Service cards should consistently show:

- scenario
- required material
- handling steps
- related place
- contact method

### 5.4 User Center: Campus Identity Hub

The user page should become a student identity and progress hub.

It should highlight:

- current identity
- exploration progress
- favorites
- study history
- service records or service shortcuts
- recent activity

Admin capability may remain, but it should not read as a coursework feature. If retained, it should be framed as internal operations access.

## 6. Information Architecture

The main tab structure remains:

- 首页
- 导览
- 学习
- 我的

Secondary pages remain:

- 地点详情
- 新生路线
- 服务中心
- 公告列表和详情
- 收藏
- 学习详情
- 学习记录
- 运营中心 if still useful for admin demo

The enterprise demo should not add many new pages before the existing core pages feel polished. The goal is better hierarchy, wording, and demo flow rather than more navigation depth.

## 7. Visual Direction

The visual tone should be:

- professional
- campus-oriented
- bright
- guided
- calm
- trustworthy

Avoid:

- assignment-style explanatory text
- overly playful badges
- dense blocks with equal weight
- operations-only features on normal student screens
- one-note beige or brown dominance

The current warm campus palette can stay, but it should be balanced with clearer enterprise neutrals, stronger text contrast, and more deliberate action colors. Cards should have stable spacing and predictable hierarchy.

## 8. Data and API Direction

The project should keep local Mock data for this round, but the request layer should look ready for a real backend.

The request facade should continue to be the page-facing API. Future backend migration should require changing the adapter, not rewriting every page.

Recommended shape:

- `utils/request.js`: page-facing facade
- `utils/requestAdapter.js`: chooses Mock or HTTP mode
- `utils/services/*`: Mock service implementations
- optional `utils/apiConfig.js`: base URL, mode, timeout, feature flags

Example future API families:

- `/api/home`
- `/api/places`
- `/api/notices`
- `/api/services`
- `/api/studies`
- `/api/users/session`
- `/api/favorites`
- `/api/checkins`

This round may document these endpoints and prepare naming, but full Spring Boot implementation is out of scope.

## 9. Documentation Direction

Primary docs should read like product and engineering materials, not assignment materials.

Keep or create:

- product overview
- demo script
- technical architecture
- API migration notes
- test and verification guide

Move, de-emphasize, or clearly mark coursework-only files:

- scoring templates
- personal-summary templates
- final assignment checklist
- defense-only screenshot tables

No useful file should be deleted casually. If a document is still needed for school submission, keep it under a clearly named coursework/archive area or leave it untouched while making README and product docs enterprise-facing.

## 10. Demo Path

The preferred 3-5 minute demo path:

1. Open homepage and explain the campus action console.
2. Follow the next route/place recommendation into campus guide.
3. Search or filter a place, then open place detail.
4. Favorite or check in to show state feedback.
5. Open service center and solve a realistic problem.
6. Return to user center and show progress, favorites, and recent activity.

Every step should have visible state change or clear product value.

## 11. Testing and Verification

The existing Node smoke tests should remain.

Add or prepare:

- one command to run all smoke tests
- README verification section using that command
- manual enterprise demo checklist
- basic checks for Mock/API adapter behavior if adapter work is included

Important verification targets:

- homepage still loads with Mock data
- map filters and detail navigation still work
- check-in and favorites still respect login state
- service center links to place details
- user center reflects favorites, history, and progress
- all existing smoke tests pass

## 12. Implementation Slices

### Slice 1: Enterprise Wording and Docs

- update README to product-first wording
- add enterprise demo guide
- avoid making coursework files the primary entry point

### Slice 2: Homepage and Demo Flow Polish

- sharpen homepage hierarchy
- reduce explanatory text
- make next action and route progress more prominent

### Slice 3: Guide Page Noise Reduction

- hide or gate operations-heavy controls
- make student exploration the default page story
- keep coordinate tools available only where appropriate

### Slice 4: Service and User Center Productization

- make service center feel like a problem solver
- make user center feel like an identity and progress hub

### Slice 5: Lightweight API Readiness

- introduce or document request adapter mode
- preserve Mock services
- avoid backend-heavy work

### Slice 6: Verification and Demo Artifacts

- add a unified test command
- add manual demo checklist
- ensure final docs match the new product position

## 13. Risks

- Trying to add backend too early would shift attention away from the selected Mini Program demo goal.
- Removing coursework files outright could hurt school submission needs, so product-facing docs should be upgraded without reckless cleanup.
- Map page complexity may make visual polish risky unless changes are scoped carefully.
- If API adapter work changes the request facade too broadly, it can destabilize many pages.

## 14. Success Criteria

- A reviewer opening the repository sees a product project first, not a coursework bundle.
- A user opening the Mini Program understands what to do next within the first screen.
- The 3-5 minute demo path feels coherent and has visible state feedback.
- Normal student screens do not foreground internal coordinate-review features.
- The codebase still runs with local Mock data.
- Existing smoke tests pass through a simple command.
- Future Spring Boot API integration has a documented path without becoming this round's main work.
