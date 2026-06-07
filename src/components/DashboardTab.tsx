/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { api } from "../api.js";
import { 
  FileText, 
  FolderOpen, 
  Layers, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  Database,
  Grid
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";

interface DashboardTabProps {
  onNavigateToTab: (tab: string, filters?: any) => void;
  dataRevision?: number;
}

export default function DashboardTab({ onNavigateToTab, dataRevision = 0 }: DashboardTabProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchStats = async (background = false) => {
    try {
      if (!background) setLoading(true);
      setError(null);
      const data = await api.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || t("Tahliliy ma'lumotlarni hisoblashda xatolik yuz berdi"));
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (dataRevision > 0) {
      fetchStats(true);
    }
  }, [dataRevision]);

  if (loading && !stats) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500">{t("Natijalar yuklanmoqda...")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center my-6">
        <span className="badge bg-red-600 text-white border-0">{t("Xato")}</span>
        <p className="mt-3 text-sm text-slate-700">{t(error)}</p>
        <button onClick={fetchStats} className="btn-secondary mt-4">
          {t("Qayta yuklash")}
        </button>
      </div>
    );
  }

  const { counters, categoryStats, cabinetStats, songgiYozuvlar, weeklyData } = stats;

  // Compute maximum count in weekly data to upscale SVG chart bars
  const maxWeeklyCount = Math.max(...weeklyData.map((d: any) => d.count), 1);

  return (
    <div className="space-y-8 selection:bg-primary-100 selection:text-primary-900">
      {/* Page Title Row */}
      <div className="page-header">
        <h2 className="page-title">
          {t("Boshqaruv paneli (Dashboard)")}
        </h2>
        <p className="page-subtitle">
          {t("Arxiv tizimining umumiy statistikasi va oxirgi faollik ko'rsatkichlari")}
        </p>
      </div>

      {/* 4.3.1. General Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: t("Hujjatlar"),
            value: counters.jamiHujjatlar,
            desc: t("Arxivda saqlanayotgan jami faol hujjatlar"),
            icon: FileText,
            colorClass: "text-primary-600",
            iconColor: "text-primary-500",
            bgClass: "bg-indigo-50/30",
            borderColor: "border-primary-100 hover:border-primary-400"
          },
          {
            title: t("Kategoriyalar"),
            value: counters.jamiKategoriyalar,
            desc: t("Tizimdagi faol mavjud hujjat turlari"),
            icon: FolderOpen,
            colorClass: "text-amber-600",
            iconColor: "text-amber-500",
            bgClass: "bg-amber-50/30",
            borderColor: "border-amber-100 hover:border-amber-400"
          },
          {
            title: t("Shkaflar"),
            value: counters.jamiShkaflar,
            desc: t("Fizik shkaflar va metall stellajlar"),
            icon: Layers,
            colorClass: "text-sky-600",
            iconColor: "text-sky-500",
            bgClass: "bg-sky-50/30",
            borderColor: "border-sky-100 hover:border-sky-400"
          },
          {
            title: t("Bugun Qabul"),
            value: counters.bugunQabulQilingan,
            desc: t("Bugun kiritilgan yangi arxiv hujjatlari"),
            icon: Calendar,
            colorClass: "text-teal-600",
            iconColor: "text-teal-500",
            bgClass: "bg-teal-50/40",
            borderColor: "border-teal-100 hover:border-teal-400",
            highlight: counters.bugunQabulQilingan > 0
          }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              className={`card p-4 flex flex-col justify-between ${card.borderColor} ${card.bgClass} transition-all hover:shadow-md`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 leading-none">
                  {card.title}
                </span>
                <Icon className={`w-4 h-4 ${card.iconColor} shrink-0`} />
              </div>
              <div>
                <span className={`font-display text-3.5xl font-black block tracking-tight leading-none ${card.colorClass}`}>
                  {card.value}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium leading-tight mt-1.5 block">
                  {card.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* A. Categories and Percentages */}
        <div className="border border-slate-200 p-6 space-y-4 bg-white">
          <div className="flex border-b border-neutral-200 pb-3 justify-between items-center">
            <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-slate-800 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" /> {t("KATEGORIYALAR BO'YICHA TAQSIMOT")}
            </h3>
            <span className="font-mono text-xs text-neutral-500">{t("foiz ulushi")}</span>
          </div>
          
          <div className="space-y-3 pt-2">
            {categoryStats.map((cat: any) => (
              <div 
                key={cat.id} 
                className="group cursor-pointer"
                onClick={() => onNavigateToTab("search", { categoryId: cat.id })}
              >
                <div className="flex justify-between text-xs font-mono font-medium mb-1">
                  <span className="text-slate-800 group-hover:underline text-plain">{cat.name}</span>
                  <span className="text-neutral-500">
                    {cat.count} {t("ta yozuv")} (<strong className="text-primary-600 font-bold">{cat.percent}%</strong>)
                  </span>
                </div>
                {/* Minimalist Black and White progress bar with colored fill */}
                <div className="w-full h-2 rounded overflow-hidden bg-neutral-100 border border-neutral-200 group-hover:border-primary-400 transition-colors">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 rounded-r" 
                    style={{ width: `${cat.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {categoryStats.length === 0 && (
              <p className="text-center text-neutral-400 py-6 text-sm">{t("Hozircha hech qanday kategoriya kiritilmagan")}</p>
            )}
          </div>
        </div>

        {/* B. Qabul qilinganlar (Oq-Qora Grafik) */}
        <div className="border border-slate-200 p-6 space-y-4 bg-white">
          <div className="flex border-b border-neutral-200 pb-3 justify-between items-center">
            <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> {t("OXIRGI 7 KUNLIK QABUL GRAFIGI")}
            </h3>
            <span className="font-mono text-xs text-neutral-500 font-bold bg-neutral-100 px-1.5 py-0.5 border border-neutral-200">{t("KUNLIK SONI")}</span>
          </div>

          <div className="h-48 flex items-end justify-between pt-4 gap-2">
            {weeklyData.map((day: any, idx: number) => {
              const barHeightPct = (day.count / maxWeeklyCount) * 85; // cap at 85% to give space for labels
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="font-mono text-[10px] text-primary-600 font-bold group-hover:scale-110 transition-transform mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count} {t("ta")}
                  </span>
                  
                  {/* Flat black bar with elegant blue-indigo gradient for modern sleek interface */}
                  <div 
                    className="w-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 hover:border-primary-400 rounded-t transition-all overflow-hidden font-sans"
                    style={{ height: `${Math.max(barHeightPct, 4)}%` }}
                  >
                    <div 
                       className={`h-full w-full ${day.count > 0 ? "bg-gradient-to-t from-primary-600 to-sky-500" : "bg-neutral-100"}`}
                    ></div>
                  </div>
                  
                  <span className="font-mono text-[9px] text-neutral-400 rotate-45 origin-left whitespace-nowrap mt-2 ml-1 group-hover:text-slate-800 group-hover:font-bold">
                    {t(day.dayName.split(" ")[0])}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="pt-2"></div>
        </div>
      </div>

      {/* Cabinets Capacity Section */}
      <div className="border border-slate-200 p-6 space-y-4 bg-white">
        <div className="flex border-b border-neutral-200 pb-3 justify-between items-center">
          <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-slate-800 flex items-center gap-2">
            <Grid className="w-4 h-4" /> {t("SHKAFLAR VA TO'LIQLIK HOLATI")}
          </h3>
          <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">{t("shkaf ustiga bosib filtrlash")}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {cabinetStats.map((cab: any) => {
            const floorCounts = Object.entries(cab.floorDistribution);
            const totalLoad = floorCounts.reduce((acc, [_, count]) => acc + (count as number), 0);
            
            return (
              <div 
                key={cab.id}
                className="border-2 border-neutral-200 hover:border-slate-200 p-4 space-y-3 cursor-pointer transition-all flex flex-col justify-between"
                onClick={() => onNavigateToTab("search", { cabinetId: cab.id })}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 border-b border-neutral-100 pb-2">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-slate-800">{t(cab.name)}</h4>
                      <p className="text-[10px] text-neutral-500 line-clamp-1">{t(cab.description) || t("Tavsifi yo'q")}</p>
                    </div>
                    <span className="font-mono text-xs font-bold bg-primary-600 text-white px-1.5 py-0.5 uppercase shrink-0">
                      {totalLoad} {t("ta")}
                    </span>
                  </div>

                  {/* Floor boxes visualization */}
                  <div className="mt-3 space-y-1.5">
                    <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest">{t("Qavatlar bo'yicha sig'im:")}</span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 pt-1">
                      {floorCounts.map(([floor, count]) => {
                        const cnt = count as number;
                        return (
                          <div 
                            key={floor} 
                            className={`border px-1 py-1.5 text-center rounded transition-all ${
                              cnt > 0 
                                ? 'bg-gradient-to-br from-indigo-900 via-primary-900 to-neutral-900 border-indigo-900 text-white shadow-sm font-semibold hover:scale-105' 
                                : 'border-neutral-200 text-neutral-400 bg-white hover:bg-neutral-50'
                            }`}
                            title={`${floor}-${t("qavat")}: ${cnt} ${t("ta yozuv")}`}
                          >
                            <span className="font-mono text-[10px] block font-bold leading-none">{floor}</span>
                            <span className={`text-[8px] font-mono leading-none mt-1 block font-bold ${cnt > 0 ? 'text-sky-300' : 'text-slate-400'}`}>{cnt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="text-right pt-3">
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-neutral-500 uppercase hover:text-slate-800">
                    {t("Ro'yxatni ko'rish")} <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            );
          })}
          {cabinetStats.length === 0 && (
            <p className="text-center text-neutral-400 py-6 text-sm col-span-3">{t("Hozircha hech qanday shkaf kiritilmagan")}</p>
          )}
        </div>
      </div>

      {/* Bottom recent activity list */}
      <div className="border border-slate-200 p-6 space-y-4 bg-white">
        <div className="flex border-b border-neutral-200 pb-3 justify-between items-center">
          <h3 className="font-sans font-bold uppercase text-sm tracking-widest text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4" /> {t("SO'NGGI QABUL QILINGAN HUJJATLAR")}
          </h3>
          <span className="font-mono text-xs text-neutral-500">{t("oxirgi 10 ta")}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 font-mono text-[11px] uppercase text-neutral-500">
                <th className="py-2.5 px-3">{t("Sana & Vaqt")}</th>
                <th className="py-2.5 px-3">{t("Shaxs / Hujjat")}</th>
                <th className="py-2.5 px-3">{t("Kategoriya")}</th>
                <th className="py-2.5 px-3">{t("Fizik joylashuvi")}</th>
                <th className="py-2.5 px-3">{t("Holati")}</th>
                <th className="py-2.5 px-3 text-right">{t("Amal")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs font-sans">
              {songgiYozuvlar.map((doc: any) => (
                <tr 
                  key={doc.id}
                  className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                  onClick={() => onNavigateToTab("documents")}
                >
                  <td>
                    <div className="table-cell-inner text-neutral-500">
                      {new Date(doc.receivedAt).toLocaleString("uz-UZ", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </td>
                  <td>
                    <div className="table-cell-inner table-cell-inner--stack group-hover:underline">
                      <div className="font-medium text-slate-800 text-plain">{doc.personName}</div>
                      {doc.personSubtitle && (
                        <div className="text-xs text-slate-500 text-plain">{doc.personSubtitle}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="table-cell-inner text-neutral-600 text-plain">{doc.categoryName}</div>
                  </td>
                  <td>
                    <div className="table-cell-inner text-neutral-600 text-plain">
                      {doc.cabinetName !== "—" ? (
                        <><span className="font-medium">{doc.cabinetName}</span> · <strong className="text-slate-800">{doc.floor}-{t("qavat")}</strong></>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="table-cell-inner">
                      <span className={doc.status === "Joyida" ? "status-badge status-joyida" : doc.status === "Berilgan" ? "status-badge status-berilgan" : "status-badge status-neutral"}>
                        {t(doc.status)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="table-cell-inner table-cell-inner--end">
                      <button className="text-[10px] px-2 py-1 bg-primary-600 text-white rounded">{t("Batafsil ma'lumot va PDF korish")}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {songgiYozuvlar.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-neutral-400 font-mono">
                    {t("Hozircha arxiv hujjatlari mavjud emas.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
