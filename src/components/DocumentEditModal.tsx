/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { api } from "../api.js";
import { getCategoryFlowType } from "../apiMappers.ts";
import { DocumentStatus } from "../types.js";
import { useTranslation } from "./LanguageContext.tsx";
import { getDocumentPersonLabel } from "../utils/format.ts";

const editInputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500";

interface DocumentEditModalProps {
  doc: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function DocumentEditModal({ doc, onClose, onSaved }: DocumentEditModalProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [editStatus, setEditStatus] = useState<DocumentStatus>(DocumentStatus.JOYIDA);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCabinetId, setEditCabinetId] = useState("");
  const [editFloor, setEditFloor] = useState<number>(1);
  const [editDocName, setEditDocName] = useState("");
  const [editDocDate, setEditDocDate] = useState("");
  const [editStudentId, setEditStudentId] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFileBase64, setEditFileBase64] = useState("");
  const [editFileError, setEditFileError] = useState("");
  const [statusNotesAdd, setStatusNotesAdd] = useState("");

  useEffect(() => {
    const person = getDocumentPersonLabel(doc);
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

    const load = async () => {
      try {
        const [cats, cabs, stds, emps] = await Promise.all([
          api.getCategories(),
          api.getCabinets(),
          api.getStudents(),
          api.getEmployees(),
        ]);
        setCategories(cats);
        setCabinets(cabs);
        setStudents(stds);
        setEmployees(emps);
      } catch (err) {
        console.error("DocumentEditModal load error", err);
      }
    };
    load();
  }, [doc]);

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

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
        setSaving(false);
        return;
      }

      if (flowType === "student") {
        personType = "student";
        if (!editStudentId) {
          alert(t("Mavjud talabani tanlang!"));
          setSaving(false);
          return;
        }
        studentId = editStudentId;
      } else if (flowType === "employee") {
        personType = "employee";
        if (!editEmployeeId) {
          alert(t("Mavjud xodimni tanlang!"));
          setSaving(false);
          return;
        }
        employeeId = editEmployeeId;
      }

      const payload: Record<string, unknown> = {
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

      await api.updateDocument(doc.id, payload);
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || t("Tahrirlashni saqlashda xatolik yuz berdi"));
    } finally {
      setSaving(false);
    }
  };

  const selectedCabinetsMaxFloors = cabinets.find((c) => c.id === editCabinetId)?.maxFloor || 9;
  const editFlowType = editCategoryId ? getCategoryFlowType(editCategoryId, categories) : "institut";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
    >
      <div className="modal-backdrop" onClick={onClose} />
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
          <button type="button" onClick={onClose} className="btn-secondary !p-1.5">
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
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label className="field-label">{t("Kimga va nima maqsadda chiqarilgan? (*)")}</label>
              <input
                type="text"
                required
                value={statusNotesAdd}
                onChange={(e) => setStatusNotesAdd(e.target.value)}
                placeholder={t("Masalan: Dekanat boshlig'i Soliyevga vaqtinchalik reyting uchun")}
                className={editInputClass}
              />
            </div>
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
                {t("Yangi fayl:")} {editFile.name} ({(editFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              {t("Bekor qilish")}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? t("Saqlanmoqda...") : t("O'zgarishlarni Saqlash")}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
