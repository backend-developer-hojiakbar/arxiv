/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Eye, Edit3, Printer, Trash2 } from "lucide-react";
import { useTranslation } from "./LanguageContext.tsx";

interface DocumentTableActionsProps {
  canEdit: boolean;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onDelete: () => void;
}

export default function DocumentTableActions({
  canEdit,
  canDelete,
  onView,
  onEdit,
  onPrint,
  onDelete,
}: DocumentTableActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-end gap-1.5">
      <button
        type="button"
        onClick={onView}
        className="flex cursor-pointer items-center justify-center rounded border border-slate-200 p-1.5 text-slate-500 transition-all hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600"
        title={t("Batafsil ko'rish")}
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      {canEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex cursor-pointer items-center justify-center gap-1 rounded border border-slate-200 bg-white p-1.5 text-[11px] font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-primary-600"
          title={t("Tahrirlash")}
        >
          <Edit3 className="h-3.5 w-3.5" /> {t("Tahrirlash")}
        </button>
      )}
      <button
        type="button"
        onClick={onPrint}
        className="flex cursor-pointer items-center justify-center gap-1 rounded border border-primary-600 bg-primary-600 p-1.5 text-[11px] font-medium text-white transition-all hover:bg-primary-700"
        title={t("Fizik joylashuv voucherini chop etish")}
      >
        <Printer className="h-3.5 w-3.5" /> {t("Chop etish")}
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="flex cursor-pointer items-center justify-center rounded border border-red-200 p-1.5 text-red-600 transition-all hover:border-red-400 hover:bg-red-50"
          title={t("O'chirish (Soft delete)")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
