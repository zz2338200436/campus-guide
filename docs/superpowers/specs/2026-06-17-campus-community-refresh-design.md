# Campus Community Refresh Design

**Date:** 2026-06-17

**Goal**

Refresh the existing `校园圈` module so the feed page, detail page, and publish page feel like one coherent student-facing community product while staying inside the current app's light, compact visual system.

**Chosen Direction**

Use the approved `B. 当前壳子升级版` direction from the visual comparison.

- Keep the current app shell, navigation, and calm light surfaces.
- Make `校园圈` look more like a finished module through clearer hierarchy, stronger card states, and tighter page-to-page consistency.
- Do not recreate the darker GitHub/RAR shell or introduce a separate visual language just for the community feature.

**Recommended Approach**

Implement a coordinated three-page refresh with only lightweight data and store changes.

- Redesign the feed page first because it sets the tone for the whole module.
- Redesign the detail page and publish page using the same type labels, status language, and action layout as the feed page.
- Reuse the existing local `communityStore` persistence model and only add the minimum derived data and validation needed to support the upgraded UI.

This keeps the change large enough to matter visually, but small enough to fit the current branch without dragging in backend work, media upload, or a second app shell.

**Scope**

Included:

- `pages/community/community` feed page redesign.
- `pages/community-detail/community-detail` detail and comment flow redesign.
- `pages/community-post/community-post` publish page redesign.
- Minimal `communityStore` updates for overview counts, display-ready post state, and publish validation.
- Seed data expansion where needed so the refreshed feed does not look empty or underpowered in local demos.
- Focused tests for the refreshed module surfaces and the new validation behavior.

Excluded:

- Search, advanced sorting, or extra filters beyond `全部 / 动态 / 集市`.
- Backend APIs, moderation, notifications, or real-time updates.
- Image upload, image galleries, or media processing.
- New post types beyond the current `feed` and `marketplace`.
- App-wide shell redesign, tabBar changes, or home/user page redesign as part of this task.
- Replacing the assistant flow or reworking unrelated data modules.

**Product Decisions**

The refresh should feel noticeably stronger without looking like a different app.

- Visual style:
  Keep the current white-card, compact-radius, restrained-color system already used across the local project. Community pages may get slightly stronger type badges and emphasis colors, but should still belong to the same product family as `首页`, `导览`, and `我的`.
- Feed page structure:
  Put a compact top section above the list with module title, one-sentence purpose, 2-3 overview numbers, and the primary publish action.
- Tabs:
  Keep `全部 / 动态 / 集市` as the only top-level filter for this pass. No search box, no secondary filter rail.
- Hot content:
  Keep a small "热度靠前" block near the top, but present it as a compact content summary section instead of a generic text list.
- Feed cards:
  Differentiate `动态` and `集市` cards through badge, metadata, and price/status treatment instead of building two unrelated layouts.
- Detail page:
  Make the primary post content, interaction summary, comment list, and reply state all visually distinct. Reply mode must be obvious before the user sends.
- Publish page:
  Separate shared fields from marketplace-only fields. The page should clearly tell the user what kind of content they are publishing through control states, labels, and field grouping rather than through long explanatory paragraphs.
- Empty/login states:
  Keep them direct and compact. If a user is not logged in, actions should fail clearly and quickly without adding bulky onboarding copy.

**Architecture**

Keep the existing module boundaries and avoid introducing a second layer of abstractions unless the implementation proves it is necessary.

- `utils/communityStore.js` remains the module boundary for:
  - user-scoped persistence,
  - seed/custom post merging,
  - likes/comments/replies,
  - derived module summaries such as overview counts and hot posts,
  - basic publish validation.
- Page controllers remain responsible for:
  - mapping store data to page-local presentation state,
  - toggling current tab or publish mode,
  - handling empty or reply modes,
  - wiring page actions and navigation.
- `utils/communityData.js` can be expanded with a few more representative seed posts if the current two-item dataset is too thin for the refreshed layout.

This keeps the data logic local to the community module while preventing page WXML from becoming responsible for business rules.

**File Plan**

Modify:

- `pages/community/community.js`
- `pages/community/community.wxml`
- `pages/community/community.wxss`
- `pages/community-detail/community-detail.js`
- `pages/community-detail/community-detail.wxml`
- `pages/community-detail/community-detail.wxss`
- `pages/community-post/community-post.js`
- `pages/community-post/community-post.wxml`
- `pages/community-post/community-post.wxss`
- `utils/communityStore.js`
- `utils/communityData.js`
- `tests/utils-smoke.test.js`

Create:

- `tests/community-refresh.test.js`

Do not modify unless implementation evidence shows it is required:

- `app.json`
- `pages/index/*`
- `pages/user/*`
- `utils/services/homeService.js`

**Feed Page Design**

`pages/community/community` should become a clear module landing page rather than a loose card list.

Top section:

- compact hero header with:
  - label such as `校园互助`,
  - page title `校园圈`,
  - short supporting description,
  - 2-3 compact metrics derived from current data, for example total visible posts, current tab count, and hot post count.
- one primary action near the top for `发布内容`, using the same button system as the rest of the app.

Filter and overview area:

- keep the existing segmented tabs, but restyle them to read as a deliberate filter control.
- keep the hot section directly below the tabs.
- hot section items should show enough structure to be scanned quickly:
  - author or title,
  - short excerpt,
  - lightweight type/status cue.

Feed cards:

- each card should expose:
  - author name,
  - location and time,
  - type badge,
  - optional title,
  - 1-2 line content excerpt,
  - tags,
  - interaction summary row.
- `marketplace` cards should additionally show:
  - price with stronger emphasis,
  - item status such as `在售`.
- the action row should read clearly as:
  - like,
  - comment count,
  - detail/read action.
- the page should reserve bottom spacing if a fixed or sticky publish action is used.

Empty state:

- if a filtered list is empty, show a compact empty state that tells the user there is no matching content and keeps the primary publish action available.

**Detail Page Design**

`pages/community-detail/community-detail` should make a single post and its discussion feel intentional instead of raw storage output.

Post section:

- show a stronger header block with:
  - author,
  - type badge,
  - location,
  - created time,
  - optional title,
  - full content,
  - marketplace price/status when applicable.
- add a small interaction summary row before comments, for example likes and comments count.

Comment section:

- comment list should distinguish:
  - top-level comment author and time,
  - main comment content,
  - nested replies in a softer sub-surface.
- reply affordance should be more obvious than a plain text tail at the bottom.
- when the user is replying, the page should show a clear reply state above or beside the input so it is obvious who will receive the reply.

Composer:

- keep a compact bottom composer with send action.
- if in reply mode, include a visible cancel action and target name.
- preserve read-only browsing for logged-out users; the send path should still block clearly on login.

Missing post state:

- if a post id is invalid or no longer available, show a lightweight empty state instead of a blank page.

**Publish Page Design**

`pages/community-post/community-post` should feel like a real creation flow, not a stack of raw inputs.

Mode selection:

- keep `动态 / 集市` as the publish mode switch.
- the active mode should restyle the form and field labels clearly enough that the user immediately knows what they are submitting.

Field grouping:

- shared section:
  - optional title,
  - required content,
  - tags,
  - optional location.
- marketplace-only section:
  - required price,
  - optional sale status if the implementation can add it cleanly without expanding scope.

Validation:

- publishing should fail with a compact toast when:
  - content is empty,
  - marketplace mode has no price.
- validation should live in the store boundary or a shared validation path, not only in the WXML.

Submission layout:

- one clear primary submit button.
- enough bottom spacing to avoid cramped input/button stacking on smaller screens.

Login handling:

- keep the current "must login before publishing" behavior, but ensure the page does not leave the user on a visually broken surface during the redirect back.

**Data And State Design**

Only add data capability that directly supports the refreshed UI.

- Expand seed data to a small but believable mix of:
  - ordinary feed posts,
  - marketplace posts,
  - posts with comments,
  - posts with likes,
  - at least one item that demonstrates the marketplace status row.
- Add a small overview summary API in `communityStore` for feed-header metrics.
- Add normalized display helpers inside the community module where necessary, for example:
  - type label,
  - tab counts,
  - hot post summaries,
  - marketplace display state.
- Preserve the existing persistence fix for replies to seeded comments.
- Keep custom posts scoped to the current logged-in user as they are now.

**Error Handling**

- Creating a post with empty required fields should fail with a direct toast message.
- Trying to like, comment, reply, or publish while logged out should keep the current fast-fail toast behavior.
- Invalid detail-page ids should resolve to a visible fallback state.
- UI should not depend on long text wrapping to explain errors or states; the layout should remain stable under short error copy.

**Testing Strategy**

Use focused regression coverage, then run the existing full suite.

- Add a new `tests/community-refresh.test.js` file that verifies:
  - feed page contains the refreshed top structure and clearer action areas,
  - detail page exposes interaction summary and reply-state UI,
  - publish page contains grouped or clearly scoped creation controls.
- Extend `tests/utils-smoke.test.js` to verify:
  - post creation rejects empty content,
  - marketplace post creation rejects empty price,
  - overview summary returns stable counts for seeded/local data.
- Keep the existing assistant/community registration coverage intact.
- Run targeted tests while implementing and `npm test` before completion.

**Success Criteria**

- `校园圈` feels like a complete module instead of three loosely imported pages.
- The refreshed pages stay visually consistent with the current local app shell.
- Feed cards make `动态` and `集市` easy to distinguish at a glance.
- Detail-page reply mode is clear and does not feel accidental.
- Publish-page validation prevents obviously empty submissions.
- Existing smoke tests continue to pass after the refresh.

**Implementation Order**

1. Add failing tests for refreshed community page structure and publish validation.
2. Expand seed data and add minimal store-level summary/validation support.
3. Redesign the feed page using the new overview data.
4. Redesign the detail page with clearer interaction summary and reply state.
5. Redesign the publish page with grouped fields and stronger mode handling.
6. Run the focused tests, then `npm test`, and fix regressions.
