/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { unlockAudioPlayback } from "../services/microphone.ts";
import { ZiyrakController, type ZiyrakPhase } from "../services/ziyrakController.ts";
import { useTranslation } from "./LanguageContext.tsx";

interface VoiceAssistantProps {
  onOpenSearch: (query: string) => void;
}

export default function VoiceAssistant({ onOpenSearch }: VoiceAssistantProps) {
  const { t } = useTranslation();
  const controllerRef = useRef<ZiyrakController | null>(null);
  const [phase, setPhase] = useState<ZiyrakPhase>("off");
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    const controller = new ZiyrakController();
    controllerRef.current = controller;

    void controller.start({
      onPhase: setPhase,
      onStatus: setStatusText,
      onSearch: onOpenSearch,
      onError: setStatusText,
    });

    return () => {
      controller.stop();
      controllerRef.current = null;
    };
  }, [onOpenSearch]);

  const handleOrbClick = () => {
    void unlockAudioPlayback();
    controllerRef.current?.activate();
  };

  if (phase === "off" && !statusText) return null;

  const orbClass =
    phase === "wake"
      ? "bg-slate-400/80 shadow-[0_0_24px_rgba(100,116,139,0.45)] animate-pulse"
      : phase === "connecting" || phase === "searching"
        ? "bg-amber-400 shadow-[0_0_28px_rgba(251,191,36,0.55)] animate-pulse"
        : phase === "speaking"
          ? "bg-emerald-500 shadow-[0_0_32px_rgba(16,185,129,0.6)] animate-pulse"
          : phase === "active"
            ? "bg-primary-500 shadow-[0_0_32px_rgba(59,130,246,0.65)] animate-pulse"
            : phase === "error"
              ? "bg-red-500 shadow-[0_0_24px_rgba(239,68,68,0.5)]"
              : "bg-slate-300";

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 no-print sm:bottom-6 sm:right-6">
      {statusText && (
        <div className="max-w-[18rem] rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-2 text-right text-xs font-medium text-slate-700 shadow-lg backdrop-blur">
          {statusText}
        </div>
      )}
      <button
        type="button"
        onClick={handleOrbClick}
        className={`relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-0 transition-all duration-300 ${orbClass}`}
        title={t("Ziyrak ovozli yordamchi")}
        aria-label={statusText || t("Ziyrak ovozli yordamchi")}
      >
        <span className="h-5 w-5 rounded-full bg-white/90" />
        {(phase === "active" || phase === "speaking") && (
          <span className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
        )}
      </button>
      {phase === "wake" && (
        <p className="text-right text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
          Salom Ziyrak
        </p>
      )}
    </div>
  );
}
