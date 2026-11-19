// Sunset Cover Studio — the hand-in program for make.fun's gta6-cover-art-01.
// Node 22, standard library only. It takes this repository's app/ and
// screenshots/ folders, copies them into the output directory, and writes
// /output/dossier.json with the vendored make.fun library (vendor/makefun-app.ts),
// which summarises the app for the judge. The app itself is plain static files
// under app/ — no build step, no network — so the copy is the whole hand-in.
//
// Run it locally with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program must be deterministic: run it twice and the bytes match.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root is the folder this file sits in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The gate's caps, mirrored here so a bad hand-in fails loudly at home too:
// at most 4 screenshots of 256 KiB each, app/ at most 993 entries and 48 MiB,
// no app/ path longer than 1000 bytes, and the dossier text capped at 160 KiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
