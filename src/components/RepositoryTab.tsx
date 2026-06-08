/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api, fetchDocumentPdf } from "../api.js";
import { UserRole } from "../types.js";
import {
  FileText,
  MapPin,
  X,
  FileDown,
  Printer,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";
import { getDocumentPersonLabel, getStatusStyle } from "../utils/format.ts";
import DocumentEditModal from "./DocumentEditModal.tsx";
import DocumentFilters from "./DocumentFilters.tsx";
import DocumentPagination from "./DocumentPagination.tsx";
import DocumentTableActions from "./DocumentTableActions.tsx";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog.tsx";

const PAGE_SIZE = 10;

interface RepositoryTabProps {
  currentUser: any;
  dataRevision?: number;
  onDataChange?: () => void;
}

export default function RepositoryTab({ currentUser, dataRevision = 0, onDataChange }: RepositoryTabProps) {
  const { t } = useTranslation();

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cabinetId, setCabinetId] = useState("");
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
        console.error("Spravochnik load errors in repository", err);
      }
    };
    bootstrapData();
    searchDocuments({ page: 1 });
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
      setError(err.message || t("Arxiv ro'yxatini yuklashda xatolik yuz berdi"));
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
      alert(t("Hujjatni yuklab olishda xatolik yuz berdi:") + " " + err.message);
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
      alert(t("Chop etishda xatolik yuz berdi:") + " " + err.message);
    }
  };

  return (
    <div className="space-y-6 selection:bg-primary-100 selection:text-primary-900" onKeyDown={handleKeyDown}>
      <div className="border-b border-primary-100 pb-4">
        <h2 className="text-xl page-title">{t("Hujjatlar Ombori (Inventarizatsiya)")}</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {t("Faol hujjatlarni tahrirlash, holatini o'zgartirish, elektron PDF almashtirish va o'chirish boshqaruvi")}
        </p>
      </div>

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

      <div className="flex flex-wrap justify-between items-center gap-2 text-sm pb-2 border-b border-primary-100">
        <div>
          {t("Topildi:")} <strong className="text-primary-900 font-semibold">{total} {t("ta yozuv")}</strong>
          {totalPages > 1 && (
            <span className="ml-2 text-slate-500">· {t("Sahifa")} {page}/{totalPages}</span>
          )}
        </div>
        <div className="text-slate-400 text-xs">{t("Sana bo'yicha saralangan (Yangi birinchi)")}</div>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700 text-plain">
          {error}
          <button type="button" onClick={() => searchDocuments({ page })} className="ml-3 underline">
            {t("Qayta yuklash")}
          </button>
        </div>
      )}

      {loading && documents.length === 0 ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs text-neutral-500 block">{t("Ma'lumotlar yuklanmoqda...")}</span>
        </div>
      ) : !error && documents.length === 0 ? (
        <div className="border border-primary-100 rounded-xl p-12 text-center space-y-2 bg-slate-50/50">
          <X className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="font-semibold text-primary-900 text-sm">{t("HECH NARSA TOPILMADI")}</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {t("Kiritilgan filtrlar bo'yicha arxivdan mos yozuvlar topilmadi. Qidiruv kalit so'zlari yoki filtrlarni o'zgartirib ko'ring.")}
          </p>
        </div>
      ) : (
        <div className="relative overflow-x-auto card !p-0">
          {loading && documents.length > 0 && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <table className="data-table w-full text-left border-collapse bg-white text-sm">
            <thead>
              <tr>
                <th className="py-2.5 px-3">{t("Shaxs / Hujjat")}</th>
                <th className="py-2.5 px-3">{t("Kategoriya")}</th>
                <th className="py-2.5 px-3">{t("Sana")}</th>
                <th className="py-2.5 px-3">{t("Joylashuv")}</th>
                <th className="py-2.5 px-3">{t("Holat")}</th>
                <th className="py-2.5 px-3 text-right">{t("Amallar")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const person = getDocumentPersonLabel(doc);
                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50 group cursor-pointer"
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

      <AnimatePresence>
        {inspectDoc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectDoc(null)}
              className="fixed inset-0 bg-black z-45"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween" }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white border-l-2 border-slate-200 z-50 p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-xs font-medium bg-neutral-100 text-slate-800 border border-neutral-300 px-2 py-0.5">
                      {t("Ombor Kartasi:")} {inspectDoc.id}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-800 mt-1">{t("Hujjat Rekvizitlari")}</h3>
                  </div>
                  <button type="button" onClick={() => setInspectDoc(null)} className="p-1 border border-slate-200 hover:bg-neutral-50 text-slate-800 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  <div className="border border-slate-200 p-3 bg-neutral-50 flex items-center gap-3 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-800" />
                    <div>
                      <span className="block text-[8px] font-mono text-neutral-400 uppercase font-semibold">{t("Tahrirlangan joriy koordinata:")}</span>
                      <strong className="font-mono text-xs text-slate-800 uppercase">{inspectDoc.cabinet?.name}, {inspectDoc.floor}-{t("qavat")}</strong>
                    </div>
                  </div>

                  {(() => {
                    const person = getDocumentPersonLabel(inspectDoc);
                    return (
                      <div className="info-block space-y-2 border-b border-neutral-100 pb-3">
                        <h4 className="card-section-title">{t("Shaxs ma'lumotlari")}</h4>
                        <p className="font-semibold text-sm text-slate-800 text-plain">{person.name}</p>
                        <p className="text-sm text-slate-600 text-plain">{person.subtitle}</p>
                        {inspectDoc.docName && person.type === "institut" && (
                          <p className="text-sm text-slate-600">{t("Hujjat nomi")}: {inspectDoc.docName}</p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="space-y-2 border-b border-neutral-100 pb-3">
                    <h4 className="text-xs font-medium text-neutral-400 font-bold mb-1">{t("Status rekvizitlari:")}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-neutral-400 font-semibold block">{t("Hujjat Holati:")}</span>
                        <span className={getStatusStyle(inspectDoc.status)}>{t(inspectDoc.status)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block">{t("Qabul sanasi:")}</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {new Date(inspectDoc.receivedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-semibold block text-neutral-500">{t("Muvofiqlik izohlari:")}</span>
                    <p className="p-2.5 bg-neutral-50 border border-neutral-200 font-mono text-neutral-600 leading-normal text-[11px] whitespace-pre-wrap rounded">
                      {inspectDoc.notes || t("Hech qanday zaxira izohlar mavjud emas")}
                    </p>
                  </div>

                  <div className="space-y-1 pt-2">
                    <span className="font-semibold block text-neutral-500">{t("Yuklangan elektron fayl:")}</span>
                    <div className="flex items-center gap-2 border border-neutral-200 p-2 bg-gradient-to-r from-neutral-50 to-indigo-50/20 rounded">
                      <FileText className="w-5 h-5 text-primary-500" />
                      <div className="flex-1 truncate font-mono text-[11px] font-bold text-neutral-700">
                        {inspectDoc.originalFilename} ({(inspectDoc.fileSize / 1024).toFixed(1)} KB)
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(inspectDoc)}
                          className="p-1 px-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium flex items-center gap-1 cursor-pointer rounded"
                        >
                          <FileDown className="w-3 h-3" /> {t("yuklash")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintPdf(inspectDoc)}
                          className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 cursor-pointer rounded"
                        >
                          <Printer className="w-3 h-3" /> {t("Chop etish")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 flex gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => { setInspectDoc(null); setEditDoc(inspectDoc); }}
                    className="btn-secondary flex-1"
                  >
                    {t("Tahrirlashga o'tish")}
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
          <DocumentEditModal
            doc={editDoc}
            onClose={() => setEditDoc(null)}
            onSaved={handleEditSaved}
          />
        )}
        {confirmDeleteId && (
          <ConfirmDeleteDialog
            onCancel={() => setConfirmDeleteId(null)}
            onConfirm={() => handleDeleteDoc(confirmDeleteId)}
          />
        )}
      </AnimatePresence>

      <div className="hidden print:block print-only p-8 text-slate-800 bg-white font-mono text-sm max-w-sm mx-auto border border-slate-200">
        {printSlipDoc && (
          <div className="space-y-6 text-center">
            <div className="border-b-2 border-slate-200 pb-3 text-center">
              <h2 className="font-bold text-lg leading-tight uppercase tracking-wider">{t("INSTITUT ARXIVI")}</h2>
              <span className="text-[10px] uppercase font-bold text-neutral-500">{t("FIZIK JOYLASHUV VOUCHERI")}</span>
            </div>
            <div className="space-y-4 text-left font-mono">
              <div className="flex justify-between text-xs">
                <span>Voucher ID:</span>
                <span className="font-bold">SLP-{printSlipDoc.id.substring(4)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{t("Chop etilgan sana:")}</span>
                <span className="font-bold">{new Date().toLocaleString("uz-UZ")}</span>
              </div>
              <div className="border-t border-b border-dashed border-slate-200 py-4 space-y-3">
                {(() => {
                  const person = getDocumentPersonLabel(printSlipDoc);
                  return (
                    <>
                      <div>
                        <span className="block text-[10px] uppercase text-neutral-500 font-bold">
                          {person.type === "student" ? t("Talaba") : person.type === "employee" ? t("Xodim") : t("Hujjat")}:
                        </span>
                        <span className="font-bold text-sm block text-plain">{person.name}</span>
                        <span className="text-xs text-neutral-500 text-plain">{person.subtitle}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase text-neutral-500 font-bold">{t("Hujjat turi:")}</span>
                        <span className="font-medium text-xs text-plain">{printSlipDoc.category?.name || "—"}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="border border-slate-200 p-4 text-center space-y-1 bg-white">
                <span className="block text-[10px] uppercase font-bold text-neutral-500">{t("SHKAF VA TOKCHA COORD:")}</span>
                <strong className="block text-xl uppercase tracking-widest py-1 border border-slate-200 font-black bg-primary-600 text-white">
                  {printSlipDoc.cabinet?.name || printSlipDoc.cabinetId}
                </strong>
                <strong className="block text-2xl uppercase tracking-wider py-1.5 font-semibold">
                  {printSlipDoc.floor}-{t("qavat").toUpperCase()}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
