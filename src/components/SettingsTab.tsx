/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { 
  FolderPlus, 
  Layers, 
  Plus, 
  Edit2, 
  Check, 
  X, 
  AlertTriangle,
  Trash2
} from "lucide-react";
import { useTranslation } from "./LanguageContext.tsx";

export default function SettingsTab() {
  const { t } = useTranslation();
  // Lists
  const [categories, setCategories] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Category CRUD states
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catError, setCatError] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");
  const [editCatActive, setEditCatActive] = useState(true);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);

  // Cabinet CRUD states
  const [cabName, setCabName] = useState("");
  const [cabDesc, setCabDesc] = useState("");
  const [cabMaxFloor, setCabMaxFloor] = useState<number>(9);
  const [cabError, setCabError] = useState("");
  const [editingCabId, setEditingCabId] = useState<string | null>(null);
  const [editCabName, setEditCabName] = useState("");
  const [editCabDesc, setEditCabDesc] = useState("");
  const [editCabMaxFloor, setEditCabMaxFloor] = useState(9);
  const [editCabActive, setEditCabActive] = useState(true);
  const [confirmDeleteCabId, setConfirmDeleteCabId] = useState<string | null>(null);

  const loadDirectories = async () => {
    setLoading(true);
    try {
      const cats = await api.getCategories(true); // get all including inactive
      const cabs = await api.getCabinets();
      setCategories(cats);
      setCabinets(cabs);
    } catch (err) {
      console.error("Directories load failure", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectories();
  }, []);

  // Submit Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError("");
    if (!catName.trim()) {
      setCatError("Kategoriya nomi majburiy");
      return;
    }

    try {
      await api.createCategory(catName.trim(), catDesc.trim());
      setCatName("");
      setCatDesc("");
      loadDirectories();
    } catch (err: any) {
      setCatError(err.message || "Xatolik sodir bo'ldi");
    }
  };

  // Start Edit Category
  const startEditCategory = (cat: any) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || "");
    setEditCatActive(cat.isActive);
  };

  // Save Edit Category
  const handleSaveEditCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    try {
      await api.updateCategory(id, editCatName.trim(), editCatDesc.trim(), editCatActive);
      setEditingCatId(null);
      loadDirectories();
    } catch (err: any) {
      setCatError(err.message || "Tahrirlashda muammo sodir bo'ldi");
    }
  };

  // Submit Cabinet
  const handleAddCabinet = async (e: React.FormEvent) => {
    e.preventDefault();
    setCabError("");
    if (!cabName.trim()) {
      setCabError("Shkaf nomi/raqami majburiy");
      return;
    }
    const maxFl = Number(cabMaxFloor);
    if (isNaN(maxFl) || maxFl < 1 || maxFl > 99) {
      setCabError("Maksimal qavat diapazoni: 1 dan 99 gacha");
      return;
    }

    try {
      await api.createCabinet(cabName.trim(), cabDesc.trim(), maxFl);
      setCabName("");
      setCabDesc("");
      setCabMaxFloor(9);
      loadDirectories();
    } catch (err: any) {
      setCabError(err.message || "Xatolik sodir bo'ldi");
    }
  };

  // Start Edit Cabinet
  const startEditCabinet = (cab: any) => {
    setEditingCabId(cab.id);
    setEditCabName(cab.name);
    setEditCabDesc(cab.description || "");
    setEditCabMaxFloor(cab.maxFloor);
    setEditCabActive(cab.isActive);
  };

  // Save Edit Cabinet
  const handleSaveEditCabinet = async (id: string) => {
    if (!editCabName.trim()) return;
    const maxFl = Number(editCabMaxFloor);
    if (isNaN(maxFl) || maxFl < 1 || maxFl > 99) {
      setCabError("Maksimal qavat diapazoni: 1 - 99");
      return;
    }

    try {
      await api.updateCabinet(id, editCabName.trim(), editCabDesc.trim(), maxFl, editCabActive);
      setEditingCabId(null);
      loadDirectories();
    } catch (err: any) {
      setCabError(err.message || "Shkafni saqlashda xatolik yuz berdi");
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    try {
      setCatError("");
      await api.deleteCategory(id);
      setConfirmDeleteCatId(null);
      loadDirectories();
    } catch (err: any) {
      setCatError(err.message || "Kategoriyani o'chirishda xatolik yuz berdi");
    }
  };

  // Delete Cabinet
  const handleDeleteCabinet = async (id: string) => {
    try {
      setCabError("");
      await api.deleteCabinet(id);
      setConfirmDeleteCabId(null);
      loadDirectories();
    } catch (err: any) {
      setCabError(err.message || "Shkafni o'chirishda xatolik yuz berdi");
    }
  };

  return (
    <div className="space-y-6 selection:bg-primary-600 selection:text-white">
      {/* Header */}
      <div className="border-b border-primary-100 pb-4">
        <h2 className="text-xl page-title">
          {t("Mundarija va Tizim Sozlamalari")}
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {t("Arxiv spravochniklari boshqaruvi: Hujjat kategoriyalari hamda shkaflarni sozlash")}
        </p>
      </div>

      {loading && !categories.length ? (
        <div className="py-12 text-center text-xs font-mono">{t("Ma'lumot spravochniklari yangilanmoqda...")}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT COLUMN: CATEGORIES SECTION */}
          <div className="border border-primary-100 rounded-xl shadow-sm p-5 bg-white space-y-6">
            <div className="flex justify-between items-center border-b border-indigo-50 pb-2">
              <h3 className="font-sans font-bold uppercase text-xs tracking-widest text-primary-900 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-primary-600" /> {t("HUJJAT KATEGORIYALARI")}
              </h3>
              <span className="font-mono text-[10px] text-neutral-500 uppercase">{t("jami:")} {categories.length} {t("ta")}</span>
            </div>

            {catError && (
              <div className="border border-red-200 rounded-lg bg-red-50/50 p-2.5 text-[11px] font-semibold flex items-center gap-1.5 text-red-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t(catError)}</span>
              </div>
            )}

            {/* List and Inline edits */}
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isEditing = editingCatId === cat.id;
                return (
                  <div key={cat.id} className="border border-indigo-50/60 p-3 bg-indigo-50/10 rounded-xl space-y-2">
                    {isEditing ? (
                      /* Inline Category edit inputs */
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block text-[9px] font-mono text-neutral-400 uppercase">{t("Kategoriya nomi:")}</label>
                          <input
                            type="text"
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            className="w-full bg-white border border-neutral-300 px-2.5 py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-neutral-400 uppercase">{t("Tavsifi:")}</label>
                          <input
                            type="text"
                            value={editCatDesc}
                            onChange={(e) => setEditCatDesc(e.target.value)}
                            className="w-full bg-white border border-neutral-300 px-2.5 py-1"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`active-${cat.id}`}
                            checked={editCatActive}
                            onChange={(e) => setEditCatActive(e.target.checked)}
                            className="cursor-pointer"
                          />
                          <label htmlFor={`active-${cat.id}`} className="text-xs font-medium font-bold text-neutral-600 cursor-pointer">
                            {t("Xodimlar uchun faol (Active)")}
                          </label>
                        </div>
                        <div className="flex gap-2 justify-end pt-1.5">
                          <button
                            onClick={() => setEditingCatId(null)}
                            className="p-1 px-2 border border-neutral-300 hover:border-primary-600 font-sans text-[10px] uppercase cursor-pointer text-neutral-500 hover:text-primary-600 rounded-md bg-white hover:bg-indigo-50/50 transition-all"
                          >
                            <X className="w-3 h-3 inline mr-1" /> {t("Bekor qilish")}
                          </button>
                          <button
                            onClick={() => handleSaveEditCategory(cat.id)}
                            className="p-1 px-2.5 bg-primary-600 text-white font-sans text-[10px] uppercase font-bold cursor-pointer rounded-md hover:bg-primary-700 transition-all"
                          >
                            <Check className="w-3 h-3 inline mr-1" /> {t("Saqlash")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Category Info Card */
                      <div className="flex justify-between items-start gap-4 text-xs font-sans">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{t(cat.name)}</span>
                            {!cat.isActive && (
                              <span className="text-[9px] font-mono font-bold border border-red-200 text-red-500 px-1 bg-red-50 uppercase">{t("Nofaol")}</span>
                            )}
                          </div>
                          <p className="text-neutral-500 leading-normal text-[11px]">{t(cat.description) || t("Tavsifi kiritilmagan")}</p>
                          <span className="block font-mono text-[9px] text-neutral-400 uppercase tracking-wider">
                            {t("Foydalanilmoqda:")} <strong className="text-neutral-600">{cat.docCount || 0} {t("ta hujjatda")}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {confirmDeleteCatId === cat.id ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 bg-rose-50/35 border border-rose-100 p-2 rounded-lg text-xs">
                              <span className="text-[10px] font-sans font-bold text-rose-950 uppercase px-1">{t("O'chirish?")}</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-900 font-sans text-[10px] uppercase font-bold cursor-pointer rounded transition-all shadow-md"
                                >
                                  {t("Xa")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCatId(null)}
                                  className="px-2.5 py-1 bg-white border border-slate-300 text-slate-705 font-sans text-[10px] uppercase cursor-pointer rounded transition-all hover:bg-slate-50"
                                >
                                  {t("Yo'q")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditCategory(cat)}
                                className="p-1 border border-neutral-300 hover:border-slate-200 text-neutral-500 hover:text-slate-800 hover:bg-white cursor-pointer shrink-0"
                                title="Tahrirlash"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCatId(cat.id)}
                                className="p-1 border border-neutral-300 hover:border-red-600 text-neutral-500 hover:text-red-600 hover:bg-white cursor-pointer shrink-0"
                                title="O'chirish"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Form Category additions */}
            <form onSubmit={handleAddCategory} className="border-t border-dashed border-primary-100 pt-4 space-y-3.5">
              <span className="block font-sans text-[10px] font-extrabold text-primary-900 uppercase tracking-wider">
                {t("+ YANGI KATEGORIYA QO'SHISH:")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-sans uppercase tracking-wider text-neutral-400 mb-1">
                    {t("Kategoriya nomi (*)")}
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder={t("Masalan: Reyting daftar")}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-primary-500 outline-hidden transition-all text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-sans uppercase tracking-wider text-neutral-400 mb-1">
                    {t("Izoh / Qisqa tavsifi")}
                  </label>
                  <input
                    type="text"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder={t("Tashqi parametrlari...")}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-primary-500 outline-hidden transition-all text-neutral-800"
                  />
                </div>
              </div>
              <div className="text-right">
                <button
                  type="submit"
                  className="bg-primary-600 text-white hover:bg-primary-700 font-sans text-xs uppercase font-bold tracking-wider px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 ml-auto cursor-pointer transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> {t("Kategoriya qo'shish")}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: CABINETS SECTION */}
          <div className="border border-primary-100 rounded-xl shadow-sm p-5 bg-white space-y-6">
            <div className="flex justify-between items-center border-b border-indigo-50 pb-2">
              <h3 className="font-sans font-bold uppercase text-xs tracking-widest text-primary-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary-600" /> {t("ARXIV SHKAFLARI (STELLAJ)")}
              </h3>
              <span className="font-mono text-[10px] text-neutral-500 uppercase">{t("jami:")} {cabinets.length} {t("ta")}</span>
            </div>

            {cabError && (
              <div className="border border-red-200 rounded-lg bg-red-50/50 p-2.5 text-[11px] font-semibold flex items-center gap-1.5 text-red-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t(cabError)}</span>
              </div>
            )}

            {/* List and Inline edits */}
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {cabinets.map((cab) => {
                const isEditing = editingCabId === cab.id;
                return (
                  <div key={cab.id} className="border border-indigo-50/60 p-3 bg-indigo-50/10 rounded-xl space-y-2">
                    {isEditing ? (
                      /* Inline Cabinet Edit inputs */
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-neutral-400 uppercase font-bold">{t("Shkaf nomi/raqami:")}</label>
                            <input
                              type="text"
                              value={editCabName}
                              onChange={(e) => setEditCabName(e.target.value)}
                              className="w-full bg-white border border-neutral-300 px-2 py-1"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-neutral-400 uppercase font-bold">{t("Maksimal qavat (1-99):")}</label>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={editCabMaxFloor}
                              onChange={(e) => setEditCabMaxFloor(Number(e.target.value))}
                              className="w-full bg-white border border-neutral-300 px-2 py-1 font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-neutral-400 uppercase font-bold">{t("Fizik tavsifi:")}</label>
                          <input
                            type="text"
                            value={editCabDesc}
                            onChange={(e) => setEditCabDesc(e.target.value)}
                            className="w-full bg-white border border-neutral-300 px-2 py-1"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`active-cab-${cab.id}`}
                            checked={editCabActive}
                            onChange={(e) => setEditCabActive(e.target.checked)}
                            className="cursor-pointer"
                          />
                          <label htmlFor={`active-cab-${cab.id}`} className="text-xs font-medium font-bold text-neutral-600 cursor-pointer">
                            {t("Ishlash holati faol (Active)")}
                          </label>
                        </div>
                        <div className="flex gap-2 justify-end pt-1.5">
                          <button
                            onClick={() => setEditingCabId(null)}
                            className="p-1 px-2 border border-neutral-300 hover:border-primary-600 font-sans text-[10px] uppercase cursor-pointer text-neutral-500 hover:text-primary-600 rounded-md bg-white hover:bg-indigo-50/50 transition-all"
                          >
                            <X className="w-3 h-3 inline mr-1" /> {t("Bekor qilish")}
                          </button>
                          <button
                            onClick={() => handleSaveEditCabinet(cab.id)}
                            className="p-1 px-2.5 bg-primary-600 text-white font-sans text-[10px] uppercase font-bold cursor-pointer rounded-md hover:bg-primary-700 transition-all"
                          >
                            <Check className="w-3 h-3 inline mr-1" /> {t("Saqlash")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Cabinet Card Info */
                      <div className="flex justify-between items-start gap-4 text-xs font-sans">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{t(cab.name)}</span>
                            <span className="text-[9px] font-mono font-bold bg-neutral-900 border border-neutral-800 text-white px-1 uppercase shrink-0">
                              {cab.maxFloor} {t("qavatli")}
                            </span>
                            {!cab.isActive && (
                              <span className="text-[9px] font-mono font-bold border border-red-200 text-red-500 px-1 bg-red-50 uppercase shrink-0">{t("Nofaol")}</span>
                            )}
                          </div>
                          <p className="text-neutral-500 leading-normal text-[11px]">{t(cab.description) || t("Sahnada tavsif berilmagan")}</p>
                          <span className="block font-mono text-[9px] text-neutral-400 uppercase tracking-wider">
                            {t("Saqlanmoqda:")} <strong className="text-neutral-600">{cab.docCount || 0} {t("ta arxiv hujjati")}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {confirmDeleteCabId === cab.id ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 bg-rose-50/35 border border-rose-100 p-2 rounded-lg text-xs">
                              <span className="text-[10px] font-sans font-bold text-rose-950 uppercase px-1">{t("O'chirish?")}</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCabinet(cab.id)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-900 font-sans text-[10px] uppercase font-bold cursor-pointer rounded transition-all shadow-md"
                                >
                                  {t("Xa")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCabId(null)}
                                  className="px-2.5 py-1 bg-white border border-slate-300 text-slate-705 font-sans text-[10px] uppercase cursor-pointer rounded transition-all hover:bg-slate-50"
                                >
                                  {t("Yo'q")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditCabinet(cab)}
                                className="p-1 border border-neutral-300 hover:border-slate-200 text-neutral-500 hover:text-slate-800 hover:bg-white cursor-pointer shrink-0"
                                title="Tahrirlash"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCabId(cab.id)}
                                className="p-1 border border-neutral-300 hover:border-red-600 text-neutral-500 hover:text-red-600 hover:bg-white cursor-pointer shrink-0"
                                title="O'chirish"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Form Cabinet additions */}
            <form onSubmit={handleAddCabinet} className="border-t border-dashed border-primary-100 pt-4 space-y-3.5">
              <span className="block font-sans text-[10px] font-extrabold text-primary-900 uppercase tracking-wider">
                {t("+ YANGI SHKAF (STELLAJ) QO'SHISH:")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-sans uppercase tracking-wider text-neutral-400 mb-1">
                    {t("Shkaf nomi/raqami (*)")}
                  </label>
                  <input
                    type="text"
                    required
                    value={cabName}
                    onChange={(e) => setCabName(e.target.value)}
                    placeholder={t("Masalan: 4-shkaf (Zaxira)")}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-primary-500 outline-hidden transition-all text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-sans uppercase tracking-wider text-neutral-400 mb-1">
                    {t("Maksimal qavati (Butun son 1-99) (*)")}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="99"
                    value={cabMaxFloor}
                    onChange={(e) => setCabMaxFloor(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-primary-500 outline-hidden transition-all text-neutral-800 font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-sans uppercase tracking-wider text-neutral-400 mb-1">
                    {t("Bino yoki xonadagi fizik koordinata tavsifi")}
                  </label>
                  <input
                    type="text"
                    value={cabDesc}
                    onChange={(e) => setCabDesc(e.target.value)}
                    placeholder={t("Masalan: Arxiv asosiy bino, 1-qavat burchakda metall quti")}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-primary-500 outline-hidden transition-all text-neutral-800"
                  />
                </div>
              </div>
              <div className="text-right">
                <button
                  type="submit"
                  className="bg-primary-600 text-white hover:bg-primary-700 font-sans text-xs uppercase font-bold tracking-wider px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 ml-auto cursor-pointer transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> {t("Shkaf qo'shish")}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
