/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from "react";
import { api } from "../api.js";
import { UserRole } from "../types.js";
import { X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";
import {
  getDocumentPersonLabel,
  getDocumentRowClass,
  getExpiryBadgeClass,
  isDocumentExpired,
} from "../utils/format.ts";
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
  const [sortKey, setSortKey] = useState<DocumentSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all");

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
      const res = await api.getDocuments({
        q,
        categoryId: overrideParams?.categoryId !== undefined ? overrideParams.categoryId : categoryId,
        cabinetId: overrideParams?.cabinetId !== undefined ? overrideParams.cabinetId : cabinetId,
        docDate: overrideParams?.docDate !== undefined ? overrideParams.docDate : filterDate,
        expired: expiryFilterToQuery(activeExpiryFilter),
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

  const handleSort = (key: DocumentSortKey) => {
    const next = toggleSortKey(sortKey, sortDir, key);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const sortedDocuments = useMemo(
    () => sortDocuments(documents, sortKey, sortDir),
    [documents, sortKey, sortDir]
  );

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
        embedded={variant === "embedded"}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
        <div>
          {t("Topildi:")} <strong className="font-semibold text-primary-900">{total} {t("ta yozuv")}</strong>
          {totalPages > 1 && (
            <span className="ml-2 text-slate-500">· {t("Sahifa")} {page}/{totalPages}</span>
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
        <div
          className={
            variant === "embedded"
              ? "relative overflow-x-auto rounded-lg border border-slate-200"
              : "relative overflow-x-auto card !p-0"
          }
        >
          {loading && documents.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          )}
          <table className="data-table w-full border-collapse bg-white text-left text-sm">
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
                    onClick={() => setInspectDoc(doc)}
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
        <div className="card overflow-hidden !p-0">
          {sectionTitle && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <h3 className="card-section-title flex min-w-0 flex-1 items-center gap-2">
                {sectionIcon && <span className="shrink-0">{sectionIcon}</span>}
                <span className="leading-snug">{sectionTitle}</span>
              </h3>
              {sectionBadge && (
                <span className="shrink-0 text-xs font-medium text-slate-500">{sectionBadge}</span>
              )}
            </div>
          )}
          <div className="space-y-4 px-5 pb-5 pt-4">{content}</div>
        </div>
      ) : (
        content
      )}

      <AnimatePresence>
        {inspectDoc && (
          <DocumentDetailDrawer
            doc={inspectDoc}
            onClose={() => setInspectDoc(null)}
            onPrintSlip={handlePrintSlip}
            canEdit={canEdit}
            onEdit={() => {
              setInspectDoc(null);
              setEditDoc(inspectDoc);
            }}
          />
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
