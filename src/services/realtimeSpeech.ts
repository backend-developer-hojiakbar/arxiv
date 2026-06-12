/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { api } from "../api.ts";
import { formatDocumentForVoice } from "../utils/format.ts";

export type RealtimeCallbacks = {
  onStatus: (text: string) => void;
  onSearch: (query: string) => void;
  onStateChange: (listening: boolean) => void;
  onError: (message: string) => void;
  onIdle: () => void;
};

type RealtimeServerEvent = {
  type: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  item?: {
    type?: string;
    call_id?: string;
    name?: string;
    arguments?: string;
  };
  error?: { message?: string };
  response?: {
    output?: Array<{
      type?: string;
      call_id?: string;
      name?: string;
      arguments?: string;
    }>;
  };
};

export async function checkRealtimeSpeechAvailable(): Promise<boolean> {
  const status = await api.getSpeechStatus();
  return Boolean(status.available && status.realtime);
}

export class ZiyrakRealtimeSession {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private micStream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private handledCalls = new Set<string>();
  private active = false;
  private idleTimer: number | null = null;
  private idleMs = 120_000;
  private onIdle: (() => void) | null = null;
  private greeted = false;
  private sessionReady = false;
  private dcOpen = false;

  async start(callbacks: RealtimeCallbacks, idleMs = 120_000): Promise<void> {
    if (this.active) return;
    this.active = true;
    this.idleMs = idleMs;
    this.onIdle = callbacks.onIdle;
    this.greeted = false;
    this.sessionReady = false;
    this.dcOpen = false;
    this.handledCalls.clear();

    callbacks.onStatus("Ziyrak ulanmoqda...");
    callbacks.onStateChange(true);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    this.pc = pc;

    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.volume = 1;
    audio.setAttribute("playsinline", "true");
    audio.style.display = "none";
    document.body.appendChild(audio);
    this.audioEl = audio;

    pc.ontrack = (event) => {
      audio.srcObject = event.streams[0];
      void this.ensureAudioPlaying(callbacks);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "failed" || state === "disconnected") {
        callbacks.onError("Ziyrak ulanishi uzildi");
      }
    };

    const mic = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.micStream = mic;
    mic.getTracks().forEach((track) => pc.addTrack(track, mic));

    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;

    dc.onopen = () => {
      this.dcOpen = true;
      this.trySendGreeting();
    };

    dc.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as RealtimeServerEvent;
        void this.handleServerEvent(payload, callbacks);
      } catch {
        /* ignore */
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const answerSdp = await api.createRealtimeCall(offer.sdp || "");
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    await this.waitForConnection(pc, 12_000);

    callbacks.onStatus("Ziyrak tayyor — gapiring");
    this.resetIdleTimer();
    this.trySendGreeting();
  }

  stop(): void {
    this.active = false;
    if (this.idleTimer) window.clearTimeout(this.idleTimer);
    this.idleTimer = null;
    this.dc?.close();
    this.dc = null;
    this.pc?.close();
    this.pc = null;
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.srcObject = null;
      this.audioEl.remove();
      this.audioEl = null;
    }
    this.handledCalls.clear();
    this.onIdle = null;
    this.greeted = false;
    this.sessionReady = false;
    this.dcOpen = false;
  }

  isActive(): boolean {
    return this.active;
  }

  private waitForConnection(pc: RTCPeerConnection, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const done = (ok: boolean) => {
        window.clearTimeout(timer);
        pc.removeEventListener("connectionstatechange", onChange);
        pc.removeEventListener("iceconnectionstatechange", onIce);
        if (ok) resolve();
        else reject(new Error("WebRTC ulanmadi"));
      };
      const ready = () =>
        pc.connectionState === "connected" ||
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed";

      const onChange = () => {
        if (ready()) done(true);
        if (pc.connectionState === "failed") done(false);
      };
      const onIce = onChange;

      if (ready()) {
        resolve();
        return;
      }

      pc.addEventListener("connectionstatechange", onChange);
      pc.addEventListener("iceconnectionstatechange", onIce);
      const timer = window.setTimeout(() => {
        if (pc.connectionState !== "closed") resolve();
        else done(false);
      }, timeoutMs);
    });
  }

  private async ensureAudioPlaying(callbacks: RealtimeCallbacks): Promise<void> {
    if (!this.audioEl) return;
    try {
      this.audioEl.muted = false;
      await this.audioEl.play();
    } catch {
      callbacks.onStatus("Ovoz chiqishi uchun doirani yana bosing");
    }
  }

  private trySendGreeting(): void {
    if (!this.active || this.greeted) return;
    if (!this.sessionReady || !this.dcOpen || !this.dc || this.dc.readyState !== "open") {
      return;
    }

    this.greeted = true;
    this.dc.send(
      JSON.stringify({
        type: "response.create",
        response: {
          modalities: ["audio"],
          instructions:
            "Foydalanuvchi Ziyrakni chaqirdi. Iliq tabiiy o'zbek tilida ayt: Salom! Qanday yordam bera olaman?",
        },
      })
    );
  }

  private resetIdleTimer(): void {
    if (!this.active || !this.onIdle) return;
    if (this.idleTimer) window.clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(() => {
      if (this.active) {
        this.stop();
        this.onIdle?.();
      }
    }, this.idleMs);
  }

  private async handleServerEvent(event: RealtimeServerEvent, callbacks: RealtimeCallbacks): Promise<void> {
    if (event.type === "session.created" || event.type === "session.updated") {
      this.sessionReady = true;
      this.trySendGreeting();
      return;
    }

    if (event.type === "error") {
      const msg = event.error?.message || "Realtime xatolik";
      console.error("Ziyrak realtime:", msg, event);
      callbacks.onError(msg);
      return;
    }

    if (event.type === "input_audio_buffer.speech_started") {
      this.resetIdleTimer();
      callbacks.onStatus("Ziyrak tinglayapti...");
      return;
    }

    if (event.type === "response.function_call_arguments.done") {
      if (event.call_id && event.name && event.arguments) {
        await this.executeTool(event.call_id, event.name, event.arguments, callbacks);
      }
      return;
    }

    if (event.type === "response.output_item.done" && event.item?.type === "function_call") {
      const { call_id: callId, name, arguments: args } = event.item;
      if (callId && name && args) {
        await this.executeTool(callId, name, args, callbacks);
      }
      return;
    }

    if (event.type === "response.done") {
      this.resetIdleTimer();
      const outputs = event.response?.output || [];
      for (const item of outputs) {
        if (item.type === "function_call" && item.call_id && item.name && item.arguments) {
          await this.executeTool(item.call_id, item.name, item.arguments, callbacks);
        }
      }
      return;
    }

    if (event.type === "response.created") {
      callbacks.onStatus("Ziyrak javob bermoqda...");
      void this.ensureAudioPlaying(callbacks);
      return;
    }

    if (
      event.type === "response.output_audio_transcript.delta" ||
      event.type === "response.output_audio.delta" ||
      event.type === "response.audio.delta" ||
      event.type === "output_audio_buffer.started"
    ) {
      callbacks.onStatus("Ziyrak gapirmoqda...");
      void this.ensureAudioPlaying(callbacks);
    }
  }

  private async executeTool(
    callId: string,
    name: string,
    argsJson: string,
    callbacks: RealtimeCallbacks
  ): Promise<void> {
    if (!this.active || this.handledCalls.has(callId)) return;
    this.handledCalls.add(callId);

    if (name !== "search_documents") return;

    let query = "";
    try {
      const parsed = JSON.parse(argsJson) as { query?: string };
      query = (parsed.query || "").trim();
    } catch {
      callbacks.onError("Qidiruv parametri noto'g'ri");
      return;
    }

    if (!query) {
      this.sendToolResult(callId, { found: false, message: "So'rov bo'sh" });
      return;
    }

    callbacks.onStatus("Ziyrak qidiryapti...");
    try {
      const res = await api.getDocuments({ q: query, page: 1, limit: 5 });
      callbacks.onSearch(query);

      const documents = res.documents.slice(0, 3).map((doc) => formatDocumentForVoice(doc));

      this.sendToolResult(callId, {
        found: documents.length > 0,
        total: res.total,
        query,
        documents,
        instruction:
          documents.length > 0
            ? "Har bir natija uchun person_name, doc_name, location_text (shkaf va qavat) ni ovozda ayt."
            : "Topilmadi deb ayt.",
        message:
          documents.length === 0
            ? "Hech narsa topilmadi"
            : documents.length === 1
              ? documents[0].verbal
              : `${res.total} ta hujjat topildi`,
      });
    } catch {
      this.sendToolResult(callId, {
        found: false,
        query,
        message: "Qidiruvda xatolik",
      });
    }
  }

  private sendToolResult(callId: string, output: unknown): void {
    if (!this.dc || this.dc.readyState !== "open") return;

    this.dc.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(output),
        },
      })
    );
    this.dc.send(
      JSON.stringify({
        type: "response.create",
        response: { modalities: ["audio"] },
      })
    );
    this.resetIdleTimer();
  }
}
