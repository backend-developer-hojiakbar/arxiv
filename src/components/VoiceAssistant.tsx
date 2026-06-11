/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { ensureMicrophoneAccess } from "../services/microphone.ts";
import { ZiyrakRealtimeSession } from "../services/realtimeSpeech.ts";
import { getLastSpeechError, resolveSpeechMode, type SpeechMode } from "../services/speechService.ts";
import { useTranslation } from "./LanguageContext.tsx";

type AssistantState = "off" | "connecting" | "listening" | "speaking" | "searching" | "error";

interface VoiceAssistantProps {
  onOpenSearch: (query: string) => void;
}

export default function VoiceAssistant({ onOpenSearch }: VoiceAssistantProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<AssistantState>("off");
  const [statusText, setStatusText] = useState("");
  const [speechMode, setSpeechMode] = useState<SpeechMode | "checking">("checking");
  const sessionRef = useRef<ZiyrakRealtimeSession | null>(null);

  useEffect(() => {
    resolveSpeechMode()
      .then((mode) => setSpeechMode(mode))
      .catch(() => setSpeechMode("none"));
  }, []);

  const stopAssistant = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setState("off");
    setStatusText("");
  }, []);

  const startAssistant = useCallback(async () => {
    let mode = speechMode;
    if (mode === "checking" || mode === "none") {
      setStatusText(t("Ziyrak tekshirilmoqda..."));
      mode = await resolveSpeechMode(true);
      setSpeechMode(mode);
    }

    if (mode !== "realtime") {
      setState("error");
      const detail = getLastSpeechError();
      setStatusText(detail || t("Realtime ovoz xizmati mavjud emas"));
      return;
    }

    try {
      setState("connecting");
      setStatusText(t("Mikrofon ruxsati so'ralmoqda..."));
      await ensureMicrophoneAccess();
    } catch (err: any) {
      setState("error");
      setStatusText(err?.message || t("Mikrofon ruxsati berilmadi"));
      return;
    }

    const session = new ZiyrakRealtimeSession();
    sessionRef.current = session;

    try {
      await session.start({
        onStatus: (text) => {
          setStatusText(text);
          if (text.includes("qidiryapti")) setState("searching");
          else if (text.includes("gapir") || text.includes("javob")) setState("speaking");
          else setState("listening");
        },
        onSearch: onOpenSearch,
        onStateChange: (listening) => {
          setState(listening ? "listening" : "off");
        },
        onError: (message) => {
          setState("error");
          setStatusText(message);
          session.stop();
          sessionRef.current = null;
        },
      });
      setState("listening");
    } catch (err: any) {
      session.stop();
      sessionRef.current = null;
      setState("error");
      setStatusText(err?.message || t("Realtime ulanish xatosi"));
    }
  }, [onOpenSearch, speechMode, t]);

  const toggle = () => {
    if (state === "off" || state === "error") {
      void startAssistant();
    } else {
      stopAssistant();
    }
  };

  useEffect(() => () => stopAssistant(), [stopAssistant]);

  const active = state !== "off";
  const busy = state === "connecting" || state === "searching" || state === "speaking";
  const disabled = speechMode === "checking";

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 no-print sm:bottom-6 sm:right-6">
      {statusText && (
        <div className="max-w-[18rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-lg">
          {statusText}
        </div>
      )}
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-lg transition-all disabled:opacity-50 ${
          active
            ? "bg-primary-600 text-white ring-4 ring-primary-200"
            : "border border-slate-200 bg-white text-slate-700 hover:border-primary-300"
        }`}
        title={t("Ziyrak ovozli yordamchi")}
      >
        {busy || disabled ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : active ? (
          <Mic className="h-4 w-4" />
        ) : (
          <MicOff className="h-4 w-4" />
        )}
        Ziyrak
      </button>
    </div>
  );
}
