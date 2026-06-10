/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { api } from "../api.ts";

export interface SpeechSession {
  token: string;
  region: string;
  language: string;
}

let cachedSession: SpeechSession | null = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 8 * 60 * 1000;

async function getSession(): Promise<SpeechSession> {
  if (cachedSession && Date.now() - cachedAt < TOKEN_TTL_MS) {
    return cachedSession;
  }
  cachedSession = await api.getSpeechToken();
  cachedAt = Date.now();
  return cachedSession;
}

function buildConfig(session: SpeechSession): sdk.SpeechConfig {
  const config = sdk.SpeechConfig.fromAuthorizationToken(session.token, session.region);
  config.speechRecognitionLanguage = session.language;
  config.speechSynthesisLanguage = session.language;
  config.speechSynthesisVoiceName = session.language.startsWith("uz")
    ? "uz-UZ-MadinaNeural"
    : "ru-RU-SvetlanaNeural";
  return config;
}

export function speakText(text: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await getSession();
      const config = buildConfig(session);
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

export function listenOnce(timeoutMs = 8000): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await getSession();
      const config = buildConfig(session);
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(config, audioConfig);

      const timer = window.setTimeout(() => {
        recognizer.stopContinuousRecognitionAsync();
        recognizer.close();
        resolve("");
      }, timeoutMs);

      recognizer.recognizeOnceAsync(
        (result) => {
          window.clearTimeout(timer);
          recognizer.close();
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            resolve(result.text.trim());
          } else if (result.reason === sdk.ResultReason.NoMatch) {
            resolve("");
          } else {
            reject(new Error(result.errorDetails || "Ovoz tanilmadi"));
          }
        },
        (err) => {
          window.clearTimeout(timer);
          recognizer.close();
          reject(err);
        }
      );
    } catch (err) {
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
      const config = buildConfig(session);
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(config, audioConfig);

      recognizer.recognizing = (_s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizingSpeech) {
          const text = e.result.text;
          if (isWakePhrase(text)) {
            onWake(text);
          }
        }
      };

      recognizer.recognized = (_s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          const text = e.result.text;
          if (isWakePhrase(text)) {
            onWake(text);
          }
        }
      };

      recognizer.canceled = (_s, e) => {
        if (e.reason === sdk.CancellationReason.Error) {
          reject(new Error(e.errorDetails));
        }
      };

      recognizer.startContinuousRecognitionAsync(
        () => resolve({ stop: () => recognizer.stopContinuousRecognitionAsync(() => recognizer.close()) }),
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
