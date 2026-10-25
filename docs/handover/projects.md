# Handover: project section parity with the blog overhaul

> **For a new AI session.** Everything needed to bring the project section (home featured, `/projects` list, the card, `/projects/:slug` detail, Markdown content) to the level the blog reached. The analysis is done; don't redo it. Read this file, then start at [§6 Execution plan](#6-execution-plan).
>
> Tracking issue: **#139 (T-63)**. Written 2026-10-25 against `main` at v0.4.0 (`a6dafba`). If `main` has moved, re-check only the `file:line` references you touch.

---

## 1. Goal and non-negotiables

Bring the project pages to parity with the blog work from #111/#112 (Markdown), #113/#119 (blog UI/UX), #122/#126 (layout polish) and #67/#128 (highlighting, gallery).

**Non-negotiables:**

1. **No breaking change.**
   - Existing projects, URLs (`/projects`, `/projects?tag=&page=`, `/projects/:slug`), admin create/edit/delete, prerendered HTML and every e2e contract in [§5](#5-dont-break-contracts) keep working.
   - No DB migration, no column renames.
   - `slug` is nullable: handle `null`.
2. **One task = one issue = one branch = one PR** (squash merge), in the order of [§6](#6-execution-plan). Never mix tasks.
3. **Budgets** (`scripts/bundle-budget.json`):
   - initial JS `/` ≤ 190, `/blog` ≤ 120, `/privacy` ≤ 105 KiB gzip; CSS ≤ 13.5; JS total ≤ 1480.
   - Raise a budget only in the same PR, with a written reason (CONTRIBUTING).
   - CSS is the tightest: reuse existing utilities, and use inline styles for one-offs as `FeaturedCarousel` does.
4. **Prerender/hydration safety.**
   - Every public route is prerendered (T-35) and hydrated.
   - The first render must not measure the DOM or read `window`.
   - Client-only state flips go in an effect, wrapped in `startTransition` when they can reach a still-hydrating Suspense boundary (React #421; see `src/lib/hooks.ts` `useHydrated`, `src/pages/projects.tsx:99-111` and #123/#124).
5. **`m.*` / `Reveal` need a `MotionScope` ancestor** (#123).
   - `ProjectCard` renders `Reveal`.
   - Home, `/projects` and the detail page already provide `MotionScope`; any new place that renders `ProjectCard` must too.

## 2. Ground rules for the session (sub-agent driven, dynamic model)

Work **sub-agent driven**. The main session plans, reviews diffs, runs the final verification, commits and opens PRs. Implementation goes to sub-agents.

| Model      | Use for                               | Examples in this plan                                                                                             |
| ---------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Haiku**  | light, mechanical, read-only          | collecting facts, grepping contracts, updating fixtures, PLAN/doc edits, checking label/project fields            |
| **Sonnet** | medium, well-specified implementation | T-60 card, T-61 list page, T-59 carousel wiring, e2e specs                                                        |
| **Opus**   | heavy or risky                        | T-59 generic `Carousel` extraction, T-62 detail page + moving shared article modules, anything touching hydration |

Rules that avoided problems in the blog work:

- **One git worktree per task** (`git worktree add -b <branch> /tmp/wt-<task> origin/main`), symlink `node_modules` from the main checkout, and never edit the main checkout from an agent.
  - Two agents in one worktree is fine only with disjoint file ownership, stated in each prompt.
- **Agents never commit, never `git stash`, never kill processes.**
  - Playwright uses port 4173.
  - Run e2e with `CI=1` so Playwright builds its own server instead of reusing another worktree's (a stale reuse produced 196 false failures once).
  - Run e2e for one worktree at a time.
- Give agents the exact `file:line` facts from this doc, the contracts in §5, the budget numbers, and the verification commands. Ask for a concise report with before/after numbers.
- **Verify agent claims yourself** before committing: re-run the checks and look at the diff. A previous agent reported a language as dropped when it wasn't, and another added a 54 KiB dependency while the budget allowed 20.
- **Prefer no new runtime dependency.** If one is needed: exact pin, version at least 2 weeks old, inspect the built chunk (`npm run analyze` or `grep` the chunk) to confirm only what you need is bundled.

## 3. What the blog has (reuse, don't copy)

| Concern           | Blog implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Reuse plan                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Featured carousel | `src/features/blog/FeaturedCarousel.tsx` (scroll-snap, prev/next disabled at the ends after mount, `region`/`aria-roledescription="carousel"`, "n of N", grid fallback ≤ 3 via `CAROUSEL_MIN_POSTS = 4`, skeleton row), `FEATURED_LIMIT = 9` (`blog/api.ts:80`)                                                                                                                                                                                                                                                                                           | Extract generic `src/components/ui/Carousel.tsx` (T-59)                                                |
| Card              | `src/features/blog/BlogCard.tsx` (stretched `Link` with `after:absolute after:inset-0`, `focus-within:ring-2`, tags +N, clamps, placeholder, `variant="feature"`, `BlogCardSkeleton`)                                                                                                                                                                                                                                                                                                                                                                     | Apply the same patterns to `ProjectCard` (T-60)                                                        |
| List              | `src/pages/blog.tsx` (grid `sm:2 lg:3`, 9 per page, feature card on unfiltered p1, labelled search + clear, sort select with custom chevron `?sort=oldest`, `aria-live` count, Clear filters, empty state with reset, skeletons matching the cards), `orIlikeFilter` (`src/lib/search.ts:32`), `useListParams` (`src/lib/useListParams.ts`), `blogKeys.list` includes `sort`                                                                                                                                                                              | Same UI and data pattern (T-61)                                                                        |
| Detail            | `src/pages/blog-detail.tsx`: header on the page background (breadcrumb, `TagLinks` → `/blog?tag=`, H1, lead, meta with `readingTime`), cover figure, `max-w-5xl` frame, body + TOC grid (`TOC_ASIDE_CLASS`, `TocSidebar`, `TocDisclosure`), heading ids (`articleHeadingComponents` + `extractHeadings`, matched by source line), `ReadingProgress`, `ShareBar` (canonical `absoluteUrl`), `PostNavigation` + `getAdjacentBlogs` with an `(published_at, id)` total order, `RelatedPosts`, `ArticleSkeleton` (`blog-detail.tsx:44`), `Seo type="article"` | Generalise into `src/features/article/*` with re-exports from the old blog paths (T-62)                |
| Markdown          | shared `src/components/ui/Markdown.tsx` (lazy renderer; lazy GFM `needsGfm`; lazy highlight `needsHighlight`; GitHub blob→raw images; external links `_blank`)                                                                                                                                                                                                                                                                                                                                                                                            | Already used by project detail (`project-detail.tsx:148`). Nothing to build; T-62 adds heading ids/TOC |
| Admin             | "Insert image" on markdown fields with `folder` (`src/features/admin/MarkdownField.tsx`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Already enabled for projects (`resources/projects.ts:35-39`). Nothing to do                            |

Shared exports today: `TagLinks`, `PostNavigation`, `RelatedPosts` (`ArticleFooter.tsx`), `TOC_ASIDE_CLASS`, `TocSidebar`, `TocDisclosure` (`TableOfContents.tsx`), `readingTime`/`countWords` (`reading.ts`), `extractHeadings`/`TocHeading` (`toc.ts`), `articleHeadingComponents` (`article-headings.tsx`), `ShareBar`, `ReadingProgress`.

## 4. Gap audit: project vs blog (as of v0.4.0)

### A. Home featured (`src/pages/home.tsx:148-192`)

- Plain grid `grid-cols-1 md:2 lg:3` (l.166) with 3 `ProjectCardSkeleton`s; no carousel.
- `getFeaturedProjects` (`src/features/projects/api.ts:80-90`): `is_featured = true`, `order created_at desc`, hard-coded `.limit(3)`.
- `FeaturedCarousel` is blog-coupled:
  - imports `BlogCard`/`BlogCardSkeleton` (l.4)
  - prop `posts: BlogCardData[]` (l.43)
  - renders `<BlogCard headingLevel="h3">` (l.74, l.124)
- The mechanics are generic.
- `ProjectCard` hard-codes `h3` (l.69) and `sizes` (l.26), and has no `className` prop.

### B. List (`src/pages/projects.tsx`)

- `ITEMS_PER_PAGE = 6` (l.13); grid `md:2 lg:3` (l.65).
- `useListParams('tag')` (l.16): the hook already supports `q` but the page ignores it.
- No search: `getProjects` (`api.ts:70-78`) takes `{page, limit, tag}`; `ProjectListParams` is at `api.ts:64`.
- No sort; `order('created_at', desc)` with no `id` tie-break, and all fixtures share one `created_at`.
- `projectKeys.list` (`queries.ts:15-19`) has no `q`/`sort`.
- No feature card, `aria-live` count or Clear filters.
- Empty state is the text "No projects found for this tag." with no reset (l.81-85).
- Skeleton is a bare `aspect-[4/3]` pulse (l.68-71), not `ProjectCardSkeleton`, so the page shifts.
- Keep `CollapsibleTagFilter` (maxVisible 6) and the `MotionScope` wrapper (l.99-111).

### C. Card (`src/features/projects/ProjectCard.tsx`)

- Stretched title link (l.70-76): ok.
- Demo/repo anchors sit in a hover-only overlay (l.29-55, `opacity-0 group-hover/image:opacity-100`, `pointer-events-none` with an inner `pointer-events-auto`):
  - invisible on keyboard focus and on touch
  - only `title`, no `aria-label`
- No card focus ring.
- `tech_stack.slice(0,3)` without +N; description `line-clamp-2` (l.81).
- No image placeholder (`ImageCarousel` handles empty).
- `ImageCarousel` controls inside the card (nested interactives).
- `ProjectCardSkeleton` exists (l.90).
- **Bug:** detail page `demo_url`/`repo_url` are used raw (`project-detail.tsx:189,198`) without `ensureFullUrl`. The fixture `repo_url` is `github.com/x/y`, so it resolves as a relative link.

### D. Detail (`src/pages/project-detail.tsx`, 216 lines)

- Has (from #128):
  - `CONTAINER = max-w-5xl` (l.18)
  - gallery + lazy lightbox (l.106-116)
  - Related projects (l.21-40; region "Related projects", h2 `#related-projects-heading`, cards h3) via `getRelatedProjects` (`tags` overlap, `created_at desc, id desc`)
- Missing:
  - breadcrumb (has "Back to Projects", l.98)
  - header above the gallery (H1 is below it, l.119)
  - tag chips as links (plain `span`s, l.174-185)
  - reading time
  - heading ids / TOC
  - share
  - older/newer
  - layout skeleton (spinner, l.54-60)
  - `Seo type="article"` (l.91-95)
- Body is boxed with a forced "About this project" h2 (l.143-152) in a `flex md:flex-row` with an `md:w-64` sticky sidebar (l.134, 156-157): Tech Stack, Tags, Live Demo, View Source.

### E. Markdown

- `<Markdown components={{ h1: 'h2' }}>` (l.148): GFM, highlighting and blob→raw already apply.
- `extractHeadings`/`articleHeadingComponents` are not used.
- Admin "Insert image" is already on (`folder: 'projects'`).

### F. Data

- `projects` columns (`src/types/database.ts:230-246`):
  - `id`, `user_id`, `slug` (nullable), `title`, `short_description`, `content`, `images`
  - `tech_stack`, `tags` (both `string[] | null`)
  - `demo_url`, `repo_url`, `is_featured`, `created_at`, `updated_at`
  - **No `published_at`**: order by `(created_at, id)`.
- `PROJECT_CARD_COLUMNS` (`api.ts:10`) has no `tags`/`created_at`.
  - Add a column only if the card needs it.
  - Never use `select=*` (`data-layer.spec.ts:30-31`).
- Decision (owner, 2026-10-25): related and tag chips use **`tags`**, not `tech_stack`. Keep it consistent with blog and #128.
- e2e mock (`e2e/fixtures/supabase-mock.ts:74-120`) already supports:
  - `eq`, `neq`, `lt`, `gt`, `ov`, `cs`, `ilike`
  - `or=(…ilike…)`
  - multi-column `order`, `limit`/`offset`
- Fixtures (`e2e/fixtures/dataset.ts:52-84`):
  - `project-1..8`: ids 1–8, "Project N", `tech_stack ['React','Supabase','Go']`, `tags [i%2?'web':'backend','oss']`
  - featured: ids 1–3
  - images: `p{N}a`/`p{N}b`
  - all `created_at = '2026-01-15T10:00:00.000Z'` (l.8)
  - plus `long-content` (id 99, tags `['oss']`, 1 image)
  - 9 projects in total

### G. Budgets

- The `/` budget is the one at risk (home carousel).
- There is no `/projects` initial-JS budget. Optional: add one in T-61, mirroring the `/blog` entry, at measured size + 15–20%.

## 5. Don't-break contracts

Run these specs after every task. If one must change, the PR explains why, and the change only extends the assertion.

| Spec                                                     | Contract                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/seo.spec.ts:91-104`                                 | `/projects` cards are crawlable `a[href="/projects/project-1"]`, keyboard reachable                                                                                                                                                                                                                                                                                                                                                      |
| `e2e/seo.spec.ts:123-139`                                | from that link, `xpath=ancestor::div[contains(@class,"group")][1]` contains `a[target="_blank"]`; each one's `closest('.absolute') ?? el` has computed `z-index > 0`. **Keep a `.group` div ancestor and keep the external links inside an `.absolute` element with z-index > 0.**                                                                                                                                                       |
| `e2e/url-state.spec.ts:20-31`                            | `/projects` has a page-2 button; `?page=2` survives reload and back. **Page size must stay < 9** (9 fixtures), or grow the fixtures.                                                                                                                                                                                                                                                                                                     |
| `e2e/data-layer.spec.ts:30-55, 88-91`                    | `button /^#?oss$/` visible; `rpc/project_tags` called; no `select=tags&` scan; no `select=*`; unknown slug handled                                                                                                                                                                                                                                                                                                                       |
| `e2e/client-nav.spec.ts`                                 | home → Projects shows "Project 1", painted (opacity 1). **Keep `MotionScope`.**                                                                                                                                                                                                                                                                                                                                                          |
| `e2e/prerender.spec.ts:23, 71-73, 82`                    | `/projects/long-content` no overflow; no JS: `/projects/project-1` h1 "Project 1"; `/projects` h1 "All Projects"; hydration with no console errors                                                                                                                                                                                                                                                                                       |
| `e2e/project-detail.spec.ts`                             | list "Gallery"; buttons `/full screen$/` ("Open image n of N full screen"); dialog "Image viewer"; alt "Screenshot of Project 1"; prerendered HTML: the **first** occurrence of "Related projects" is followed by `long-content`, `project-8`, `project-7` and not `project-1`, with no `role="dialog"`; region "Related projects" has exactly **3 h3**; navigation to "Project 8"; no overflow at 375 px; layout-box checks (l.121-154) |
| `e2e/images.spec.ts:22-23, 122`                          | images on `/projects` and `/projects/project-1`; admin upload to `/projects/<uuid>_1600x1200.webp`                                                                                                                                                                                                                                                                                                                                       |
| `e2e/admin-crud.spec.ts:25-67`                           | project create/edit/delete via admin tabs                                                                                                                                                                                                                                                                                                                                                                                                |
| `e2e/smoke.spec.ts:80`                                   | unknown project slug → not-found                                                                                                                                                                                                                                                                                                                                                                                                         |
| `e2e/motion.spec.ts`                                     | "carousel: keyboard and dot buttons change the slide" (`ImageCarousel` in the card)                                                                                                                                                                                                                                                                                                                                                      |
| `e2e/home-carousel.spec.ts`, `FeaturedCarousel.test.tsx` | blog featured carousel unchanged                                                                                                                                                                                                                                                                                                                                                                                                         |
| `e2e/blog-detail.spec.ts`                                | blog detail unchanged after shared modules move (T-62)                                                                                                                                                                                                                                                                                                                                                                                   |

## 6. Execution plan

Merge order top to bottom. Status, priority, size, estimate and dates are set on the GitHub project ("Issues Tracker").

| #   | Task                                              | Issue | Prio      | Size · est. | Start → Target | Branch                                 | Agents                                                                                  |
| --- | ------------------------------------------------- | ----- | --------- | ----------- | -------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | **T-60** ProjectCard parity + `ensureFullUrl` fix | #135  | P1 high   | S · 3 h     | 10-27 → 10-28  | `fix/T-60-project-card`                | Sonnet (card), Haiku (contract check)                                                   |
| 2   | **T-61** `/projects` list parity                  | #136  | P1 high   | M · 5 h     | 10-28 → 10-30  | `feat/T-61-projects-list`              | Sonnet (api/queries + page), Haiku (e2e/fixture edits)                                  |
| 3   | **T-59** featured projects carousel               | #137  | P2 medium | M · 4 h     | 10-30 → 11-02  | `feat/T-59-featured-projects-carousel` | Opus (generic `Carousel` extraction), Sonnet (home wiring + e2e)                        |
| 4   | **T-62** project detail as a reading page         | #138  | P2 medium | L · 8 h     | 11-02 → 11-06  | `feat/T-62-project-detail`             | Opus (layout + `src/features/article` move), Sonnet (adjacent API + share/footer + e2e) |

The full steps and acceptance criteria are in each issue body. The notes below cover only what the issues don't say.

### T-60 (#135) card

- Show actions on `group-hover` **and** `group-focus-within`, and always under `@media (hover: none)`.
  - Tailwind 3 has no `hover:none` variant; add one small rule to `src/styles/global.css` and watch the CSS budget.
- `aria-label`s: "Live demo of {title}" / "Source code of {title}".
- Card controls (`ImageCarousel` dots/arrows) must not trigger the stretched link: they are above it with `relative z-10`.
- Add optional props `headingLevel` (default `h3`), `sizes` and `className`, plus `variant` only if T-61 wants a feature card.
- `ensureFullUrl` on the detail sidebar links. e2e asserts `href^="https://"`.

### T-61 (#136) list

- Search: `orIlikeFilter(['title', 'short_description'], q)`.
- Sort: `.order('created_at', { ascending }).order('id', { ascending })`.
- `projectKeys.list(params)` must default `sort` to `'newest'` and `query` to `''`, so the prerendered `/projects` key equals the client key. Otherwise hydration refetches or flashes. Update `src/lib/query-keys.test.ts`.
- Keep `ITEMS_PER_PAGE = 6` (url-state contract). The feature card is optional (only if T-60 added `variant`).
- New e2e:
  - `sort=oldest` → request `order=created_at.asc,id.asc`, restored after reload
  - a search that only matches `short_description`
  - Clear filters resets `q`/`tag`/`sort`/`page`

### T-59 (#137) carousel

- Generic `Carousel<T>({ items, getKey, renderItem, renderSkeleton, label, minForCarousel = 4 })`.
- `FeaturedCarousel` becomes a wrapper with **identical DOM and labels**, so its tests stay green.
- `FEATURED_PROJECTS_LIMIT = 9`.
- Fixtures: make ids 1–4 featured. Re-check every spec that counts featured projects, and the home `ProjectCardSkeleton` count.
- Home renders it inside the existing `MotionScope`.

### T-62 (#138) detail

- Move `TableOfContents`, `toc`, `article-headings`, `reading`, `ShareBar`, `ReadingProgress` and the generic parts of `ArticleFooter` into `src/features/article/`. **Re-export from the old blog paths**, so blog imports and tests are untouched (run `blog-detail.spec.ts`).
- `PostNavigation`/`RelatedPosts` become generic over `{ slug, title }` and a base path. Keep blog's DOM.
- Add `getAdjacentProjects(id, createdAt)` mirroring `getAdjacentBlogs` (`blog/api.ts:99-132`, 4 queries: same-timestamp peer by id first, then nearest earlier/later). Every fixture shares one `created_at`, so the tie-break **is** the normal path here. Query key includes `id`.
- Keep the string "Related projects" out of everything rendered above the Related section (the prerender test uses `indexOf`).
- Give one fixture project content with ≥ 3 headings for the TOC. `long-content` (id 99) is a candidate, but check `prerender.spec.ts:23` and the Related expectations.
- `Seo type="article"`.

## 7. Workflow per task (CONTRIBUTING + CODE_OF_CONDUCT)

1. **Issue:** already created (#135–#138, tracking #139). Move its project Status to _In progress_ when you start.
2. **Branch:** from `origin/main` in a fresh worktree: `<type>/T-xx-short-name`.
3. **Implement:** with sub-agents per §2, then review the diff yourself.
4. **Verify** (all must pass; CI runs the same):
   ```bash
   npm run typecheck && npm run lint && npm run format:check && npm test
   PRERENDER_MOCK=1 VITE_SUPABASE_URL=https://mock.supabase.co VITE_SUPABASE_ANON_KEY=ci-dummy-anon-key npm run build && npm run size
   CI=1 npx playwright test --project=desktop --project=mobile --project=tablet
   CI=1 npx playwright test --project=w320 --project=light --project=reduced-motion e2e/smoke.spec.ts
   ```
   Known flaky test, unrelated to this work: `performance.spec.ts` "3D card only on desktop" (`grab` vs `grabbing`), about 1 in 5 runs. Mention it in the PR if it shows up; don't fix it in these PRs.
5. **Commit:** Conventional Commits, split by concern (e.g. `feat(projects): …`, `fix(projects): …`, `test(e2e): …`, `chore(size): …`). End every message with the Co-Authored-By line given in the session's attribution instructions. The CHANGELOG comes from release-please; don't edit it.
6. **PR:**
   - base `main` (**never stack PRs**: a stacked PR got merged into its base branch instead of `main` once)
   - fill `.github/pull_request_template.md` completely: Summary, `Closes #n`, `Plan task: T-xx`, Type, How it was tested with real numbers, the budget table, Checklist
   - assignee `ilramdhan`; the same labels as the issue
   - add it to project 3 with Status _In review_, and set the issue to _In review_
   - end the body with the attribution line from the session instructions
7. **Merge:**
   - The ruleset requires 1 code-owner approval and squash merge. The owner merges; never use `--admin` to bypass review.
   - After merge, delete the branch (remote and local) and the worktree, and tick the box in #139.
8. **Review bots** (Codex/Copilot) comment on PRs. Read their inline comments, fix valid P1/P2 findings in the same PR, and mention them in a commit message.
9. **CODE_OF_CONDUCT** (Contributor Covenant): keep issue and PR text factual and respectful, and never paste secrets or private data.

## 8. Done when

- [ ] #135, #136, #137, #138 merged; #139 closed
- [ ] Project pages offer everything in [§3](#3-what-the-blog-has-reuse-dont-copy) that makes sense for projects
- [ ] All contracts in §5 pass on `main`; budgets pass with headroom
- [ ] `docs/PLAN.md` §9 issue index lists T-59…T-63
- [ ] This file is deleted, or marked "Done" at the top, in the last PR
