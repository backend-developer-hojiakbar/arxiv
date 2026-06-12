/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isWakePhrase } from "./speechUtils.ts";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function browserSpeechSupported(): boolean {
  return Boolean(getRecognitionCtor());
}

export function browserSpeak(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("speechSynthesis yo'q"));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "uz-UZ";
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error("TTS xato"));
    window.speechSynthesis.speak(utterance);
  });
}

export function browserListenOnce(timeoutMs = 9000): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      reject(new Error("SpeechRecognition yo'q"));
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "uz-UZ";
    recognition.interimResults = false;
    recognition.continuous = false;
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      fn();
    };
    const timer = window.setTimeout(() => finish(() => reject(new Error("Timeout"))), timeoutMs);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0]?.[0]?.transcript?.trim() || "";
      finish(() => (text ? resolve(text) : reject(new Error("Bo'sh"))));
    };
    recognition.onerror = () => finish(() => reject(new Error("Mic xato")));
    recognition.onend = () => finish(() => reject(new Error("Tugadi")));
    recognition.start();
  });
}

export function browserListenForWake(onWake: (text: string) => void): { stop: () => void } {
  const Ctor = getRecognitionCtor();
  if (!Ctor) throw new Error("Ovoz tanish qo'llab-quvvatlanmaydi");

  const recognition = new Ctor();
  recognition.lang = "uz-UZ";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;

  let transcriptBuffer = "";
  let stopped = false;
  let wakeFired = false;

  const trimBuffer = (text: string) => {
    transcriptBuffer = `${transcriptBuffer} ${text}`.trim();
    if (transcriptBuffer.length > 280) {
      transcriptBuffer = transcriptBuffer.slice(-280);
    }
  };

  const checkWake = (text: string) => {
    if (wakeFired || stopped) return;
    trimBuffer(text);
    if (isWakePhrase(transcriptBuffer) || isWakePhrase(text)) {
      wakeFired = true;
      onWake(transcriptBuffer || text);
    }
  };

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const text = event.results[i][0]?.transcript || "";
      if (text) checkWake(text);
    }
  };

  recognition.onerror = () => {
    if (stopped) return;
    window.setTimeout(() => {
      if (stopped) return;
      try {
        recognition.start();
      } catch {
        /* ignore */
      }
    }, 400);
  };

  recognition.onend = () => {
    if (stopped) return;
    try {
      recognition.start();
    } catch {
      /* ignore */
    }
  };

  recognition.start();

  return {
    stop: () => {
      stopped = true;
      recognition.onend = null;
      recognition.onerror = null;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
  };
}
