/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SDK_CDN = "https://aka.ms/csspeech/jsbrowserpackageraw";

export type AzureSpeechSdk = {
  SpeechConfig: {
    fromAuthorizationToken: (token: string, region: string) => SpeechConfig;
  };
  SpeechSynthesizer: new (config: SpeechConfig) => SpeechSynthesizer;
  SpeechRecognizer: new (config: SpeechConfig, audio: AudioConfig) => SpeechRecognizer;
  AudioConfig: {
    fromDefaultMicrophoneInput: () => AudioConfig;
  };
  ResultReason: {
    RecognizingSpeech: number;
    RecognizedSpeech: number;
    NoMatch: number;
    SynthesizingAudioCompleted: number;
  };
  CancellationReason: {
    Error: number;
  };
};

type SpeechConfig = {
  speechRecognitionLanguage: string;
  speechSynthesisLanguage: string;
  speechSynthesisVoiceName: string;
};

type AudioConfig = object;

type SpeechSynthesizer = {
  speakTextAsync: (
    text: string,
    onResult: (result: { reason: number; errorDetails?: string }) => void,
    onError: (err: string) => void
  ) => void;
  close: () => void;
};

type SpeechRecognizer = {
  recognizing: ((sender: unknown, event: RecognizerEvent) => void) | null;
  recognized: ((sender: unknown, event: RecognizerEvent) => void) | null;
  canceled: ((sender: unknown, event: CancelEvent) => void) | null;
  recognizeOnceAsync: (
    onResult: (result: { reason: number; text: string; errorDetails?: string }) => void,
    onError: (err: string) => void
  ) => void;
  startContinuousRecognitionAsync: (onStarted: () => void, onError: (err: string) => void) => void;
  stopContinuousRecognitionAsync: (onStopped?: () => void) => void;
  close: () => void;
};

type RecognizerEvent = {
  result: { reason: number; text: string };
};

type CancelEvent = {
  reason: number;
  errorDetails?: string;
};

declare global {
  interface Window {
    SpeechSDK?: AzureSpeechSdk;
  }
}

let loadPromise: Promise<AzureSpeechSdk> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.SpeechSDK) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[data-speech-sdk="1"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Speech SDK yuklanmadi")));
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.speechSdk = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Speech SDK yuklanmadi"));
    document.head.appendChild(script);
  });
}

export function loadAzureSpeechSdk(): Promise<AzureSpeechSdk> {
  if (!loadPromise) {
    loadPromise = loadScript(SDK_CDN).then(() => {
      if (!window.SpeechSDK) {
        throw new Error("Speech SDK yuklanmadi");
      }
      return window.SpeechSDK;
    });
  }
  return loadPromise;
}
