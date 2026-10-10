#!/usr/bin/env node
// Regenerates the raster icons in public/ from the vector mark in public/favicon.svg
// using the Playwright Chromium already installed for e2e (no extra dependency).
// Usage: CHROMIUM_PATH=<chromium> node scripts/generate-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const pub = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const svg = fs.readFileSync(path.join(pub, 'favicon.svg'), 'utf8');
const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
const BG = '#0f172a';
const FG = '#fffaf8';

// `scale` = glyph share of the canvas; maskable icons keep it inside the 80% safe zone.
const icons = [
  { file: 'favicon-16.png', size: 16, scale: 0.8, radius: 0.2 },
  { file: 'favicon-32.png', size: 32, scale: 0.8, radius: 0.2 },
  { file: 'apple-touch-icon.png', size: 180, scale: 0.6, radius: 0 },
  { file: 'icon-192.png', size: 192, scale: 0.64, radius: 0.2 },
  { file: 'icon-512.png', size: 512, scale: 0.64, radius: 0.2 },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.5, radius: 0 },
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
for (const { file, size, scale, radius } of icons) {
  const g = size * scale;
  const html = `<body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * radius}" fill="${BG}"/>
    <svg x="${(size - g) / 2}" y="${(size - g) / 2}" width="${g}" height="${g}" viewBox="76 76 349 349" fill="${FG}">${paths.map((d) => `<path d="${d}"/>`).join('')}</svg></svg></body>`;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html);
  fs.writeFileSync(path.join(pub, file), await page.screenshot({ omitBackground: true }));
}
await browser.close();

// favicon.ico: a single 32x32 PNG-encoded image.
const png = fs.readFileSync(path.join(pub, 'favicon-32.png'));
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
fs.writeFileSync(path.join(pub, 'favicon.ico'), Buffer.concat([header, png]));
