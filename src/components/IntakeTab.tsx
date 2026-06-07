/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { getCategoryFlowType } from "../apiMappers.ts";
import { 
  FolderPlus, 
  UserPlus, 
  FileUp, 
  Map as MapIcon, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500";
const selectClass = `${inputClass} cursor-pointer`;
const modeBtnActive = "rounded-md bg-primary-600 text-white shadow-sm";
const modeBtnIdle = "rounded-md text-slate-600 hover:bg-white";

interface IntakeTabProps {
  onNavigateToTab: (tab: string) => void;
  onDataChange?: () => void;
}

export default function IntakeTab({ onNavigateToTab, onDataChange }: IntakeTabProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Lists for dropdown
  const [categories, setCategories] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);
  const [existingStudents, setExistingStudents] = useState<any[]>([]);
  const [existingEmployees, setExistingEmployees] = useState<any[]>([]);

  // STEP 1 Form State: Category
  const [categoryId, setCategoryId] = useState("");

  // Document Info
  const [docName, setDocName] = useState("");
  const [docDate, setDocDate] = useState("");

  // STEP 2 Form State: Student (for cat-talaba)
  const [studentMode, setStudentMode] = useState<"existing" | "new">("existing");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [studentRegId, setStudentRegId] = useState(""); // HEMIS code
  const [groupName, setGroupName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");

  // STEP 2 Form State: Employee (for cat-xodim)
  const [employeeMode, setEmployeeMode] = useState<"existing" | "new">("existing");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeMiddleName, setEmployeeMiddleName] = useState("");
  const [employeeRegId, setEmployeeRegId] = useState(""); // Tababel raqami / ID
  const [employeeDepartment, setEmployeeDepartment] = useState(""); // Kafedrasi / Bo'limi
  const [employeePosition, setEmployeePosition] = useState(""); // Lavozimi
  const [employeePhone, setEmployeePhone] = useState("");

  // STEP 3 Form State: PDF File
  const [file, setFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState("");

  // STEP 4 Form State: Placement
  const [cabinetId, setCabinetId] = useState("");
  const [floor, setFloor] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  // Load backend variables
  const loadData = async () => {
    try {
      const cats = await api.getCategories();
      const cabs = await api.getCabinets();
      setCategories(cats);
      setCabinets(cabs);

      // Load clean lists
      const [empList, stdList] = await Promise.all([
        api.getEmployees(),
        api.getStudents(),
      ]);
      setExistingEmployees(empList || []);
      setExistingStudents(stdList || []);
    } catch (err) {
      console.error("Failed to load metadata in Intake", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Base64 File encoding
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setFileError(t("Faqat PDF formatini yuklashingiz mumkin (.pdf)"));
      return;
    }

    const maxSize = 30 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setFileError(t("Fayl hajmi 30 MB dan ko'p bo'lmasligi lozim"));
      return;
    }

    setFile(selectedFile);
    setUploadProgress(10);

    const reader = new FileReader();
    reader.onloadstart = () => setUploadProgress(30);
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 60) + 30;
        setUploadProgress(pct);
      }
    };
    reader.onload = (event) => {
      setPdfBase64(event.target?.result as string);
      setUploadProgress(100);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleIntakeSubmit = async () => {
    setLoading(true);
    setGlobalError(null);

    try {
      const flowType = getCategoryFlowType(categoryId, categories);
      let personType = "none";
      let employeeId: string | undefined;
      let studentId: string | undefined;

      if (flowType === "student") {
        personType = "student";
        if (studentMode === "existing") {
          if (!selectedStudentId) {
            setGlobalError(t("Mavjud talabani tanlang!"));
            setLoading(false);
            return;
          }
          studentId = selectedStudentId;
        } else {
          if (!lastName.trim() || !firstName.trim()) {
            setGlobalError(t("Yangi talaba uchun familiya va ism kiritilishi shart"));
            setLoading(false);
            return;
          }
          const std = await api.createStudent({
            lastName: lastName.trim(),
            firstName: firstName.trim(),
            middleName: middleName.trim() || undefined,
            studentId: studentRegId.trim() || undefined,
            groupName: groupName.trim() || undefined,
          });
          studentId = std.id;
        }
      } else if (flowType === "employee") {
        personType = "employee";
        if (employeeMode === "existing") {
          if (!selectedEmployeeId) {
            setGlobalError(t("Mavjud xodimni tanlang!"));
            setLoading(false);
            return;
          }
          employeeId = selectedEmployeeId;
        } else {
          if (!employeeRegId.trim()) {
            setGlobalError(t("Xodim ID raqami majburiy"));
            setLoading(false);
            return;
          }
          const emp = await api.createEmployee({
            lastName: employeeLastName.trim(),
            firstName: employeeFirstName.trim(),
            middleName: employeeMiddleName.trim() || undefined,
            employeeId: employeeRegId.trim(),
            department: employeeDepartment.trim() || undefined,
            position: employeePosition.trim() || undefined,
            phone: employeePhone.trim() || undefined,
          });
          employeeId = emp.id;
        }
      }

      await api.createDocument({
        categoryId,
        docName: docName.trim(),
        docDate,
        cabinetId,
        floor: Number(floor),
        personType,
        employeeId,
        studentId,
        notes,
        file: file || undefined,
        pdfBase64: !file && pdfBase64 ? pdfBase64 : undefined,
        pdfFilename: file?.name || "arxiv_hujjat.pdf",
      });
      onDataChange?.();
      setSuccess(true);
    } catch (err: any) {
      setGlobalError(err.message || t("Hujjat qabul qilinishida xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  };

  // Reset complete page states
  const handleResetForm = () => {
    setStep(1);
    setSuccess(false);
    setGlobalError(null);
    setCategoryId("");
    setDocName("");
    setDocDate("");

    // Students Reset
    setSelectedStudentId("");
    setLastName("");
    setFirstName("");
    setMiddleName("");
    setStudentRegId("");
    setGroupName("");
    setBirthDate("");
    setPhone("");

    // Employees Reset
    setSelectedEmployeeId("");
    setEmployeeFirstName("");
    setEmployeeLastName("");
    setEmployeeMiddleName("");
    setEmployeeRegId("");
    setEmployeeDepartment("");
    setEmployeePosition("");
    setEmployeePhone("");

    setFile(null);
    setPdfBase64("");
    setUploadProgress(0);
    setCabinetId("");
    setFloor("");
    setNotes("");
    
    // reload background lists
    loadData();
  };

  const flowType = categoryId ? getCategoryFlowType(categoryId, categories) : "institut";

  const getPersonSummary = () => {
    if (flowType === "student") {
      if (studentMode === "existing" && selectedStudentId) {
        const st = existingStudents.find((s) => s.id === selectedStudentId);
        if (!st) return null;
        return {
          title: "Talaba ma'lumotlari",
          fields: [
            { label: "F.I.Sh.", value: `${st.lastName} ${st.firstName} ${st.middleName || ""}`.trim() },
            ...(st.studentId ? [{ label: "Talaba ID", value: st.studentId }] : []),
            ...(st.groupName ? [{ label: "Guruh", value: st.groupName }] : []),
            { label: "Hujjat nomi", value: docName.trim() },
            { label: "Hujjat sanasi", value: docDate ? new Date(docDate).toLocaleDateString("uz-UZ") : "—" },
          ],
        };
      }
      if (studentMode === "new" && lastName.trim() && firstName.trim()) {
        const fullName = `${lastName} ${firstName} ${middleName}`.trim();
        return {
          title: "Talaba ma'lumotlari",
          fields: [
            { label: "F.I.Sh.", value: fullName },
            ...(studentRegId.trim() ? [{ label: "Talaba ID", value: studentRegId.trim() }] : []),
            ...(groupName.trim() ? [{ label: "Guruh", value: groupName.trim() }] : []),
            { label: "Hujjat nomi", value: docName.trim() },
            { label: "Hujjat sanasi", value: docDate ? new Date(docDate).toLocaleDateString("uz-UZ") : "—" },
          ],
        };
      }
      return null;
    }

    if (flowType === "employee") {
      if (employeeMode === "existing" && selectedEmployeeId) {
        const emp = existingEmployees.find((e) => e.id === selectedEmployeeId);
        if (!emp) return null;
        return {
          title: "Xodim ma'lumotlari",
          fields: [
            { label: "F.I.Sh.", value: `${emp.lastName} ${emp.firstName} ${emp.middleName || ""}`.trim() },
            ...(emp.employeeId ? [{ label: "Xodim ID", value: emp.employeeId }] : []),
            ...(emp.department ? [{ label: "Bo'lim", value: emp.department }] : []),
            ...(emp.position ? [{ label: "Lavozim", value: emp.position }] : []),
            { label: "Hujjat nomi", value: docName.trim() },
            { label: "Hujjat sanasi", value: docDate ? new Date(docDate).toLocaleDateString("uz-UZ") : "—" },
          ],
        };
      }
      if (employeeMode === "new" && employeeLastName.trim() && employeeFirstName.trim()) {
        const fullName = `${employeeLastName} ${employeeFirstName} ${employeeMiddleName}`.trim();
        return {
          title: "Xodim ma'lumotlari",
          fields: [
            { label: "F.I.Sh.", value: fullName },
            ...(employeeRegId.trim() ? [{ label: "Xodim ID", value: employeeRegId.trim() }] : []),
            ...(employeeDepartment.trim() ? [{ label: "Bo'lim", value: employeeDepartment.trim() }] : []),
            ...(employeePosition.trim() ? [{ label: "Lavozim", value: employeePosition.trim() }] : []),
            { label: "Hujjat nomi", value: docName.trim() },
            { label: "Hujjat sanasi", value: docDate ? new Date(docDate).toLocaleDateString("uz-UZ") : "—" },
          ],
        };
      }
      return null;
    }

    if (flowType === "institut" && docName.trim()) {
      return {
        title: "Institut hujjati",
        fields: [
          { label: "Hujjat nomi", value: docName.trim() },
          { label: "Hujjat sanasi", value: docDate ? new Date(docDate).toLocaleDateString("uz-UZ") : "—" },
        ],
      };
    }

    return null;
  };

  const personSummary = getPersonSummary();

  const getStepRailConfig = () => {
    let secondStepLabel = "Hujjat ma'lumotlari";
    let secondStepDesc = "Nomi, raqami va chiqarilgan sanasi";
    
    if (flowType === "student") {
      secondStepLabel = "Hujjat va talaba";
      secondStepDesc = "F.I.Sh va HEMIS rekvizitlari";
    } else if (flowType === "employee") {
      secondStepLabel = "Hujjat va xodim";
      secondStepDesc = "F.I.Sh va tababel rekvizitlari";
    }

    return [
      { num: 1, label: t("Kategoriya tanlash"), icon: FolderPlus, desc: t("Soha bo'limini tanlang") },
      { num: 2, label: t(secondStepLabel), icon: UserPlus, desc: t(secondStepDesc) },
      { num: 3, label: t("PDF nusxasi"), icon: FileUp, desc: t("Maksimal hajm: 30 MB (.pdf)") },
      { num: 4, label: t("Arxiv joylashuvi"), icon: MapIcon, desc: t("Shkaf va Tokcha (Tok)") },
      { num: 5, label: t("Xulosa va saqlash"), icon: CheckCircle, desc: t("Yakuniy ma'lumotlarni tahlil qilish") }
    ];
  };

  const selectedCabinet = cabinets.find(c => c.id === cabinetId);

  // Validations per steps
  const isStepValid = () => {
    if (step === 1) return !!categoryId;
    if (step === 2) {
      if (flowType === "institut") {
        return docName.trim().length >= 2 && !!docDate;
      }
      if (flowType === "student") {
        const hasDocFields = docName.trim().length >= 2 && !!docDate;
        if (!hasDocFields) return false;
        if (studentMode === "existing") return !!selectedStudentId;
        return lastName.trim().length >= 2 && firstName.trim().length >= 2;
      }
      if (flowType === "employee") {
        const hasDocFields = docName.trim().length >= 2 && !!docDate;
        if (!hasDocFields) return false;
        if (employeeMode === "existing") return !!selectedEmployeeId;
        return employeeLastName.trim().length >= 2 && employeeFirstName.trim().length >= 2 && !!employeeRegId.trim();
      }
      return false;
    }
    if (step === 3) return !!file || !!pdfBase64;
    if (step === 4) {
      if (!cabinetId || !floor) return false;
      const cab = cabinets.find(c => c.id === cabinetId);
      if (cab) {
        const fl = Number(floor);
        return fl >= 1 && fl <= cab.maxFloor;
      }
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-8 selection:bg-primary-100 selection:text-primary-900">
      <div className="page-header">
        <h2 className="page-title">{t("Yangi Hujjat Qabul Qilish (Intake)")}</h2>
        <p className="page-subtitle">
          {t("Kompleks o'quvchi ma'lumotlari, PDF yuklash va fizik saqlash koordinatalarini ro'yxatga olish")}
        </p>
      </div>

      {success ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card mx-auto max-w-lg space-y-6 p-8 text-center"
        >
          <div className="flex justify-center">
            <CheckCircle className="h-14 w-14 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-800">{t("Hujjat qabul qilindi")}</h3>
            <p className="mx-auto max-w-sm text-sm text-slate-500">
              {t("Hujjat arxiv bazasiga saqlanib, fizik joylashuv bilan bog'landi.")}
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={handleResetForm} className="btn-secondary flex-1">
              {t("Yangi hujjat kiritish")}
            </button>
            <button type="button" onClick={() => onNavigateToTab("search")} className="btn-primary flex-1">
              {t("Qidiruv tizimiga o'tish")}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-1">
            {getStepRailConfig().map((st) => {
              const isActive = step === st.num;
              const isCompleted = step > st.num;
              return (
                <div
                  key={st.num}
                  className={`card flex items-start gap-3 p-3 transition-all ${
                    isActive
                      ? "border-primary-300 bg-primary-50 ring-1 ring-primary-200"
                      : isCompleted
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-slate-200 bg-white opacity-80"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isActive
                        ? "bg-primary-600 text-white"
                        : isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {st.num}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <span
                      className={`block text-sm font-medium leading-snug ${
                        isActive ? "text-primary-900" : isCompleted ? "text-emerald-800" : "text-slate-500"
                      }`}
                    >
                      {st.label}
                    </span>
                    <span className="block text-xs text-slate-400">{st.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card flex min-h-[420px] flex-col justify-between p-6 lg:col-span-3">
            <div>
              {globalError && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="text-plain">{globalError}</span>
                </div>
              )}

              {/* STEP 1: CATEGORY SELECTION */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="card-section-title">{t("Kategoriya tanlash")}</h3>
                    <span className="badge badge-neutral">{t("majburiy")}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <p className="field-label">{t("Kategoriyaniturni tanlang (*):")}</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {(categories.filter((c) => c.isActive !== false).length > 0
                          ? categories.filter((c) => c.isActive !== false)
                          : []
                        ).map((cat) => {
                          const isSelected = categoryId === cat.id;
                          return (
                            <div 
                              key={cat.id}
                              onClick={() => setCategoryId(cat.id)}
                              className={`flex min-h-[130px] cursor-pointer flex-col justify-between rounded-xl border-2 p-4 transition-all ${isSelected ? "border-primary-500 bg-primary-50/40 ring-2 ring-primary-200" : "border-slate-200 bg-white hover:border-primary-300"}`}
                            >
                              <div>
                                <span className="block text-sm font-semibold text-slate-800 text-plain">{t(cat.name)}</span>
                                <span className="mt-2 block text-xs leading-relaxed text-slate-500">{t(cat.description) || t("Tavsif kiritilmagan")}</span>
                              </div>
                              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="text-xs text-slate-400">{isSelected ? t("Tanlangan") : t("Tanlash")}</span>
                                <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${isSelected ? "border-primary-600 bg-primary-600" : "border-slate-300"}`}>
                                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: CATEGORY SPECIFIC METADATA */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  
                  {/* Category = Institut yoki Talaba */}
                  {(flowType === "institut" || flowType === "student") && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="card-section-title">
                          {flowType === "student"
                            ? t("Hujjat va talaba ma'lumotlari")
                            : t("Hujjat ma'lumotlari")}
                        </h3>
                        <span className="badge badge-neutral">{t("majburiy")}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="field-label">{t("Hujjat nomi yoki raqamini kiriting (*)")}</label>
                          <input
                            type="text"
                            required
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder={t("Masalan: Bo'yruq № 312 yoki Nizom")}
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="field-label">{t("Chiqarilgan sanasi")} (*)</label>
                          <input
                            type="date"
                            required
                            value={docDate}
                            onChange={(e) => setDocDate(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {flowType === "student" && (
                        <div className="space-y-4 border-t border-slate-100 pt-4">
                          <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() => setStudentMode("existing")}
                              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${studentMode === "existing" ? modeBtnActive : modeBtnIdle}`}
                            >
                              <Users className="h-3.5 w-3.5" /> {t("Mavjud talabani tanlash")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentMode("new")}
                              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${studentMode === "new" ? modeBtnActive : modeBtnIdle}`}
                            >
                              <UserPlus className="h-3.5 w-3.5" /> {t("Yangi talaba qo'shish")}
                            </button>
                          </div>

                          {studentMode === "existing" ? (
                            <div>
                              <label className="field-label">{t("Arxivdagi talabalar ro'yxatidan tanlang (*)")}</label>
                              <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className={selectClass}
                              >
                                <option value="">{t("-- Talabani tanlang --")}</option>
                                {existingStudents.map((std) => (
                                  <option key={std.id} value={std.id}>
                                    {std.lastName} {std.firstName} {std.middleName || ""} — {std.studentId || t("ID yo'q")} — {std.groupName || t("Guruh yo'q")}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-2">
                              <div>
                                <label className="field-label">{t("Familiyasi (*)")}</label>
                                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
                              </div>
                              <div>
                                <label className="field-label">{t("Ismi (*)")}</label>
                                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                              </div>
                              <div>
                                <label className="field-label">{t("Otasining ismi")}</label>
                                <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={inputClass} />
                              </div>
                              <div>
                                <label className="field-label">{t("Student ID (HEMIS)")}</label>
                                <input type="text" value={studentRegId} onChange={(e) => setStudentRegId(e.target.value)} className={inputClass} />
                              </div>
                              <div className="md:col-span-2">
                                <label className="field-label">{t("Akademik guruh")}</label>
                                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className={inputClass} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category = Xodim */}
                  {flowType === "employee" && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="card-section-title">{t("Hujjat va xodim ma'lumotlari")}</h3>
                        <span className="badge badge-neutral">{t("majburiy")}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => setEmployeeMode("existing")}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${employeeMode === "existing" ? modeBtnActive : modeBtnIdle}`}
                        >
                          <Users className="h-3.5 w-3.5" /> {t("Mavjud xodimni qidirish")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmployeeMode("new")}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${employeeMode === "new" ? modeBtnActive : modeBtnIdle}`}
                        >
                          <UserPlus className="h-3.5 w-3.5" /> {t("Yangi xodim qo'shish")}
                        </button>
                      </div>

                      {employeeMode === "existing" ? (
                        <div>
                          <label className="field-label">{t("Arxivdagi xodimlar ro'yxatidan tanlang (*)")}</label>
                          <select
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className={selectClass}
                          >
                            <option value="">{t("-- Xodimni tanlang --")}</option>
                            {existingEmployees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.lastName} {emp.firstName} {emp.middleName || ""} - Kafedra: {emp.department || "N/A"} &middot; Lavozim: {emp.position || "N/A"} &middot; ID: {emp.employeeId || "N/A"}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        /* New Employee Form */
                        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-2">
                          <div className="md:col-span-2 text-sm font-medium text-slate-700">
                            {t("Yangi xodim ma'lumotlari:")}
                          </div>
                          <div>
                            <label className="field-label">{t("Familiyasi (*)")}</label>
                            <input
                              type="text"
                              value={employeeLastName}
                              onChange={(e) => setEmployeeLastName(e.target.value)}
                              placeholder={t("Familiyasi")}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="field-label">{t("Ismi (*)")}</label>
                            <input
                              type="text"
                              value={employeeFirstName}
                              onChange={(e) => setEmployeeFirstName(e.target.value)}
                              placeholder={t("Ismi")}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="field-label">{t("Otasining ismi")}</label>
                            <input
                              type="text"
                              value={employeeMiddleName}
                              onChange={(e) => setEmployeeMiddleName(e.target.value)}
                              placeholder={t("Otasining ismi")}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="field-label">{t("Tababel raqami / ID")}</label>
                            <input
                              type="text"
                              value={employeeRegId}
                              onChange={(e) => setEmployeeRegId(e.target.value)}
                              placeholder={t("Masalan: T-4190")}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="field-label">{t("Kafedrasi / Bo'limi")}</label>
                            <input
                              type="text"
                              value={employeeDepartment}
                              onChange={(e) => setEmployeeDepartment(e.target.value)}
                              placeholder={t("Fizika kafedrasi")}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="field-label">{t("Lavozimi")}</label>
                            <input
                              type="text"
                              value={employeePosition}
                              onChange={(e) => setEmployeePosition(e.target.value)}
                              placeholder={t("Katta o'qituvchi")}
                              className={inputClass}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="field-label">{t("Telefon raqami")}</label>
                            <input
                              type="text"
                              value={employeePhone}
                              onChange={(e) => setEmployeePhone(e.target.value)}
                              placeholder="+998 90..."
                              className={`${inputClass} font-mono-normal`}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4">
                        <div>
                          <label className="field-label">{t("Hujjat nomi yoki raqamini kiriting (*)")}</label>
                          <input
                            type="text"
                            required
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder={t("Hujjat nomi yoki uning tartib raqami")}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="field-label">{t("Chiqarilgan sanasi")} (*)</label>
                          <input
                            type="date"
                            required
                            value={docDate}
                            onChange={(e) => setDocDate(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}

              {/* STEP 3: PDF FILE UPLOAD */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="card-section-title">{t("PDF nusxasi yuklash")}</h3>
                    <span className="badge badge-neutral">{t("majburiy")}</span>
                  </div>

                  {fileError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{t(fileError)}</p>
                  )}

                  <div className="space-y-4">
                    <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all hover:border-primary-400 hover:bg-primary-50/30">
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title={t("Hujjatni bu yerga bosing yoki sudrab keling")}
                      />
                      <div className="space-y-2">
                        <FileUp className="mx-auto h-10 w-10 text-primary-500" />
                        <p className="text-sm font-medium text-slate-800">{t("Faylni tanlash yoki sudrab yuklash")}</p>
                        <p className="text-xs text-slate-500">{t("Faqat .pdf formatida, maksimal 30 MB")}</p>
                      </div>
                    </div>

                    {file && (
                      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="max-w-xs truncate font-medium text-slate-800">{file.name}</span>
                          <span className="text-primary-600 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-primary-600 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          {uploadProgress === 100 ? t("Tayyor (Base64 tayyorlangan)") : t("Bajarilmoqda...")}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: PLACEMENT MAP */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="card-section-title">{t("Arxiv joylashuvi")}</h3>
                    <span className="badge badge-neutral">{t("majburiy")}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="field-label">{t("Arxiv Shkafi (*)")}</label>
                      <select
                        value={cabinetId}
                        onChange={(e) => { setCabinetId(e.target.value); setFloor(""); }}
                        className={selectClass}
                      >
                        <option value="">{t("-- Shkafni tanlang --")}</option>
                        {cabinets.filter((c) => c.isActive !== false).map((cab) => (
                           <option key={cab.id} value={cab.id}>{cab.name} — {t("Maks.")} {cab.maxFloor} {t("qavat")}</option>
                        ))}
                      </select>
                      {selectedCabinet && (
                        <p className="mt-1 text-xs text-slate-500">
                          {t("Tavsif:")} {t(selectedCabinet.description) || "—"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="field-label">{t("Qavat raqami")} (*)</label>
                      <input
                        type="number"
                        min="1"
                        max={selectedCabinet ? selectedCabinet.maxFloor : "99"}
                        value={floor}
                        onChange={(e) => setFloor(e.target.value === "" ? "" : Number(e.target.value))}
                        disabled={!cabinetId}
                        placeholder={selectedCabinet ? `${t("1 va")} ${selectedCabinet.maxFloor} ${t("oralig'ida")}` : t("Avvalo shkaf tanlang")}
                        className={`${inputClass} font-mono-normal disabled:bg-slate-50`}
                      />
                      {selectedCabinet && (
                        <p className="mt-1 text-xs text-primary-600">
                          {t(selectedCabinet.name)}, {floor || "—"}-{t("qavat")}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="field-label">{t("Shkafdagi aniq joylashuv izohi (Ixtiyoriy)")}</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("Masalan: chap bo'lim orqa tomondagi ko'k jildli tezis jurnali")}
                        rows={3}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </motion.div>
              )}              {/* STEP 5: FINAL COMPLETE CONFIRMATION SUMMARY */}
              {step === 5 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <h3 className="card-section-title">{t("Yakuniy xulosa — saqlashdan oldin tekshiring")}</h3>

                  <div className="card divide-y divide-slate-100 overflow-hidden">
                    {personSummary && (
                      <div className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-800">{t(personSummary.title)}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {personSummary.fields.map((field) => (
                            <div key={field.label}>
                              <span className="field-label !mb-0">{t(field.label)}</span>
                              <span className="text-plain font-medium text-slate-800">{field.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="field-label !mb-0">{t("Kategoriya")}</span>
                        <span className="text-plain">{categories.find(c => c.id === categoryId)?.name || "—"}</span>
                      </div>
                      <div>
                        <span className="field-label !mb-0">{t("PDF fayl")}</span>
                        <span className="text-plain text-slate-700 truncate block">{file?.name || "—"}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-primary-900 text-white rounded-b-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-indigo-200 text-xs">{t("Shkaf")}</span>
                          <div className="font-semibold text-plain">{selectedCabinet?.name || "—"}</div>
                        </div>
                        <div>
                          <span className="text-indigo-200 text-xs">{t("Qavat")}</span>
                          <div className="font-semibold text-emerald-300">{floor}-{t("qavat")}</div>
                        </div>
                        {notes && (
                          <div className="col-span-2 border-t border-indigo-800 pt-2">
                            <span className="text-indigo-200 text-xs">{t("Izoh")}</span>
                            <p className="text-indigo-100 text-plain">{notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="sticky bottom-0 flex justify-between gap-3 border-t border-slate-100 bg-white pt-4">
              <button
                type="button"
                disabled={step === 1 || loading}
                onClick={() => setStep(step - 1)}
                className="btn-secondary disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> {t("Orqaga")}
              </button>

              {step < 5 ? (
                <button
                  type="button"
                  disabled={!isStepValid()}
                  onClick={() => setStep(step + 1)}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("Keyingisi")} <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleIntakeSubmit}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t("Qabul qilinmoqda...")}
                    </>
                  ) : (
                    t("Arxivga Saqlash")
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
