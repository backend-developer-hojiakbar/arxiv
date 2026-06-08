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
}

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
}: DocumentFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="filter-panel space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-primary-600" />
        <h3 className="text-sm font-semibold text-slate-800">{t("Qidiruv filtrlari")}</h3>
      </div>

      <div className="filter-grid">
        <div className="md:col-span-2 lg:col-span-3">
          <label className="field-label">{t("Ism, ID yoki hujjat nomi")}</label>
          <div className="relative">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("Masalan: Abduvahobov yoki HEMIS102938")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
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

        <div>
          <label className="field-label">{t("Kategoriya")}</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">{t("Barchasi")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">{t("Shkaf")}</label>
          <select
            value={cabinetId}
            onChange={(e) => setCabinetId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">{t("Barchasi")}</option>
            {cabinets.map((cab) => (
              <option key={cab.id} value={cab.id}>{cab.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">{t("Sana")}</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
        <button type="button" onClick={onSearch} disabled={loading} className="btn-primary">
          <Search className="h-4 w-4" /> {t("Qidirish")}
        </button>
        <button type="button" onClick={onReset} className="btn-secondary">
          {t("Tozalash")}
        </button>
      </div>
    </div>
  );
}
