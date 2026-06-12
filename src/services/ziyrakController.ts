/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { browserSpeechSupported, browserListenForWake } from "./browserSpeech.ts";
import { ensureMicrophoneAccess } from "./microphone.ts";
import { ZiyrakRealtimeSession } from "./realtimeSpeech.ts";
import { resolveSpeechMode } from "./speechService.ts";

export type ZiyrakPhase = "off" | "wake" | "connecting" | "active" | "speaking" | "searching" | "error";

export type ZiyrakControllerCallbacks = {
  onPhase: (phase: ZiyrakPhase) => void;
  onStatus: (text: string) => void;
  onSearch: (query: string) => void;
  onError: (message: string) => void;
};

const IDLE_MS = 120_000;

export class ZiyrakController {
  private wakeStop: (() => void) | null = null;
  private session: ZiyrakRealtimeSession | null = null;
  private callbacks: ZiyrakControllerCallbacks | null = null;
  private running = false;
  private micReady = false;

  async start(callbacks: ZiyrakControllerCallbacks): Promise<void> {
    if (this.running) return;
    this.callbacks = callbacks;

    const mode = await resolveSpeechMode(true);
    if (mode !== "realtime") {
      callbacks.onPhase("error");
      callbacks.onError("Realtime ovoz xizmati mavjud emas");
      return;
    }

    if (!browserSpeechSupported()) {
      callbacks.onPhase("error");
      callbacks.onError("Ziyrak uchun Chrome brauzer kerak");
      return;
    }

    try {
      callbacks.onStatus("Mikrofon ruxsati so'ralmoqda...");
      await ensureMicrophoneAccess();
      this.micReady = true;
    } catch (err: any) {
      callbacks.onPhase("error");
      callbacks.onError(err?.message || "Mikrofon ruxsati berilmadi");
      return;
    }

    this.running = true;
    this.startWakeMode();
  }

  stop(): void {
    this.running = false;
    this.wakeStop?.();
    this.wakeStop = null;
    this.session?.stop();
    this.session = null;
    this.callbacks?.onPhase("off");
    this.callbacks = null;
  }

  private startWakeMode(): void {
    if (!this.running || !this.callbacks) return;

    this.session?.stop();
    this.session = null;
    this.wakeStop?.();
    this.wakeStop = null;

    this.callbacks.onPhase("wake");
    this.callbacks.onStatus("Salom Ziyrak deb ayting");

    this.wakeStop = browserListenForWake(() => {
      void this.activateSession();
    });
  }

  private async activateSession(): Promise<void> {
    if (!this.running || !this.callbacks) return;

    this.wakeStop?.();
    this.wakeStop = null;

    this.callbacks.onPhase("connecting");
    this.callbacks.onStatus("Ziyrak uyg'onmoqda...");

    const session = new ZiyrakRealtimeSession();
    this.session = session;

    try {
      await session.start(
        {
          onStatus: (text) => {
            this.callbacks?.onStatus(text);
            if (text.includes("qidiryapti")) this.callbacks?.onPhase("searching");
            else if (text.includes("gapir") || text.includes("javob")) this.callbacks?.onPhase("speaking");
            else this.callbacks?.onPhase("active");
          },
          onSearch: (query) => this.callbacks?.onSearch(query),
          onStateChange: () => {
            /* handled via onStatus */
          },
          onError: (message) => {
            this.callbacks?.onPhase("error");
            this.callbacks?.onError(message);
            this.startWakeMode();
          },
          onIdle: () => {
            this.callbacks?.onStatus("Ziyrak kutilmoqda — Salom Ziyrak deb ayting");
            this.startWakeMode();
          },
        },
        IDLE_MS
      );
      this.callbacks.onPhase("active");
    } catch (err: any) {
      session.stop();
      this.session = null;
      this.callbacks.onPhase("error");
      this.callbacks.onError(err?.message || "Ziyrak ulanmadi");
      window.setTimeout(() => this.startWakeMode(), 1500);
    }
  }
}
