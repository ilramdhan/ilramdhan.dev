#!/usr/bin/env node
// Regenerates public/og.png (1200x630) with the Playwright Chromium already installed for e2e.
// Mutugading tokens: white surface, ink text, one accent (action), Inter. Usage: node scripts/generate-og.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
/* global document */
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = fs.readFileSync(path.join(root, 'public/favicon.svg'), 'utf8');
const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => `<path d="${m[1]}"/>`).join('');
const font = fs
  .readFileSync(
    path.join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'),
  )
  .toString('base64');
const html = `<style>
@font-face{font-family:Inter;font-weight:100 900;src:url(data:font/woff2;base64,${font}) format('woff2')}
body{margin:0;width:1200px;height:630px;background:#fff;color:#1d1d1f;font-family:Inter;position:relative}
svg{position:absolute;left:96px;top:96px;width:72px;height:72px;fill:#1d1d1f}
h1{position:absolute;left:96px;top:300px;margin:0;font-size:96px;font-weight:600;letter-spacing:-.03em;line-height:1}
p{position:absolute;left:96px;top:424px;margin:0;font-size:40px;color:#6e6e73;letter-spacing:-.01em}
b{position:absolute;left:96px;bottom:80px;font-size:28px;font-weight:500;color:#0a6499}
</style>
<svg viewBox="76 76 349 349">${paths}</svg>
<h1>Ilham Ramadhan</h1><p>Web Developer &amp; Portfolio</p><b>ilramdhan.dev</b>`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
fs.writeFileSync(path.join(root, 'public/og.png'), await page.screenshot());
await browser.close();
