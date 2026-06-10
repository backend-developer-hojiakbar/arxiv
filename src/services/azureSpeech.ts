/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { api } from "../api.ts";

export interface SpeechSession {
  token: string;
  region: string;
  language: string;
}

type SpeechSdk = typeof import("microsoft-cognitiveservices-speech-sdk");

let sdkPromise: Promise<SpeechSdk> | null = null;
let cachedSession: SpeechSession | null = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 8 * 60 * 1000;

async function getSdk(): Promise<SpeechSdk> {
  if (!sdkPromise) {
    sdkPromise = import("microsoft-cognitiveservices-speech-sdk");
  }
  return sdkPromise;
}

async function getSession(): Promise<SpeechSession> {
  if (cachedSession && Date.now() - cachedAt < TOKEN_TTL_MS) {
    return cachedSession;
  }
  cachedSession = await api.getSpeechToken();
  cachedAt = Date.now();
  return cachedSession;
}

async function buildConfig(session: SpeechSession) {
  const sdk = await getSdk();
  const config = sdk.SpeechConfig.fromAuthorizationToken(session.token, session.region);
  config.speechRecognitionLanguage = session.language;
  config.speechSynthesisLanguage = session.language;
  config.speechSynthesisVoiceName = session.language.startsWith("uz")
    ? "uz-UZ-MadinaNeural"
    : "ru-RU-SvetlanaNeural";
  return { sdk, config };
}

export async function checkAzureSpeechAvailable(): Promise<boolean> {
  try {
    await getSession();
    await getSdk();
    return true;
  } catch {
    return false;
  }
}

export function speakText(text: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await getSession();
      const { sdk, config } = await buildConfig(session);
      const synthesizer = new sdk.SpeechSynthesizer(config);

      synthesizer.speakTextAsync(
        text,
        (result) => {
          synthesizer.close();
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve();
          } else {
            reject(new Error(result.errorDetails || "Ovoz sintezi muvaffaqiyatsiz"));
          }
        },
        (err) => {
          synthesizer.close();
          reject(err);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

export function listenOnce(timeoutMs = 9000): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let recognizer: import("microsoft-cognitiveservices-speech-sdk").SpeechRecognizer | null = null;
    let finished = false;

    const finish = (text: string) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      try {
        recognizer?.close();
      } catch {
        /* ignore */
      }
      resolve(text);
    };

    const timer = window.setTimeout(() => finish(""), timeoutMs);

    try {
      const session = await getSession();
      const { sdk, config } = await buildConfig(session);
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      recognizer = new sdk.SpeechRecognizer(config, audioConfig);

      recognizer.recognizeOnceAsync(
        (result) => {
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            finish(result.text.trim());
          } else if (result.reason === sdk.ResultReason.NoMatch) {
            finish("");
          } else {
            finished = true;
            window.clearTimeout(timer);
            recognizer?.close();
            reject(new Error(result.errorDetails || "Ovoz tanilmadi"));
          }
        },
        (err) => {
          finished = true;
          window.clearTimeout(timer);
          recognizer?.close();
          reject(err);
        }
      );
    } catch (err) {
      finish("");
      reject(err);
    }
  });
}

export type WakeListener = {
  stop: () => void;
};

export function listenForWakePhrase(onWake: (spokenText: string) => void): Promise<WakeListener> {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await getSession();
      const { sdk, config } = await buildConfig(session);
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(config, audioConfig);

      const handleText = (text: string) => {
        if (text && isWakePhrase(text)) onWake(text);
      };

      recognizer.recognizing = (_s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizingSpeech) {
          handleText(e.result.text);
        }
      };

      recognizer.recognized = (_s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          handleText(e.result.text);
        }
      };

      recognizer.canceled = (_s, e) => {
        if (e.reason === sdk.CancellationReason.Error) {
          reject(new Error(e.errorDetails || "Mikrofon xatosi"));
        }
      };

      recognizer.startContinuousRecognitionAsync(
        () =>
          resolve({
            stop: () => {
              recognizer.stopContinuousRecognitionAsync(() => recognizer.close());
            },
          }),
        (err) => reject(err)
      );
    } catch (err) {
      reject(err);
    }
  });
}

export function normalizeSpeech(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:'"]/g, " ").replace(/\s+/g, " ").trim();
}

export function isWakePhrase(text: string): boolean {
  const n = normalizeSpeech(text);
  return (
    n.includes("ziyrak") ||
    n.includes("зийрак") ||
    n.includes("ziyirok") ||
    n.includes("зийрок")
  );
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
