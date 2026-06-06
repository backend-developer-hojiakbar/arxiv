/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api, fetchDocumentPdf } from "../api.js";
import { 
  Search, 
  X, 
  Printer, 
  Eye, 
  FileText, 
  Calendar, 
  SlidersHorizontal,
  Bookmark,
  MapPin,
  FileDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";

interface SearchTabProps {
  initialFilters?: any;
}

export default function SearchTab({ initialFilters }: SearchTabProps) {
  // Query filters state
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cabinetId, setCabinetId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [docDate, setDocDate] = useState("");
  const [status, setStatus] = useState("");
  const { t } = useTranslation();
  
  // Lists for dropdowns
  const [categories, setCategories] = useState<any[]>([]);
  const [cabinets, setCabinets] = useState<any[]>([]);
  
  // Results
  const [documents, setDocuments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selected Doc for Drawer
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [printSlipDoc, setPrintSlipDoc] = useState<any>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDoc) {
      setPdfPreviewUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    fetchDocumentPdf(selectedDoc.id)
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setPdfPreviewUrl(objectUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setPdfPreviewUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedDoc?.id]);

  // Load categories & cabinets for filters
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const catData = await api.getCategories();
        const cabData = await api.getCabinets();
        setCategories(catData);
        setCabinets(cabData);
      } catch (err) {
        console.error("Dropdown arrays load failure", err);
      }
    };
    loadDropdowns();
  }, []);

  // Handle initial filters (e.g., redirect from dashboard clicks)
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.categoryId) setCategoryId(initialFilters.categoryId);
      if (initialFilters.cabinetId) setCabinetId(initialFilters.cabinetId);
      // Automatically trigger a search
      searchDocuments({
        categoryId: initialFilters.categoryId,
        cabinetId: initialFilters.cabinetId
      });
    } else {
      searchDocuments();
    }
  }, [initialFilters]);

  // Handle Search
  const searchDocuments = async (overrideParams?: any) => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        q,
        categoryId: overrideParams?.categoryId !== undefined ? overrideParams.categoryId : categoryId,
        cabinetId: overrideParams?.cabinetId !== undefined ? overrideParams.cabinetId : cabinetId,
        docDate: overrideParams?.docDate !== undefined ? overrideParams.docDate : docDate,
        dateFrom,
        dateTo,
        status,
        page: 1,
        limit: 100
      };
      
      const res = await api.getDocuments(filters);
      setDocuments(res.documents);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || t("Hujjatlarni oqimlashda xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQ("");
    setCategoryId("");
    setCabinetId("");
    setDocDate("");
    setDateFrom("");
    setDateTo("");
    setStatus("");
    setTimeout(() => {
      searchDocuments({ categoryId: "", cabinetId: "", docDate: "" });
    }, 50);
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchDocuments();
    }
  };

  // Trigger Local Printer
  const handlePrintSlip = (doc: any) => {
    setPrintSlipDoc(doc);
    setTimeout(() => {
      window.print();
    }, 300);
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
      alert(t("Hujjatni yuklab olishda xatolik yuz berdi: ") + err.message);
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
      alert(t("Chop etishda xatolik yuz berdi: ") + err.message);
    }
  };

  return (
    <div className="space-y-6 selection:bg-primary-600 selection:text-white" onKeyDown={handleKeyDown}>
      {/* Search Header */}
      <div className="border-b border-primary-100 pb-4">
        <h2 className="text-xl page-title">
          {t("Hujjatlarni Tezkor Qidirish")}
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {t("Fizik shkaf va qavat qidiruvi: Ism, kategoriya yoki o'quvchi kodi orqali qidiring")}
        </p>
      </div>

      {/* Filter controls Section */}
      <div className="border border-primary-100 rounded-xl p-5 bg-white space-y-4 shadow-sm shadow-indigo-100/10">
        <div className="flex items-center gap-2 border-b border-primary-100/60 pb-2 mb-1">
          <SlidersHorizontal className="w-4 h-4 text-primary-600" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary-900">
            {t("Fizik Qidiruv Filtrlari (AND mantiqli)")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Main lookup text */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1 font-semibold">
              {t("Hujjat nomi / Xodim ism familiyasi")}
            </label>
            <div className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("Qidirish uchun qiymat kiriting...")}
                className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded-lg focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-150 transition-all text-sm font-sans"
              />
              {q && (
                <button 
                  onClick={() => setQ("")}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-primary-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1 font-semibold">
              {t("Hujjat Kategoriyasi")}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded-lg focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-150 transition-all cursor-pointer text-sm"
            >
              <option value="">{t("Barchasi (All)")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{t(cat.name)}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1 font-semibold">
              {t("Hujjat sanasini belgilang")}
            </label>
            <input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded-lg focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-150 transition-all text-sm font-sans"
            />
          </div>

          <div className="md:col-span-4 flex justify-end gap-2 pt-1 border-t border-dashed border-neutral-150">
            <button
              onClick={() => searchDocuments()}
              disabled={loading}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer rounded-lg shadow-md shadow-indigo-100/40"
            >
              <Search className="w-3.5 h-3.5" /> {t("Qidirish")}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-white text-slate-700 border border-slate-300 hover:border-indigo-500 hover:bg-slate-50 font-mono text-xs flex items-center justify-center cursor-pointer rounded-lg transition-all"
              title={t("Tozalash")}
            >
              {t("Tozalash")}
            </button>
          </div>
        </div>
      </div>

      {/* Results Title Area */}
      <div className="flex justify-between items-center text-sm font-mono pb-2 border-b border-primary-100">
        <div>
          {t("Topildi:")} <strong className="text-primary-900 font-black">{total} {t("ta yozuv")}</strong>
        </div>
        <div className="text-neutral-400 text-xs text-right">
          {t("Sana bo'yicha saralangan (Yangi birinchi)")}
        </div>
      </div>

      {/* Results grid / table */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest block">{t("Natijalar saralanmoqda...")}</span>
        </div>
      ) : error ? (
        <div className="p-6 border border-red-200 bg-red-50/50 rounded-xl text-center font-medium my-4">
          <span className="font-mono text-xs uppercase bg-red-600 text-white px-2 py-1 rounded">{t("Xato yuklanish")}</span>
          <p className="mt-2 text-neutral-600 text-sm">{t(error)}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="border border-primary-100 rounded-xl p-12 text-center space-y-2 bg-slate-50/50">
          <X className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="font-sans font-bold text-primary-900 uppercase tracking-wider text-sm">{t("HECH NARSA TOPILMADI")}</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {t("Kiritilgan filtrlar bo'yicha arxivdan mos yozuvlar topilmadi. Qidiruv kalit so'zlari yoki filtrlarni o'zgartirib ko'ring.")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-150 rounded-xl shadow-sm">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-primary-900 text-white text-xs font-medium tracking-wider">
                <th className="py-3 px-3">{t("O'quvchi F.I.Sh.")}</th>
                <th className="py-3 px-3">{t("Student ID (Talaba kodi)")}</th>
                <th className="py-3 px-3">{t("Hujjat turi (Kategoriya)")}</th>
                <th className="py-3 px-3">{t("Qabul sanasi")}</th>
                <th className="py-3 px-3 text-center">{t("Fizik Shkaf")}</th>
                <th className="py-3 px-3 text-center bg-indigo-900">{t("Qavat (Plast)")}</th>
                <th className="py-3 px-3">{t("Holat")}</th>
                <th className="py-3 px-3 text-right">{t("Amallar")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {documents.map((doc) => (
                <tr 
                  key={doc.id}
                  className="hover:bg-indigo-50/20 transition-all group cursor-pointer"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <td className="py-3 px-3 font-medium text-neutral-900">
                    {doc.student ? `${t(doc.student.lastName)} ${t(doc.student.firstName)} ${t(doc.student.middleName || "")}` : t("Noma'lum O'quvchi")}
                  </td>
                  <td className="py-3 px-3 font-mono text-neutral-600">
                    {doc.student?.studentId || <span className="text-neutral-300">-</span>}
                  </td>
                  <td className="py-3 px-3 text-neutral-600">
                    {t(doc.category?.name) || <span className="text-neutral-300">&middot;</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-neutral-500">
                    {new Date(doc.receivedAt).toLocaleDateString("uz-UZ")}
                  </td>
                  {/* High visual feedback of Location as required in 4.4.5 */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-primary-900 border-l border-neutral-50 uppercase bg-slate-50/30">
                    {t(doc.cabinet?.name) || t(doc.cabinetId)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-indigo-900 bg-slate-100/50 text-sm border-r border-neutral-50">
                    {doc.floor}-{t("qavat")}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-block border px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider rounded ${doc.status === 'Joyida' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-300 text-neutral-400 bg-white'}`}>
                      {t(doc.status)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-1.5 border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 text-slate-500 hover:text-primary-600 transition-all flex items-center justify-center cursor-pointer rounded"
                        title={t("Batafsil ma'lumot va PDF korish")}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePrintSlip(doc)}
                        className="p-1.5 border border-primary-600 bg-primary-600 text-white hover:bg-primary-700 transition-all flex items-center justify-center gap-1 text-[11px] font-medium font-bold cursor-pointer rounded shadow-sm shadow-indigo-100"
                        title={t("Fizik joylashuv voucherini chop etish")}
                      >
                        <Printer className="w-3.5 h-3.5" /> {t("Chop etish")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slideover detail drawer for Document & PDF viewing */}
      <AnimatePresence>
        {selectedDoc && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="fixed inset-0 bg-primary-900/30 backdrop-blur-xs z-40"
            ></motion.div>
            
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white border-l border-primary-100 z-50 p-6 shadow-2xl overflow-y-auto flex flex-col justify-between selection:bg-primary-600 selection:text-white"
            >
              <div>
                <div className="flex justify-between items-start border-b border-primary-100 pb-4 mb-6">
                  <div>
                    <span className="text-xs font-medium font-bold bg-primary-600 text-white px-2 py-0.5 tracking-wider rounded">
                      {t("Arxiv Kartasi:")} {selectedDoc.id}
                    </span>
                    <h3 className="text-lg font-display font-black text-primary-900 uppercase tracking-tight mt-2 leading-tight">
                      {t("Hujjat haqida batafsil ma'lumot")}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="p-1.5 border border-slate-200 text-slate-500 hover:text-primary-600 hover:bg-indigo-50/20 rounded cursor-pointer transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Visual Location highlight first */}
                  <div className="border border-primary-100 bg-indigo-50/10 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-indigo-200 bg-primary-600 text-white flex items-center justify-center font-bold rounded-lg shadow-sm">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-mono text-neutral-500 uppercase tracking-widest font-bold">{t("Fizik saqlash joylashuvi:")}</span>
                        <strong className="font-mono font-black text-primary-900 leading-tight tracking-wider text-base uppercase">
                          {t(selectedDoc.cabinet?.name)}, {selectedDoc.floor}-{t("qavat")}
                        </strong>
                      </div>
                    </div>
                    <button 
                      onClick={() => handlePrintSlip(selectedDoc)}
                      className="border border-indigo-200 bg-white hover:bg-indigo-50/20 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-700 rounded-lg transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" /> {t("SLIP")}
                    </button>
                  </div>

                  {/* Student details */}
                  <div className="space-y-2">
                    <h4 className="font-mono text-xs uppercase text-neutral-500 tracking-wider font-bold border-b border-neutral-100 pb-1">
                      {t("1. O'quvchi talaba ma'lumotlari")}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                      <div>
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Familiya, Ism, Otasining ismi")}</span>
                        <span className="font-semibold text-slate-800">
                          {selectedDoc.student ? `${t(selectedDoc.student.lastName)} ${t(selectedDoc.student.firstName)} ${t(selectedDoc.student.middleName || "")}` : t("Noma'lum")}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Student ID (Talaba kodi)")}</span>
                        <span className="font-mono font-medium text-slate-800">
                          {selectedDoc.student?.studentId || <span className="text-neutral-400">{t("Ko'rsatilmagan")}</span>}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Akademik guruh")}</span>
                        <span className="font-medium text-slate-800">
                          {selectedDoc.student?.groupName || <span className="text-neutral-400">{t("Noma'lum")}</span>}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Tug'ilgan sana / Telefon")}</span>
                        <span className="text-slate-800 col-span-2 sm:col-span-1">
                          {selectedDoc.student?.birthDate ? new Date(selectedDoc.student.birthDate).toLocaleDateString() : ""}
                          {selectedDoc.student?.phone ? ` / ${selectedDoc.student.phone}` : ""}
                          {(!selectedDoc.student?.birthDate && !selectedDoc.student?.phone) && <span className="text-neutral-400">{t("Ko'rsatilmagan")}</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document details */}
                  <div className="space-y-2">
                    <h4 className="font-mono text-xs uppercase text-neutral-500 tracking-wider font-bold border-b border-neutral-100 pb-1">
                      {t("2. Hujjat va saqlash parametrlari")}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                      <div>
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase font-semibold">{t("Hujjat kategoriyasi")}</span>
                        <span className="font-medium text-neutral-800">{t(selectedDoc.category?.name) || t("Noma'lum")}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase font-semibold">{t("Hujjat holati")}</span>
                        <span className={`inline-block border px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider rounded ${selectedDoc.status === 'Joyida' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-350 text-neutral-500 bg-white'}`}>
                          {t(selectedDoc.status)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Arxivga qabul qildi (Xodim)")}</span>
                        <span className="font-medium text-neutral-800">{t(selectedDoc.receiver?.fullName) || t("Bosh xodim")}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Qabul qilingan sana & vaqt")}</span>
                        <span className="font-mono text-neutral-600 text-xs">
                          {new Date(selectedDoc.receivedAt).toLocaleString("uz-UZ")}
                        </span>
                      </div>
                      {selectedDoc.status === "Berilgan" && (
                        <>
                          <div>
                            <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Hujjatni chiqargan xodim")}</span>
                            <span className="font-medium text-slate-800">{t(selectedDoc.issuer?.fullName) || t("Administrator")}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Chiqarilgan sana & vaqt")}</span>
                            <span className="font-mono text-neutral-600 text-xs">
                              {new Date(selectedDoc.issuedAt).toLocaleString("uz-UZ")}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="col-span-2">
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase">{t("Shkafdagi aniq izoh variantlari")}</span>
                        <p className="text-neutral-700 bg-neutral-50 px-3 py-2 border border-neutral-200 text-xs italic">
                          {t(selectedDoc.notes) || t("Zaxira izohlar kiritilmagan")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Raw Interactive PDF preview iframe */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-1">
                      <h4 className="font-mono text-xs uppercase text-neutral-500 tracking-wider font-bold">
                        {t("3. Elektron PDF nusxasi ko'rinishi")}
                      </h4>
                      <span className="font-mono text-[9px] text-neutral-400">
                        {selectedDoc.originalFilename} ({(selectedDoc.fileSize / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    {/* Render Real interactive local PDF inside iframe, fallback to message */}
                    <div className="border border-primary-100 rounded-xl overflow-hidden bg-neutral-50 relative">
                      {pdfPreviewUrl ? (
                        <iframe 
                          src={pdfPreviewUrl} 
                          className="w-full h-80 z-10 relative bg-white" 
                          title="PDF file preview"
                        ></iframe>
                      ) : (
                        <div className="w-full h-80 flex items-center justify-center text-sm text-slate-500">
                          {t("PDF yuklanmoqda...")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-neutral-200 pt-4 mt-6 flex flex-col sm:flex-row gap-2">
                <button 
                  type="button"
                  onClick={() => handleDownloadPdf(selectedDoc)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-mono text-xs uppercase tracking-wider font-bold text-center flex-1 cursor-pointer rounded flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <FileDown className="w-4 h-4" /> {t("Yuklab olish")}
                </button>
                <button 
                  type="button"
                  onClick={() => handlePrintPdf(selectedDoc)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-wider font-bold text-center flex-1 cursor-pointer rounded flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <Printer className="w-4 h-4" /> {t("Chop etish")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs uppercase tracking-wider font-bold flex-1 cursor-pointer rounded-lg text-center transition-all text-xs"
                >
                  {t("Yopish")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invisible Printable location voucher. Controlled entirely via browser printing stylesheets */}
      <div className="hidden print:block print-only p-8 text-slate-800 bg-white font-mono text-sm max-w-sm mx-auto border border-slate-200 selection:bg-black">
        {printSlipDoc && (
          <div className="space-y-6 text-center">
            {/* Header */}
            <div className="border-b-2 border-slate-200 pb-3 text-center">
              <h2 className="font-bold text-lg leading-tight uppercase tracking-wider">{t("INSTITUT ARXIVI")}</h2>
              <span className="text-[10px] uppercase font-bold text-neutral-500 text-center">{t("FIZIK JOYLASHUV VOUCHERI")}</span>
            </div>

            {/* Content info */}
            <div className="space-y-4 text-left font-mono">
              <div className="flex justify-between text-xs">
                <span>Voucher ID:</span>
                <span className="font-bold">SLP-{printSlipDoc.id.substring(4)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{t("Chop etilgan sana:")}</span>
                <span className="font-bold">{new Date().toLocaleString("uz-UZ")}</span>
              </div>
              
              <div className="border-t border-b border-dashed border-slate-200 py-4 space-y-3">
                <div>
                  <span className="block text-[10px] uppercase text-neutral-500 font-bold">{t("Talaba:")}</span>
                  <span className="font-bold text-sm block">
                    {printSlipDoc.student ? `${t(printSlipDoc.student.lastName)} ${t(printSlipDoc.student.firstName)} ${t(printSlipDoc.student.middleName || "")}` : t("Noma'lum")}
                  </span>
                  <span className="text-xs text-neutral-500">{t("ID kodi:")} {printSlipDoc.student?.studentId || "-"} &middot; {t("Guruhi:")} {printSlipDoc.student?.groupName || "-"}</span>
                </div>
                
                <div>
                  <span className="block text-[10px] uppercase text-neutral-500 font-bold">{t("Hujjat turi:")}</span>
                  <span className="font-medium text-xs font-mono">{t(printSlipDoc.category?.name) || t("Noma'lum")}</span>
                </div>
              </div>

              {/* Exact Physical Placement high-contrast highlights */}
              <div className="border border-slate-200 p-4 text-center space-y-1 bg-white">
                <span className="block text-[10px] uppercase font-bold text-neutral-500">{t("SHKAF VA TOKCHA COORD:")}</span>
                <strong className="block text-xl uppercase tracking-widest leading-none py-1 border border-slate-200 font-black bg-primary-600 text-white">
                  {t(printSlipDoc.cabinet?.name) || t(printSlipDoc.cabinetId)}
                </strong>
                <strong className="block text-2xl uppercase tracking-wider leading-none py-1.5 font-sans font-black font-semibold">
                  {printSlipDoc.floor}-{t("qavat").toUpperCase()}
                </strong>
              </div>

              {printSlipDoc.notes && (
                <div className="text-xs">
                  <span className="block font-bold text-[10px] text-neutral-500">QO'SHIMCHA KO'RSATMA:</span>
                  <p className="italic leading-normal border border-dashed border-neutral-300 p-2 text-[11px] bg-neutral-50">{t(printSlipDoc.notes)}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-slate-200 pt-3 text-[9px] text-neutral-500 space-y-1 text-center">
              <span>{t("Ushbu varaq arxiv javonidan hujjat izlash uchun mo'ljallangan.")}</span>
              <p className="font-bold text-slate-800">{t("Iltimos, hujjatlarni o'z o'rniga qaytarib qo'ying!")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
