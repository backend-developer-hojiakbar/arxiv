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
  transcript?: string;
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

  async start(callbacks: RealtimeCallbacks, idleMs = 120_000): Promise<void> {
    if (this.active) return;
    this.active = true;
    this.idleMs = idleMs;
    this.onIdle = callbacks.onIdle;
    this.handledCalls.clear();

    callbacks.onStatus("Ziyrak ulanmoqda...");
    callbacks.onStateChange(true);

    const pc = new RTCPeerConnection();
    this.pc = pc;

    const audio = document.createElement("audio");
    audio.autoplay = true;
    this.audioEl = audio;
    pc.ontrack = (event) => {
      audio.srcObject = event.streams[0];
    };

    const mic = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.micStream = mic;
    pc.addTrack(mic.getTracks()[0]);

    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;

    dc.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as RealtimeServerEvent;
        void this.handleServerEvent(payload, callbacks);
      } catch {
        /* ignore */
      }
    };

    dc.onopen = () => {
      this.resetIdleTimer();
      callbacks.onStatus("Ziyrak faol — gapiring");
      dc.send(
        JSON.stringify({
          type: "response.create",
          response: {
            instructions:
              "Foydalanuvchi Salom Ziyrak dedi. Iliq tabiiy o'zbek tilida ayt: Salom! Qanday yordam bera olaman?",
          },
        })
      );
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const answerSdp = await api.createRealtimeCall(offer.sdp || "");
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    callbacks.onStatus("Ziyrak tinglayapti...");
    this.resetIdleTimer();
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
      this.audioEl.srcObject = null;
      this.audioEl = null;
    }
    this.handledCalls.clear();
    this.onIdle = null;
  }

  isActive(): boolean {
    return this.active;
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
      return;
    }

    if (
      event.type === "response.output_audio_transcript.delta" ||
      event.type === "response.output_audio.delta"
    ) {
      callbacks.onStatus("Ziyrak gapirmoqda...");
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
            ? "Har bir natija uchun person_name, doc_name, location_text ni ovozda ayt."
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
    this.dc.send(JSON.stringify({ type: "response.create" }));
    this.resetIdleTimer();
  }
}
