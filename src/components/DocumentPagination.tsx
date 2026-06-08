/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DocumentPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export default function DocumentPagination({
  page,
  totalPages,
  total,
  pageSize,
  loading,
  onPageChange,
}: DocumentPaginationProps) {
  if (totalPages <= 1) return null;

  const pageItems = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "gap")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("gap");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
      <span className="text-slate-500">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="btn-secondary !py-1.5 !px-2.5 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageItems.map((item, idx) =>
          item === "gap" ? (
            <span key={`gap-${idx}`} className="px-1 text-slate-400">…</span>
          ) : (
            <button
              key={item}
              type="button"
              disabled={loading}
              onClick={() => onPageChange(item)}
              className={`min-w-[2rem] rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                page === item
                  ? "bg-primary-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:border-primary-300"
              }`}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          className="btn-secondary !py-1.5 !px-2.5 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
