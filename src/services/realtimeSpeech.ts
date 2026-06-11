/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { api } from "../api.ts";
import { getDocumentPersonLabel } from "../utils/format.ts";

export type RealtimeCallbacks = {
  onStatus: (text: string) => void;
  onSearch: (query: string) => void;
  onStateChange: (listening: boolean) => void;
  onError: (message: string) => void;
};

type RealtimeServerEvent = {
  type: string;
  call_id?: string;
  name?: string;
  arguments?: string;
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

  async start(callbacks: RealtimeCallbacks): Promise<void> {
    if (this.active) return;
    this.active = true;
    this.handledCalls.clear();

    callbacks.onStatus("Realtime ulanmoqda...");
    callbacks.onStateChange(true);

    const pc = new RTCPeerConnection();
    this.pc = pc;

    const audio = document.createElement("audio");
    audio.autoplay = true;
    this.audioEl = audio;
    pc.ontrack = (event) => {
      audio.srcObject = event.streams[0];
    };

    const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      callbacks.onStatus("Ziyrak tinglayapti — gapiring");
      dc.send(
        JSON.stringify({
          type: "response.create",
          response: {
            instructions: "Foydalanuvchiga qisqa salomlash va qanday qidirish mumkinligini ayt.",
          },
        })
      );
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const answerSdp = await api.createRealtimeCall(offer.sdp || "");
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    callbacks.onStatus("Ziyrak tayyor — gapiring");
  }

  stop(): void {
    this.active = false;
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
  }

  isActive(): boolean {
    return this.active;
  }

  private async handleServerEvent(event: RealtimeServerEvent, callbacks: RealtimeCallbacks): Promise<void> {
    if (event.type === "response.function_call_arguments.done") {
      if (event.call_id && event.name && event.arguments) {
        await this.executeTool(event.call_id, event.name, event.arguments, callbacks);
      }
      return;
    }

    if (event.type === "response.done") {
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

    if (event.type === "response.output_audio_transcript.delta") {
      callbacks.onStatus("Ziyrak gapirmoqda...");
    }

    if (event.type === "input_audio_buffer.speech_started") {
      callbacks.onStatus("Ziyrak tinglayapti...");
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

      const documents = res.documents.slice(0, 3).map((doc) => {
        const label = getDocumentPersonLabel(doc);
        return {
          name: label.name,
          doc_name: doc.docName,
          person_type: label.type,
        };
      });

      this.sendToolResult(callId, {
        found: documents.length > 0,
        total: res.total,
        query,
        documents,
        message:
          documents.length === 0
            ? "Hech narsa topilmadi"
            : res.total === 1
              ? `${documents[0].name} topildi`
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
  }
}
