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
  Plus, 
  AlertTriangle,
  Users,
  Eye
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";

interface IntakeTabProps {
  onNavigateToTab: (tab: string) => void;
}

export default function IntakeTab({ onNavigateToTab }: IntakeTabProps) {
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
      const empList = await api.getEmployees();
      setExistingEmployees(empList || []);
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

      if (flowType === "employee") {
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
        docName,
        docDate,
        cabinetId,
        floor: Number(floor),
        personType,
        employeeId,
        notes,
        file,
        pdfBase64: pdfBase64 || undefined,
        pdfFilename: file?.name || "arxiv_hujjat.pdf",
      });
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
    if (flowType === "employee") {
      if (employeeMode === "existing" && selectedEmployeeId) {
        const emp = existingEmployees.find((e) => e.id === selectedEmployeeId);
        if (!emp) return null;
        return {
          title: "Hujjat kiritiladigan xodim:",
          fields: [
            { label: "XODIM F.I.Sh:", value: `${emp.lastName} ${emp.firstName} ${emp.middleName || ""}`.trim() },
            ...(emp.employeeId ? [{ label: "Xodim ID:", value: emp.employeeId }] : []),
            ...(emp.department ? [{ label: "Kafedrasi / Bo'limi", value: emp.department }] : []),
            ...(emp.position ? [{ label: "Lavozimi:", value: emp.position }] : []),
          ],
        };
      }
      if (employeeMode === "new" && employeeLastName.trim() && employeeFirstName.trim()) {
        const fullName = `${employeeLastName} ${employeeFirstName} ${employeeMiddleName}`.trim();
        return {
          title: "Hujjat kiritiladigan xodim:",
          fields: [
            { label: "XODIM F.I.Sh:", value: fullName },
            ...(employeeRegId.trim() ? [{ label: "Xodim ID:", value: employeeRegId.trim() }] : []),
            ...(employeeDepartment.trim() ? [{ label: "Kafedrasi / Bo'limi", value: employeeDepartment.trim() }] : []),
            ...(employeePosition.trim() ? [{ label: "Lavozimi:", value: employeePosition.trim() }] : []),
          ],
        };
      }
      return null;
    }

    return null;
  };

  const personSummary = getPersonSummary();

  const getStepRailConfig = () => {
    let secondStepLabel = "Hujjat ma'lumotlari";
    let secondStepDesc = "Nomi, raqami va chiqarilgan sanasi";
    
    if (flowType === "employee") {
      secondStepLabel = "Hujjat va xodim";
      secondStepDesc = "F.I.Sh va tababel rekvizitlari";
    }

    return [
      { num: 1, label: t("Kategoriya tanlash"), icon: FolderPlus, desc: t("Soha bo'limini tanlang") },
      { num: 2, label: t(secondStepLabel), icon: UserPlus, desc: t(secondStepDesc) },
      { num: 3, label: t("PDF nusxasi"), icon: FileUp, desc: t("Maksimal hajm: 20 MB (.pdf)") },
      { num: 4, label: t("Arxiv joylashuvi"), icon: MapIcon, desc: t("Shkaf va Tokcha (Tok)") },
      { num: 5, label: t("Xulosa va saqlash"), icon: CheckCircle, desc: t("Yakuniy ma'lumotlarni tahlil qilish") }
    ];
  };

  const selectedCabinet = cabinets.find(c => c.id === cabinetId);

  // Validations per steps
  const isStepValid = () => {
    if (step === 1) return !!categoryId;
    if (step === 2) {
      if (flowType === "institut" || flowType === "student") {
        return docName.trim().length >= 2 && !!docDate;
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
    <div className="space-y-6 selection:bg-primary-600 selection:text-white">
      {/* Header */}
      <div className="border-b border-primary-100 pb-4">
        <h2 className="text-xl page-title">
          {t("Yangi Hujjat Qabul Qilish (Intake)")}
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {t("Kompleks o'quvchi ma'lumotlari, PDF yuklash va fizik saqlash koordinatalarini ro'yxatga olish")}
        </p>
      </div>

      {success ? (
        /* Success Screen */
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl mx-auto border border-primary-100 p-8 text-center space-y-6 bg-white rounded-2xl shadow-xl shadow-indigo-100/10"
        >
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl page-title">HUJJAT QABUL QILINDI!</h3>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
              Hujjat arxiv bazasiga muvaffaqiyatli saqlanib, fizik saqlash joylashuvi koordinatalariga bog'landi.
            </p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleResetForm}
              className="flex-1 border border-indigo-200 bg-white hover:bg-indigo-50/20 text-indigo-700 py-3 px-4 font-mono text-xs uppercase font-bold text-center tracking-wider rounded-lg transition-all cursor-pointer"
            >
              {t("Yangi hujjat kiritish")}
            </button>
            <button
              onClick={() => onNavigateToTab("search")}
              className="flex-1 bg-primary-600 text-white hover:bg-primary-700 py-3 px-4 font-mono text-xs uppercase font-bold text-center tracking-wider rounded-lg transition-all shadow-md shadow-indigo-100/40 cursor-pointer"
            >
              {t("Qidiruv tizimiga o'tish")}
            </button>
          </div>
        </motion.div>
      ) : (
        /* Intake multi-step form */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* STAGES SIDE RAILS */}
          <div className="lg:col-span-1 space-y-2.5">
            {getStepRailConfig().map((st) => {
              const Icon = st.icon;
              const isActive = step === st.num;
              const isCompleted = step > st.num;
              return (
                <div 
                  key={st.num}
                  className={`border p-3 flex items-start gap-3 transition-all rounded-lg ${isActive ? 'border-primary-600 bg-primary-600 text-white shadow-md shadow-indigo-100/50' : isCompleted ? 'border-emerald-100 bg-emerald-50/30 text-emerald-700' : 'border-neutral-200 bg-white text-neutral-400'}`}
                >
                  <div className={`w-6 h-6 shrink-0 flex items-center justify-center font-mono text-xs font-bold rounded ${isActive ? 'bg-white text-indigo-700' : isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}>
                    0{st.num}
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold leading-normal uppercase">{st.label}</span>
                    <span className={`block text-[9px] leading-none ${isActive ? 'text-neutral-300' : 'text-neutral-400'}`}>{st.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTIVE STEP CONTENT */}
          <div className="lg:col-span-3 border border-primary-100 rounded-xl p-6 bg-white flex flex-col justify-between min-h-[420px] shadow-sm shadow-indigo-100/10">
            <div>
              {globalError && (
                <div className="mb-4 border border-red-200 bg-red-50/50 p-3.5 text-xs font-sans font-medium flex items-start gap-2.5 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="text-red-850">{t(globalError)}</span>
                </div>
              )}

              {/* STEP 1: CATEGORY SELECTION */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex justify-between items-center border-b border-primary-100/60 pb-2">
                    <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-primary-900">
                      {t("1-Bosqich: Hujjat Kategoriyasi Tanlash")}
                    </h3>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">{t("majburiy")}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                        {t("Kategoriyaniturni tanlang (*):")}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(categories.filter((c) => c.isActive !== false).length > 0
                          ? categories.filter((c) => c.isActive !== false)
                          : []
                        ).map((cat) => {
                          const isSelected = categoryId === cat.id;
                          return (
                            <div 
                              key={cat.id}
                              onClick={() => setCategoryId(cat.id)}
                              className={`border-2 p-4 cursor-pointer rounded-xl transition-all flex flex-col justify-between min-h-[140px] ${isSelected ? 'border-primary-600 bg-indigo-50/20 ring-2 ring-primary-500/15' : 'border-neutral-200 hover:border-primary-400 bg-white'}`}
                            >
                              <div>
                                <span className="block font-sans font-bold text-xs text-primary-900 uppercase tracking-wider">{t(cat.name)}</span>
                                <span className="text-[10px] text-neutral-500 leading-normal mt-2.5 block">{t(cat.description) || t("Tavsif kiritilmagan")}</span>
                              </div>
                              <div className="flex justify-between items-center mt-3 pt-3 border-t border-primary-100/40">
                                <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">{t("Tanlangan")}</span>
                                <div className={`w-3.5 h-3.5 border rounded-full flex items-center justify-center ${isSelected ? 'border-primary-600 bg-primary-600' : 'border-neutral-300'}`}>
                                  {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
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
                      <div className="flex justify-between items-center border-b border-primary-100/60 pb-2">
                        <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-primary-900">
                          {flowType === "student"
                            ? t("2-Bosqich: Hujjat ma'lumotlari (Talaba)")
                            : t("2-Bosqich: Hujjat ma'lumotlari (Institut)")}
                        </h3>
                        <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">{t("majburiy")}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5 font-semibold">
                            {t("Hujjat nomi yoki raqamini kiriting (*)")}
                          </label>
                          <input
                            type="text"
                            required
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder={t("Masalan: Bo'yruq № 312 yoki Nizom")}
                            className="w-full bg-white border border-neutral-300 px-3.5 py-2 text-sm rounded-lg focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5 font-semibold">
                            Chiqarilgan sanasini kiriting (*)
                          </label>
                          <input
                            type="date"
                            required
                            value={docDate}
                            onChange={(e) => setDocDate(e.target.value)}
                            className="w-full bg-white border border-neutral-300 px-3.5 py-2 text-sm rounded-lg focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category = Xodim */}
                  {flowType === "employee" && (
                    <div className="space-y-5">
                      <div className="flex justify-between items-center border-b border-primary-100/60 pb-2">
                        <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-primary-900">
                          {t("2-Bosqich: Xodim hamda hujjat ma'lumotlari")}
                        </h3>
                        <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">{t("majburiy")}</span>
                      </div>

                      {/* Mode Selector */}
                      <div className="grid grid-cols-2 gap-4 border border-primary-100 p-1 bg-indigo-50/20 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setEmployeeMode("existing")}
                          className={`py-2 px-3 tracking-wider font-mono text-xs uppercase font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all rounded ${employeeMode === "existing" ? "bg-primary-600 text-white shadow-sm" : "text-indigo-700 hover:bg-indigo-50/40"}`}
                        >
                          <Users className="w-3.5 h-3.5" /> {t("Mavjud xodimni qidirish")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmployeeMode("new")}
                          className={`py-2 px-3 tracking-wider font-mono text-xs uppercase font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all rounded ${employeeMode === "new" ? "bg-primary-600 text-white shadow-sm" : "text-indigo-700 hover:bg-indigo-50/40"}`}
                        >
                          <UserPlus className="w-3.5 h-3.5" /> {t("Yangi xodim qo'shish")}
                        </button>
                      </div>

                      {employeeMode === "existing" ? (
                        <div className="space-y-3.5">
                          <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                            {t("Arxivdagi xodimlar ro'yxatidan tanlang (*)")}
                          </label>
                          <select
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded-lg focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all cursor-pointer"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-indigo-50/40 p-4 bg-indigo-50/10 rounded-xl">
                          <div className="md:col-span-2 font-mono text-[10px] text-indigo-700 uppercase font-bold">
                            {t("Yangi xodim ma'lumotlari:")}
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1 font-semibold">
                              {t("Familiyasi (*)")}
                            </label>
                            <input
                              type="text"
                              value={employeeLastName}
                              onChange={(e) => setEmployeeLastName(e.target.value)}
                              placeholder={t("Familiyasi")}
                              className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1 font-semibold">
                              {t("Ismi (*)")}
                            </label>
                            <input
                              type="text"
                              value={employeeFirstName}
                              onChange={(e) => setEmployeeFirstName(e.target.value)}
                              placeholder={t("Ismi")}
                              className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                              Otasining ismi
                            </label>
                            <input
                              type="text"
                              value={employeeMiddleName}
                              onChange={(e) => setEmployeeMiddleName(e.target.value)}
                              placeholder="Otasining ismi"
                              className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                              {t("Tababel raqami / ID")}
                            </label>
                            <input
                              type="text"
                              value={employeeRegId}
                              onChange={(e) => setEmployeeRegId(e.target.value)}
                              placeholder={t("Masalan: T-4190")}
                              className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                              {t("Kafedrasi / Bo'limi")}
                            </label>
                            <input
                              type="text"
                              value={employeeDepartment}
                              onChange={(e) => setEmployeeDepartment(e.target.value)}
                              placeholder={t("Fizika kafedrasi")}
                              className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                              Lavozimi
                            </label>
                            <input
                              type="text"
                              value={employeePosition}
                              onChange={(e) => setEmployeePosition(e.target.value)}
                              placeholder="Katta o'qituvchi"
                              className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                              {t("Telefon raqami")}
                            </label>
                            <input
                              type="text"
                              value={employeePhone}
                              onChange={(e) => setEmployeePhone(e.target.value)}
                              placeholder="+998 90..."
                              className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-xs rounded focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Employee Document details fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-200/60 pt-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5 font-semibold">
                            {t("Hujjat nomi yoki raqamini kiriting (*)")}
                          </label>
                          <input
                            type="text"
                            required
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder={t("Hujjat nomi yoki uning tartib raqami")}
                            className="w-full bg-white border border-neutral-300 px-3.5 py-2 text-sm rounded-lg focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5 font-semibold">
                            Chiqarilgan sanasi (Joriy etilgan) (*)
                          </label>
                          <input
                            type="date"
                            required
                            value={docDate}
                            onChange={(e) => setDocDate(e.target.value)}
                            className="w-full bg-white border border-neutral-300 px-3.5 py-2 text-sm rounded-lg focus:border-primary-600 outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-sans"
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
                  <div className="flex justify-between items-center border-b border-primary-100/60 pb-2">
                    <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-primary-900">
                      {t("3-Bosqich: Elektron PDF hujjati yuklash")}
                    </h3>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">{t("majburiy")}</span>
                  </div>

                  {fileError && <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 border border-red-200 rounded">{t(fileError)}</p>}

                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-indigo-200 hover:border-primary-400 p-8 bg-slate-50/50 hover:bg-indigo-50/10 text-center cursor-pointer transition-all rounded-xl relative">
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title={t("Hujjatni bu yerga bosing yoki sudrab keling")}
                      />
                      <div className="space-y-2">
                        <FileUp className="w-10 h-10 text-indigo-400 mx-auto animate-bounce-subtle" />
                        <p className="text-sm font-sans font-bold text-primary-900">{t("Faylni tanlash yoki sudrab yuklash")}</p>
                        <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">{t("Faqat .pdf formatida, maksimal 30 MB")}</p>
                      </div>
                    </div>

                    {file && (
                      <div className="border border-primary-100 rounded-lg p-4 space-y-2 bg-indigo-50/10">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="truncate max-w-xs font-bold text-primary-900">{file.name}</span>
                          <span className="text-primary-600 font-bold">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                        
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary-600 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-[10px] font-mono uppercase text-neutral-400">
                          <span>{t("Progress")}</span>
                          <span className="text-primary-600 font-bold">{uploadProgress === 100 ? t("Tayyor (Base64 tayyorlangan)") : t("Bajarilmoqda...")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: PLACEMENT MAP */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex justify-between items-center border-b border-primary-100/60 pb-2">
                    <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-primary-900">
                      {t("4-Bosqich: Fizik saqlash joylashuvi (Koordinata)")}
                    </h3>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">{t("majburiy")}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5 font-semibold">
                        {t("Arxiv Shkafi (*)")}
                      </label>
                      <select
                        value={cabinetId}
                        onChange={(e) => { setCabinetId(e.target.value); setFloor(""); }}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded focus:border-primary-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all cursor-pointer"
                      >
                        <option value="">{t("-- Shkafni tanlang --")}</option>
                        {cabinets.map((cab) => (
                           <option key={cab.id} value={cab.id}>{t(cab.name)} - ({t("Maksimal")} {cab.maxFloor} {t("qavat")})</option>
                        ))}
                      </select>
                      {selectedCabinet && (
                        <p className="text-[10px] text-neutral-500 font-mono mt-1 italic">
                          {t("Tavsif:")} {t(selectedCabinet.description) || "N/A"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5 font-bold">
                        {t("Qavat raqami (Butun musbat son) (*)")}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedCabinet ? selectedCabinet.maxFloor : "99"}
                        value={floor}
                        onChange={(e) => setFloor(e.target.value === "" ? "" : Number(e.target.value))}
                        disabled={!cabinetId}
                        placeholder={selectedCabinet ? `${t("1 va")} ${selectedCabinet.maxFloor} ${t("oralig'ida")}` : t("Avvalo shkaf tanlang")}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded focus:border-primary-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all font-mono normal-case disabled:bg-neutral-50"
                      />
                      {selectedCabinet && (
                        <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider font-mono mt-1">
                          {t("Varaqa formati:")} «{t(selectedCabinet.name)}, {floor || "N"}-{t("qavat")}»
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                        {t("Shkafdagi aniq joylashuv izohi (Ixtiyoriy)")}
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("Masalan: chap bo'lim orqa tomondagi ko'k jildli tezis jurnali")}
                        rows={3}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded focus:border-primary-600 outline-hidden focus:ring-1 focus:ring-indigo-100 transition-all"
                      ></textarea>
                    </div>
                  </div>
                </motion.div>
              )}              {/* STEP 5: FINAL COMPLETE CONFIRMATION SUMMARY */}
              {step === 5 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex justify-between items-center border-b border-primary-100 pb-2">
                    <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-primary-900">
                      {t("5-Bosqich: Arxivga kiritishdan oldin xulosa")}
                    </h3>
                    <span className="font-mono text-[10px] text-indigo-400 uppercase font-black tracking-widest">{t("tasdiqlash zaxirasi")}</span>
                  </div>

                  <div className="border border-primary-100 rounded-xl overflow-hidden divide-y divide-indigo-50/60 shadow-sm">
                    {personSummary && (
                      <>
                        <div className="bg-indigo-50/30 p-3 font-mono text-[11px] font-bold text-indigo-850 uppercase">
                          {t(personSummary.title)}
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {personSummary.fields.map((field) => (
                            <div key={field.label}>
                              <span className="text-slate-400 block text-[11px] font-medium">{t(field.label)}</span>
                              <span className="font-semibold text-slate-800">{field.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="bg-indigo-50/30 p-3 font-mono text-[11px] font-bold text-indigo-850 uppercase">
                      {t("Kategoriya va yuklanadigan fayl nusxasi:")}
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">{t("Hujjat turi (Kategoriya):")}</span>
                        <span className="font-bold text-slate-800">{t(categories.find(c => c.id === categoryId)?.name) || t("Kategoriya topilmadi")}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">{t("Yuklangan PDF nomi:")}</span>
                        <span className="font-mono text-xs text-slate-700 truncate block font-bold">{file?.name}</span>
                      </div>
                    </div>

                    <div className="bg-indigo-50/30 p-3 font-mono text-[11px] font-bold text-indigo-850 uppercase">
                      {t("Haqiqiy fizik saqlash koordinatasi:")}
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-primary-900 text-white">
                      <div>
                        <span className="text-indigo-200 block text-[11px] font-medium">{t("SHKAF REKVIZITI:")}</span>
                        <span className="font-black text-sm tracking-wider uppercase font-sans text-white">{t(selectedCabinet?.name)}</span>
                      </div>
                      <div>
                        <span className="text-indigo-200 block text-[11px] font-medium">{t("TOKCHA / QAVAT:")}</span>
                        <span className="font-mono font-black text-base text-emerald-400">{floor}-{t("QAVAT")}</span>
                      </div>
                      {notes && (
                        <div className="col-span-2 border-t border-indigo-900/40 pt-2">
                          <span className="text-indigo-200 block text-[11px] font-medium">{t("QO'SHIMCHA IZOH:")}</span>
                          <span className="italic opacity-80 text-indigo-100">{notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* LOWER DIALOG BUTTONS CONTROL */}
            <div className="border-t border-neutral-100 pt-4 flex justify-between gap-3 sticky bottom-0 bg-white">
              <button
                type="button"
                disabled={step === 1 || loading}
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 border border-neutral-300 hover:border-indigo-500 rounded text-slate-700 font-mono text-xs uppercase font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> {t("Orqaga")}
              </button>

              {step < 5 ? (
                <button
                  type="button"
                  disabled={!isStepValid()}
                  onClick={() => setStep(step + 1)}
                  className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-100 disabled:text-slate-400 font-mono text-xs uppercase font-bold flex items-center gap-1 cursor-pointer transition-all rounded"
                >
                  {t("Keyingisi")} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleIntakeSubmit}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-mono text-xs uppercase font-black tracking-wider flex items-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 transition-all rounded shadow-md shadow-indigo-100/40"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t("Qabul qilinmoqda...")}
                    </>
                  ) : (
                    <>
                      {t("Arxivga Saqlash")}
                    </>
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
