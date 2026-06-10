/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { api } from "../api.ts";
import { getDocumentPersonLabel } from "../utils/format.ts";
import {
  extractQueryFromWake,
  getTimeGreeting,
  listenForWakePhrase,
  listenOnce,
  speakText,
  type WakeListener,
} from "../services/azureSpeech.ts";
import { useTranslation } from "./LanguageContext.tsx";

type AssistantState = "off" | "listening" | "greeting" | "query" | "searching" | "speaking" | "error";

interface VoiceAssistantProps {
  onOpenSearch: (query: string) => void;
}

export default function VoiceAssistant({ onOpenSearch }: VoiceAssistantProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<AssistantState>("off");
  const [statusText, setStatusText] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const busyRef = useRef(false);
  const enabledRef = useRef(false);
  const wakeRef = useRef<WakeListener | null>(null);

  useEffect(() => {
    api
      .getSpeechToken()
      .then(() => setAvailable(true))
      .catch(() => setAvailable(false));
  }, []);

  const stopWake = useCallback(() => {
    wakeRef.current?.stop();
    wakeRef.current = null;
  }, []);

  const restartWakeListening = useCallback(async () => {
    if (!enabledRef.current) return;
    try {
      wakeRef.current = await listenForWakePhrase((spoken) => {
        void onWakeRef.current(spoken);
      });
      setState("listening");
      setStatusText(t("Ziyrak tinglamoqda — Hey Ziyrak deb ayting"));
    } catch (err: any) {
      setState("error");
      setStatusText(err?.message || t("Ziyrak mikrofon xatosi"));
    }
  }, [t]);

  const runSearch = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query) {
        setState("speaking");
        setStatusText(t("Ziyrak: so'rov eshitilmadi"));
        await speakText("Nimani qidirishim kerak? Iltimos, qayta ayting.");
        return;
      }

      setState("searching");
      setStatusText(t("Ziyrak qidiryapti..."));
      try {
        const res = await api.getDocuments({ q: query, page: 1, limit: 5 });
        onOpenSearch(query);

        setState("speaking");
        if (!res.documents.length) {
          setStatusText(t("Ziyrak: topilmadi"));
          await speakText("Kechirasiz, topa olmadim.");
        } else {
          const name = getDocumentPersonLabel(res.documents[0]).name;
          const spoken =
            res.total === 1
              ? `${name} nomli hujjat topdim.`
              : `${res.total} ta hujjat topdim. Birinchisi ${name}.`;
          setStatusText(t("Ziyrak: topildi"));
          await speakText(spoken);
        }
      } catch {
        setState("error");
        setStatusText(t("Ziyrak: qidiruv xatosi"));
        await speakText("Qidiruvda xatolik yuz berdi.");
      }
    },
    [onOpenSearch, t]
  );

  const onWake = useCallback(
    async (spoken: string) => {
      if (busyRef.current || !enabledRef.current) return;
      busyRef.current = true;
      stopWake();

      const inlineQuery = extractQueryFromWake(spoken);

      setState("greeting");
      setStatusText(t("Ziyrak javob bermoqda..."));
      await speakText(`${getTimeGreeting()}! Men Ziyrak. Nimani qidiray?`);

      let query = inlineQuery;
      if (!query) {
        setState("query");
        setStatusText(t("Ziyrak tinglayapti..."));
        query = await listenOnce(9000);
      }

      await runSearch(query);
      busyRef.current = false;
      await restartWakeListening();
    },
    [restartWakeListening, runSearch, stopWake, t]
  );

  const onWakeRef = useRef(onWake);
  onWakeRef.current = onWake;

  const startAssistant = useCallback(async () => {
    if (available === false) {
      setState("error");
      setStatusText(t("Azure Speech sozlanmagan"));
      return;
    }
    enabledRef.current = true;
    await restartWakeListening();
  }, [available, restartWakeListening, t]);

  const stopAssistant = useCallback(() => {
    enabledRef.current = false;
    busyRef.current = false;
    stopWake();
    setState("off");
    setStatusText("");
  }, [stopWake]);

  const toggle = () => {
    if (state === "off" || state === "error") {
      void startAssistant();
    } else {
      stopAssistant();
    }
  };

  useEffect(() => () => stopAssistant(), [stopAssistant]);

  if (available === null) return null;

  const active = state !== "off";
  const busy = state === "greeting" || state === "query" || state === "searching" || state === "speaking";

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 no-print sm:bottom-6 sm:right-6">
      {statusText && (
        <div className="max-w-[16rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-lg">
          {statusText}
        </div>
      )}
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-lg transition-all ${
          active
            ? "bg-primary-600 text-white ring-4 ring-primary-200"
            : "border border-slate-200 bg-white text-slate-700 hover:border-primary-300"
        }`}
        title={t("Ziyrak ovozli yordamchi")}
      >
        {busy ? (
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
