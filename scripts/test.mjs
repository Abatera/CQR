// Runs Vitest from a working directory with an uppercase drive letter.
// On Windows, starting Vitest from "d:\..." instead of "D:\..." makes it load two copies
// of its runner, and every test file fails with "Cannot read properties of undefined
// (reading 'config')". Other platforms are unaffected.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const upper = (p) => p.replace(/^[a-z]:/, (d) => d.toUpperCase());
const cwd = upper(process.cwd());
const vitest = upper(fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url)));
const res = spawnSync(process.execPath, [vitest, ...process.argv.slice(2)], { cwd, stdio: 'inherit' });
process.exit(res.status ?? 1);
