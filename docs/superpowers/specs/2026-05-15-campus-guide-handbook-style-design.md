# Campus Guide Handbook Style Design

## 1. Why This Round Exists

The current flagship version is already cleaner, richer, and more complete than the original coursework build.

However, one problem remains visible:

- many pages now work well, but they still feel visually related in almost the same way
- the shared aqua palette makes the product feel polished, but also slightly generic
- the main tabs are stronger than before, yet not distinct enough in personality

The user request for this round is not “minor visual polish.”

It is:

`change the style, change the palette, and continue the page-level upgrade plan`

This means the next iteration should not just refine spacing or add a few accents.

It should intentionally pivot the visual language.

## 2. New Visual Direction

The project should move from:

`fresh aqua campus cards`

to:

`campus handbook / guidebook style`

The app should feel closer to:

- a campus orientation booklet
- a printed notice board
- a front-end course handbook

This style is more memorable for coursework presentation because it looks more authored and less like a default “clean mini program.”

## 3. Chosen Palette

### 3.1 Base palette

- background: warm paper white / soft beige
- main text: ink blue
- secondary text: slate gray-blue
- card base: paper white with low-contrast edge
- accent: brick red / warm rust
- secondary accent: muted amber / campus gold

### 3.2 Visual effect

The overall screen should feel:

- warmer
- more editorial
- less glossy
- more like paper, signage, and handbook surfaces

### 3.3 Explicitly avoid

- returning to generic system-blue SaaS UI
- going too dark or too heavy
- keeping the current aqua-green palette as the dominant identity
- adding decorative noise that hurts readability

## 4. Product Mood

Keywords for this round:

- handbook
- campus guide
- editorial
- structured
- warm
- practical

The app should still feel approachable and clear, but more like something curated by a team with visual intent.

## 5. Structural Diagnosis

The main issue is no longer just cleanliness.

It is rhythm.

Currently, many pages still share the same visual sentence:

- soft header
- white card
- another white card
- list of white cards

Even with better content, this causes “same-ness.”

So the redesign should intentionally differentiate page roles.

## 6. Page Role Definitions

### 6.1 Home

The homepage should feel like:

`the cover and dashboard of the campus handbook`

It should:

- open with the strongest visual identity
- establish the new palette immediately
- show quick orientation, not just feature access

### 6.2 Map

The map page should feel like:

`a printed campus route guide`

It should:

- use stronger route-panel treatment
- make “first day route” feel like the core story
- reduce the sense of “static demo map + card list”

### 6.3 Study

The study page should feel like:

`a front-end learning handbook`

It should:

- highlight stage progression like a course booklet
- use stronger section contrast between progress, featured topics, and knowledge feed
- feel more instructional than informational

### 6.4 User

The user page should feel like:

`a personal profile sheet / academic dashboard`

It should:

- feel less like a generic account page
- treat progress and tools like dashboard blocks, not just entries

### 6.5 Notice

The notice page should feel like:

`a campus notice board`

It should:

- reduce heavy card sameness
- use stronger list hierarchy
- visually separate important reminders from updates

### 6.6 Favorite and History

These pages should feel like:

- favorites: saved handbook bookmarks
- history: learning timeline

They should not remain plain repeated list cards.

## 7. Surface System

The previous flagship used one dominant surface family.

This round should use a more differentiated surface system:

### 7.1 Cover surface

For homepage hero and a few major anchors.

Characteristics:

- warm paper tone or ink-blue block
- large title
- strong contrast

### 7.2 Paper card surface

For standard content blocks.

Characteristics:

- soft ivory or white
- subtle border
- lower gloss shadow
- more “page” than “floating glass”

### 7.3 Notice strip surface

For updates, metadata rows, compact informational lists.

Characteristics:

- flatter
- tighter vertical rhythm
- stronger divider use

### 7.4 Route / guidance surface

For map route, progress path, and next-step modules.

Characteristics:

- tinted warm background
- stronger accent edge or index mark
- feels like a guidance block, not a regular card

## 8. Typography and Hierarchy

The typography should become more editorial:

- titles: stronger, darker, more compact
- secondary labels: smaller but more deliberate
- metadata: flatter and quieter
- highlight numbers: use accent color rather than bright cyan

The key hierarchy change:

- fewer equal-weight blocks
- fewer sections where everything looks equally important
- more contrast between hero, guide panel, summary block, and list area

## 9. Palette Mapping

Recommended functional mapping:

- page background: warm ivory
- section titles: ink blue
- important numbers: brick red
- active pills and key actions: deep ink / warm accent blend
- helpful tips and subtle labels: muted amber or dusty slate
- pinned / urgent content: warm red family

This mapping should apply globally and consistently before page-specific overrides.

## 10. Implementation Scope

This round should continue the previous page-priority plan, but with the new style direction.

### Phase A

Apply the new style language to:

- global tokens and shared surfaces
- homepage
- map
- study

These three pages are the visual identity anchors.

### Phase B

Then continue the same language through:

- place detail
- study detail
- user

### Phase C

Finally unify:

- service
- notice
- favorite
- study history

## 11. Concrete Page Changes

### 11.1 Home

The homepage should be rebalanced to look like a handbook cover:

- hero becomes more like a cover banner or orientation sheet
- quick actions become more compact and less same-weight
- notice area becomes more like a bulletin excerpt
- recommendation surfaces should feel less like repeated generic cards

### 11.2 Map

The map page should be rebalanced around the route:

- the route block should become a primary visual element
- the map board should look flatter and more like a printed diagram
- recommended locations and all locations should be more clearly distinguished

### 11.3 Study

The study page should make learning progression visually obvious:

- progress panels should feel like curriculum progress
- stage selectors should feel like handbook tabs
- featured topics should look like highlighted reading recommendations

### 11.4 User

The user page should strengthen identity and personal dashboard feeling:

- logged-in state should have stronger profile sheet treatment
- momentum blocks should feel more like performance cards
- tool cards should not all feel equal

### 11.5 Notice

The notice page should move toward a board/list hybrid:

- important notices feel pinned
- latest updates feel chronological
- list rhythm should be tighter and more authoritative

## 12. Acceptance Criteria

This style pivot is successful when:

- the old aqua-green identity is no longer the dominant impression
- the app reads as a warm campus handbook rather than a generic clean mini app
- homepage, map, and study each have clearly different visual roles
- the app remains readable and lightweight on mobile
- the existing flagship feature set still feels consistent after the palette change

## 13. Repository Constraint

The normal brainstorming flow expects the spec document to be committed.

The current workspace is not a git repository as of May 15, 2026, so this spec cannot be committed in this environment.

## 14. Relationship to Existing Specs

This document is a visual-direction override for the existing flagship refresh work.

It does not replace the product structure established in:

- `2026-05-15-campus-guide-flagship-refresh-design.md`

Instead, it changes the visual language used to implement that structure.
