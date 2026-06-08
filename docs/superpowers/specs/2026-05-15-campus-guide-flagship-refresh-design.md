# Campus Guide Flagship Refresh Design

## 1. Background

The current project is already functional, cleaner than the initial coursework version, and now has stronger cache behavior, search, request-layer structure, and supporting docs. However, it still has two visible problems:

- the product does not yet feel rich enough in use cases
- the interface is cleaner, but not yet memorable

The user feedback for this round is clear:

- core pages still feel ordinary
- some modules look complete, but not compelling
- the project needs both stronger functionality and stronger visual highlights
- the result should feel “finished” before moving on to PPT and defense materials

This refresh is therefore not a small polish round. It is a flagship repositioning of the project.

## 2. New Product Position

The project should no longer read as “a campus information coursework demo.”

It should read as:

`a campus life assistant + a front-end learning growth mini platform`

This positioning gives the product two clear value lines:

1. campus utility for new students and daily campus use
2. learning growth support for the front-end course showcase

The redesign should make these two lines visible on the first screen, not hidden in separate pages.

## 3. Goals

- make the homepage feel like a real campus product dashboard
- make the map module feel exploratory rather than merely presentational
- make the study module feel like a learning hub rather than a filtered list
- make the user page feel like a personal cockpit rather than a login form
- add enough new value blocks that teachers can immediately notice product growth
- preserve the current native Mini Program architecture and existing working flows

## 4. Non-goals

- no backend or cloud migration
- no real map route API integration
- no overengineered gamification system
- no fully new admin backend
- no design direction that breaks the existing fresh campus tone

## 5. Experience Pillars

### 5.1 Campus Dashboard

The product should feel useful immediately:

- what is happening today
- where should I go
- what can I do next

### 5.2 Guided Exploration

The map and place flows should suggest exploration:

- recommended places
- first-visit guidance
- next-stop relationships

### 5.3 Learning Growth

The study experience should feel cumulative:

- how much has been learned
- what to continue next
- what topic path the user is currently in

### 5.4 Personal Momentum

The user page should summarize progress:

- identity
- saved content
- study activity
- admin recognition when applicable

## 6. Design Direction

### 6.1 Tone

Keep the fresh campus tone, but add stronger editorial structure and product presence.

Keywords:

- fresh
- guided
- confident
- bright
- structured

Avoid:

- generic dashboard visuals
- noisy neon styling
- childish campus decoration
- dense list stacks with equal visual weight

### 6.2 Visual Language

The upgraded look should combine four ideas:

- fresh campus feeling
- light information cards
- campus guide board feeling
- learning platform hierarchy

### 6.3 Surface Types

The UI should use a more intentional card hierarchy:

- hero surface: soft gradient, strongest visual anchor
- stat surface: compact metrics, quick reading
- content surface: white card, light shadow, consistent spacing
- guide surface: slightly tinted panel for route hints, recommendations, and context notes

### 6.4 Visual Motifs

The flagship version should introduce a few recurring motifs:

- rounded map-board panels
- layered stat chips
- mini guidance rows with arrow or “next” cues
- grouped content panels with stronger section framing

These motifs should be repeated across homepage, map, study, and user pages so the product feels intentionally designed.

## 7. Information Architecture Upgrade

### 7.1 Core Tabs

- Home: campus today + shortcuts + highlights + learning momentum
- Map: exploration + categories + recommendations + place details
- Study: growth summary + topic paths + content feed + next learning
- User: identity + activity + saved content + personal tools

### 7.2 Secondary Pages

- Service: regrouped into practical campus service clusters
- Notice: important reminders + latest updates
- Place detail: place profile + useful visit hints + related stops
- Study detail: article + code + related learning
- Favorite: more product-like categorized collection space
- Study history: recent learning journey, not just a flat list

## 8. Functional Expansion

## 8.1 Homepage

### Problems to solve

- currently useful, but still reads as stacked sections
- not enough “today” feeling
- not enough high-value shortcuts beyond static module entry

### New homepage structure

1. flagship hero
2. campus today summary
3. quick action matrix
4. explore highlights
5. latest notices
6. learning momentum
7. recommended study

### New homepage blocks

#### Flagship hero

Should combine:

- product title
- concise value statement
- campus + learning dual identity
- small metrics or trust chips

#### Campus today summary

A compact overview panel that can include:

- notice count
- available key places
- study progress
- current login state cue

This does not need real-time APIs. It can be derived from existing mock data and local records.

#### Quick action matrix

Expand beyond the four tab entries.

Recommended actions:

- campus map
- campus service
- notice board
- study hub
- favorites
- study history

The matrix should feel like a useful campus launcher, not just navigation.

#### Explore highlights

Add a curated block for recommended places:

- “first visit recommended”
- “popular campus spots”
- “good for study / good for daily life”

This gives the homepage stronger product value and leads naturally into the map flow.

#### Learning momentum

Upgrade the current continue-learning idea into a fuller panel:

- recent learning item
- viewed count / total count
- one or two recommended next topics

## 8.2 Map Page

### Problems to solve

- list and map are present, but the page still feels like a demo
- not enough “why should I look here first”
- place browsing is functional but not guided

### New map structure

1. exploration header
2. campus guide board
3. first-visit recommendation strip
4. search + category controls
5. recommended places panel
6. place list

### New map features

#### First-visit recommendation

Show 2 to 3 recommended places for first-time exploration, such as:

- library
- first teaching building
- canteen

This can be powered by additional metadata in `placeData`.

#### Place recommendation lens

The map page should support quick interpretation such as:

- best for study
- best for daily life
- best for new students

These do not need complex filtering UI at first. A small highlighted group is enough.

#### Better detail follow-through

Place detail should gain:

- best visit time
- who it is good for
- nearby related places
- suggested next stop

This adds practical value without requiring route APIs.

## 8.3 Study Page

### Problems to solve

- better than before, but still too list-driven
- not enough progression feeling
- too little distinction between “entry topic” and “next topic”

### New study structure

1. study growth hero
2. progress summary
3. continue learning panel
4. topic path strip
5. search + category controls
6. recommended next topics
7. knowledge feed

### New study features

#### Progress summary

Derived from existing records:

- viewed topics count
- total topic count
- saved study count

This should be honest, lightweight, and clearly tied to current account data.

#### Topic path framing

The learning area should visually support a simple path model:

- entry
- common
- advanced

This can be implemented with lightweight metadata in `studyData`, not a complex course engine.

#### Recommended next topics

Based on the current topic or recent history:

- one or two follow-up topics
- one lateral related topic

#### Study detail follow-through

Study detail should gain:

- related topics
- recommended next step
- stronger code example framing

## 8.4 User Page

### Problems to solve

- page still centers too much on login
- logged-in state is useful, but not rich enough
- page needs more “my campus and learning” feeling

### New user structure

1. profile hero
2. login guidance or identity summary
3. personal momentum stats
4. tool cards
5. admin cue if applicable
6. logout action

### New user features

#### Personal momentum stats

Show compact metrics such as:

- favorite count
- study history count
- viewed study progress

#### Personal tools

Keep favorites and history, but present them as part of a broader personal tool area.

Recommended cards:

- my favorites
- study history
- continue learning
- notice check

Not all need separate new pages. Some can deep-link to existing pages or tab destinations.

## 8.5 Service and Notice Pages

### Service page

Regroup the service content into practical buckets:

- study support
- life support
- campus activity
- daily convenience

This makes the page feel curated rather than flat.

### Notice page

Refine it as:

- important reminders
- latest updates

The pinned summary added in the previous round should remain, but the first screen should feel more editorial and less like a raw notice list.

## 9. Data Model Extensions

The new version should stay mock-driven, but mock data can be enriched.

### 9.1 `placeData`

Recommended additional fields:

- `tagline`
- `bestFor`
- `bestTime`
- `nearby`
- `nextStops`
- `featured`

### 9.2 `studyData`

Recommended additional fields:

- `stage` (`entry`, `common`, `advanced`)
- `duration`
- `keywords`
- `relatedIds`
- `featured`

### 9.3 `serviceData`

Recommended additional fields:

- `group`
- `tag`
- `featured`

### 9.4 `noticeData`

Recommended additional fields:

- `summary`
- `priorityLabel` if needed for clearer display

These extensions are justified because this round explicitly targets stronger product value and stronger first-screen meaning.

## 10. Component and Style Scope

Primary files likely affected:

- `app.wxss`
- `pages/index/*`
- `pages/map/*`
- `pages/placeDetail/*`
- `pages/service/*`
- `pages/study/*`
- `pages/studyDetail/*`
- `pages/notice/*`
- `pages/user/*`
- `pages/favorite/*`
- `pages/studyHistory/*`
- shared components used by these pages

Possible shared additions:

- more reusable stat card styling
- more reusable guide/tip card styling
- reusable link-row or recommendation-row patterns

## 11. Implementation Strategy

The implementation should not treat every page equally.

Priority order:

1. homepage flagship upgrade
2. map + place detail exploratory upgrade
3. study + study detail growth upgrade
4. user page personal cockpit upgrade
5. service / notice / collection follow-through

This keeps the strongest user-facing improvements on the most visible path.

## 12. Acceptance Criteria

The flagship refresh is successful when:

- the first screen of the homepage immediately communicates both campus and learning value
- the map page feels exploratory and guided, not merely demonstrative
- the study page communicates progress, continuation, and recommendation
- the user page feels like a personal center rather than just a login area
- at least three obvious standout highlights are visible in the main demo path
- existing flows still work: login, search, favorites, study history, continue learning
- the product feels like a finished mini app rather than a list of coursework pages

## 13. Risks and Controls

### Risk: too many additions weaken polish

Control:

- add only lightweight but high-visibility functional blocks
- prioritize first-screen value and flow continuity

### Risk: feature growth breaks existing clarity

Control:

- preserve strong section hierarchy
- keep card system disciplined and reusable

### Risk: mock data changes create inconsistency

Control:

- add fields incrementally
- keep request facade unchanged unless data binding truly requires expansion

### Risk: all pages improve a little but none stands out

Control:

- intentionally make homepage, map, and study the flagship trio
- let user page reinforce the product story

## 14. Validation Plan

After implementation, verify:

- homepage flagship blocks render in a balanced order on mobile widths
- map recommendations and place detail follow-through read naturally
- study progress and next-topic panels behave correctly with and without history
- login, logout, favorites, and study history still behave correctly for different users
- secondary pages visually match the flagship tab pages
- no tab page falls back into plain stacked-list presentation

## 15. Repository Constraint

The brainstorming workflow normally expects a commit for the spec document, but the current workspace is not a git repository as of May 15, 2026, so the spec cannot be committed in this environment.

## 16. Relationship to Previous Design

This document supersedes the earlier UI refresh spec from May 14, 2026.

The earlier spec focused on:

- freshness
- card consistency
- stronger hierarchy

This flagship spec keeps those foundations, but expands the scope to include:

- clearer product positioning
- richer homepage value
- guided exploration
- learning growth framing
- stronger personal-center storytelling
