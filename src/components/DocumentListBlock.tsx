/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api, fetchDocumentPdf } from "../api.js";
import { UserRole } from "../types.js";
import { FileText, MapPin, X, FileDown, Printer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";
import { getDocumentPersonLabel, getStatusStyle } from "../utils/format.ts";
import DocumentEditModal from "./DocumentEditModal.tsx";
import DocumentFilters from "./DocumentFilters.tsx";
import DocumentPagination from "./DocumentPagination.tsx";
import DocumentTableActions from "./DocumentTableActions.tsx";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog.tsx";

const PAGE_SIZE = 10;

interface DocumentListBlockProps {
  currentUser: any;
  onDataChange?: () => void;
  dataRevision?: number;
  initialFilters?: { categoryId?: string; cabinetId?: string };
  sectionTitle?: string;
  sectionBadge?: string;
  sectionIcon?: React.ReactNode;
  variant?: "standalone" | "embedded";
}

export default function DocumentListBlock({
  currentUser,
  onDataChange,
  dataRevision = 0,
  initialFilters,
  sectionTitle,
  sectionBadge,
  sectionIcon,
  variant = "standalone",
}: DocumentListBlockProps) {
  const { t } = useTranslation();

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState(initialFilters?.categoryId || "");
  const [cabinetId, setCabinetId] = useState(initialFilters?.cabinetId || "");
  const [filterDate, setFilterDate] = useState("");

  const [categories, setCategories] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);

  const [documents, setDocuments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inspectDoc, setInspectDoc] = useState<any>(null);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [printSlipDoc, setPrintSlipDoc] = useState<any>(null);

  const canEdit = currentUser?.role !== UserRole.VIEWER;
  const canDelete = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    const bootstrapData = async () => {
      try {
        const [catData, cabData] = await Promise.all([api.getCategories(), api.getCabinets()]);
        setCategories(catData);
        setCabinets(cabData);
      } catch (err) {
        console.error("DocumentListBlock dropdown load error", err);
      }
    };
    bootstrapData();

    if (initialFilters) {
      if (initialFilters.categoryId) setCategoryId(initialFilters.categoryId);
      if (initialFilters.cabinetId) setCabinetId(initialFilters.cabinetId);
      searchDocuments({
        categoryId: initialFilters.categoryId,
        cabinetId: initialFilters.cabinetId,
        page: 1,
      });
    } else {
      searchDocuments({ page: 1 });
    }
  }, []);

  useEffect(() => {
    if (dataRevision > 0) {
      searchDocuments({ page }, true);
    }
  }, [dataRevision]);

  const searchDocuments = async (
    overrideParams?: { categoryId?: string; cabinetId?: string; docDate?: string; page?: number },
    background = false
  ) => {
    if (!background) setLoading(true);
    setError(null);
    const nextPage = overrideParams?.page ?? page;
    try {
      const res = await api.getDocuments({
        q,
        categoryId: overrideParams?.categoryId !== undefined ? overrideParams.categoryId : categoryId,
        cabinetId: overrideParams?.cabinetId !== undefined ? overrideParams.cabinetId : cabinetId,
        docDate: overrideParams?.docDate !== undefined ? overrideParams.docDate : filterDate,
        page: nextPage,
        limit: PAGE_SIZE,
      });
      setDocuments(res.documents);
      setTotal(res.total);
      setPage(res.page || nextPage);
      setTotalPages(res.pages || 1);
    } catch (err: any) {
      setError(err.message || t("Hujjatlarni oqimlashda xatolik yuz berdi"));
    } finally {
      if (!background) setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    searchDocuments({ page: 1 });
  };

  const handleReset = () => {
    setQ("");
    setCategoryId("");
    setCabinetId("");
    setFilterDate("");
    setPage(1);
    setTimeout(() => {
      searchDocuments({ categoryId: "", cabinetId: "", docDate: "", page: 1 });
    }, 50);
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    searchDocuments({ page: nextPage });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleEditSaved = () => {
    onDataChange?.();
    searchDocuments({ page }, true);
  };

  const handleDeleteDoc = async (id: string) => {
    setLoading(true);
    try {
      await api.deleteDocument(id);
      onDataChange?.();
      setConfirmDeleteId(null);
      setInspectDoc(null);
      searchDocuments({ page }, true);
    } catch (err: any) {
      alert(err.message || t("O'chirishda muammo sodir bo'ldi"));
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSlip = (doc: any) => {
    setPrintSlipDoc(doc);
    setTimeout(() => window.print(), 300);
  };

  const handleDownloadPdf = async (doc: any) => {
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

  const handlePrintPdf = async (doc: any) => {
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
          window.open(url, "_blank");
        }
      };
    } catch (err: any) {
      alert(t("Chop etishda xatolik yuz berdi: ") + err.message);
    }
  };

  const content = (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      <DocumentFilters
        q={q}
        setQ={setQ}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        cabinetId={cabinetId}
        setCabinetId={setCabinetId}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        categories={categories}
        cabinets={cabinets}
        loading={loading}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary-100 pb-2 text-sm">
        <div>
          {t("Topildi:")} <strong className="font-semibold text-primary-900">{total} {t("ta yozuv")}</strong>
          {totalPages > 1 && (
            <span className="ml-2 text-slate-500">· {t("Sahifa")} {page}/{totalPages}</span>
          )}
        </div>
        <div className="text-xs text-slate-400">{t("Sana bo'yicha saralangan (Yangi birinchi)")}</div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-plain">
          {error}
          <button type="button" onClick={() => searchDocuments({ page })} className="ml-3 underline">
            {t("Qayta yuklash")}
          </button>
        </div>
      )}

      {loading && documents.length === 0 ? (
        <div className="space-y-3 py-16 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <span className="block text-xs text-neutral-500">{t("Ma'lumotlar yuklanmoqda...")}</span>
        </div>
      ) : !error && documents.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-primary-100 bg-slate-50/50 p-12 text-center">
          <X className="mx-auto h-8 w-8 text-neutral-400" />
          <h3 className="text-sm font-semibold text-primary-900">{t("HECH NARSA TOPILMADI")}</h3>
          <p className="mx-auto max-w-sm text-xs text-neutral-500">
            {t("Kiritilgan filtrlar bo'yicha arxivdan mos yozuvlar topilmadi. Qidiruv kalit so'zlari yoki filtrlarni o'zgartirib ko'ring.")}
          </p>
        </div>
      ) : (
        <div className="relative overflow-x-auto card !p-0">
          {loading && documents.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          )}
          <table className="data-table w-full border-collapse bg-white text-left text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2.5">{t("Shaxs / Hujjat")}</th>
                <th className="px-3 py-2.5">{t("Kategoriya")}</th>
                <th className="px-3 py-2.5">{t("Sana")}</th>
                <th className="px-3 py-2.5">{t("Joylashuv")}</th>
                <th className="px-3 py-2.5">{t("Holat")}</th>
                <th className="px-3 py-2.5 text-right">{t("Amallar")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const person = getDocumentPersonLabel(doc);
                return (
                  <tr
                    key={doc.id}
                    className="group cursor-pointer hover:bg-slate-50"
                    onClick={() => setInspectDoc(doc)}
                  >
                    <td>
                      <div className="table-cell-inner table-cell-inner--stack">
                        <div className="font-medium text-slate-800 text-plain">{person.name}</div>
                        <div className="text-xs text-slate-500 text-plain">{person.subtitle}</div>
                      </div>
                    </td>
                    <td>
                      <div className="table-cell-inner text-slate-600">{doc.category?.name || "—"}</div>
                    </td>
                    <td>
                      <div className="table-cell-inner text-slate-500">
                        {doc.docDate
                          ? new Date(doc.docDate).toLocaleDateString("uz-UZ")
                          : doc.receivedAt
                            ? new Date(doc.receivedAt).toLocaleDateString("uz-UZ")
                            : "—"}
                      </div>
                    </td>
                    <td>
                      <div className="table-cell-inner text-plain">
                        <span className="font-medium">{doc.cabinet?.name || doc.cabinetId}</span>
                        <span className="text-slate-500"> · {doc.floor}-{t("qavat")}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-cell-inner">
                        <span className={getStatusStyle(doc.status)}>{t(doc.status)}</span>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="table-cell-inner table-cell-inner--end">
                        <DocumentTableActions
                          canEdit={canEdit}
                          canDelete={canDelete}
                          onView={() => setInspectDoc(doc)}
                          onEdit={() => setEditDoc(doc)}
                          onPrint={() => handlePrintSlip(doc)}
                          onDelete={() => setConfirmDeleteId(doc.id)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <DocumentPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            loading={loading}
            onPageChange={goToPage}
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      {variant === "embedded" ? (
        <div className="card space-y-4">
          {sectionTitle && (
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="card-section-title flex items-center gap-2">
                {sectionIcon}
                {sectionTitle}
              </h3>
              {sectionBadge && <span className="text-xs text-slate-400">{sectionBadge}</span>}
            </div>
          )}
          {content}
        </div>
      ) : (
        content
      )}

      <AnimatePresence>
        {inspectDoc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectDoc(null)}
              className="fixed inset-0 z-45 bg-black"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween" }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-xl flex-col justify-between overflow-y-auto border-l-2 border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <span className="border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                      {t("Arxiv Kartasi:")} {inspectDoc.id}
                    </span>
                    <h3 className="mt-1 text-lg font-semibold text-slate-800">{t("Hujjat haqida batafsil ma'lumot")}</h3>
                  </div>
                  <button type="button" onClick={() => setInspectDoc(null)} className="cursor-pointer border border-slate-200 p-1 hover:bg-neutral-50">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-neutral-50 p-3">
                    <MapPin className="h-5 w-5 text-slate-800" />
                    <div>
                      <span className="field-label !mb-0">{t("Fizik joylashuv")}</span>
                      <strong className="text-sm text-slate-800 text-plain">
                        {inspectDoc.cabinet?.name}, {inspectDoc.floor}-{t("qavat")}
                      </strong>
                    </div>
                  </div>

                  {(() => {
                    const person = getDocumentPersonLabel(inspectDoc);
                    return (
                      <div className="info-block space-y-2 border-b border-neutral-100 pb-3">
                        <h4 className="card-section-title">{t("Shaxs ma'lumotlari")}</h4>
                        <p className="text-sm font-semibold text-slate-800 text-plain">{person.name}</p>
                        <p className="text-sm text-slate-600 text-plain">{person.subtitle}</p>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-2 border-b border-neutral-100 pb-3">
                    <div>
                      <span className="field-label !mb-0">{t("Hujjat kategoriyasi")}</span>
                      <span className="text-plain">{inspectDoc.category?.name || "—"}</span>
                    </div>
                    <div>
                      <span className="field-label !mb-0">{t("Qabul qilgan xodim")}</span>
                      <span className="text-plain">{inspectDoc.receiver?.fullName || "—"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="field-label">{t("Yuklangan elektron fayl:")}</span>
                    <div className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 p-2">
                      <FileText className="h-5 w-5 text-primary-500" />
                      <div className="flex-1 truncate font-mono text-[11px] font-bold text-neutral-700">
                        {inspectDoc.originalFilename} ({(inspectDoc.fileSize / 1024).toFixed(1)} KB)
                      </div>
                      <button type="button" onClick={() => handleDownloadPdf(inspectDoc)} className="btn-primary !py-1 !px-2 !text-xs">
                        <FileDown className="h-3 w-3" /> {t("Yuklab olish")}
                      </button>
                      <button type="button" onClick={() => handlePrintPdf(inspectDoc)} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700">
                        <Printer className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-neutral-200 pt-4">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => { setInspectDoc(null); setEditDoc(inspectDoc); }}
                    className="btn-secondary flex-1"
                  >
                    {t("Tahrirlash")}
                  </button>
                )}
                <button type="button" onClick={() => setInspectDoc(null)} className="btn-primary flex-1">
                  {t("Yopish")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editDoc && (
          <DocumentEditModal doc={editDoc} onClose={() => setEditDoc(null)} onSaved={handleEditSaved} />
        )}
        {confirmDeleteId && (
          <ConfirmDeleteDialog
            onCancel={() => setConfirmDeleteId(null)}
            onConfirm={() => handleDeleteDoc(confirmDeleteId)}
          />
        )}
      </AnimatePresence>

      <div className="hidden print:block print-only mx-auto max-w-sm border border-slate-200 bg-white p-8 font-mono text-sm text-slate-800">
        {printSlipDoc && (
          <div className="space-y-6 text-center">
            <div className="border-b-2 border-slate-200 pb-3">
              <h2 className="text-lg font-bold uppercase tracking-wider">{t("INSTITUT ARXIVI")}</h2>
              <span className="text-[10px] font-bold uppercase text-neutral-500">{t("FIZIK JOYLASHUV VOUCHERI")}</span>
            </div>
            <div className="space-y-4 text-left">
              <div className="border border-slate-200 bg-white p-4 text-center">
                <strong className="block bg-primary-600 py-1 text-xl font-black uppercase tracking-widest text-white">
                  {printSlipDoc.cabinet?.name || printSlipDoc.cabinetId}
                </strong>
                <strong className="block py-1.5 text-2xl font-semibold uppercase">
                  {printSlipDoc.floor}-{t("qavat").toUpperCase()}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
