// Responsive + animation sweep across many viewports against the mocked build.
import { chromium } from 'playwright';
import fs from 'fs';

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:4173';
// reuse the mock from e2e.mjs by importing its db via a tiny copy
const now = new Date().toISOString();
const img = (t) => `https://placehold.co/1200x630/png?text=${t}`;
const long = 'Supercalifragilistic-very-long-project-title-without-spaces-to-test-wrapping';
const db = {
  profile: [{ id: 'u1', display_name: 'Dummy Developer Name', badge_text: 'Open to work', hero_title: 'Full Stack Web Developer, Backend Engineer',
    short_description: 'I build fast, accessible web apps with React, Go and Postgres.', detailed_bio: '## Hi\nBio.', avatar_url: img('a'), resume_url: null,
    address: 'Jakarta, Indonesia', footer_text: '© 2026 Dummy', logo_text: 'DummyDev', social_links: { github: 'https://github.com/d', linkedin: 'https://l.com/d', mail: 'd@e.com', twitter: 'x.com/d', instagram: 'i.com/d', youtube: 'y.com/d', whatsapp: 'wa.me/1', steam: 's.com/d' } }],
  projects: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, created_at: now, title: i === 0 ? long : `Project ${i + 1}`, slug: `project-${i + 1}`, short_description: 'Desc '.repeat(20),
    content: '## X\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```\n' + 'x'.repeat(200) + '\n```', images: [img('p'), img('q')], tech_stack: ['React', 'TypeScript', 'Supabase', 'Go'], tags: ['web', 'oss', 'backend', 'devops', 'cloud', 'ai', 'mobile', 'cli'], demo_url: 'https://e.com', repo_url: 'https://g.com', is_featured: i < 3 })),
  blogs: Array.from({ length: 7 }, (_, i) => ({ id: i + 1, created_at: now, published_at: now, title: i === 0 ? long : `Blog ${i + 1}`, slug: `blog-${i + 1}`, excerpt: 'Excerpt '.repeat(15),
    content: '## H\n' + 'word '.repeat(300) + '\n\n```js\n' + 'const veryLongLine = "' + 'y'.repeat(250) + '";\n```', images: [img('b')], tags: ['react', 'go', 'devops', 'cloud', 'testing', 'ux', 'a11y', 'perf'], is_featured: i < 2 })),
  services: [1, 2, 3].map((i) => ({ id: i, title: `Service ${i}`, description: 'Service description text.', icon_name: 'code' })),
  tech_stack: ['React', 'TypeScript', 'Go', 'PostgreSQL', 'Docker', 'Kubernetes', 'Tailwind CSS', 'Node.js'].map((n, i) => ({ id: i + 1, name: n, icon_url: null })),
  resume: [{ id: 1, type: 'experience', title: 'Senior Engineer', institution: 'ACME Corporation International', period: '2022 - Now', description: 'Did things' }, { id: 2, type: 'education', title: 'BSc CS', institution: 'Uni', period: '2018 - 2022', description: '' }],
  certificates: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, title: `Certificate ${i + 1}`, description: 'D', issued_by: ['AWS', 'Google', 'Microsoft', 'Dicoding', 'Coursera'][i], issued_date: '2025-01-01', file_url: img('c'), credential_url: 'https://e.com', created_at: now })),
  messages: [], blog_comments: [],
};
async function mock(route) {
  const req = route.request(); const url = new URL(req.url());
  if (url.pathname.startsWith('/auth/')) return route.fulfill({ status: 200, body: '{}' });
  let rows = db[url.pathname.replace('/rest/v1/', '')] ?? [];
  for (const [k, v] of url.searchParams) if (v.startsWith('eq.')) rows = rows.filter((r) => String(r[k]) === v.slice(3));
  if ((req.headers()['accept'] || '').includes('vnd.pgrst.object')) return route.fulfill({ status: rows[0] ? 200 : 406, contentType: 'application/json', body: JSON.stringify(rows[0] ?? {}) });
  const lim = +url.searchParams.get('limit') || rows.length, off = +url.searchParams.get('offset') || 0;
  const page = rows.slice(off, off + lim);
  return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `0-${page.length - 1}/${rows.length}` }, body: JSON.stringify(page) });
}

const viewports = [[320, 640], [360, 780], [390, 844], [414, 896], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440]];
const routes = [['home', '/'], ['about', '/about'], ['projects', '/projects'], ['project', '/projects/project-1'], ['blog', '/blog'], ['blogpost', '/blog/blog-1'], ['certs', '/certificates']];
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const result = {};
for (const [w, h] of viewports) {
  for (const [name, path] of routes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 768, isMobile: w < 768 });
    const page = await ctx.newPage();
    await page.route('https://mock.supabase.co/**', mock);
    await page.route(/placehold\.co|simpleicons|wakatime|github/, (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="100%" height="100%" fill="#888"/></svg>' }));
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
      window.__cls = 0; window.__longTasks = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { window.__longTasks += l.getEntries().length; }).observe({ type: 'longtask', buffered: true });
    });
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    // scroll through to trigger whileInView animations
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(800);
    const info = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const offenders = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || getComputedStyle(el).position === 'fixed') continue;
        if (r.right > vw + 1 || r.left < -1) {
          let p = el.parentElement, clipped = false;
          while (p) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'clip' || o === 'auto' || o === 'scroll') { clipped = true; break; } p = p.parentElement; }
          if (!clipped) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')} [${Math.round(r.left)}→${Math.round(r.right)}]`);
        }
      }
      const tiny = [...document.querySelectorAll('button,a')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.width < 24 || r.height < 24); }).length;
      const smallText = [...document.querySelectorAll('p,span,a,li')].filter((e) => e.childNodes.length && parseFloat(getComputedStyle(e).fontSize) < 12 && e.textContent.trim()).length;
      return { docW: document.documentElement.scrollWidth, vw, hScroll: document.documentElement.scrollWidth > vw, offenders: offenders.slice(0, 4), offenderCount: offenders.length, tinyTargets: tiny, smallText,
        cls: +window.__cls.toFixed(3), longTasks: window.__longTasks, runningAnimations: document.getAnimations().length };
    });
    result[`${name}@${w}`] = info;
    if (['home', 'blogpost', 'projects', 'about'].includes(name) && [320, 768, 1024, 1920].includes(w)) await page.screenshot({ path: `${OUT}/${name}-${w}.png`, fullPage: true });
    await ctx.close();
  }
}
// reduced motion check: does anything honour it?
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage(); await page.route('https://mock.supabase.co/**', mock);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  result.reducedMotion = await page.evaluate(() => ({ runningAnimations: document.getAnimations().length, canvases: document.querySelectorAll('canvas').length }));
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/responsive.json`, JSON.stringify(result, null, 2));
console.log('ok');
