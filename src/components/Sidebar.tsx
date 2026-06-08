/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserRole } from "../types.js";
import { 
  LogOut, 
  LayoutGrid, 
  Search, 
  FilePlus2, 
  Database, 
  Scroll, 
  FolderLock,
  X
} from "lucide-react";
import { useTranslation } from "./LanguageContext.tsx";
import AppLogo from "./AppLogo.tsx";

interface SidebarProps {
  currentUser: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentUser, activeTab, onTabChange, onLogout, isOpen, onClose }: SidebarProps) {
  const isDocRole = currentUser?.role !== UserRole.VIEWER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const { t } = useTranslation();

  const menuItems = [
    { id: "dashboard", label: "Boshqaruv paneli", icon: LayoutGrid, desc: "Statistika & Oqim" },
    { id: "search", label: "Qidiruv (Search)", icon: Search, desc: "Tezkor filter tizimi" },
    isDocRole && { id: "intake", label: "Hujjat qabul (Intake)", icon: FilePlus2, desc: "PDF va Fizik joylashuv" },
    { id: "documents", label: "Hujjatlar ro'yxati", icon: Database, desc: "Inventar & Holat" },
    isDocRole && { id: "settings", label: "Mundarija", icon: Scroll, desc: "Kategoriyalar & Shkaflar" },
    isAdmin && { id: "admin", label: "Admin panel", icon: FolderLock, desc: "Foydalanuvchilar" },
  ].filter(Boolean) as any[];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-primary-900">
        <div>
          <div className="flex items-center gap-2.5">
            <AppLogo size="sm" className="ring-2 ring-white/20" />
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">{t("Institut Arxivi")}</h1>
              <p className="text-[11px] text-blue-200 mt-0.5">{t("Boshqaruv Tizimi")}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="md:hidden p-1.5 text-white/80 hover:bg-white/10 rounded-lg cursor-pointer"
          title={t("Yopish")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
               key={item.id}
               onClick={() => {
                 onTabChange(item.id);
                 onClose();
               }}
               className={`w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer group rounded-lg transition-all ${
                 isSelected 
                   ? "bg-primary-600 text-white shadow-sm" 
                   : "text-slate-700 hover:bg-slate-50 hover:text-primary-700"
               }`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isSelected ? "text-white" : "text-slate-400 group-hover:text-primary-600"}`} />
              <div className="min-w-0">
                <span className={`text-sm font-medium block leading-snug ${isSelected ? "text-white" : "text-slate-800"}`}>{t(item.label)}</span>
                <span className={`text-[11px] block leading-tight mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-400"}`}>{t(item.desc)}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 flex items-center justify-center text-white text-sm font-semibold shrink-0 rounded-lg">
            {currentUser?.fullName?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-800 text-plain" title={currentUser?.fullName}>
              {currentUser?.fullName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser?.role === 'admin' ? t("Bosh Arxivchi (Admin)") : currentUser?.role === 'xodim' ? t("Arxiv Operator") : t("Arxivchi (Viewer)")}
            </p>
          </div>
          <button 
            onClick={onLogout} 
            className="text-xs font-medium text-primary-600 hover:text-primary-800 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t("Chiqish")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden no-print transition-opacity" 
        />
      )}

      <aside 
        className={`
          no-print fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 transform transition-transform duration-200 ease-in-out bg-white h-full shrink-0 shadow-sm
          md:translate-x-0 md:static md:flex md:flex-col md:h-screen
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
