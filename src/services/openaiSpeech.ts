/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { api } from "../api.ts";
import { playAudioBlob, recordAudio, stopStream } from "./audioRecorder.ts";
import { isWakePhrase } from "./speechUtils.ts";

export type WakeListener = {
  stop: () => void;
};

const MIN_AUDIO_BYTES = 800;
const WAKE_CHUNK_MS = 3500;

export async function checkOpenAISpeechAvailable(): Promise<boolean> {
  const status = await api.getSpeechStatus();
  return status.available;
}

export async function speakText(text: string): Promise<void> {
  const blob = await api.synthesizeSpeech(text);
  await playAudioBlob(blob);
}

export async function listenOnce(timeoutMs = 9000): Promise<string> {
  const { blob, stream } = await recordAudio(timeoutMs);
  stopStream(stream);

  if (blob.size < MIN_AUDIO_BYTES) return "";

  const result = await api.transcribeAudio(blob);
  return result.text.trim();
}

export function listenForWakePhrase(onWake: (spokenText: string) => void): Promise<WakeListener> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let stopped = false;
      let busy = false;

      const listenLoop = async () => {
        while (!stopped) {
          if (busy) {
            await new Promise((r) => window.setTimeout(r, 150));
            continue;
          }

          busy = true;
          try {
            const { blob } = await recordAudio(WAKE_CHUNK_MS, stream);
            if (stopped) break;

            if (blob.size >= MIN_AUDIO_BYTES) {
              const { text } = await api.transcribeAudio(blob);
              if (text && isWakePhrase(text)) onWake(text);
            }
          } catch {
            /* davom etamiz */
          } finally {
            busy = false;
          }
        }
      };

      void listenLoop();

      resolve({
        stop: () => {
          stopped = true;
          stopStream(stream);
        },
      });
    } catch (err) {
      reject(err);
    }
  });
}
