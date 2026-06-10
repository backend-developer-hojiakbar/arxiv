/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function normalizeSpeech(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:'"]/g, " ").replace(/\s+/g, " ").trim();
}

export function isWakePhrase(text: string): boolean {
  const n = normalizeSpeech(text);
  const variants = [
    "ziyrak",
    "ziyraq",
    "ziraq",
    "ziirak",
    "ziyirok",
    "зийрак",
    "зийрок",
    "зирак",
    "зийрак",
    "сийрак",
  ];
  return variants.some((word) => n.includes(word));
}

export function extractQueryFromWake(text: string): string {
  let q = normalizeSpeech(text);
  q = q.replace(/^(hey|salom|assalomu alaykum)\s+/i, "");
  q = q.replace(/ziyrak|зийрак|ziyirok|зийрок/g, "");
  return q.trim();
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Hayrli tong";
  if (hour < 18) return "Hayrli kun";
  return "Hayrli kech";
}
