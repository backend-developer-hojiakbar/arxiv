/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  checkAzureSpeechAvailable,
  listenForWakePhrase as azureListenWake,
  listenOnce as azureListenOnce,
  speakText as azureSpeak,
  type WakeListener,
} from "./azureSpeech.ts";
import {
  browserListenForWake,
  browserListenOnce,
  browserSpeak,
  browserSpeechSupported,
} from "./browserSpeech.ts";

export type SpeechMode = "azure" | "browser" | "none";

let mode: SpeechMode | null = null;
let lastAzureError = "";

export function getLastAzureSpeechError(): string {
  return lastAzureError;
}

export function resetSpeechMode(): void {
  mode = null;
  lastAzureError = "";
}

export async function resolveSpeechMode(force = false): Promise<SpeechMode> {
  if (mode && !force) return mode;
  if (force) mode = null;

  try {
    if (await checkAzureSpeechAvailable()) {
      lastAzureError = "";
      mode = "azure";
      return mode;
    }
  } catch (err: any) {
    lastAzureError = err?.message || "Azure Speech token olinmadi";
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
  if (current === "azure") return azureSpeak(text);
  if (current === "browser") return browserSpeak(text);
  throw new Error("Ovoz xizmati mavjud emas");
}

export async function listenOnce(timeoutMs = 9000): Promise<string> {
  const current = await resolveSpeechMode();
  if (current === "azure") return azureListenOnce(timeoutMs);
  if (current === "browser") return browserListenOnce(timeoutMs);
  throw new Error("Ovoz tanish mavjud emas");
}

export async function listenForWake(onWake: (text: string) => void): Promise<WakeListener> {
  const current = await resolveSpeechMode();
  if (current === "azure") return azureListenWake(onWake);
  if (current === "browser") {
    return browserListenForWake(onWake);
  }
  throw new Error("Ovoz tanish mavjud emas");
}
