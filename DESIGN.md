---
name: Ilham Ramadhan
description: Apple-clean personal portfolio and blog of a web developer, in English and Indonesian.
colors:
  surface-white: '#ffffff'
  surface-parchment: '#f5f5f7'
  surface-night: '#1d1d1f'
  surface-night-2: '#272729'
  surface-night-3: '#2a2a2c'
  surface-frame: '#ebebef'
  surface-frame-parchment: '#e8e8ed'
  surface-raised: '#ffffff'
  ink: '#1d1d1f'
  ink-muted: '#6e6e73'
  on-dark: '#ffffff'
  on-dark-muted: '#cccccc'
  action: '#0a6499'
  action-hover: '#08537f'
  action-on-dark: '#01aaeb'
  action-on-dark-hover: '#3dbdf0'
  hairline: '#e0e0e0'
  danger: '#b42318'
  chip: '#e8e8ed'
  chip-hover: '#dcdce1'
  dark-page: '#000000'
  dark-parchment: '#161617'
  dark-night: '#272729'
  dark-raised: '#1d1d1f'
  dark-frame-parchment: '#232325'
  dark-night-3: '#333336'
  dark-ink: '#f5f5f7'
  dark-ink-muted: '#a1a1a6'
  dark-action: '#2997ff'
  dark-action-hover: '#5cb0ff'
  dark-pill: '#0071e3'
  dark-pill-hover: '#0068d6'
  dark-hairline: '#424245'
  dark-chip: '#2c2c2e'
  dark-thumb: '#3a3a3c'
  dark-danger: '#ff6961'
typography:
  hero:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Inter Variable, Inter, Helvetica Neue, Arial, sans-serif'
    fontSize: 'clamp(2.5rem, 1.2rem + 5.2vw, 5rem)'
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: '-0.02em'
  tile:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Inter Variable, Inter, Helvetica Neue, Arial, sans-serif'
    fontSize: 'clamp(2rem, 1.1rem + 3.4vw, 3.5rem)'
    fontWeight: 600
    lineHeight: 1.07
    letterSpacing: '-0.02em'
  section:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Inter Variable, Inter, Helvetica Neue, Arial, sans-serif'
    fontSize: 'clamp(1.75rem, 1.3rem + 1.6vw, 2.5rem)'
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: '-0.015em'
  title:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Inter Variable, Inter, Helvetica Neue, Arial, sans-serif'
    fontSize: 'clamp(1.1875rem, 1.1rem + 0.25vw, 1.3125rem)'
    fontWeight: 600
    lineHeight: 1.19
    letterSpacing: '-0.012em'
  lead:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Inter Variable, Inter, Helvetica Neue, Arial, sans-serif'
    fontSize: 'clamp(1.3125rem, 1rem + 0.6vw, 1.5rem)'
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: '-0.01em'
  body:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Inter Variable, Inter, Helvetica Neue, Arial, sans-serif'
    fontSize: '1.0625rem'
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: '-0.01em'
  caption:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Inter Variable, Inter, Helvetica Neue, Arial, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: '-0.006em'
  fine:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Inter Variable, Inter, Helvetica Neue, Arial, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: '0em'
rounded:
  xs: '5px'
  sm: '8px'
  md: '11px'
  lg: '18px'
  panel: '20px'
  panel-nav: '32px'
  full: '9999px'
spacing:
  gutter-phone: '16px'
  gutter: 'clamp(24px, 4vw, 32px)'
  wrap: '1180px'
  section: 'clamp(4rem, 9vw, 7rem)'
  stack: 'clamp(2.5rem, 5vw, 4rem)'
  stack-lg: 'clamp(3rem, 5vw, 4.5rem)'
  roomy: 'clamp(6rem, 14vw, 11rem)'
  nav-h: '44px'
components:
  pill-primary:
    backgroundColor: '{colors.action}'
    textColor: '{colors.surface-white}'
    typography: '{typography.body}'
    rounded: '{rounded.full}'
    padding: '11px 22px'
    height: '44px'
  pill-primary-hover:
    backgroundColor: '{colors.action-hover}'
  pill-primary-on-dark:
    backgroundColor: '{colors.action-on-dark}'
    textColor: '{colors.ink}'
    rounded: '{rounded.full}'
  link-chevron:
    textColor: '{colors.action}'
    typography: '{typography.body}'
    height: '44px'
  link-chevron-on-dark:
    textColor: '{colors.action-on-dark}'
  field:
    backgroundColor: '{colors.surface-parchment}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0 16px'
    height: '48px'
  media-frame:
    backgroundColor: '{colors.surface-frame}'
    rounded: '{rounded.lg}'
  tile-white:
    backgroundColor: '{colors.surface-white}'
    textColor: '{colors.ink}'
    padding: '{spacing.section} {spacing.gutter}'
  tile-parchment:
    backgroundColor: '{colors.surface-parchment}'
    textColor: '{colors.ink}'
    padding: '{spacing.section} {spacing.gutter}'
  tile-dark:
    backgroundColor: '{colors.surface-night}'
    textColor: '{colors.on-dark}'
    padding: '{spacing.section} {spacing.gutter}'
  nav-bar:
    backgroundColor: '{colors.surface-white}'
    textColor: '{colors.ink}'
    typography: '{typography.fine}'
    height: '{spacing.nav-h}'
  footer:
    backgroundColor: '{colors.surface-parchment}'
    textColor: '{colors.ink-muted}'
    typography: '{typography.fine}'
---

# Design System: Ilham Ramadhan

Source of truth: `src/styles/global.css` (tokens, type ladder, keyframes, prose) and the partials in
`src/components/tile/`. This file describes what ships. If the code and this file disagree, the code wins and this
file gets fixed.

The system is a deliberate 1:1 port of the mutugading.com "Apple-clean" system (owner decision D1 in
`docs/redesign/PLAN.md`; reference: `mutugading.com/web/DESIGN.md`). Token values are copied verbatim. Where the
taste checkers disagree with that reference, the waiver and its evidence are in `docs/redesign/taste-waivers.md`.

## Overview

**Creative North Star: "The Product Shot"**

Every page is lit like an Apple product page, and the product is the work: shipped projects, articles, certificates.
The interface steps back so a screenshot and one plain sentence carry each block. A page is a stack of tiles, each
roughly one screen, and the change of ground between tiles (white, parchment, near-black) is the only divider. There
are no cards, borders, shadows or gradients.

Density is low and scale contrast is high: a 40–80px headline, one 21–24px line under it, two small actions, then a
picture or a quiet row of figures. Figures come only from content (Supabase rows, WakaTime, GitHub); an unknown value
is hidden, never invented. Motion is a family of small physical responses ported from mutugading (masked heading
words, a photo opening in its frame, rows translating in on scroll, a figure counting up once), each loaded lazily and
each still under reduced motion. The hero's 3D lanyard card (D2) is the one memorable moment, desktop only.

The rejected look is the old site: indigo accents, glow (`site-glow`), framer-motion fades, card grids. Do not bring
any of it back.

**Key Characteristics:**

- Light by default, with a dark theme that follows the OS ("Auto") or a Light / Dark / Auto choice in the nav. Dark tiles (`Tile tone="dark"`) are a tile inversion and stay dark in both themes.
- One accent (cobalt light, `#2997ff` dark), only on links, calls to action and focus.
- One type family (the platform sans, self-hosted Inter Variable as the fallback), weights 600 and 400.
- Full-bleed or inset tiles, 0 gap; the ground change is the divider.
- Screenshots sit in 18px frames. Numbers appear as a quiet row of big figures (`SpecRow`).
- English at `/`, Indonesian at `/id/*`, same layout; copy from typed dictionaries (`src/i18n/messages`).

## Colors

Achromatic: three grounds, two inks, one blue that means "you can act here".

### Primary

- **Cobalt** (`action`, #0a6499): links, chevron links, filled pills and focus rings on light tiles. 6.37:1 on white, 5.85:1 on parchment.
- **Sky** (`action-on-dark`, #01aaeb): the same role on dark tiles (6.38:1 on night). A pill on a dark tile is a sky fill with ink text.

### Neutral

- **White** (`surface-white`): the page, default tiles, the nav bar. Flips to black in the dark theme, so `bg-white` means "page", never fixed white.
- **Parchment** (`surface-parchment`): alternate tiles, the footer doormat, form fields, segmented-control tracks.
- **Night** (`surface-night`): dark tiles. `surface-night-2` is the micro-step for a dark tile right after another; `surface-night-3` is the empty frame on dark.
- **Frame Grey** (`surface-frame`, `surface-frame-parchment` on parchment): the ground a `MediaFrame` shows with no image.
- **Raised** (`surface-raised`, `thumb`): dialogs, sheets, menus and segmented thumbs; white in light, #1d1d1f / #3a3a3c in dark.
- **Ink** (`ink`) and **Graphite** (`ink-muted`, 5.07:1 on white): all text on light tiles. Nothing lighter carries text.
- **Mist** (`on-dark-muted`): secondary text on dark tiles. `on-dark` is fixed white for text on photos and scrims.
- **Rule** (`rule`, 10% black / 14% white): 1px list separators only. `hairline` is for utility controls.
- **Signal Red** (`danger`): form errors, 6.4:1 on white.

### Dark theme

Same token names, new values (global.css "DARK THEME", applied under `prefers-color-scheme: dark` unless
`<html data-theme="light">`, and under `data-theme="dark"`). Page #000, parchment #161617, raised #1d1d1f, ink
#f5f5f7, graphite #a1a1a6, action #2997ff, filled pill #0071e3 + white, danger #ff6961. Dark tiles step up to
#272729 so they still divide against the black page. The no-flash script in `index.html` sets `data-theme` (and the
legacy `dark` class) from `localStorage.theme` before paint; its CSP hash is in `vercel.json`.

### Named Rules

**The Tile-Aware Rule.** Partials never take a colour prop. `data-tone="dark"` re-points `--tile-ink`, `--tile-muted`, `--tile-action`, `--tile-pill`, `--tile-pill-ink`, `--tile-frame` and `--tile-light`; everything inside uses `text-tile-*` / `bg-tile-*`. `data-tone="parchment"` only swaps the frame grey.

**The One Blue Rule.** Blue appears only on something you can click or something with focus. Never a band, an icon tint or a heading colour.

## Typography

**Display Font:** system-ui / -apple-system (SF on Apple devices), with Inter Variable (self-hosted from `@fontsource-variable/inter`, Latin + Latin Extended, never preloaded) as the fallback
**Body Font:** the same stack
**Label/Mono Font:** none in the UI. Code blocks in articles use the platform monospace; figures get `.tabular`.

**Character:** One neutral grotesque at two weights. Hierarchy comes from size; the tight tracking at display sizes is what reads as Apple.

### Hierarchy

- **Hero** (`text-hero`, 600, 40→80px, 1.05, -0.02em, balanced): the single h1 of a hero tile, at most 14ch.
- **Tile** (`text-tile`, 600, 32→56px, 1.07): the h2 naming a tile.
- **Section** (`text-section`, 600, 28→40px, 1.1): smaller tile headings and article h2.
- **Title** (`text-title`, 600, 19→21px, 1.19): item names in rows and columns (h3).
- **Lead** (`text-lead`, 400, 21→24px, 1.33): one line under a heading.
- **Body** (`text-body`, 400, 17px, 1.47): running text. Article columns are 680px wide, 17px.
- **Caption** (`text-caption`, 400, 14px): labels, meta, field labels (600).
- **Fine** (`text-fine`, 400, 12px, 0 tracking): nav links, footer columns, fine print.

### Named Rules

**The No-Label Rule.** No eyebrows, kickers, uppercase tracking labels, mono labels or pills used as labels.

**The Two-Weight Rule.** 600 for headings and figures, 400 for everything else.

## Layout

- **Tiles.** Every block is a `Tile` (`src/components/tile/Tile.tsx`): a `<section aria-labelledby>` with an inner `.wrap` (max 1180px plus 16px gutters on phones, 24–32px from 640px). Sizes: `default` (py `section`), `hero` (one viewport, sliding under the translucent nav), `roomy`, `screen`. `InsetPanel` is the apple.com rounded panel variant (20px corners, 32px from 834px; `start` + `end` halves read as one surface).
- **Alignment.** `center` (Apple stack) or `split` (two columns at lg, text first when stacked).
- **Rows.** `LinkedGroup` items, `SpecRow` (2, then 3–4 at lg), `FeatureColumns` (1 → 2 → 3–4). No boxes; air and alignment carry the structure.
- **Breakpoints.** Tailwind defaults plus `nav` = 834px (`nav:` / `max-nav:`), where the hamburger sheet and footer disclosures take over below.
- **Chrome offsets.** `--nav-h` is 44px; `html` has `scroll-padding-top: nav-h + 8px`; anchors and TOC targets use `scroll-margin-top: nav-h + 1.5rem`. Pages own no `<main>`: `PublicLayout` renders it.
- **Admin** (`/admin`) is an Operate surface: tokens only (`.input`, `.btn-*`, `.form-container` in global.css), no tiles, no motion beyond the sidebar `animate-page-in`.

## Elevation & Depth

Flat, no shadows. Depth comes from the ground change between tiles and from translucency on fixed chrome only: the
nav bar (blurred, translucent white/black) and dialog/sheet scrims. The footer is a parchment doormat revealed by the
page lifting off it (the reveal curtain, `.reveal-stage` / `.reveal-curtain`).

### Named Rules

**The No-Box Rule.** Nothing gets a border, card background, drop shadow or gradient to look raised. If something needs to stand apart, give it its own tile.

**The One Radial Rule.** The only gradient is `SoftLight`, a pointer-following radial light (fine pointers, motion allowed, lazy). Approved masks: the footer wordmark fade (`.footer-wordmark-box`) and the marquee edge fade. Mask only, never a fill.

## Shapes

The Apple corner ladder: 5px (`xs`), 8px (`sm`), 11px (`md`, fields), 18px (`lg`, every photograph and dialog; `xl`
through `4xl` are pinned to 18px so vendored classes cannot drift), 20/32px for inset panels, and full pills for
buttons, segmented controls and icon buttons. The chevron is a drawn SVG path, never "›".

## Components

All partials live in `src/components/tile/` and are imported by module (`@/components/tile/Tile`), not through the
barrel, from anything in the entry chunk (see STATE Gotchas: a barrel import there hoists every partial into
`index.js`).

### Buttons

- **Primary (`PillButton`, `ActionLink variant="primary"`):** full pill, tile-aware fill, 17px, 11×22px padding, 44px target. Hover steps the fill over 200ms, press scales 0.98.
- **Secondary (`LinkChevron`):** body-size link in the tile action colour with a drawn chevron that nudges 2px on hover. Always after a pill, never a second pill.
- **Focus:** the global 2px outline in the tile action colour, 3px offset.

### Segmented controls

`SegmentedControl`: a parchment track with a thumb sliding on transform (250ms), real buttons with `aria-pressed`,
44px tall. Used for blog tags, project and certificate filters. Never a frame-grey track (fails AA).

### Linked groups (no cards)

`LinkedGroup`: a `MediaFrame` plus a title, one muted line and a non-interactive `LinkChevron`, the whole group one
link (project cards, blog rows, certificates). Hover zooms the photo 1.02 and underlines the chevron; the container
gets no lift, shadow or background.

### Photographs

`MediaFrame` (on our `Img`, keeps width/height for CLS): 18px radius, frame-grey ground. Aspects `wide`, `video`,
`portrait`, `landscape`, `cinema`, `square`, `fill`. A `null` src renders the quiet empty frame.

### Inputs

`Field` (+ `.input` in admin): parchment fill, no stroke, 11px radius, 17px text, caption label above, description
and `role="alert"` error below in signal red. Focus is a 2px action ring.

### Disclosure

`Disclosure` / `DisclosureGroup`: the only expand/collapse (resume rows, article TOC on phones, footer columns below
834px). 1px `border-rule` rows, full-width button with a chevron turning 180deg, height animating both ways (300ms
ease-apple).

### Navigation (`src/app/layouts/chrome/`)

- **Bar:** fixed 44px, translucent with blur. `Brand` on the left; past 48px of scroll the name collapses into the mark (`.brand-name`, static under reduced motion). 12px links, Light/Dark/Auto menu (`ThemeControls`, `animate-menu-in`), EN/ID switch keeping the current page.
- **Below 834px:** `MobileSheet`, a full-screen sheet with a focus trap that stops Lenis (`animate-page-in`).
- **Footer:** parchment doormat with link columns (disclosures on phones), socials as text links, version, locale names, and the wordmark rise (`wordmark-rise-engine`, ScrollTrigger refresh after late layout).
- **Skip link** first in the tab order. `LocaleBanner` offers Indonesian on first visit, never redirects.

### Signature: SpecRow

2–4 big tabular figures with a 14px graphite label under each, no boxes. Empty values dropped. Numbers count up once
in view (`CountUpValue`), with the final value in the accessible name.

## Motion

Engines live in `src/components/motion/` and are imported lazily (`near.ts` arms them near the viewport), so GSAP,
ScrollTrigger, Flip and Lenis never reach a route's initial JS. GSAP plugins are registered once in `gsap.ts`
(`MOTION` tokens). There is no framer-motion (removed in R9).

| Need             | Primitive                                                           | Rule                                                                    |
| ---------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Hero entrance    | `animate-rise` on copy, `animate-rise-still` on the LCP visual      | once on load; the LCP element never starts at opacity 0                 |
| Heading          | `TileHeading` → `useSplitReveal` / `split-text-engine` masked words | h2 on, h1 off                                                           |
| Numbers          | `SpecRow` → `CountUpValue`; `GrowBar` for WakaTime bars             | once in view                                                            |
| Rows             | `.stagger-row` + `colVar()` (`tile/stagger.ts`)                     | translate only, never a fade                                            |
| Photo entrance   | `InsetReveal` / `MediaFrame reveal`                                 | inset clip opens once, below the fold only                              |
| Standalone photo | `ParallaxLayer` / `MediaFrame parallax`                             | never on a clickable photo                                              |
| Clickable photo  | `MediaFrame interactive` + `SoftLight`                              | zoom 1.02 on the link's hover only                                      |
| One statement    | `ScrollFill`                                                        | muted → ink, one per page                                               |
| Names            | `Marquee` (`marquee-engine`)                                        | pauses on hover/focus, visible Pause/Play                               |
| List reflow      | `FlipGroup` (`flip-engine`)                                         | filtered project/blog/certificate lists                                 |
| Page change      | `RouteFade` (View Transitions) + `Morph` / `morphName`              | same image across list → detail                                         |
| Smooth scroll    | `SmoothScrollProvider` (`lenis-engine`, on idle)                    | native on coarse pointers and under reduced motion                      |
| Small enters     | `animate-menu-in`, `animate-page-in` (global.css)                   | always behind `motion-safe:`                                            |
| 3D hero card     | `features/hero-3d/HeroCard` (R3F + rapier)                          | only at ≥1024px, fine pointer, motion allowed; not downloaded otherwise |

Easing is `ease-apple` = cubic-bezier(0.22, 1, 0.36, 1). `/__motion` (dev only, not prerendered) previews every
primitive.

### Named Rules

**The Still-When-Asked Rule.** Under `prefers-reduced-motion` everything rests at its final, fully visible state: no split text, final figures, no parallax, the marquee becomes one wrapped line, view transitions take 0s, no 3D card.

**The Zoom-or-Parallax Rule.** Parallax and hover zoom never share a photograph.

## Do's and Don'ts

### Do:

- **Do** build every public block from `src/components/tile/` partials and tile-aware utilities.
- **Do** keep one h1 per page, 44×44px targets, and the global 2px focus outline.
- **Do** get every string from `src/i18n/messages/{en,id}.ts` (`useT()`); `id` must satisfy the `en` type.
- **Do** keep heavy code (GSAP, Lenis, three.js, markdown, highlight.js, charts) behind `import()`, and check `npm run size` on every route after adding a lazy chunk.
- **Do** give anything that moves for more than 5 seconds a pause control.

### Don't:

- **Don't** add borders, cards, shadows, gradients (beyond SoftLight and the two masks), eyebrow pills, icon circles, badges or mono uppercase labels.
- **Don't** use a second accent, or blue on anything that is not interactive.
- **Don't** use Tailwind `text-white` / `bg-white` for fixed white: `white` is the themed page. Use `text-on-dark`, `bg-raised`, `bg-thumb`, `text-pill-ink`.
- **Don't** fade rows in on scroll, or put parallax and hover zoom on the same photo.
- **Don't** hand-roll an accordion: use `Disclosure`.
- **Don't** reintroduce framer-motion or import a partial through the barrel from the entry chunk.
- **Don't** invent numbers or claims; unknown values are hidden.
