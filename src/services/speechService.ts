/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { checkRealtimeSpeechAvailable } from "./realtimeSpeech.ts";
import {
  checkOpenAISpeechAvailable,
  listenForWakePhrase as openaiListenWake,
  listenOnce as openaiListenOnce,
  speakText as openaiSpeak,
  type WakeListener,
} from "./openaiSpeech.ts";
import {
  browserListenForWake,
  browserListenOnce,
  browserSpeak,
  browserSpeechSupported,
} from "./browserSpeech.ts";

export type SpeechMode = "realtime" | "legacy" | "browser" | "none";

let mode: SpeechMode | null = null;
let lastSpeechError = "";

export function getLastSpeechError(): string {
  return lastSpeechError;
}

/** @deprecated use getLastSpeechError */
export function getLastAzureSpeechError(): string {
  return lastSpeechError;
}

export function resetSpeechMode(): void {
  mode = null;
  lastSpeechError = "";
}

export async function resolveSpeechMode(force = false): Promise<SpeechMode> {
  if (mode && !force) return mode;
  if (force) mode = null;

  try {
    if (await checkRealtimeSpeechAvailable()) {
      lastSpeechError = "";
      mode = "realtime";
      return mode;
    }
  } catch (err: any) {
    lastSpeechError = err?.message || "Realtime ovoz xizmati mavjud emas";
  }

  try {
    if (await checkOpenAISpeechAvailable()) {
      lastSpeechError = "";
      mode = "legacy";
      return mode;
    }
  } catch (err: any) {
    lastSpeechError = err?.message || "OpenAI ovoz xizmati mavjud emas";
  }

  if (browserSpeechSupported()) {
    mode = "browser";
  } else {
    mode = "none";
  }
  return mode;
}

export async function speak(text: string): Promise<void> {
  const current = await resolveSpeechMode();
  if (current === "legacy") return openaiSpeak(text);
  if (current === "browser") return browserSpeak(text);
  throw new Error("Ovoz xizmati mavjud emas");
}

export async function listenOnce(timeoutMs = 9000): Promise<string> {
  const current = await resolveSpeechMode();
  if (current === "legacy") return openaiListenOnce(timeoutMs);
  if (current === "browser") return browserListenOnce(timeoutMs);
  throw new Error("Ovoz tanish mavjud emas");
}

export async function listenForWake(onWake: (text: string) => void): Promise<WakeListener> {
  const current = await resolveSpeechMode();
  if (current === "legacy") return openaiListenWake(onWake);
  if (current === "browser") return browserListenForWake(onWake);
  throw new Error("Ovoz tanish mavjud emas");
}
