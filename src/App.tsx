/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
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
import { Menu } from "lucide-react";
import { useTranslation } from "./components/LanguageContext.tsx";
import LanguageToggle from "./components/LanguageToggle.tsx";
import AppLogo from "./components/AppLogo.tsx";

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
  const [dataRevision, setDataRevision] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const { lang, setLang, t } = useTranslation();

  const notifyDataChange = useCallback(() => {
    setDataRevision((v) => v + 1);
  }, []);

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
        <div className="flex flex-col items-center gap-6 px-6 text-center">
          <AppLogo size="2xl" className="shadow-md ring-4 ring-white" />
          <div className="h-9 w-9 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">{t("Sessiya tekshirilmoqda...")}</span>
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
            <AppLogo size="xs" />
            <h1 className="text-sm font-semibold text-primary-900">{t("FJSTI Arxivi")}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageToggle lang={lang} setLang={setLang} compact />
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
          
          <LanguageToggle lang={lang} setLang={setLang} />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-100">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="no-print">
              {visitedTabs.has("dashboard") && (
                <TabPanel tabId="dashboard" activeTab={activeTab}>
                  <DashboardTab
                    onNavigateToTab={handleNavWithFilters}
                    dataRevision={dataRevision}
                    currentUser={currentUser}
                    onDataChange={notifyDataChange}
                  />
                </TabPanel>
              )}
              {visitedTabs.has("search") && (
                <TabPanel tabId="search" activeTab={activeTab}>
                  <SearchTab
                    initialFilters={tabFilters}
                    dataRevision={dataRevision}
                    currentUser={currentUser}
                    onDataChange={notifyDataChange}
                  />
                </TabPanel>
              )}
              {isDocRole && visitedTabs.has("intake") && (
                <TabPanel tabId="intake" activeTab={activeTab}>
                  <IntakeTab
                    onNavigateToTab={handleTabChange}
                    onDataChange={notifyDataChange}
                  />
                </TabPanel>
              )}
              {visitedTabs.has("documents") && (
                <TabPanel tabId="documents" activeTab={activeTab}>
                  <RepositoryTab
                    currentUser={currentUser}
                    dataRevision={dataRevision}
                    onDataChange={notifyDataChange}
                  />
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

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-2.5 sm:px-6 no-print">
          <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-1">
              <p>
                <span className="font-medium text-slate-600">{t("Qo'llab-quvvatlovchi")}:</span>{" "}
                <span className="uppercase tracking-wide text-slate-700">
                  {t("Farg'ona Jamoat Salomatligi Tibbiyot Instituti")}
                </span>
              </p>
              <p>
                <span className="font-medium text-slate-600">{t("Yaratuvchi")}:</span>{" "}
                <span className="text-slate-700">{t("Inkubatsiya va Akseleratsiya markazi")}</span>
              </p>
            </div>
            <span className="shrink-0 text-slate-400">
              {t("FJSTI Arxivi")} &copy; {new Date().getFullYear()}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

