/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "./LanguageContext.tsx";

interface DocumentFiltersProps {
  q: string;
  setQ: (value: string) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;
  cabinetId: string;
  setCabinetId: (value: string) => void;
  filterDate: string;
  setFilterDate: (value: string) => void;
  categories: any[];
  cabinets: any[];
  loading: boolean;
  onSearch: () => void;
  onReset: () => void;
  embedded?: boolean;
}

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800";

export default function DocumentFilters({
  q,
  setQ,
  categoryId,
  setCategoryId,
  cabinetId,
  setCabinetId,
  filterDate,
  setFilterDate,
  categories,
  cabinets,
  loading,
  onSearch,
  onReset,
  embedded = false,
}: DocumentFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className={embedded ? "space-y-4" : "filter-panel space-y-4"}>
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-primary-600" />
        <h3 className="text-sm font-semibold text-slate-800">{t("Qidiruv filtrlari")}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="field-label">{t("Ism, ID yoki hujjat nomi")}</label>
          <div className="relative">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("Masalan: Abduvahobov yoki HEMIS102938")}
              className={inputClass}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-primary-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="sm:col-span-1 lg:col-span-3">
            <label className="field-label">{t("Kategoriya")}</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">{t("Barchasi")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 lg:col-span-3">
            <label className="field-label">{t("Shkaf")}</label>
            <select
              value={cabinetId}
              onChange={(e) => setCabinetId(e.target.value)}
              className={inputClass}
            >
              <option value="">{t("Barchasi")}</option>
              {cabinets.map((cab) => (
                <option key={cab.id} value={cab.id}>{cab.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 lg:col-span-3">
            <label className="field-label">{t("Sana")}</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3 lg:justify-end">
            <button type="button" onClick={onSearch} disabled={loading} className="btn-primary min-w-[7.5rem]">
              <Search className="h-4 w-4" /> {t("Qidirish")}
            </button>
            <button type="button" onClick={onReset} className="btn-secondary min-w-[7.5rem]">
              {t("Tozalash")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
