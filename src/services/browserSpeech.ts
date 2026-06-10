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
  return Boolean(getRecognitionCtor()) && "speechSynthesis" in window;
}

export function browserSpeak(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("Ovoz sintezi qo'llab-quvvatlanmaydi"));
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "uz-UZ";
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error("Ovoz sintezi xatosi"));
    window.speechSynthesis.speak(utter);
  });
}

export function browserListenOnce(timeoutMs = 9000): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      reject(new Error("Ovoz tanish qo'llab-quvvatlanmaydi"));
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "uz-UZ";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let done = false;
    const finish = (text: string) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      resolve(text);
    };

    const timer = window.setTimeout(() => finish(""), timeoutMs);

    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript || "";
      finish(text.trim());
    };
    recognition.onerror = () => finish("");
    recognition.onend = () => {
      if (!done) finish("");
    };

    try {
      recognition.start();
    } catch (err) {
      reject(err);
    }
  });
}

export function browserListenForWake(onWake: (text: string) => void): { stop: () => void } {
  const Ctor = getRecognitionCtor();
  if (!Ctor) throw new Error("Ovoz tanish qo'llab-quvvatlanmaydi");

  const recognition = new Ctor();
  recognition.lang = "uz-UZ";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const text = event.results[i][0]?.transcript || "";
      if (text && isWakePhrase(text)) onWake(text);
    }
  };

  recognition.onend = () => {
    try {
      recognition.start();
    } catch {
      /* ignore */
    }
  };

  recognition.start();

  return {
    stop: () => {
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
  };
}
