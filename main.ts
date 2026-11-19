// PALMERA BAY — GTA VI Trophy Guide, entry program (Node 22, stdlib only).
// The guide itself is plain static files in app/ (index.html, style.css,
// app.js, data/trophies.json): no build step, no network at run time.
// This program hands it in: it copies app/ and screenshots/ from beside
// this file into the output directory and writes /output/dossier.json with
// buildDossier from the vendored make.fun library. Leave
// vendor/makefun-frontend.ts untouched — the scorer rebuilds the dossier
// with its own copy and requires the two to match byte for byte.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Caps from the scorer's gate: dossier text at most 163,840 bytes, at most
// 4 screenshots of at most 256 KiB each, app/ at most 993 files/dirs and
// 48 MiB. buildDossier refuses an entry past those limits instead of
// writing a dossier the gate would reject.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
