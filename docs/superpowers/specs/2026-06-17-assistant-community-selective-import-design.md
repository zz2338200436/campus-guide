# AI Assistant And Community Selective Import Design

**Date:** 2026-06-17

**Goal**

Import the useful parts of the external `campus-guide-main.rar` contribution into the current enterprise-demo branch without replacing the current product structure. The imported scope is limited to an in-app AI assistant and a local mock community module.

**Recommended Approach**

Use selective import instead of direct merge or archive overwrite.

- Directly merging the tagged Git history adds nothing because the remote tag points to an older commit already contained in local `main`.
- Overwriting the workspace with the RAR content is unsafe because it changes 40 shared runtime files and would discard current map calibration, enterprise copy cleanup, and the request adapter/test harness already present locally.
- Selective import preserves the current student-facing product, lets us fix known defects in the contributed code before shipping, and gives us a clean branch history.

**Scope**

Included:

- AI assistant page and a compact entry point from the existing app shell.
- Community feed, post detail, and publish pages using local mock storage.
- Supporting data/store modules and image assets required by those features.
- Focused tests that lock in page registration, home data exposure, and community persistence behavior.

Excluded:

- Replacing the current `tabBar` with a five-tab layout.
- Replacing current `pages/index`, `pages/map`, `pages/service`, `pages/user`, or `utils/request.js` wholesale.
- Importing `project.private.config.json`.
- Treating the RAR content as canonical source history.

**Product Decisions**

The current enterprise-demo IA stays intact.

- `pages/community/community` will be a normal page, not a bottom tab.
- `pages/assistant/assistant` will be a normal page, opened from explicit entry points.
- The homepage keeps its current structure and gains a single compact assistant/community entry area only if it stays within the existing page slimming constraints.
- The user page gains one compact access point to the new modules without expanding into a large dashboard.

**Architecture**

The import will follow current local patterns instead of copying the archive structure verbatim.

- Keep the current `request` facade and service-centric app shape unchanged for existing features.
- Add community behavior as local utility modules (`utils/communityData.js`, `utils/communityStore.js`) because the contributed feature is entirely client-side mock data and storage driven.
- Add assistant behavior as a lightweight local engine (`utils/aiEngine.js`) plus a standalone page. The first implementation remains rule-based, but its answers should align with existing campus concepts and avoid contradicting the current product copy.
- Add the floating assistant button as a reusable component only after it is adapted to the current visual system and viewport constraints.

**File Plan**

Create:

- `components/ai-fab/ai-fab.js`
- `components/ai-fab/ai-fab.json`
- `components/ai-fab/ai-fab.wxml`
- `components/ai-fab/ai-fab.wxss`
- `pages/assistant/assistant.js`
- `pages/assistant/assistant.json`
- `pages/assistant/assistant.wxml`
- `pages/assistant/assistant.wxss`
- `pages/community/community.js`
- `pages/community/community.json`
- `pages/community/community.wxml`
- `pages/community/community.wxss`
- `pages/community-detail/community-detail.js`
- `pages/community-detail/community-detail.json`
- `pages/community-detail/community-detail.wxml`
- `pages/community-detail/community-detail.wxss`
- `pages/community-post/community-post.js`
- `pages/community-post/community-post.json`
- `pages/community-post/community-post.wxml`
- `pages/community-post/community-post.wxss`
- `utils/aiEngine.js`
- `utils/communityData.js`
- `utils/communityStore.js`
- `tests/assistant-community-import.test.js`

Modify:

- `app.json`
- `pages/index/index.js`
- `pages/index/index.json`
- `pages/index/index.wxml`
- `pages/index/index.wxss`
- `pages/user/user.js`
- `pages/user/user.wxml`
- `pages/user/user.wxss`
- `utils/services/homeService.js`
- `tests/request-services.test.js`
- `tests/page-slimming.test.js`
- `tests/secondary-page-slimming.test.js`

Copy assets if needed:

- `images/banner01.jpg`
- `images/banner02.jpg`
- `images/banner03.jpg`
- `images/banner04.jpg`
- `images/banner05.jpg`
- `images/banner06.jpg`

**Behavior Design**

Assistant:

- A dedicated assistant page offers a chat-like UI with seeded quick questions.
- The first version stays offline and deterministic. It should answer campus helper questions using a small rule set and should not claim real AI capabilities.
- The floating button is a secondary enhancement. If it cannot be added without breaking the current slim page constraints, page-level entry points remain the shipped solution and the floating component stays out of scope for this pass.

Community:

- Community has two content modes: regular feed and marketplace.
- Data is local-only and scoped by current logged-in user through the existing storage/user helpers.
- Users can browse, like, comment, reply, and publish posts.
- Preloaded sample posts remain read-only seed content; user interactions are persisted in storage.

**Defect Fixes Required During Import**

The imported code will not be copied as-is.

- Fix reply persistence for seeded posts so replies survive reload and do not disappear because of duplicate comment-id merge logic.
- Remove dynamic event binding expressions from WXML and replace them with explicit handlers.
- Rework floating-button positioning to use actual device dimensions rather than fixed `px * 2` conversion and hard-coded screen bounds.
- Keep assistant copy consistent with the current student-facing product language and avoid stale hard-coded operational claims.

**Testing Strategy**

Use TDD for each imported behavior slice.

- Add a failing config/structure test proving new pages are registered in `app.json` without changing the existing four-tab layout.
- Add a failing service/home-data test proving the homepage exposes assistant/community shortcuts in a controlled way.
- Add failing storage tests for community like/comment/reply behavior, including regression coverage for seeded-comment reply persistence.
- Update page-size tests only if the new compact entry points require a small threshold adjustment; do not bypass the slimming tests by expanding the pages freely.
- Run targeted tests while implementing and `npm test` before completion.

**Success Criteria**

- The current app shell and enterprise-demo flows still pass the existing smoke suite.
- The project gains a working assistant page and community flow.
- No existing tab is removed or replaced.
- The imported features sit inside the current visual and architectural conventions instead of reintroducing the old dark teal product style.

**Implementation Order**

1. Register new pages and add failing structural tests.
2. Add community data/store with persistence regression tests.
3. Add community pages and compact entry points.
4. Add assistant engine/page and compact entry points.
5. Add the floating assistant button only if it can satisfy current UX constraints without page bloat.
6. Run the full smoke suite and fix regressions.
