# Accessibility Statement

The goal for **ilramdhan.dev** is to be usable by everyone, including people who use screen readers, keyboard-only navigation, screen magnification, or who prefer reduced motion.

## Target

[WCAG 2.2](https://www.w3.org/TR/WCAG22/) **Level AA** for all public pages and the admin dashboard.

## Current status (2026-10-10): partially conformant

An audit ([`docs/audit/AUDIT.md`](docs/audit/AUDIT.md) §2.4 and §2.6) found these known gaps, each tracked as an issue:

| Area      | Known issue                                                                                               | Plan task  |
| --------- | --------------------------------------------------------------------------------------------------------- | ---------- |
| Names     | Icon-only buttons/links (theme toggle, menu, carousel, social icons, admin actions) lack accessible names | T-42       |
| Keyboard  | Cards and navigation are clickable `div`/`button`s instead of links; admin actions only appear on hover   | T-34, T-43 |
| Structure | No skip link; `<main>` only on the home page; multiple `<h1>` on legal pages                              | T-42, T-33 |
| Forms     | Some inputs have no associated label; errors not announced                                                | T-42       |
| Motion    | Animations, 3D scene and typewriter ignore `prefers-reduced-motion`                                       | T-29, T-31 |
| Touch     | Several targets smaller than 24×24 px                                                                     | T-43       |
| Contrast  | Small grey text and faded logos need verification                                                         | T-44       |
| Language  | `lang` is always `en`; Indonesian version planned                                                         | T-40       |

## How we test

- Automated: axe-core in Playwright for every route at mobile and desktop widths (planned, T-05/T-44).
- Manual: keyboard-only walkthrough, VoiceOver (iOS/macOS) and NVDA/TalkBack spot checks, 200 % zoom, `prefers-reduced-motion: reduce`, light and dark themes.

## Feedback

If you hit a barrier, please open an issue using the **Bug report** template (choose "Accessibility" as the area) or use the contact form at <https://ilramdhan.dev/#contact>. Describe the page, what you tried to do, and the assistive technology/browser you use. We aim to respond within 7 days.
