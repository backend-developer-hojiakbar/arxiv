import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src/components");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith(".tsx") ? [p] : [];
  });
}

const keys = new Set();
for (const file of walk(src)) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/t\(\s*["']([^"']+)["']\s*\)/g)) keys.add(m[1]);
}

const cyrl = fs.readFileSync(path.join(root, "src/i18n/cyrillic.ts"), "utf8");
const existing = new Set([...cyrl.matchAll(/^\s+"((?:\\.|[^"\\])+)"\s*:/gm)].map((m) => m[1]));

const missing = [...keys].filter((k) => !existing.has(k)).sort();
console.log("t() keys:", keys.size, "in cyrillic:", existing.size, "missing:", missing.length);
missing.forEach((k) => console.log(k));
