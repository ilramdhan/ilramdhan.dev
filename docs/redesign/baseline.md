# R0 baseline (before redesign, 2026-11-23)

Build: `npm run build:e2e` (Supabase mock env, prerendered) served by `vite preview` on 127.0.0.1:4290.
Re-measure the same way in R7 (Lighthouse target: ≥ these −3, aim ≥95).

## Lighthouse mobile (lighthouse@latest, headless, simulated throttling)

| Route               | Perf | A11y | Best practices | SEO | LCP   | CLS | TBT    |
| ------------------- | ---- | ---- | -------------- | --- | ----- | --- | ------ |
| /                   | 61   | 84   | 96             | 100 | 5.5 s | 0   | 780 ms |
| /about              | 88   | 82   | 96             | 100 | 3.9 s | 0   | 0 ms   |
| /projects           | 90   | 87   | 96             | 100 | 3.6 s | 0   | 0 ms   |
| /projects/project-1 | 92   | 87   | 96             | 100 | 3.4 s | 0   | 0 ms   |
| /blog               | 91   | 89   | 96             | 100 | 3.5 s | 0   | 0 ms   |
| /blog/blog-post-1   | 86   | 91   | 96             | 100 | 4.2 s | 0   | 0 ms   |
| /certificates       | 86   | 85   | 96             | 100 | 4.2 s | 0   | 0 ms   |
| /privacy            | 92   | 85   | 96             | 100 | 3.4 s | 0   | 0 ms   |
| /terms              | 92   | 85   | 96             | 100 | 3.4 s | 0   | 0 ms   |
| 404                 | –    | –    | –              | –   | –     | –   | –      |

404: Lighthouse refuses pages answering HTTP 404 ("unable to reliably load the page"); not measured.

## Bundle sizes (`npm run size`, KiB; all budgets passed)

| Budget                            | KiB    |
| --------------------------------- | ------ |
| JS total (gzip)                   | 1474.8 |
| Largest JS chunk (gzip, three.js) | 1028.5 |
| CSS total (gzip)                  | 11.9   |
| 3D models (raw, card.glb)         | 225.0  |
| 3D card chunks (gzip)             | 1030.4 |
| Initial JS / (gzip)               | 160.7  |
| Initial JS /projects (gzip)       | 131.5  |
| Initial JS /blog (gzip)           | 107.9  |
| Initial JS /privacy (gzip)        | 94.7   |
