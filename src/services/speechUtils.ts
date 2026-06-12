/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const ZIYRAK_WORDS = [
  "ziyrak",
  "ziyraq",
  "ziraq",
  "ziirak",
  "ziyirok",
  "зийрак",
  "зийрок",
  "зирак",
  "сийрак",
  "siirak",
];

const WAKE_PREFIXES = ["salom", "assalom", "hey", "ok", "okay", "hay", "hello"];

export function normalizeSpeech(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesZiyrak(text: string): boolean {
  return ZIYRAK_WORDS.some((word) => text.includes(word));
}

export function isWakePhrase(text: string): boolean {
  const n = normalizeSpeech(text);
  if (!includesZiyrak(n)) return false;

  if (WAKE_PREFIXES.some((prefix) => n.includes(prefix))) return true;

  const words = n.split(" ").filter(Boolean);
  return words.length <= 5;
}

export function isGoodbyePhrase(text: string): boolean {
  const n = normalizeSpeech(text);
  return (
    n.includes("rahmat") ||
    n.includes("xayr") ||
    n.includes("hayr") ||
    n.includes("yop") ||
    n.includes("to'xtat") ||
    n.includes("stop")
  );
}

export function extractQueryFromWake(text: string): string {
  let q = normalizeSpeech(text);
  q = q.replace(/^(hey|salom|assalomu alaykum|ok|okay)\s+/i, "");
  q = q.replace(/ziyrak|ziyraq|ziraq|ziirak|ziyirok|зийрак|зийрок|зирак|сийрак/g, "");
  return q.trim();
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Hayrli tong";
  if (hour < 18) return "Hayrli kun";
  return "Hayrli kech";
}
