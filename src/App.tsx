/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import LoginScreen from "./components/LoginScreen.tsx";
import Sidebar from "./components/Sidebar.tsx";
import DashboardTab from "./components/DashboardTab.tsx";
import SearchTab from "./components/SearchTab.tsx";
import IntakeTab from "./components/IntakeTab.tsx";
import RepositoryTab from "./components/RepositoryTab.tsx";
import SettingsTab from "./components/SettingsTab.tsx";
import AdminTab from "./components/AdminTab.tsx";
import { api, removeAuthToken } from "./api.ts";
import { Menu, Languages } from "lucide-react";
import { useTranslation } from "./components/LanguageContext.tsx";

const TAB_TITLES: Record<string, string> = {
  dashboard: "Dashboard // Umumiy Statistika",
  search: "Qidiruv (Search) // Hujjatlar Qidiruvi",
  intake: "Hujjat qabul (Intake) // Yangi Hujjat Qo'shish",
  documents: "Hujjatlar ro'yxati // Arxiv Hujjatlari Ombori",
  settings: "Kategoriyalar & Shkaflar // Tizim Spravochniklari",
  admin: "Admin panel // Tizim Sozlamalari & Audit",
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [tabFilters, setTabFilters] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const { lang, setLang, t } = useTranslation();

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem("arxiv_auth_token");
      if (!savedToken) return;

      try {
        const user = await api.getMe();
        setCurrentUser(user);
      } catch {
        removeAuthToken();
      }
    };

    restoreSession();
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setActiveTab("dashboard");
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      removeAuthToken();
    }
    setCurrentUser(null);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setTabFilters(null);
  };

  const handleNavWithFilters = (tabId: string, filters?: any) => {
    setTabFilters(filters || null);
    setActiveTab(tabId);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const roleLabel = currentUser?.role === 'admin'
    ? t("Bosh Arxivchi (Admin)")
    : currentUser?.role === 'xodim'
      ? t("Arxiv Operator")
      : t("Arxivchi (Viewer)");

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-100 text-slate-800 font-sans overflow-hidden selection:bg-primary-100 selection:text-primary-900">
      <Sidebar 
        currentUser={currentUser} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:hidden shrink-0 no-print">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 text-white flex items-center justify-center font-semibold text-xs rounded-lg">
              А
            </div>
            <h1 className="text-sm font-semibold text-primary-900">{t("Institut Arxivi")}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <LangToggle lang={lang} setLang={setLang} compact />
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="btn-secondary !py-1.5 !px-2.5 !text-xs"
            >
              <Menu className="w-4 h-4" /> {t("Menu")}
            </button>
          </div>
        </header>

        <header className="h-14 border-b border-slate-200 hidden md:flex items-center justify-between px-6 lg:px-8 bg-white shrink-0 no-print">
          <h2 className="text-sm font-semibold text-primary-900">
            {t(TAB_TITLES[activeTab] || "")}
          </h2>
          
          <div className="flex items-center gap-3">
            <LangToggle lang={lang} setLang={setLang} />
            <span className="badge badge-primary text-xs">
              {roleLabel}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-100">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="no-print">
              {activeTab === "dashboard" && (
                <DashboardTab onNavigateToTab={handleNavWithFilters} />
              )}
              {activeTab === "search" && (
                <SearchTab initialFilters={tabFilters} />
              )}
              {activeTab === "intake" && (
                <IntakeTab onNavigateToTab={handleTabChange} />
              )}
              {activeTab === "documents" && (
                <RepositoryTab currentUser={currentUser} />
              )}
              {activeTab === "settings" && (
                <SettingsTab />
              )}
              {activeTab === "admin" && (
                <AdminTab />
              )}
            </div>
          </div>
        </main>

        <footer className="h-9 border-t border-slate-200 bg-white flex items-center justify-between px-6 text-xs text-slate-500 shrink-0 no-print">
          <div className="flex items-center gap-4">
            <span>{t("Tizim holati")}: <span className="text-emerald-600 font-semibold">{t("ONLINE")}</span></span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline">{t("Faol xodim")}: <span className="text-slate-700 font-medium">{currentUser?.fullName}</span></span>
          </div>
          <div className="hidden sm:block">{t("Arxiv Departament")} &copy; {new Date().getFullYear()}</div>
        </footer>
      </div>
    </div>
  );
}

function LangToggle({ lang, setLang, compact }: { lang: string; setLang: (l: "cyrillic" | "latin") => void; compact?: boolean }) {
  return (
    <div className={`flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5 ${compact ? "text-[10px]" : "text-xs"}`}>
      {!compact && (
        <span className="text-slate-500 font-medium px-2 flex items-center gap-1">
          <Languages className="w-3.5 h-3.5" />
        </span>
      )}
      <button
        type="button"
        onClick={() => setLang("cyrillic")}
        className={`px-2 py-1 rounded-md transition-all cursor-pointer font-medium ${lang === "cyrillic" ? "bg-primary-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
      >
        Кирил
      </button>
      <button
        type="button"
        onClick={() => setLang("latin")}
        className={`px-2 py-1 rounded-md transition-all cursor-pointer font-medium ${lang === "latin" ? "bg-primary-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
      >
        Lotin
      </button>
    </div>
  );
}
