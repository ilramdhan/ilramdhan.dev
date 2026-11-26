# F12 admin + login inventory (step 1)

Written before any admin/login UI change (PLAN §8.5). Every function below must still work after step 2;
each row names the test that proves it. Status: **proven** (test existed before F12), **added in F12** (new
test in this step), **n/a** (function does not exist today; listed so step 2 doesn't invent or lose it).

Specs: `crud` = `e2e/admin-crud.spec.ts`, `admin` = `e2e/admin.spec.ts`, `i18n` = `e2e/i18n-content.spec.ts`,
`images` = `e2e/images.spec.ts`, `shell` = `e2e/admin-shell.spec.ts` (new), `msgs` = `e2e/admin-messages.spec.ts`
(new), `forms` = `e2e/admin-forms.spec.ts` (new), `unit` = `src/features/admin/admin.test.tsx`,
`route-unit` = `src/app/AdminRoute.test.tsx`, `isadmin-unit` = `src/lib/useIsAdmin.test.ts`,
`login-unit` = `src/pages/login.test.tsx` (new).

All CRUD tabs share one engine: `ResourceManager` (list, add/edit form, row buttons) on top of
`useCrudResource` (create, diffed update, optimistic delete, toasts) and `ResourceForm` (zod validation,
EN | ID tabs, uploads). Profile uses `ResourceForm` directly; Messages is hand-written.

## Auth, login, shell

| Function                                                                   | Where                                                   | Proving test                                                                                    | Status                                                                             |
| -------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/admin` anonymous → `/login`                                              | `src/app/AdminRoute.tsx:35`                             | admin "redirects anonymous visitors"; route-unit "redirects anonymous"                          | proven                                                                             |
| Loading state while auth/admin check pending                               | `AdminRoute.tsx:32-34`                                  | route-unit "shows a loading state"                                                              | proven                                                                             |
| Allowlisted admin gets the dashboard + navbar "Dashboard" pill             | `AdminRoute.tsx:53`, `src/app/layouts/Navbar.tsx:43-50` | admin "an allowlisted admin gets the dashboard"                                                 | proven                                                                             |
| Non-admin: toast, signed out once, redirected home                         | `AdminRoute.tsx:24-31`                                  | admin "a signed-in non-admin…"; route-unit "signs a non-admin out once"                         | proven                                                                             |
| No `is_admin()` (pre-migration) → access + console warning                 | `src/lib/useIsAdmin.ts`                                 | admin "before the migration…"; isadmin-unit                                                     | proven                                                                             |
| Failed admin check → alert + "Try again"                                   | `AdminRoute.tsx:36-51`                                  | admin "a failed admin check offers a retry"; route-unit "offers a retry"                        | proven                                                                             |
| Admin/login English-only (no `/id/admin`)                                  | `src/app/routes.tsx:73-85`, `src/i18n/locale.ts:20-21`  | `src/i18n/locale.test.ts`                                                                       | proven                                                                             |
| Login page: h1 "Admin login", noindex                                      | `src/pages/login.tsx:32-36`                             | admin (h1); `e2e/seo.spec.ts` "/login … noindex"                                                | proven                                                                             |
| "Sign In with GitHub" → GitHub OAuth redirect                              | `login.tsx:21-28`, `src/app/auth.tsx:80-85`             | shell "starts the GitHub OAuth redirect" (`/auth/v1/authorize?provider=github`)                 | added in F12                                                                       |
| Failed sign-in → error toast                                               | `login.tsx:24-26`                                       | login-unit "toasts when the GitHub sign-in fails"                                               | added in F12                                                                       |
| Already signed in on `/login` → toast + `/admin`                           | `login.tsx:14-19`                                       | shell "a signed-in visitor is sent on"                                                          | added in F12                                                                       |
| Button disabled + spinner while auth loading                               | `login.tsx:43-47`                                       | none (sub-second state, no observable hook in e2e)                                              | unprovable: transient; keep `disabled={isLoading}`                                 |
| Login "Back to Home" link                                                  | `login.tsx:55-62`                                       | `e2e/seo.spec.ts` "client-side navigation…" clicks it                                           | proven                                                                             |
| Logout: signOut, toast "Logged out successfully", leaves dashboard         | `src/pages/admin.tsx:46-50`                             | shell "logout signs out, toasts and leaves the dashboard"                                       | added in F12 (see B1)                                                              |
| Sidebar tab switching (8 tabs, each shows its heading)                     | `admin.tsx:42,52-72,107-116`                            | shell "every sidebar entry shows its tab"                                                       | added in F12                                                                       |
| Active tab highlighted                                                     | `admin.tsx:111`                                         | none (class only; no `aria-current`)                                                            | unprovable: no semantic state; step 2 should add `aria-current="page"` and test it |
| "Back to Website" link                                                     | `admin.tsx:100-105,154-159`                             | shell "Back to Website leaves the dashboard"                                                    | added in F12                                                                       |
| Mobile menu: open (`aria-expanded`), close via sheet X, backdrop, tab pick | `admin.tsx:78-87,129-185`                               | shell "mobile sidebar opens, closes…" (mobile only; tablet and desktop always show the sidebar) | added in F12 (see B2)                                                              |
| Tab survives refresh/back                                                  | n/a (`useState`, PLAN §8.5 wants `/admin/:tab`)         | none                                                                                            | n/a: new in step 2                                                                 |
| Toaster (sonner, bottom-right)                                             | `src/app/layouts/PublicLayout.tsx:51`                   | every toast assertion above/below                                                               | proven                                                                             |

## Shared form engine (all CRUD tabs + profile)

| Function                                                       | Where                                                           | Proving test                                                                           | Status                    |
| -------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------- |
| List rows                                                      | `ResourceManager.tsx:87-94`, `useCrudResource.ts:33`            | unit "loads the list"; crud (each tab edits a listed row)                              | proven                    |
| Add opens empty form, Edit opens filled form                   | `ResourceManager.tsx:47,60,65-85`                               | unit "ResourceManager opens the form…"; crud                                           | proven                    |
| Create: mapped payload, toast "X added!", refetch, form closes | `useCrudResource.ts:36-64`, `ResourceManager.tsx:82`            | unit "creates with the mapped payload…"; crud                                          | proven                    |
| Update sends only changed fields                               | `useCrudResource.ts:53-55`, `diff.ts`                           | unit "sends only the changed fields", "skips the request…"; crud                       | proven                    |
| Delete: optimistic, toast "X removed.", rollback on error      | `useCrudResource.ts:66-84`                                      | unit "removes a row…optimistically", "restores the list…"; crud                        | proven                    |
| Cancel closes the form, nothing sent                           | `ResourceForm.tsx:135-139`                                      | unit (ResourceManager Cancel); forms "cancel closes the form without saving"           | proven + e2e added in F12 |
| Save error → toast with server message, form kept              | `useCrudResource.ts:29-31`                                      | unit "surfaces create errors as a toast"; forms "a failed save shows the server error" | proven + e2e added in F12 |
| Zod validation inline (`aria-describedby`), focus first error  | `ResourceForm.tsx:75-91`, `useZodForm.ts`                       | unit "shows zod errors inline", "flags a missing required field"; crud "invalid input" | proven                    |
| URL normalisation (scheme added)                               | `fields.ts` `urlOrNull`                                         | unit "validates optional URLs"; crud (demo_url, credential_url, twitter)               | proven                    |
| Tags comma split/join                                          | `fields.ts`                                                     | unit "splits/joins comma-separated tags"; crud (tech_stack, tags)                      | proven                    |
| Slug from title                                                | `resources/projects.ts`, `resources/blog.ts`                    | crud (slug `my-new-project`, `hello-world`, `project-one`)                             | proven                    |
| Featured checkbox (`is_featured`) — the only "publish" toggle  | `ResourceForm.tsx:307-318`, projects/blog resources             | forms "featured toggle and removing a stored image are saved"                          | added in F12              |
| Image upload (multi, WebP compression, Storage path)           | `ResourceForm.tsx:319-361`, `uploads.ts`, `src/lib/upload.ts`   | unit "resolveUploads…"; images "a 4 MB JPEG is stored as a <= 400 KB WebP"             | proven                    |
| Remove a stored image                                          | `ResourceForm.tsx:332-339`                                      | unit "submits parsed values and lets existing images be removed"; forms (e2e)          | proven + e2e added in F12 |
| Single file upload (PDF/image) + current-file link             | `ResourceForm.tsx:362-397`                                      | forms "certificate file upload…", "profile: CV upload… wrong type is refused"          | added in F12              |
| Upload type/size validation error                              | `src/lib/upload.ts:60-79`                                       | forms (wrong type toast); `src/lib/upload.test.ts`                                     | added in F12 (e2e)        |
| Markdown field: "Insert image" uploads + inserts at cursor     | `MarkdownField.tsx:39-70`                                       | unit "inserts an uploaded image…", "keeps edits…", "blocks saving and cancelling…"     | proven                    |
| Markdown live preview                                          | n/a (plain textarea + hint)                                     | none                                                                                   | n/a: does not exist today |
| EN \| ID tabs: WAI-ARIA tabs, roving focus, unique ids         | `ResourceForm.tsx:96-112,172-227`                               | i18n "tabs are keyboard operable…"; unit "gives each form its own tab ids"             | proven                    |
| ID text saved into `translations.id`; empty ID → none sent     | `translations.ts`, `useCrudResource.ts:40-48`                   | i18n (both tests); unit "keeps stored translations…"                                   | proven                    |
| Failed save from ID tab returns to EN + focuses error          | `ResourceForm.tsx:75-82`                                        | unit "switches to the EN tab and focuses…"                                             | proven                    |
| Reorder rows                                                   | n/a (lists follow DB order)                                     | none                                                                                   | n/a                       |
| Draft / unpublished state                                      | n/a (blog `published_at` is set on create, `resources/blog.ts`) | crud blog (`published_at: any String`)                                                 | n/a (no toggle)           |
| Confirm before row delete                                      | n/a (one click deletes; see B4)                                 | crud (deletes without a dialog)                                                        | n/a                       |

## Per tab

### Overview / Profile (`src/pages/admin/ProfileTab.tsx`, `resources/profile.ts`)

| Function                                           | Where                  | Proving test                                             | Status                                      |
| -------------------------------------------------- | ---------------------- | -------------------------------------------------------- | ------------------------------------------- |
| Load profile into form (h1 "General Settings")     | `ProfileTab.tsx:20,53` | every admin e2e `beforeEach`                             | proven                                      |
| Save only changed fields, toast "Profile updated!" | `ProfileTab.tsx:22-47` | crud "profile: saves only changed fields…"               | proven                                      |
| Social links normalised; email validated           | `resources/profile.ts` | crud "profile…" (twitter URL, invalid email)             | proven                                      |
| Avatar / logo image upload + preview               | `profile.ts:72-87`     | same code path as the CV upload (`kind: 'file'`)         | proven via CV (forms); preview not asserted |
| CV (PDF) upload + "Current CV" link                | `profile.ts:88-95`     | forms "profile: CV upload…"                              | added in F12                                |
| ID translation of profile texts                    | `ProfileTab.tsx:33-38` | forms "profile: ID texts are saved into translations.id" | added in F12                                |
| Form remounts with fresh values after save         | `ProfileTab.tsx:57`    | forms CV test (second save after the first error)        | added in F12                                |

### Resume (`ResumeTab.tsx`, `resources/resume.ts`) — two managers: Work Experience, Education

| Function                            | Where                 | Proving test                                     | Status          |
| ----------------------------------- | --------------------- | ------------------------------------------------ | --------------- |
| Create experience                   | `ResumeTab.tsx:27-35` | crud "resume: experience and education CRUD"     | proven          |
| Edit education (GPA)                | `ResumeTab.tsx:36-43` | crud                                             | proven          |
| Delete experience                   | `ResumeTab.tsx:18`    | crud                                             | proven          |
| Create education / delete education | same engine           | crud covers each verb on one of the two managers | proven (engine) |

### Services (`ServicesTab.tsx`, `resources/services.ts`)

| Function                    | Where                  | Proving test                                 | Status       |
| --------------------------- | ---------------------- | -------------------------------------------- | ------------ |
| Create / edit icon / delete | `ServicesTab.tsx:7-34` | crud "services: create, edit and delete"     | proven       |
| Server error on create      | engine                 | forms "a failed save shows the server error" | added in F12 |

### Projects (`ProjectsTab.tsx`, `resources/projects.ts`)

| Function                                    | Where                  | Proving test                                     | Status          |
| ------------------------------------------- | ---------------------- | ------------------------------------------------ | --------------- |
| Create / edit (diff) / delete               | `ProjectsTab.tsx:7-37` | crud "projects: create, edit…", "invalid input…" | proven          |
| Image upload compression                    | engine                 | images "a 4 MB JPEG…"                            | proven          |
| Featured toggle, remove stored image        | engine                 | forms "featured toggle…"                         | added in F12    |
| EN \| ID tabs + translations                | engine                 | i18n "admin EN \| ID tabs"                       | proven          |
| Markdown "Insert image" (folder `projects`) | `projects.ts:36-41`    | unit (engine, folder `blogs`)                    | proven (engine) |

### Blog (`BlogTab.tsx`, `resources/blog.ts`)

| Function                                            | Where              | Proving test                                  | Status          |
| --------------------------------------------------- | ------------------ | --------------------------------------------- | --------------- |
| Create (slug, tags, `published_at`) / edit / delete | `BlogTab.tsx:7-37` | crud "blog: create, edit and delete"          | proven          |
| Cancel the create form                              | engine             | forms "cancel closes the form without saving" | added in F12    |
| Featured, images, markdown, EN \| ID                | engine             | as Projects                                   | proven (engine) |

### Messages (`MessagesTab.tsx`, `src/features/messages/api.ts`)

| Function                                                                             | Where                           | Proving test                                                                   | Status       |
| ------------------------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------ | ------------ |
| List, newest first, count in h1 "Inbox (N)"                                          | `MessagesTab.tsx:15,64-67`      | msgs "lists messages…", "empty inbox says so"                                  | added in F12 |
| Unread dot + "Mark as Read" (unread only)                                            | `MessagesTab.tsx:102,111-119`   | msgs "lists messages…" (PATCH `is_read`), "read messages have no Mark as Read" | added in F12 |
| Mark All Read + toast                                                                | `MessagesTab.tsx:32-38,77-79`   | msgs "lists messages…" (PATCH `is_read=eq.false`)                              | added in F12 |
| Delete one + toast "Message deleted."                                                | `MessagesTab.tsx:17-23,120-126` | msgs "lists messages…"                                                         | added in F12 |
| Select + bulk delete with `confirm()` dialog (cancel keeps, accept deletes selected) | `MessagesTab.tsx:44-58,69-76`   | msgs "bulk delete asks first…"                                                 | added in F12 |
| Pagination 10/page, prev/next disabled at ends                                       | `MessagesTab.tsx:40-42,137-157` | msgs "paginates 10 per page"                                                   | added in F12 |
| Empty state                                                                          | `MessagesTab.tsx:83-84`         | msgs "empty inbox says so"                                                     | added in F12 |

### Certificates (`CertificatesTab.tsx`, `resources/certificates.ts`)

| Function                                    | Where                      | Proving test                                 | Status       |
| ------------------------------------------- | -------------------------- | -------------------------------------------- | ------------ |
| Create (dates, null expiry) / edit / delete | `CertificatesTab.tsx:7-30` | crud "certificates: create, edit and delete" | proven       |
| File upload (PDF) → `file_url`              | `certificates.ts:45-51`    | forms "certificate file upload…"             | added in F12 |

### Tech Stack (`TechStackTab.tsx`, `resources/tech-stack.ts`)

| Function                                    | Where                       | Proving test                              | Status |
| ------------------------------------------- | --------------------------- | ----------------------------------------- | ------ |
| Icon preview follows the name (simpleicons) | `TechStackTab.tsx:14,42-62` | crud "tech stack: icon follows the name…" | proven |
| Create / edit (icon regenerated) / delete   | `TechStackTab.tsx:7-40`     | crud                                      | proven |

## Totals

68 rows: 39 proven before F12, 22 proven by tests added in F12 (19 new + 3 that already had a unit test and
gained an e2e), 5 n/a (tab URL, markdown preview, reorder, draft, delete confirm) and 2 unprovable (login
spinner: transient; active-tab highlight: class only).

## Bugs found (not fixed in step 1; UI is untouched)

- **B1 logout lands on `/login`, not `/`.** `handleLogout` awaits `signOut()` then `navigate('/')`; the auth
  change re-renders `AdminRoute` first, which sends the signed-out user to `/login`. Test accepts both.
- **B2 mobile "Close menu" toggle is unclickable once the sheet is open.** Toggle (`fixed top-4 left-4 z-50`) and
  the sheet (`fixed left-0 w-64 z-50`, later in the DOM) overlap; the sheet wins. Only the sheet's X closes it,
  and that X has no accessible name. No Escape key, no focus trap.
- **B3 icon-only buttons without names:** mobile sheet X, Messages pager prev/next, message checkboxes (no
  label). "Mark as Read"/"Delete" rely on `title` only.
- **B4 row delete has no confirmation** (every CRUD tab and single message delete); bulk delete uses native
  `confirm()`. Row Edit/Delete buttons are `opacity-0` until hover/focus (invisible on touch).
- **B5 Messages has no error handling:** single delete / mark read show no toast on failure; bulk delete
  deletes sequentially and a mid-way failure is an unhandled rejection (no toast, selection kept, partial delete).
- **B6 active sidebar tab is shown by colour only** (no `aria-current`); tab state is lost on refresh/back.
- **B7 message rows use raw `bg-white`/`bg-parchment`** (no dark variant for read rows' text contrast audit).

## Selectors step 2 will plausibly break (update these specs with the redesign, not before)

- `openTab` helpers: `page.locator('aside').first()` / `aside:visible` + `getByRole('button', { name: <tab> })`
  in crud, i18n (`openProjectEditor`), images, shell, msgs, forms. Tabs becoming links to `/admin/:tab` → switch to
  `getByRole('link', …)` or `page.goto('/admin/<tab>')`.
- `getByRole('button', { name: 'Open menu' | 'Close menu' })` (shell, every `openTab`); sheet X via
  `menu.getByRole('button').first()` (shell, B2 workaround).
- `admin.spec.ts` `logoutButton = { name: 'Logout', includeHidden: true }` as **button**; `dashboardButton` link
  "Dashboard" in the navbar (should not change).
- Tab headings used as page-ready signals: "General Settings", "Resume / CV Management", "Services Management",
  "Manage Projects", "Manage Articles", "Inbox (N)", "Certificates", "Tech Stack"; form titles "Create Project",
  "Create Article".
- `getByRole('button', { name: 'Add' }).first()` (crud resume: two "Add" buttons).
- Messages: `name: 'Mark as Read'`/`'Delete'` come from `title`; pager found via `getByText(/^Page \d+ of 2$/)`
  parent; checkboxes by index; `Delete Selected (N)` text.
- Toast texts ("Project added!", "Logged out successfully", …) and the login strings ("Admin login",
  "Sign In with GitHub", "Already logged in. Redirecting...", "Back to Home") are behaviour and should be kept.
- Shell backdrop click at `(viewport width - 10, height / 2)` assumes a ≤256px left sheet with a full backdrop.
