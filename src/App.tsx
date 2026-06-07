/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type ReactNode } from "react";
import LoginScreen from "./components/LoginScreen.tsx";
import Sidebar from "./components/Sidebar.tsx";
import DashboardTab from "./components/DashboardTab.tsx";
import SearchTab from "./components/SearchTab.tsx";
import IntakeTab from "./components/IntakeTab.tsx";
import RepositoryTab from "./components/RepositoryTab.tsx";
import SettingsTab from "./components/SettingsTab.tsx";
import AdminTab from "./components/AdminTab.tsx";
import { api, removeAuthToken } from "./api.ts";
import { UserRole } from "./types.ts";
import { Menu, Languages } from "lucide-react";
import { useTranslation } from "./components/LanguageContext.tsx";

const VALID_TABS = new Set(["dashboard", "search", "intake", "documents", "settings", "admin"]);

function getTabFromUrl(): string {
  const tab = new URLSearchParams(window.location.search).get("tab") || "";
  return VALID_TABS.has(tab) ? tab : "dashboard";
}

function tabAllowedForUser(tab: string, user: { role?: string } | null): boolean {
  if (!VALID_TABS.has(tab)) return false;
  if (!user) return tab === "dashboard";
  if ((tab === "intake" || tab === "settings") && user.role === UserRole.VIEWER) return false;
  if (tab === "admin" && user.role !== UserRole.ADMIN) return false;
  return true;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: "Dashboard // Umumiy Statistika",
  search: "Qidiruv (Search) // Hujjatlar Qidiruvi",
  intake: "Hujjat qabul (Intake) // Yangi Hujjat Qo'shish",
  documents: "Hujjatlar ro'yxati // Arxiv Hujjatlari Ombori",
  settings: "Kategoriyalar & Shkaflar // Tizim Spravochniklari",
  admin: "Admin panel // Foydalanuvchilar boshqaruvi",
};

type AuthState = "loading" | "authenticated" | "unauthenticated";

function TabPanel({
  tabId,
  activeTab,
  children,
}: {
  tabId: string;
  activeTab: string;
  children: ReactNode;
}) {
  const isActive = activeTab === tabId;
  return (
    <div role="tabpanel" hidden={!isActive} aria-hidden={!isActive} className={isActive ? "" : "hidden"}>
      {children}
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authState, setAuthState] = useState<AuthState>(() =>
    localStorage.getItem("arxiv_auth_token") ? "loading" : "unauthenticated"
  );
  const [activeTab, setActiveTab] = useState<string>(getTabFromUrl);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set([getTabFromUrl()]));
  const [tabFilters, setTabFilters] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const { lang, setLang, t } = useTranslation();

  const isDocRole = currentUser?.role !== UserRole.VIEWER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  useEffect(() => {
    if (!currentUser) return;
    setActiveTab((prev) => (tabAllowedForUser(prev, currentUser) ? prev : "dashboard"));
  }, [currentUser]);

  useEffect(() => {
    if (authState !== "authenticated") return;
    const url = new URL(window.location.href);
    if (activeTab === "dashboard") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", activeTab);
    }
    const next = `${url.pathname}${url.search}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [activeTab, authState]);

  useEffect(() => {
    const onPopState = () => {
      const tab = getTabFromUrl();
      if (tabAllowedForUser(tab, currentUser)) {
        setActiveTab(tab);
        setTabFilters(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [currentUser]);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem("arxiv_auth_token");
      if (!savedToken) {
        setAuthState("unauthenticated");
        return;
      }

      try {
        const user = await api.getMe();
        setCurrentUser(user);
        setAuthState("authenticated");
      } catch {
        removeAuthToken();
        setCurrentUser(null);
        setAuthState("unauthenticated");
      }
    };

    restoreSession();
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setAuthState("authenticated");
    const tab = getTabFromUrl();
    setActiveTab(tabAllowedForUser(tab, user) ? tab : "dashboard");
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      removeAuthToken();
    }
    setCurrentUser(null);
    setAuthState("unauthenticated");
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setTabFilters(null);
  };

  const handleNavWithFilters = (tabId: string, filters?: any) => {
    setTabFilters(filters || null);
    setActiveTab(tabId);
  };

  if (authState === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <span className="text-sm text-slate-500">{t("Sessiya tekshirilmoqda...")}</span>
        </div>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

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
          
          <LangToggle lang={lang} setLang={setLang} />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-100">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="no-print">
              {visitedTabs.has("dashboard") && (
                <TabPanel tabId="dashboard" activeTab={activeTab}>
                  <DashboardTab onNavigateToTab={handleNavWithFilters} />
                </TabPanel>
              )}
              {visitedTabs.has("search") && (
                <TabPanel tabId="search" activeTab={activeTab}>
                  <SearchTab initialFilters={tabFilters} />
                </TabPanel>
              )}
              {isDocRole && visitedTabs.has("intake") && (
                <TabPanel tabId="intake" activeTab={activeTab}>
                  <IntakeTab onNavigateToTab={handleTabChange} />
                </TabPanel>
              )}
              {visitedTabs.has("documents") && (
                <TabPanel tabId="documents" activeTab={activeTab}>
                  <RepositoryTab currentUser={currentUser} />
                </TabPanel>
              )}
              {isDocRole && visitedTabs.has("settings") && (
                <TabPanel tabId="settings" activeTab={activeTab}>
                  <SettingsTab />
                </TabPanel>
              )}
              {isAdmin && visitedTabs.has("admin") && (
                <TabPanel tabId="admin" activeTab={activeTab}>
                  <AdminTab />
                </TabPanel>
              )}
            </div>
          </div>
        </main>

        <footer className="h-9 border-t border-slate-200 bg-white flex items-center justify-end px-6 text-xs text-slate-400 shrink-0 no-print">
          <span>{t("Arxiv Departament")} &copy; {new Date().getFullYear()}</span>
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
