# Campus Guide UI Refresh Design

## 1. Background

Current project pages are functional but visually uneven. The main issues are:

- weak information hierarchy across pages
- inconsistent card, tag, and title styles
- homepage, map, study, and user pages do not yet feel like one product
- detail and list pages risk falling back to plain coursework-style layouts

The refresh direction for this project is:

- fresh campus feeling
- light information cards
- stronger hierarchy
- clean and simple presentation

## 2. Goals

- unify the visual language across tab pages and secondary pages
- improve first-screen clarity on the homepage, map, study, and user pages
- make cards, sections, buttons, and tags feel consistent
- preserve existing functionality and mock-driven data flow
- keep the final result suitable for a campus-themed course project rather than a business dashboard

## 3. Non-goals

- no business logic rewrite
- no mock data structure redesign
- no backend or cloud integration changes
- no new complex interaction model
- no heavy animation or decorative redesign that weakens usability

## 4. Design Direction

### 4.1 Product Tone

The final interface should feel like a lightweight campus service product, not a generic admin panel and not a playful children-focused app.

Visual keywords:

- fresh
- soft
- organized
- approachable
- calm

Avoid:

- overly saturated gradients
- dense layouts with too many equal-weight blocks
- strong corporate dashboard styling
- decorative elements that overpower content

### 4.2 Visual System

#### Color

Keep the existing cyan-green foundation and make it more controlled:

- primary: cyan-blue for active states, emphasis, and section anchors
- accent: light mint/green for supportive highlights
- background: misty pale cyan gradient
- surface: white cards with subtle tint separation
- text: deep teal for headings, slate for body text, muted gray-blue for secondary content

Intended effect:

- preserve campus freshness
- improve contrast and readability
- reduce the current feeling of flat white blocks on a light background

#### Cards

Cards become the main UI unit across the product.

Rules:

- larger radius than current implementation
- subtle border and soft shadow
- stronger separation between primary and secondary cards through spacing, not loud color
- internal spacing standardized across components

Card roles:

- hero card: prominent, soft gradient, stronger visual pull
- content card: white surface, light shadow, regular spacing
- utility card: smaller, lighter, used for counts and quick access

#### Typography and Hierarchy

Hierarchy should be obvious at a glance:

- page hero title: strongest weight and size
- page intro or supporting line: secondary but still visible
- section title: compact, consistent, clear
- card title: strong enough to scan in lists
- metadata and helper text: lighter and quieter

This change is meant to fix the current issue where headings, summaries, and metadata often feel too close in weight.

#### Buttons and Tags

- primary button: controlled gradient, strong contrast, generous radius
- secondary button: plain white or light background with clear border
- tags: unified pill style with clear active/inactive states
- status labels: small but visually consistent with the rest of the system

#### Decoration

Decorative language should stay light:

- soft gradients
- rounded shapes
- mild glow or shadow
- no excessive illustration styling

## 5. Page-by-Page Design

### 5.1 Homepage

#### Problems

- current hero block is better than a plain list, but still reads like stacked information
- quick entry area is functional but lacks product feel
- school intro competes too much with main content
- notice and study sections still feel close to default list stacking

#### New Structure

1. Hero section
2. Quick entry grid
3. Lightweight school intro
4. Latest notices
5. Recommended study

#### Homepage Hero

The hero should act as a welcome surface instead of a text container.

It should include:

- product name
- one-line value statement
- short supporting explanation
- small stats or trust indicators

Visual behavior:

- soft gradient background
- rounded and floating feel
- enough negative space to breathe

#### Quick Entry Grid

The entry area should look like feature cards instead of plain buttons.

Each entry should communicate:

- destination
- quick mental model of what the module does

Grid behavior:

- consistent sizing
- friendly icon block or symbol block
- clearer press affordance

#### Content Sections

Notices and study recommendations should become cleaner content groups:

- clearer spacing from section to section
- section header action links visually softened
- list items/cards should feel part of the same design family

### 5.2 Map Page

#### Problems

- map area is useful but not visually framed as the main feature
- filter pills work but feel generic
- place cards do not strongly emphasize the reading order

#### New Structure

1. Map page header
2. Campus map feature card
3. Context tip or guidance card
4. Category filter strip
5. Place list

#### Map Feature Area

The campus map should feel like the page anchor.

It should:

- carry a page title or header message
- visually contain the campus illustration and pin area
- distinguish itself from regular content cards

#### Category Filtering

The filter strip should feel lighter and more deliberate:

- softer pills
- stronger active state
- comfortable scrolling rhythm

#### Place List

Each place card should prioritize:

1. place name
2. type
3. open time
4. short description

The list should clearly support the idea of "view map first, then browse details."

### 5.3 Study Page

#### Problems

- current top area is informative but visually flat
- category strip and study cards do not yet form a strong content rhythm
- list items feel too equal in weight

#### New Structure

1. Study theme header
2. Category navigation strip
3. Study content feed

#### Study Header

This area should introduce the learning zone as a themed module, not just a page title.

It should contain:

- main title
- short description
- subtle visual cue that this is a curated learning area

#### Category Navigation

The category strip should sit visually between navigation and content:

- light enough not to overpower the content
- strong enough to orient the user

#### Study Cards

Each study card should emphasize:

1. category
2. title
3. summary
4. action cue

Cards should read like knowledge cards rather than raw list records.

### 5.4 User Page

#### Problems

- profile area works but does not yet feel like a complete personal center
- login state and logged-in state differ in structure quality
- feature entry area is too close to a plain utility list

#### New Structure

1. user hero/profile area
2. login guidance card or logged-in summary
3. utility cards for favorites and history
4. logout action

#### Logged-in State

The profile card should feel complete and credible:

- avatar block
- name
- college and major
- student id
- admin recognition when applicable

The card should visually read as the personal identity anchor for the page.

#### Logged-out State

The login surface should feel guided, not bare:

- clearer title and explanation
- cleaner input styling
- quick account shortcuts styled consistently
- primary login action anchored clearly

#### Utility Area

Favorites and history should become clickable utility cards rather than plain rows.

Each card should communicate:

- feature name
- short description
- count
- clear navigation intent

## 6. Component Unification

### 6.1 Global Tokens and Shared Styles

Global shared styles should be strengthened in `app.wxss`:

- page background
- section spacing
- section title layout
- card radius, border, and shadow
- shared tag styles
- primary and secondary buttons
- helper and muted text

This is required so the refresh does not become page-specific patchwork.

### 6.2 `place-card`

Target change:

- stronger card structure
- clearer title and metadata order
- more refined cover treatment for pages that do not use real images
- reduced dependence on a single left accent strip

Expected outcome:

- easier scanning
- better visual quality on map, favorites, and related lists

### 6.3 `study-card`

Target change:

- stronger content card identity
- better separation between category, title, and summary
- more intentional action cue

Expected outcome:

- study content feels curated rather than dumped into a list

### 6.4 `notice-item`

Target change:

- improve pinned badge integration
- refine metadata styling
- align notice row rhythm with the upgraded card/list language

Expected outcome:

- notices feel calmer and easier to scan

### 6.5 Empty States and Minor Shared UI

Target change:

- bring empty states into the same visual system
- avoid default-looking fallback surfaces

## 7. Secondary Page Follow-through

After the four main pages are refreshed, related pages should inherit the same design language:

- `pages/placeDetail/placeDetail`
- `pages/studyDetail/studyDetail`
- `pages/notice/notice`
- `pages/noticeDetail/noticeDetail`
- `pages/favorite/favorite`
- `pages/studyHistory/studyHistory`
- `pages/service/service`

These pages do not need entirely new interaction models, but they should no longer visually lag behind the main entry pages.

## 8. Implementation Boundary

Primary change scope:

- `app.wxss`
- `pages/index/*`
- `pages/map/*`
- `pages/study/*`
- `pages/user/*`
- `components/place-card/*`
- `components/study-card/*`
- `components/notice-item/*`
- shared empty state styling if needed

Secondary consistency scope, after the primary pages and shared components are completed:

- list/detail pages tied to the same design system

Out of scope:

- business logic changes unless layout requires tiny binding adjustments
- data source changes
- tab architecture changes

## 9. Acceptance Criteria

The refresh is considered successful when:

- the homepage, map, study, and user pages clearly feel like one product
- the first screen of each core page has an obvious visual focus
- cards, buttons, tags, and section headings follow one shared language
- logged-in and logged-out states on the user page both feel polished
- no page introduces horizontal overflow or cramped stacking on common mobile widths
- secondary pages no longer feel disconnected from the refreshed tab pages

## 10. Risks and Controls

### Risk: too playful

Control:

- keep decorative elements soft and limited
- prioritize hierarchy and readability over cuteness

### Risk: style improves but consistency breaks

Control:

- upgrade shared global styles first
- reuse the same card and tag language across modules

### Risk: homepage improves but inner pages still feel old

Control:

- include component refactoring and secondary-page follow-through in the scope

### Risk: visual polish causes logic regressions

Control:

- keep changes centered on WXML and WXSS
- only touch page logic when required for layout structure

## 11. Validation Plan

After implementation, verify:

- page-level consistency across the four tab pages
- component consistency in lists and detail pages
- login and logout visual states on the user page
- category filters on map and study pages
- touch targets and spacing feel comfortable in WeChat Mini Program preview
- no obvious layout break on narrow mobile widths

## 12. Repository Constraint

The brainstorming workflow normally requires committing the design document, but the current workspace is not a git repository as of May 14, 2026, so the design doc cannot be committed in this environment.
