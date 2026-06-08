/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "./LanguageContext.tsx";

interface ConfirmDeleteDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteDialog({ onCancel, onConfirm }: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
    >
      <div className="modal-backdrop" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="modal-panel max-w-sm space-y-4 p-6 text-center"
      >
        <div className="flex justify-center">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-800">{t("HUJJATNI O'CHIRISH!")}</h4>
          <p className="text-xs leading-normal text-slate-500">
            {t("Chindan ham ushbu hujjat yozuvini arxiv bazasidan o'chirmoqchimisiz? Ushbu amaldan so'ng hujjat asosi faqat tahliliy soft-delete loglarida saqlab qolinadi.")}
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            {t("Bekor qilish")}
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700">
            {t("Ha, o'chirilsin")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
