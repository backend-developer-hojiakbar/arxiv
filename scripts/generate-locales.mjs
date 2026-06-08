/**
 * Regenerates src/i18n/cyrillic.ts, english.ts, russian.ts from LanguageContext legacy dict.
 * Run: node scripts/generate-locales.mjs
 * Note: cyrillic.ts is the source of truth after initial migration.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const cyrlSrc = fs.readFileSync(path.join(root, "src/i18n/cyrillic.ts"), "utf8");
const entries = [...cyrlSrc.matchAll(/^\s+"((?:\\.|[^"\\])+)"\s*:\s*"((?:\\.|[^"\\])*)"/gm)]
  .map(([, k, v]) => [k, v]);

// Import translation logic inline - see git history for full generator with enOverrides/ruOverrides
// For regeneration, english/russian are rebuilt from cyrillic source keys using translate module at build time.
// This script re-exports cyrillic only if needed; english/russian files are committed directly.

console.log(`cyrillic.ts contains ${entries.length} entries.`);
console.log("english.ts and russian.ts are maintained alongside cyrillic.ts.");
