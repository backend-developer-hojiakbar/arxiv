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

  const renderDeleteConfirm = (
    onConfirm: () => void,
    onCancel: () => void
  ) => (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 text-sm">
      <span className="text-red-700 font-medium">{t("O'chirish?")}</span>
      <button type="button" onClick={onConfirm} className="text-red-700 font-semibold hover:underline">{t("Ha")}</button>
      <button type="button" onClick={onCancel} className="text-slate-500 hover:underline">{t("Yo'q")}</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h2 className="page-title">{t("Mundarija va tizim sozlamalari")}</h2>
        <p className="page-subtitle">
          {t("Hujjat kategoriyalari va arxiv shkaflarini boshqarish")}
        </p>
      </div>

      {loading && !categories.length ? (
        <div className="py-16 text-center text-sm text-slate-500">{t("Ma'lumotlar yuklanmoqda...")}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Kategoriyalar */}
          <div className="card p-5 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="card-section-title flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-primary-600" />
                {t("Hujjat kategoriyalari")}
              </h3>
              <span className="badge badge-primary">{categories.length} {t("ta")}</span>
            </div>

            {catError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-plain">{catError}</span>
              </div>
            )}

            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">{t("Kategoriyalar yo'q")}</p>
              ) : categories.map((cat) => {
                const isEditing = editingCatId === cat.id;
                return (
                  <div key={cat.id} className="border border-slate-100 rounded-lg p-3 hover:border-slate-200 transition-colors bg-slate-50/40">
                    {isEditing ? (
                      <div className="space-y-3 text-sm">
                        <div>
                          <label className="field-label">{t("Kategoriya nomi")}</label>
                          <input type="text" value={editCatName} onChange={(e) => setEditCatName(e.target.value)} className="w-full border border-slate-300 px-3 py-2 rounded-lg" />
                        </div>
                        <div>
                          <label className="field-label">{t("Tavsif")}</label>
                          <input type="text" value={editCatDesc} onChange={(e) => setEditCatDesc(e.target.value)} className="w-full border border-slate-300 px-3 py-2 rounded-lg" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={editCatActive} onChange={(e) => setEditCatActive(e.target.checked)} />
                          {t("Faol")}
                        </label>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setEditingCatId(null)} className="btn-secondary"><X className="w-4 h-4" /> {t("Bekor")}</button>
                          <button type="button" onClick={() => handleSaveEditCategory(cat.id)} className="btn-primary"><Check className="w-4 h-4" /> {t("Saqlash")}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-800 text-plain">{cat.name}</span>
                            {!cat.isActive && <span className="badge bg-red-50 text-red-600 border-red-200">{t("Nofaol")}</span>}
                            <span className="badge badge-neutral">{cat.docCount || 0} {t("hujjat")}</span>
                          </div>
                          {cat.description ? (
                            <p className="text-sm text-slate-500 text-plain">{cat.description}</p>
                          ) : (
                            <p className="text-sm text-slate-400 italic">{t("Tavsif kiritilmagan")}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {confirmDeleteCatId === cat.id ? renderDeleteConfirm(
                            () => handleDeleteCategory(cat.id),
                            () => setConfirmDeleteCatId(null)
                          ) : (
                            <>
                              <button type="button" onClick={() => startEditCategory(cat)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-300" title={t("Tahrirlash")}>
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => setConfirmDeleteCatId(cat.id)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200" title={t("O'chirish")}>
                                <Trash2 className="w-4 h-4" />
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

            <form onSubmit={handleAddCategory} className="info-block space-y-3 pt-4 border-t border-slate-100">
              <h4 className="card-section-title">{t("Yangi kategoriya")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">{t("Nomi")} *</label>
                  <input type="text" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder={t("Masalan: Reyting daftari")} className="w-full border border-slate-300 px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="field-label">{t("Qisqa tavsif")}</label>
                  <input type="text" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder={t("Ixtiyoriy")} className="w-full border border-slate-300 px-3 py-2 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary"><Plus className="w-4 h-4" /> {t("Qo'shish")}</button>
              </div>
            </form>
          </div>

          {/* Shkaflar */}
          <div className="card p-5 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="card-section-title flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-600" />
                {t("Arxiv shkaflari")}
              </h3>
              <span className="badge badge-primary">{cabinets.length} {t("ta")}</span>
            </div>

            {cabError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-plain">{cabError}</span>
              </div>
            )}

            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {cabinets.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">{t("Shkaflar yo'q")}</p>
              ) : cabinets.map((cab) => {
                const isEditing = editingCabId === cab.id;
                return (
                  <div key={cab.id} className="border border-slate-100 rounded-lg p-3 hover:border-slate-200 transition-colors bg-slate-50/40">
                    {isEditing ? (
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="field-label">{t("Shkaf nomi")}</label>
                            <input type="text" value={editCabName} onChange={(e) => setEditCabName(e.target.value)} className="w-full border border-slate-300 px-3 py-2 rounded-lg" />
                          </div>
                          <div>
                            <label className="field-label">{t("Maks. qavat")}</label>
                            <input type="number" min="1" max="99" value={editCabMaxFloor} onChange={(e) => setEditCabMaxFloor(Number(e.target.value))} className="w-full border border-slate-300 px-3 py-2 rounded-lg" />
                          </div>
                        </div>
                        <div>
                          <label className="field-label">{t("Joylashuv tavsifi")}</label>
                          <input type="text" value={editCabDesc} onChange={(e) => setEditCabDesc(e.target.value)} className="w-full border border-slate-300 px-3 py-2 rounded-lg" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={editCabActive} onChange={(e) => setEditCabActive(e.target.checked)} />
                          {t("Faol")}
                        </label>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setEditingCabId(null)} className="btn-secondary"><X className="w-4 h-4" /> {t("Bekor")}</button>
                          <button type="button" onClick={() => handleSaveEditCabinet(cab.id)} className="btn-primary"><Check className="w-4 h-4" /> {t("Saqlash")}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-800 text-plain">{cab.name}</span>
                            <span className="badge badge-primary">{cab.maxFloor} {t("qavat")}</span>
                            {!cab.isActive && <span className="badge bg-red-50 text-red-600 border-red-200">{t("Nofaol")}</span>}
                            <span className="badge badge-neutral">{cab.docCount || 0} {t("hujjat")}</span>
                          </div>
                          {cab.description ? (
                            <p className="text-sm text-slate-500 text-plain">{cab.description}</p>
                          ) : (
                            <p className="text-sm text-slate-400 italic">{t("Tavsif kiritilmagan")}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {confirmDeleteCabId === cab.id ? renderDeleteConfirm(
                            () => handleDeleteCabinet(cab.id),
                            () => setConfirmDeleteCabId(null)
                          ) : (
                            <>
                              <button type="button" onClick={() => startEditCabinet(cab)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-300" title={t("Tahrirlash")}>
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => setConfirmDeleteCabId(cab.id)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200" title={t("O'chirish")}>
                                <Trash2 className="w-4 h-4" />
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

            <form onSubmit={handleAddCabinet} className="info-block space-y-3 pt-4 border-t border-slate-100">
              <h4 className="card-section-title">{t("Yangi shkaf")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">{t("Shkaf nomi")} *</label>
                  <input type="text" required value={cabName} onChange={(e) => setCabName(e.target.value)} placeholder={t("Masalan: 4-shkaf")} className="w-full border border-slate-300 px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="field-label">{t("Maksimal qavat")} *</label>
                  <input type="number" required min="1" max="99" value={cabMaxFloor} onChange={(e) => setCabMaxFloor(Number(e.target.value))} className="w-full border border-slate-300 px-3 py-2 rounded-lg" />
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label">{t("Joylashuv tavsifi")}</label>
                  <input type="text" value={cabDesc} onChange={(e) => setCabDesc(e.target.value)} placeholder={t("Masalan: 1-qavat, o'ng burchak")} className="w-full border border-slate-300 px-3 py-2 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary"><Plus className="w-4 h-4" /> {t("Qo'shish")}</button>
              </div>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
