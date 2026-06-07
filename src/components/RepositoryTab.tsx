/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api, fetchDocumentPdf } from "../api.js";
import { DocumentStatus, UserRole } from "../types.js";
import { 
  FileText, 
  Trash2, 
  Edit3, 
  Eye, 
  MapPin, 
  RotateCcw, 
  AlertTriangle, 
  Check, 
  X,
  FileDown,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";
import { getCategoryFlowType } from "../apiMappers.ts";
import { getDocumentPersonLabel, getStatusStyle } from "../utils/format.ts";

const editInputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500";

interface RepositoryTabProps {
  currentUser: any;
  dataRevision?: number;
  onDataChange?: () => void;
}

export default function RepositoryTab({ currentUser, dataRevision = 0, onDataChange }: RepositoryTabProps) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering lists
  const [categories, setCategories] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);

  // Selected for View Details
  const [inspectDoc, setInspectDoc] = useState<any>(null);
  // Selected for Edit Details
  const [editDoc, setEditDoc] = useState<any>(null);
  // Confirm Delete Doc ID
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit fields states
  const [editStatus, setEditStatus] = useState<DocumentStatus>(DocumentStatus.JOYIDA);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCabinetId, setEditCabinetId] = useState("");
  const [editFloor, setEditFloor] = useState<number>(1);
  const [editDocName, setEditDocName] = useState("");
  const [editDocDate, setEditDocDate] = useState("");
  const [editStudentId, setEditStudentId] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFileBase64, setEditFileBase64] = useState("");
  const [editFileError, setEditFileError] = useState("");
  const [statusNotesAdd, setStatusNotesAdd] = useState(""); // notes when given out ("Kimga berildi" details)

  const loadRepository = async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const res = await api.getDocuments({ limit: 100 });
      setDocuments(res.documents);
    } catch (err: any) {
      setError(err.message || t("Arxiv ro'yxatini yuklashda xatolik yuz berdi"));
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrapData = async () => {
      try {
        const catData = await api.getCategories();
        const cabData = await api.getCabinets();
        setCategories(catData);
        setCabinets(cabData);
      } catch (err) {
        console.error("Spravochnik load errors in repository", err);
      }
    };
    bootstrapData();
    loadRepository();
  }, []);

  useEffect(() => {
    if (dataRevision > 0) {
      loadRepository(true);
    }
  }, [dataRevision]);

  // Populate Edit Fields on select
  const handleOpenEdit = async (doc: any) => {
    const person = getDocumentPersonLabel(doc);
    setEditDoc(doc);
    setEditStatus(doc.status);
    setEditCategoryId(doc.categoryId);
    setEditCabinetId(doc.cabinetId);
    setEditFloor(doc.floor);
    setEditDocName(doc.docName || (person.type === "institut" ? person.name : "") || "");
    setEditDocDate(doc.docDate || "");
    setEditStudentId(doc.studentId || doc.student?.id || "");
    setEditEmployeeId(doc.employeeId || doc.employee?.id || "");
    setEditNotes(doc.notes || "");
    setStatusNotesAdd("");
    setEditFile(null);
    setEditFileBase64("");
    setEditFileError("");

    try {
      const [stds, emps] = await Promise.all([api.getStudents(), api.getEmployees()]);
      setStudents(stds);
      setEmployees(emps);
    } catch (err) {
      console.error("Person lists load error", err);
    }
  };

  // Convert File to Base64 (PDF replacer)
  const handleReplacementFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFileError("");
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      setEditFileError(t("Faqat PDF yuklash ruxsat etiladi"));
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      setEditFileError(t("Kattalik cheklovi: maks 20 MB"));
      return;
    }

    setEditFile(selected);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditFileBase64(ev.target?.result as string);
    };
    reader.readAsDataURL(selected);
  };

  // Submit Edit changes
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDoc) return;

    setLoading(true);
    try {
      let finalNotes = editNotes;
      if (editStatus === DocumentStatus.BERILGAN && statusNotesAdd.trim()) {
        finalNotes = `${editNotes}\n[Qabul: Kimga berildi: ${statusNotesAdd.trim()} - Sana: ${new Date().toLocaleDateString()}]`;
      }

      const flowType = getCategoryFlowType(editCategoryId, categories);
      let personType = "none";
      let studentId: string | null = null;
      let employeeId: string | null = null;

      if (!editDocName.trim()) {
        alert(t("Hujjat nomi yoki raqamini kiriting"));
        setLoading(false);
        return;
      }

      if (flowType === "student") {
        personType = "student";
        if (!editStudentId) {
          alert(t("Mavjud talabani tanlang!"));
          setLoading(false);
          return;
        }
        studentId = editStudentId;
      } else if (flowType === "employee") {
        personType = "employee";
        if (!editEmployeeId) {
          alert(t("Mavjud xodimni tanlang!"));
          setLoading(false);
          return;
        }
        employeeId = editEmployeeId;
      }

      const payload: any = {
        status: editStatus,
        categoryId: editCategoryId,
        cabinetId: editCabinetId,
        floor: Number(editFloor),
        docName: editDocName.trim(),
        docDate: editDocDate,
        personType,
        studentId,
        employeeId,
        notes: finalNotes,
      };

      if (editFileBase64) {
        payload.pdfBase64 = editFileBase64;
        payload.pdfFilename = editFile?.name || "arxiv_hujjat.pdf";
      }

      await api.updateDocument(editDoc.id, payload);
      onDataChange?.();
      setEditDoc(null);
    } catch (err: any) {
      alert(err.message || "Tahrirlashni saqlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Delete Action
  const handleDeleteDoc = async (id: string) => {
    setLoading(true);
    try {
      await api.deleteDocument(id);
      onDataChange?.();
      setConfirmDeleteId(null);
      setInspectDoc(null);
    } catch (err: any) {
      alert(err.message || t("O'chirishda muammo sodir bo'ldi"));
    } finally {
      setLoading(false);
    }
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
      alert(t("Hujjatni yuklab olishda xatolik yuz berdi:") + " " + err.message);
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
      alert(t("Chop etishda xatolik yuz berdi:") + " " + err.message);
    }
  };

  const selectedCabinetsMaxFloors = cabinets.find(c => c.id === editCabinetId)?.maxFloor || 9;
  const editFlowType = editCategoryId ? getCategoryFlowType(editCategoryId, categories) : "institut";

  return (
    <div className="space-y-6 selection:bg-primary-100 selection:text-primary-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl page-title">
          {t("Hujjatlar Ombori (Inventarizatsiya)")}
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {t("Faol hujjatlarni tahrirlash, holatini o'zgartirish, elektron PDF almashtirish va o'chirish boshqaruvi")}
        </p>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700 text-plain">
          {error}
          <button onClick={loadRepository} className="ml-3 underline">{t("Qayta yuklash")}</button>
        </div>
      )}

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
              <th className="py-2.5 px-3">{t("Joylashuv")}</th>
              <th className="py-2.5 px-3">{t("Holat")}</th>
              <th className="py-2.5 px-3">{t("Qabul sanasi")}</th>
              <th className="py-2.5 px-3 text-right">{t("Amallar")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-500">{t("Ma'lumotlar yuklanmoqda...")}</td>
              </tr>
            ) : documents.map((doc) => {
              const person = getDocumentPersonLabel(doc);
              return (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="align-middle">
                      <div className="font-medium text-slate-800 text-plain">{person.name}</div>
                      <div className="text-xs text-slate-500 text-plain">{person.subtitle}</div>
                    </td>
                    <td className="align-middle text-slate-600">{doc.category?.name || "—"}</td>
                    <td className="align-middle text-plain">
                      {doc.cabinet?.name || doc.cabinetId} · {doc.floor}-{t("qavat")}
                    </td>
                    <td className="align-middle">
                      <span className={getStatusStyle(doc.status)}>{t(doc.status)}</span>
                    </td>
                    <td className="align-middle text-slate-500">
                      {doc.receivedAt ? new Date(doc.receivedAt).toLocaleDateString("uz-UZ") : "—"}
                    </td>
                    <td className="align-middle text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => setInspectDoc(doc)}
                          className="p-1 px-1.5 border border-neutral-300 hover:border-slate-200 text-[11px] font-medium tracking-wider flex items-center gap-1 cursor-pointer hover:bg-neutral-50 text-slate-800 font-semibold"
                        >
                          <Eye className="w-3 h-3" /> {t("Ko'rish")}
                        </button>
                        {currentUser?.role !== UserRole.VIEWER && (
                          <button 
                            onClick={() => handleOpenEdit(doc)}
                            className="p-1 px-1.5 border border-slate-200 bg-primary-600 text-white hover:bg-primary-700 text-[11px] font-medium tracking-wider flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Edit3 className="w-3 h-3" /> {t("Tahrirlash")}
                          </button>
                        )}
                        {currentUser?.role === UserRole.ADMIN && (
                          <button 
                            onClick={() => setConfirmDeleteId(doc.id)}
                            className="p-1 px-1.5 border border-red-600 text-red-600 hover:bg-red-50 text-[11px] font-medium tracking-wider flex items-center gap-1 cursor-pointer font-bold"
                            title={t("O'chirish (Soft delete)")}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
              );
            })}
            {!loading && documents.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  {t("Hujjatlar topilmadi.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* INSPECT PREVIEW DRAWER */}
      <AnimatePresence>
        {inspectDoc && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setInspectDoc(null)} className="fixed inset-0 bg-black z-45" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween" }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white border-l-2 border-slate-200 z-50 p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-xs font-medium font-bold bg-neutral-100 text-slate-800 border border-neutral-300 px-2 py-0.5">
                      {t("Ombor Kartasi:")} {inspectDoc.id}
                    </span>
                    <h3 className="text-lg text-lg font-semibold text-slate-800 tracking-tight mt-1">{t("Hujjat Rekvizitlari")}</h3>
                  </div>
                  <button onClick={() => setInspectDoc(null)} className="p-1 border border-slate-200 hover:bg-neutral-50 text-slate-800 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  {/* Location card */}
                  <div className="border border-slate-200 p-3 bg-neutral-50 flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-800" />
                    <div>
                      <span className="block text-[8px] font-mono text-neutral-400 uppercase font-semibold">{t("Tahrirlangan joriy koordinata:")}</span>
                      <strong className="font-mono text-xs text-slate-800 uppercase">{t(inspectDoc.cabinet?.name)}, {inspectDoc.floor}-{t("qavat")}</strong>
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
                        <span className="font-mono font-semibold text-slate-800">{new Date(inspectDoc.receivedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-semibold block text-neutral-500">{t("Muvofiqlik izohlari:")}</span>
                    <p className="p-2.5 bg-neutral-50 border border-neutral-200 font-mono text-neutral-600 leading-normal text-[11px] whitespace-pre-wrap rounded">
                      {inspectDoc.notes || t("Hech qanday zaxira izohlar mavjud emas")}
                    </p>
                  </div>

                  {/* Attachment container */}
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
                          className="p-1 px-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium tracking-wider flex items-center gap-1 font-bold cursor-pointer rounded transition-all"
                        >
                          <FileDown className="w-3 h-3" /> {t("yuklash")}
                        </button>
                        <button 
                          type="button"
                          onClick={() => handlePrintPdf(inspectDoc)} 
                          className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium tracking-wider flex items-center gap-1 font-bold cursor-pointer rounded transition-all"
                        >
                          <Printer className="w-3 h-3" /> {t("Chop etish")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 flex gap-2">
                {currentUser?.role !== UserRole.VIEWER && (
                <button 
                  onClick={() => { setInspectDoc(null); handleOpenEdit(inspectDoc); }}
                  className="btn-secondary flex-1"
                >
                  {t("Tahrirlashga o'tish")}
                </button>
                )}
                <button onClick={() => setInspectDoc(null)} className="px-4 py-2 bg-primary-600 text-white font-mono text-xs uppercase tracking-wider font-bold flex-1">
                  {t("Yopish")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT MODAL DIALOG */}
      <AnimatePresence>
        {editDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <div className="modal-backdrop" onClick={() => setEditDoc(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-panel max-w-xl p-6"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                <h3 className="text-base font-semibold text-slate-800">
                  {t("Hujjat rekvizitlarini tahrirlash")}
                </h3>
                <button type="button" onClick={() => setEditDoc(null)} className="btn-secondary !p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="field-label">{t("Hujjat nomi yoki raqamini kiriting (*)")}</label>
                    <input
                      type="text"
                      required
                      value={editDocName}
                      onChange={(e) => setEditDocName(e.target.value)}
                      placeholder={t("Masalan: Bo'yruq № 312 yoki Nizom")}
                      className={editInputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label">{t("Chiqarilgan sanasi")}</label>
                    <input
                      type="date"
                      value={editDocDate}
                      onChange={(e) => setEditDocDate(e.target.value)}
                      className={editInputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">{t("Hujjat Kategoriyasi (*)")}</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => {
                      setEditCategoryId(e.target.value);
                      const nextFlow = getCategoryFlowType(e.target.value, categories);
                      if (nextFlow !== "student") setEditStudentId("");
                      if (nextFlow !== "employee") setEditEmployeeId("");
                    }}
                    className={editInputClass}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{t(c.name)}</option>
                    ))}
                  </select>
                </div>

                {editFlowType === "student" && (
                  <div>
                    <label className="field-label">{t("Arxivdagi talabalar ro'yxatidan tanlang (*)")}</label>
                    <select
                      required
                      value={editStudentId}
                      onChange={(e) => setEditStudentId(e.target.value)}
                      className={editInputClass}
                    >
                      <option value="">{t("-- Talabani tanlang --")}</option>
                      {students.map((std) => (
                        <option key={std.id} value={std.id}>
                          {std.lastName} {std.firstName} {std.middleName || ""} — {std.studentId || t("ID yo'q")} — {std.groupName || t("Guruh yo'q")}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editFlowType === "employee" && (
                  <div>
                    <label className="field-label">{t("Arxivdagi xodimlar ro'yxatidan tanlang (*)")}</label>
                    <select
                      required
                      value={editEmployeeId}
                      onChange={(e) => setEditEmployeeId(e.target.value)}
                      className={editInputClass}
                    >
                      <option value="">{t("-- Xodimni tanlang --")}</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.lastName} {emp.firstName} {emp.middleName || ""} — {emp.employeeId || t("ID yo'q")}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="field-label">{t("Hujjat Holati (*)")}</label>
                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                    {["Joyida", "Berilgan", "Yo'q qilingan"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditStatus(st as DocumentStatus)}
                        className={`rounded-md py-2 text-xs font-medium ${editStatus === st ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-white"}`}
                      >
                        {t(st)}
                      </button>
                    ))}
                  </div>
                </div>

                {editStatus === DocumentStatus.BERILGAN && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <label className="field-label">{t("Kimga va nima maqsadda chiqarilgan? (*)")}</label>
                    <input
                      type="text"
                      required
                      value={statusNotesAdd}
                      onChange={(e) => setStatusNotesAdd(e.target.value)}
                      placeholder={t("Masalan: Dekanat boshlig'i Soliyevga vaqtinchalik reyting uchun")}
                      className={editInputClass}
                    />
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">{t("Fizik Shkaf (*)")}</label>
                    <select
                      value={editCabinetId}
                      onChange={(e) => { setEditCabinetId(e.target.value); setEditFloor(1); }}
                      className={editInputClass}
                    >
                      {cabinets.map((cab) => (
                        <option key={cab.id} value={cab.id}>{t(cab.name)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">
                      {t("Tokcha (Qavat:")} 1-{selectedCabinetsMaxFloors}) (*)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedCabinetsMaxFloors}
                      value={editFloor}
                      onChange={(e) => setEditFloor(Number(e.target.value))}
                      className={`${editInputClass} font-mono-normal`}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">{t("Batafsil izoh & ko'rsatmalar")}</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className={editInputClass}
                  />
                </div>

                {/* 5. PDF replacement file */}
                <div className="border border-dashed border-neutral-400 p-3 bg-neutral-50 space-y-2">
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                    {t("Elektron PDF faylini almashtirish (Ixtiyoriy)")}
                  </label>
                  {editFileError && <p className="text-[10px] text-slate-800 font-bold mb-1">{t(editFileError)}</p>}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleReplacementFile}
                    className="block w-full text-xs font-mono"
                  />
                  {editFile && (
                    <p className="text-[10px] text-slate-800 bg-white p-1 border font-mono">
                      {t("Yangi fayl:")} {editFile.name} ({(editFile.size/1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                  <button type="button" onClick={() => setEditDoc(null)} className="btn-secondary">
                    {t("Bekor qilish")}
                  </button>
                  <button type="submit" className="btn-primary">
                    {t("O'zgarishlarni Saqlash")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE DIALOG */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <div className="modal-backdrop" onClick={() => setConfirmDeleteId(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-panel max-w-sm p-6 text-center space-y-4"
            >
              <div className="flex justify-center">
                <AlertTriangle className="w-10 h-10 text-neutral-900" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-slate-800 uppercase text-sm tracking-wide">{t("HUJJATNI O'CHIRISH!")}</h4>
                <p className="text-xs text-neutral-500 leading-normal">
                  {t("Chindan ham ushbu hujjat yozuvini arxiv bazasidan o'chirmoqchimisiz? Ushbu amaldan so'ng hujjat asosi faqat tahliliy soft-delete loglarida saqlab qolinadi.")}
                </p>
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2 border border-neutral-400 hover:border-slate-200 text-xs font-medium font-bold cursor-pointer"
                >
                  {t("Bekor qilish")}
                </button>
                <button
                  onClick={() => handleDeleteDoc(confirmDeleteId)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 text-xs font-medium font-bold cursor-pointer"
                >
                  {t("Ha, o'chirilsin")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
