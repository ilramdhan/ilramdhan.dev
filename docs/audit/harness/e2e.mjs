// Audit harness: serves the prod build against a mocked Supabase REST API with dummy data.
import { chromium } from 'playwright';
import fs from 'fs';

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:4173';
const now = new Date().toISOString();
const img = (t) => `https://placehold.co/1200x630/png?text=${encodeURIComponent(t)}`;

const db = {
  profile: [{ id: 'u1', display_name: 'Dummy Dev', badge_text: 'Open to work', hero_title: 'Web Developer, Backend Engineer, Open Source',
    short_description: 'I build fast web apps.', detailed_bio: '## Hi\nThis is **dummy** bio.', avatar_url: img('avatar'), resume_url: 'example.com/cv.pdf',
    address: 'Jakarta, Indonesia', footer_text: '© 2026 Dummy Dev', logo_text: 'DummyDev', logo_url: null,
    privacy_content: '# Privacy\nDummy.', terms_content: '# Terms\nDummy.',
    social_links: { github: 'https://github.com/dummy', linkedin: 'linkedin.com/in/dummy', mail: 'dummy@example.com' } }],
  projects: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, user_id: 'u1', created_at: now, title: `Project ${i + 1}`, slug: `project-${i + 1}`,
    short_description: 'A dummy project description that is reasonably long to test clamping behaviour.', content: '## Overview\nDummy content\n\n- a\n- b',
    images: [img(`p${i + 1}a`), img(`p${i + 1}b`)], tech_stack: ['React', 'Supabase', 'Go'], tags: [i % 2 ? 'web' : 'backend', 'oss'],
    demo_url: 'https://example.com', repo_url: 'github.com/x/y', is_featured: i < 3 })),
  blogs: Array.from({ length: 7 }, (_, i) => ({ id: i + 1, user_id: 'u1', created_at: now, published_at: now, title: `Blog Post ${i + 1}`, slug: `blog-post-${i + 1}`,
    excerpt: 'Dummy excerpt.', content: '## Heading\nParagraph with `code`.\n\n```js\nconsole.log(1)\n```', images: [img(`b${i + 1}`)], tags: [i % 2 ? 'react' : 'go'], is_featured: i < 2 })),
  services: [1, 2, 3].map((i) => ({ id: i, user_id: 'u1', title: `Service ${i}`, description: 'Dummy **service**', icon_name: ['code', 'cloud', 'database'][i - 1] })),
  tech_stack: ['React', 'TypeScript', 'Go', 'PostgreSQL', 'Docker'].map((n, i) => ({ id: i + 1, user_id: 'u1', name: n, icon_url: null, category: 'x', created_at: now })),
  resume: [{ id: 1, user_id: 'u1', type: 'experience', title: 'Engineer', institution: 'ACME', period: '2022 - Now', description: 'Did things', gpa: null, tags: [] },
    { id: 2, user_id: 'u1', type: 'education', title: 'BSc CS', institution: 'Uni', period: '2018 - 2022', description: '', gpa: '3.8', tags: [] }],
  certificates: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, user_id: 'u1', title: `Cert ${i + 1}`, description: 'Dummy', issued_by: i % 2 ? 'Google' : 'AWS',
    issued_date: '2025-01-01', expiry_date: null, credential_url: 'https://example.com', file_url: img(`c${i + 1}`), created_at: now })),
  messages: [{ id: 1, created_at: now, name: 'Visitor', email: 'v@example.com', message: 'Hello there', is_read: false }],
  blog_comments: [{ id: 1, blog_id: 1, name: 'Reader', content: 'Nice post', created_at: now }],
};

const restLog = [];
async function mockSupabase(route) {
  const req = route.request();
  const url = new URL(req.url());
  restLog.push(`${req.method()} ${url.pathname}${url.search}`);
  if (url.pathname.startsWith('/auth/v1/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  const table = url.pathname.replace('/rest/v1/', '');
  let rows = db[table] ?? [];
  if (req.method() !== 'GET') return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
  for (const [k, v] of url.searchParams) {
    if (v.startsWith('eq.')) rows = rows.filter((r) => String(r[k]) === v.slice(3));
  }
  const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
  if (single) return rows[0] ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows[0]) })
    : route.fulfill({ status: 406, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST116', message: 'no rows' }) });
  const limit = Number(url.searchParams.get('limit') || 0);
  const offset = Number(url.searchParams.get('offset') || 0);
  const page = limit ? rows.slice(offset, offset + limit) : rows;
  return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `0-${page.length - 1}/${rows.length}` }, body: JSON.stringify(page) });
}

const report = { pages: {}, restLog };
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function visit(name, path, viewport, { admin = false, theme = 'dark' } = {}) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = []; const failed = []; const bytes = { total: 0 };
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on('requestfailed', (r) => failed.push(r.url().slice(0, 120)));
  page.on('response', async (r) => { try { const b = await r.body(); bytes.total += b.length; if (b.length > 200000) (bytes.big ??= []).push(`${(b.length / 1024).toFixed(0)}KB ${r.url().slice(0, 90)}`); } catch {} });
  await page.route('https://mock.supabase.co/**', mockSupabase);
  await page.route(/placehold\.co|simpleicons|wakatime|github|githubusercontent/, (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>' }));
  await page.addInitScript(([t, admin]) => {
    localStorage.setItem('theme', t);
    if (admin) localStorage.setItem('sb-mock-auth-token', JSON.stringify({ access_token: 'x', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r',
      user: { id: 'attacker-not-owner', aud: 'authenticated', role: 'authenticated', email: 'random-github-user@example.com', app_metadata: { provider: 'github' }, user_metadata: {} } }));
  }, [theme, admin]);
  const t0 = Date.now();
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errors.push('goto: ' + e.message.slice(0, 120)));
  await page.waitForTimeout(1500);
  const loadMs = Date.now() - t0;
  const info = await page.evaluate(() => {
    const q = (s) => [...document.querySelectorAll(s)];
    return {
      title: document.title, lang: document.documentElement.lang,
      desc: document.querySelector('meta[name=description]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content, ogUrl: document.querySelector('meta[property="og:url"]')?.content,
      canonical: document.querySelector('link[rel=canonical]')?.href,
      h1: q('h1').map((h) => h.textContent.trim().slice(0, 50)),
      anchors: q('a[href]').length, buttons: q('button').length,
      buttonsNoName: q('button').filter((b) => !(b.textContent.trim() || b.getAttribute('aria-label') || b.title)).length,
      linksNoName: q('a').filter((a) => !(a.textContent.trim() || a.getAttribute('aria-label') || a.title || a.querySelector('img[alt]'))).length,
      imgsNoAlt: q('img').filter((i) => !i.hasAttribute('alt')).length,
      imgsNoLazy: q('img').filter((i) => i.loading !== 'lazy').length,
      inputsNoLabel: q('input:not([type=hidden]):not([type=checkbox]),textarea').filter((i) => !(i.id && document.querySelector(`label[for="${i.id}"]`)) && !i.getAttribute('aria-label') && !i.closest('label')).length,
      hScroll: document.documentElement.scrollWidth > window.innerWidth,
      canvases: q('canvas').length, mainLandmarks: q('main').length,
      jsonLdCount: q('script[type="application/ld+json"]').length,
    };
  });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  report.pages[name] = { path, viewport: `${viewport.width}x${viewport.height}`, loadMs, transferredKB: Math.round(bytes.total / 1024), big: bytes.big, errors: errors.slice(0, 8), failed: failed.slice(0, 5), ...info };
  await ctx.close();
}

const desk = { width: 1366, height: 800 }, mob = { width: 375, height: 740 };
for (const [n, p] of [['home', '/'], ['about', '/about'], ['projects', '/projects'], ['project-detail', '/projects/project-1'], ['blog', '/blog'],
  ['blog-detail', '/blog/blog-post-1'], ['certificates', '/certificates'], ['privacy', '/privacy'], ['notfound', '/this-page-does-not-exist'], ['blog-missing', '/blog/nope'], ['login', '/login']]) {
  await visit(`${n}-desktop`, p, desk);
  await visit(`${n}-mobile`, p, mob);
}
await visit('home-light-desktop', '/', desk, { theme: 'light' });
await visit('admin-as-random-github-user-desktop', '/admin', desk, { admin: true });
await visit('admin-as-random-github-user-mobile', '/admin', mob, { admin: true });

// Blog tag filter bug: click a tag and see whether request includes a tag filter
{
  const ctx = await browser.newContext({ viewport: desk }); const page = await ctx.newPage();
  const reqs = [];
  await page.route('https://mock.supabase.co/**', (r) => { reqs.push(r.request().url()); return mockSupabase(r); });
  await page.goto(BASE + '/blog', { waitUntil: 'networkidle' });
  reqs.length = 0;
  await page.getByRole('button', { name: '#react' }).click();
  await page.waitForTimeout(800);
  report.blogTagFilterRequests = reqs.filter((u) => u.includes('/blogs')).map((u) => decodeURIComponent(u.replace('https://mock.supabase.co', '')));
  // keyboard: tab order on home
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const focus = [];
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); focus.push(await page.evaluate(() => { const a = document.activeElement; return `${a.tagName}:${(a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 20)}|outline=${getComputedStyle(a).outlineStyle}`; })); }
  report.tabOrder = focus;
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log('done');
