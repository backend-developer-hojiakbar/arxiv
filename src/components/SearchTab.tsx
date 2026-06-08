/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api, fetchDocumentPdf } from "../api.js";
import { 
  X, 
  Printer, 
  MapPin,
  FileDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";
import { getDocumentPersonLabel, getStatusStyle } from "../utils/format.ts";
import { UserRole } from "../types.ts";
import DocumentEditModal from "./DocumentEditModal.tsx";
import DocumentFilters from "./DocumentFilters.tsx";
import DocumentPagination from "./DocumentPagination.tsx";
import DocumentTableActions from "./DocumentTableActions.tsx";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog.tsx";

const PAGE_SIZE = 10;

interface SearchTabProps {
  initialFilters?: any;
  dataRevision?: number;
  currentUser?: any;
  onDataChange?: () => void;
}

export default function SearchTab({
  initialFilters,
  dataRevision = 0,
  currentUser,
  onDataChange,
}: SearchTabProps) {
  // Query filters state
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cabinetId, setCabinetId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const { t } = useTranslation();
  
  // Lists for dropdowns
  const [categories, setCategories] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);
  
  // Results
  const [documents, setDocuments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selected Doc for Drawer
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [printSlipDoc, setPrintSlipDoc] = useState<any>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDoc) {
      setPdfPreviewUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    fetchDocumentPdf(selectedDoc.id)
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
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedDoc?.id]);

  // Load categories & cabinets for filters
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const catData = await api.getCategories();
        const cabData = await api.getCabinets();
        setCategories(catData);
        setCabinets(cabData);
      } catch (err) {
        console.error("Dropdown arrays load failure", err);
      }
    };
    loadDropdowns();
  }, []);

  // Handle initial filters (e.g., redirect from dashboard clicks)
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.categoryId) setCategoryId(initialFilters.categoryId);
      if (initialFilters.cabinetId) setCabinetId(initialFilters.cabinetId);
      // Automatically trigger a search
      setPage(1);
      searchDocuments({
        categoryId: initialFilters.categoryId,
        cabinetId: initialFilters.cabinetId,
        page: 1,
      });
    } else {
      searchDocuments({ page: 1 });
    }
  }, [initialFilters]);

  useEffect(() => {
    if (dataRevision > 0) {
      searchDocuments(undefined, true);
    }
  }, [dataRevision]);

  const canEdit = currentUser?.role !== UserRole.VIEWER;
  const canDelete = currentUser?.role === UserRole.ADMIN;

  const searchDocuments = async (
    overrideParams?: { categoryId?: string; cabinetId?: string; docDate?: string; page?: number },
    background = false
  ) => {
    if (!background) setLoading(true);
    setError(null);
    const nextPage = overrideParams?.page ?? page;
    try {
      const filters = {
        q,
        categoryId: overrideParams?.categoryId !== undefined ? overrideParams.categoryId : categoryId,
        cabinetId: overrideParams?.cabinetId !== undefined ? overrideParams.cabinetId : cabinetId,
        docDate: overrideParams?.docDate !== undefined ? overrideParams.docDate : filterDate,
        page: nextPage,
        limit: PAGE_SIZE,
      };

      const res = await api.getDocuments(filters);
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
      setSelectedDoc(null);
      searchDocuments({ page }, true);
    } catch (err: any) {
      alert(err.message || t("O'chirishda muammo sodir bo'ldi"));
    } finally {
      setLoading(false);
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Trigger Local Printer
  const handlePrintSlip = (doc: any) => {
    setPrintSlipDoc(doc);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Download PDF file cleanly
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

  // Print PDF file cleanly
  const handlePrintPdf = async (doc: any) => {
    try {
      const blob = await fetchDocumentPdf(doc.id);
      const url = window.URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
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
        } catch (e) {
          console.error("Iframe printing blocked", e);
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

  return (
    <div className="space-y-6 selection:bg-primary-600 selection:text-white" onKeyDown={handleKeyDown}>
      {/* Search Header */}
      <div className="border-b border-primary-100 pb-4">
        <h2 className="text-xl page-title">
          {t("Hujjatlarni Tezkor Qidirish")}
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {t("Fizik shkaf va qavat qidiruvi: Ism, kategoriya yoki o'quvchi kodi orqali qidiring")}
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

      {/* Results Title Area */}
      <div className="flex flex-wrap justify-between items-center gap-2 text-sm pb-2 border-b border-primary-100">
        <div>
          {t("Topildi:")} <strong className="text-primary-900 font-semibold">{total} {t("ta yozuv")}</strong>
          {totalPages > 1 && (
            <span className="ml-2 text-slate-500">
              · {t("Sahifa")} {page}/{totalPages}
            </span>
          )}
        </div>
        <div className="text-slate-400 text-xs">
          {t("Sana bo'yicha saralangan (Yangi birinchi)")}
        </div>
      </div>

      {/* Results grid / table */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest block">{t("Natijalar saralanmoqda...")}</span>
        </div>
      ) : error ? (
        <div className="p-6 border border-red-200 bg-red-50/50 rounded-xl text-center font-medium my-4">
          <span className="font-mono text-xs uppercase bg-red-600 text-white px-2 py-1 rounded">{t("Xato yuklanish")}</span>
          <p className="mt-2 text-neutral-600 text-sm text-plain">{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="border border-primary-100 rounded-xl p-12 text-center space-y-2 bg-slate-50/50">
          <X className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="font-sans font-bold text-primary-900 uppercase tracking-wider text-sm">{t("HECH NARSA TOPILMADI")}</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {t("Kiritilgan filtrlar bo'yicha arxivdan mos yozuvlar topilmadi. Qidiruv kalit so'zlari yoki filtrlarni o'zgartirib ko'ring.")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto card !p-0">
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
                  onClick={() => setSelectedDoc(doc)}
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
                        : new Date(doc.receivedAt).toLocaleDateString("uz-UZ")}
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
                      onView={() => setSelectedDoc(doc)}
                      onEdit={() => setEditDoc(doc)}
                      onPrint={() => handlePrintSlip(doc)}
                      onDelete={() => setConfirmDeleteId(doc.id)}
                    />
                    </div>
                  </td>
                </tr>
              );})}
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

      {/* Slideover detail drawer for Document & PDF viewing */}
      <AnimatePresence>
        {selectedDoc && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="fixed inset-0 bg-primary-900/30 backdrop-blur-xs z-40"
            ></motion.div>
            
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white border-l border-primary-100 z-50 p-6 shadow-2xl overflow-y-auto flex flex-col justify-between selection:bg-primary-600 selection:text-white"
            >
              <div>
                <div className="flex justify-between items-start border-b border-primary-100 pb-4 mb-6">
                  <div>
                    <span className="text-xs font-medium font-bold bg-primary-600 text-white px-2 py-0.5 tracking-wider rounded">
                      {t("Arxiv Kartasi:")} {selectedDoc.id}
                    </span>
                    <h3 className="text-lg font-display font-black text-primary-900 uppercase tracking-tight mt-2 leading-tight">
                      {t("Hujjat haqida batafsil ma'lumot")}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="p-1.5 border border-slate-200 text-slate-500 hover:text-primary-600 hover:bg-indigo-50/20 rounded cursor-pointer transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Visual Location highlight first */}
                  <div className="border border-primary-100 bg-indigo-50/10 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-indigo-200 bg-primary-600 text-white flex items-center justify-center font-bold rounded-lg shadow-sm">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="field-label !mb-0">{t("Fizik joylashuv")}</span>
                        <strong className="text-primary-900 text-base text-plain">
                          {selectedDoc.cabinet?.name}, {selectedDoc.floor}-{t("qavat")}
                        </strong>
                      </div>
                    </div>
                    <button 
                      onClick={() => handlePrintSlip(selectedDoc)}
                      className="border border-indigo-200 bg-white hover:bg-indigo-50/20 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-700 rounded-lg transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" /> {t("SLIP")}
                    </button>
                  </div>

                  {(() => {
                    const person = getDocumentPersonLabel(selectedDoc);
                    return (
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
                      {person.type === "student" && selectedDoc.student && (
                        <>
                          <div>
                            <span className="field-label !mb-0">{t("Guruh")}</span>
                            <span className="text-plain">{selectedDoc.student.groupName || "—"}</span>
                          </div>
                          <div>
                            <span className="field-label !mb-0">{t("Telefon")}</span>
                            <span className="text-plain">{selectedDoc.student.phone || "—"}</span>
                          </div>
                        </>
                      )}
                      {person.type === "employee" && selectedDoc.employee && (
                        <div>
                          <span className="field-label !mb-0">{t("Bo'lim")}</span>
                          <span className="text-plain">{selectedDoc.employee.department || "—"}</span>
                        </div>
                      )}
                      {person.type === "institut" && (
                        <div className="col-span-2">
                          <span className="field-label !mb-0">{t("Hujjat nomi")}</span>
                          <span className="text-plain">{selectedDoc.docName || "—"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                    );
                  })()}

                  {/* Document details */}
                  <div className="space-y-2">
                    <h4 className="font-mono text-xs uppercase text-neutral-500 tracking-wider font-bold border-b border-neutral-100 pb-1">
                      {t("2. Hujjat va saqlash parametrlari")}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                      <div>
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase font-semibold">{t("Hujjat kategoriyasi")}</span>
                        <span className="text-neutral-800 text-plain">{selectedDoc.category?.name || "—"}</span>
                      </div>
                      <div>
                        <span className="field-label !mb-0">{t("Qabul qilgan xodim")}</span>
                        <span className="font-medium text-neutral-800 text-plain">{selectedDoc.receiver?.fullName || "—"}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Qabul qilingan sana & vaqt")}</span>
                        <span className="font-mono text-neutral-600 text-xs">
                          {new Date(selectedDoc.receivedAt).toLocaleString("uz-UZ")}
                        </span>
                      </div>
                      {selectedDoc.status === "Berilgan" && (
                        <>
                          <div>
                            <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Hujjatni chiqargan xodim")}</span>
                            <span className="font-medium text-slate-800 text-plain">{selectedDoc.issuer?.fullName || "—"}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Chiqarilgan sana & vaqt")}</span>
                            <span className="font-mono text-neutral-600 text-xs">
                              {new Date(selectedDoc.issuedAt).toLocaleString("uz-UZ")}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="col-span-2">
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Shkafdagi aniq izoh variantlari")}</span>
                        <p className="text-neutral-700 bg-neutral-50 px-3 py-2 border border-neutral-200 text-xs italic">
                          {selectedDoc.notes || t("Izoh kiritilmagan")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Raw Interactive PDF preview iframe */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-1">
                      <h4 className="font-mono text-xs uppercase text-neutral-500 tracking-wider font-bold">
                        {t("3. Elektron PDF nusxasi ko'rinishi")}
                      </h4>
                      <span className="font-mono text-[9px] text-neutral-400">
                        {selectedDoc.originalFilename} ({(selectedDoc.fileSize / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    {/* Render Real interactive local PDF inside iframe, fallback to message */}
                    <div className="border border-primary-100 rounded-xl overflow-hidden bg-neutral-50 relative">
                      {pdfPreviewUrl ? (
                        <iframe 
                          src={pdfPreviewUrl} 
                          className="w-full h-80 z-10 relative bg-white" 
                          title="PDF file preview"
                        ></iframe>
                      ) : (
                        <div className="w-full h-80 flex items-center justify-center text-sm text-slate-500">
                          {t("PDF yuklanmoqda...")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-neutral-200 pt-4 mt-6 flex flex-col sm:flex-row gap-2">
                <button 
                  type="button"
                  onClick={() => handleDownloadPdf(selectedDoc)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-mono text-xs uppercase tracking-wider font-bold text-center flex-1 cursor-pointer rounded flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <FileDown className="w-4 h-4" /> {t("Yuklab olish")}
                </button>
                <button 
                  type="button"
                  onClick={() => handlePrintPdf(selectedDoc)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-wider font-bold text-center flex-1 cursor-pointer rounded flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <Printer className="w-4 h-4" /> {t("Chop etish")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs uppercase tracking-wider font-bold flex-1 cursor-pointer rounded-lg text-center transition-all text-xs"
                >
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

      {/* Invisible Printable location voucher. Controlled entirely via browser printing stylesheets */}
      <div className="hidden print:block print-only p-8 text-slate-800 bg-white font-mono text-sm max-w-sm mx-auto border border-slate-200 selection:bg-black">
        {printSlipDoc && (
          <div className="space-y-6 text-center">
            {/* Header */}
            <div className="border-b-2 border-slate-200 pb-3 text-center">
              <h2 className="font-bold text-lg leading-tight uppercase tracking-wider">{t("INSTITUT ARXIVI")}</h2>
              <span className="text-[10px] uppercase font-bold text-neutral-500 text-center">{t("FIZIK JOYLASHUV VOUCHERI")}</span>
            </div>

            {/* Content info */}
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
                  <span className="block text-[10px] uppercase text-neutral-500 font-bold">{person.type === "student" ? t("Talaba") : person.type === "employee" ? t("Xodim") : t("Hujjat")}:</span>
                  <span className="font-bold text-sm block text-plain">{person.name}</span>
                  <span className="text-xs text-neutral-500 text-plain">{person.subtitle}</span>
                  {printSlipDoc.student?.groupName && (
                    <span className="text-xs text-neutral-500 block">{t("Guruh")}: {printSlipDoc.student.groupName}</span>
                  )}
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-neutral-500 font-bold">{t("Hujjat turi:")}</span>
                  <span className="font-medium text-xs text-plain">{printSlipDoc.category?.name || "—"}</span>
                </div>
                </>
                  );
                })()}
              </div>

              {/* Exact Physical Placement high-contrast highlights */}
              <div className="border border-slate-200 p-4 text-center space-y-1 bg-white">
                <span className="block text-[10px] uppercase font-bold text-neutral-500">{t("SHKAF VA TOKCHA COORD:")}</span>
                <strong className="block text-xl uppercase tracking-widest leading-none py-1 border border-slate-200 font-black bg-primary-600 text-white">
                  {printSlipDoc.cabinet?.name || printSlipDoc.cabinetId}
                </strong>
                <strong className="block text-2xl uppercase tracking-wider leading-none py-1.5 font-sans font-black font-semibold">
                  {printSlipDoc.floor}-{t("qavat").toUpperCase()}
                </strong>
              </div>

              {printSlipDoc.notes && (
                <div className="text-xs">
                  <span className="block font-bold text-[10px] text-neutral-500">QO'SHIMCHA KO'RSATMA:</span>
                  <p className="italic leading-normal border border-dashed border-neutral-300 p-2 text-[11px] bg-neutral-50 text-plain">{printSlipDoc.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-slate-200 pt-3 text-[9px] text-neutral-500 space-y-1 text-center">
              <span>{t("Ushbu varaq arxiv javonidan hujjat izlash uchun mo'ljallangan.")}</span>
              <p className="font-bold text-slate-800">{t("Iltimos, hujjatlarni o'z o'rniga qaytarib qo'ying!")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
