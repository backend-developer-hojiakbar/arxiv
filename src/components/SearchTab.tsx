/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from "react";
import { api } from "../api.js";
import { X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";
import {
  getDocumentPersonLabel,
  getDocumentRowClass,
  getExpiryBadgeClass,
  isDocumentExpired,
} from "../utils/format.ts";
import { UserRole } from "../types.ts";
import DocumentEditModal from "./DocumentEditModal.tsx";
import DocumentFilters from "./DocumentFilters.tsx";
import DocumentPagination from "./DocumentPagination.tsx";
import DocumentTableActions from "./DocumentTableActions.tsx";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog.tsx";
import DocumentDetailDrawer from "./DocumentDetailDrawer.tsx";
import SortableTableHeader from "./SortableTableHeader.tsx";
import ExpiryFilterHeader from "./ExpiryFilterHeader.tsx";
import {
  type DocumentSortKey,
  type ExpiryFilter,
  type SortDir,
  cycleExpiryFilter,
  expiryFilterToQuery,
  sortDocuments,
  toggleSortKey,
} from "../utils/tableSort.ts";

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
  const [sortKey, setSortKey] = useState<DocumentSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all");

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
    overrideParams?: {
      categoryId?: string;
      cabinetId?: string;
      docDate?: string;
      page?: number;
      expiryFilter?: ExpiryFilter;
    },
    background = false
  ) => {
    if (!background) setLoading(true);
    setError(null);
    const nextPage = overrideParams?.page ?? page;
    try {
      const activeExpiryFilter = overrideParams?.expiryFilter ?? expiryFilter;
      const filters = {
        q,
        categoryId: overrideParams?.categoryId !== undefined ? overrideParams.categoryId : categoryId,
        cabinetId: overrideParams?.cabinetId !== undefined ? overrideParams.cabinetId : cabinetId,
        docDate: overrideParams?.docDate !== undefined ? overrideParams.docDate : filterDate,
        expired: expiryFilterToQuery(activeExpiryFilter),
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
    setExpiryFilter("all");
    setPage(1);
    setTimeout(() => {
      searchDocuments({ categoryId: "", cabinetId: "", docDate: "", page: 1, expiryFilter: "all" });
    }, 50);
  };

  const handleExpiryFilterCycle = () => {
    const next = cycleExpiryFilter(expiryFilter);
    setExpiryFilter(next);
    setPage(1);
    searchDocuments({ page: 1, expiryFilter: next });
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

  const handleSort = (key: DocumentSortKey) => {
    const next = toggleSortKey(sortKey, sortDir, key);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const sortedDocuments = useMemo(
    () => sortDocuments(documents, sortKey, sortDir),
    [documents, sortKey, sortDir]
  );

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
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          {t("Topildi:")} <strong className="text-primary-900 font-semibold">{total} {t("ta yozuv")}</strong>
          {totalPages > 1 && (
            <span className="ml-2 text-slate-500">
              · {t("Sahifa")} {page}/{totalPages}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400">
          {expiryFilter === "expired"
            ? t("Faqat eskirgan hujjatlar")
            : expiryFilter === "active"
              ? t("Faqat amaldagi hujjatlar")
              : sortKey
                ? t("Ustun bo'yicha saralangan")
                : t("Sana bo'yicha saralangan (Yangi birinchi)")}
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
                <th className="col-index">{t("№")}</th>
                <SortableTableHeader
                  className="px-3 py-2.5"
                  label={t("Shaxs / Hujjat")}
                  active={sortKey === "person"}
                  direction={sortDir}
                  onSort={() => handleSort("person")}
                />
                <SortableTableHeader
                  className="px-3 py-2.5"
                  label={t("Kategoriya")}
                  active={sortKey === "category"}
                  direction={sortDir}
                  onSort={() => handleSort("category")}
                />
                <SortableTableHeader
                  className="px-3 py-2.5"
                  label={t("Sana")}
                  active={sortKey === "date"}
                  direction={sortDir}
                  onSort={() => handleSort("date")}
                />
                <SortableTableHeader
                  className="px-3 py-2.5"
                  label={t("Joylashuv")}
                  active={sortKey === "location"}
                  direction={sortDir}
                  onSort={() => handleSort("location")}
                />
                <ExpiryFilterHeader
                  className="px-3 py-2.5"
                  label={t("Holat")}
                  filter={expiryFilter}
                  onCycle={handleExpiryFilterCycle}
                />
                <th className="px-3 py-2.5 text-right">{t("Amallar")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDocuments.map((doc, index) => {
                const person = getDocumentPersonLabel(doc);
                const expired = isDocumentExpired(doc.expiryYear);
                const rowNumber = (page - 1) * PAGE_SIZE + index + 1;
                return (
                <tr 
                  key={doc.id}
                  className={getDocumentRowClass(expired)}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <td className="col-index font-mono text-xs text-slate-500">{rowNumber}</td>
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
                      {expired ? (
                        <span className={getExpiryBadgeClass(true)}>{t("Eskirgan")}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
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

      <AnimatePresence>
        {selectedDoc && (
          <DocumentDetailDrawer
            doc={selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onPrintSlip={handlePrintSlip}
            canEdit={canEdit}
            onEdit={() => {
              setSelectedDoc(null);
              setEditDoc(selectedDoc);
            }}
          />
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
