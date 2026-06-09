/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { fetchDocumentPdf } from "../api.js";
import { MapPin, Printer, X, FileDown } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";
import { getDocumentPersonLabel, getExpiryBadgeClass, isDocumentExpired } from "../utils/format.ts";

interface DocumentDetailDrawerProps {
  doc: any;
  onClose: () => void;
  onPrintSlip?: (doc: any) => void;
  onEdit?: () => void;
  canEdit?: boolean;
}

export default function DocumentDetailDrawer({
  doc,
  onClose,
  onPrintSlip,
  onEdit,
  canEdit = false,
}: DocumentDetailDrawerProps) {
  const { t } = useTranslation();
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    fetchDocumentPdf(doc.id)
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setPdfPreviewUrl(objectUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setPdfPreviewUrl(null);
      });

    return () => {
      cancelled = true;
      setPdfPreviewUrl(null);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc.id]);

  const handleDownloadPdf = async () => {
    try {
      const blob = await fetchDocumentPdf(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalFilename || `hujjat_${doc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(t("Hujjatni yuklab olishda xatolik yuz berdi: ") + err.message);
    }
  };

  const handlePrintPdf = async () => {
    try {
      const blob = await fetchDocumentPdf(doc.id);
      const url = window.URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:none";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.URL.revokeObjectURL(url);
          }, 2000);
        } catch {
          const newWindow = window.open(url, "_blank");
          if (!newWindow) {
            alert(t("Iltimos, qalqib chiquvchi oynalar (popup) bloklanishini o'chiring!"));
          }
        }
      };
    } catch (err: any) {
      alert(t("Chop etishda xatolik yuz berdi: ") + err.message);
    }
  };

  const person = getDocumentPersonLabel(doc);
  const expired = isDocumentExpired(doc.expiryYear);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-primary-900/30 backdrop-blur-xs"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-2xl flex-col justify-between overflow-y-auto border-l border-primary-100 bg-white p-6 shadow-2xl"
      >
        <div>
          <div className="mb-6 flex items-start justify-between border-b border-primary-100 pb-4">
            <div>
              <span className="rounded bg-primary-600 px-2 py-0.5 text-xs font-bold tracking-wider text-white">
                {t("Arxiv Kartasi:")} {doc.id}
              </span>
              <h3 className="mt-2 text-lg font-semibold leading-tight text-primary-900">
                {t("Hujjat haqida batafsil ma'lumot")}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded border border-slate-200 p-1.5 text-slate-500 transition-all hover:bg-indigo-50/20 hover:text-primary-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-xl border border-primary-100 bg-indigo-50/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-200 bg-primary-600 font-bold text-white shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <span className="field-label !mb-0">{t("Fizik joylashuv")}</span>
                  <strong className="text-base text-primary-900 text-plain">
                    {doc.cabinet?.name}, {doc.floor}-{t("qavat")}
                  </strong>
                </div>
              </div>
              {onPrintSlip && (
                <button
                  type="button"
                  onClick={() => onPrintSlip(doc)}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 transition-all hover:bg-indigo-50/20"
                >
                  <Printer className="h-3.5 w-3.5" /> {t("SLIP")}
                </button>
              )}
            </div>

            <div className="info-block space-y-3">
              <h4 className="card-section-title">{t("Shaxs ma'lumotlari")}</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                <div>
                  <span className="field-label !mb-0">{t("F.I.Sh.")}</span>
                  <span className="font-semibold text-slate-800 text-plain">{person.name}</span>
                </div>
                <div>
                  <span className="field-label !mb-0">{t("Turi")}</span>
                  <span className="text-slate-700">{person.subtitle}</span>
                </div>
                {person.type === "student" && doc.student && (
                  <>
                    <div>
                      <span className="field-label !mb-0">{t("Guruh")}</span>
                      <span className="text-plain">{doc.student.groupName || "—"}</span>
                    </div>
                    <div>
                      <span className="field-label !mb-0">{t("Telefon")}</span>
                      <span className="text-plain">{doc.student.phone || "—"}</span>
                    </div>
                  </>
                )}
                {person.type === "employee" && doc.employee && (
                  <div>
                    <span className="field-label !mb-0">{t("Bo'lim")}</span>
                    <span className="text-plain">{doc.employee.department || "—"}</span>
                  </div>
                )}
                {person.type === "institut" && (
                  <div className="col-span-2">
                    <span className="field-label !mb-0">{t("Hujjat nomi")}</span>
                    <span className="text-plain">{doc.docName || "—"}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="border-b border-neutral-100 pb-1 text-xs font-bold uppercase tracking-wider text-neutral-500">
                {t("2. Hujjat va saqlash parametrlari")}
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                <div>
                  <span className="field-label !mb-0">{t("Hujjat kategoriyasi")}</span>
                  <span className="text-plain">{doc.category?.name || "—"}</span>
                </div>
                <div>
                  <span className="field-label !mb-0">{t("Qabul qilgan xodim")}</span>
                  <span className="font-medium text-neutral-800 text-plain">{doc.receiver?.fullName || "—"}</span>
                </div>
                <div>
                  <span className="field-label !mb-0">{t("Qabul qilingan sana & vaqt")}</span>
                  <span className="font-mono text-xs text-neutral-600">
                    {new Date(doc.receivedAt).toLocaleString("uz-UZ")}
                  </span>
                </div>
                {doc.expiryYear != null && (
                  <div>
                    <span className="field-label !mb-0">{t("Eskirish yili")}</span>
                    <span className={`text-plain ${expired ? "font-semibold text-red-600" : "text-slate-700"}`}>
                      {doc.expiryYear}
                      {expired && (
                        <span className={`ml-2 ${getExpiryBadgeClass(true)}`}>{t("Eskirgan")}</span>
                      )}
                    </span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="field-label !mb-0">{t("Shkafdagi aniq izoh variantlari")}</span>
                  <p className="border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs italic text-neutral-700">
                    {doc.notes || t("Izoh kiritilmagan")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {t("3. Elektron PDF nusxasi ko'rinishi")}
                </h4>
                <span className="font-mono text-[9px] text-neutral-400">
                  {doc.originalFilename} ({(doc.fileSize / 1024).toFixed(1)} KB)
                </span>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-primary-100 bg-neutral-50">
                {pdfPreviewUrl ? (
                  <iframe src={pdfPreviewUrl} className="relative z-10 h-80 w-full bg-white" title="PDF file preview" />
                ) : (
                  <div className="flex h-80 w-full items-center justify-center text-sm text-slate-500">
                    {t("PDF yuklanmoqda...")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 mt-6 flex flex-col gap-2 border-t border-neutral-200 bg-white pt-4 sm:flex-row">
          <button type="button" onClick={handleDownloadPdf} className="btn-primary flex-1">
            <FileDown className="h-4 w-4" /> {t("Yuklab olish")}
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700"
          >
            <Printer className="h-4 w-4" /> {t("Chop etish")}
          </button>
          {canEdit && onEdit && (
            <button type="button" onClick={onEdit} className="btn-secondary flex-1">
              {t("Tahrirlash")}
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            {t("Yopish")}
          </button>
        </div>
      </motion.div>
    </>
  );
}
