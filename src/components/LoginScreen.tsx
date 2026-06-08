/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { api } from "../api.js";
import { LogIn } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "./LanguageContext.tsx";
import LanguageToggle from "./LanguageToggle.tsx";
import AppLogo from "./AppLogo.tsx";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lang, setLang, t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(t("Iltimos, maydonlarni to'ldiring"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.login(username.trim(), password.trim());
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || t("Tizimga kirishda xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between p-6 sm:p-10 font-sans">
      <div className="flex justify-between items-center w-full max-w-5xl mx-auto pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <AppLogo size="md" />
          <div>
            <p className="text-sm text-slate-500">
              {t("Farg'ona Jamoat Salomatligi Tibbiyot Instituti")}
            </p>
            <h1 className="text-xl font-semibold text-primary-900 mt-0.5">
              {t("Inkubatsiya va Akseleratsiya markazi")}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <LanguageToggle lang={lang} setLang={setLang} />
          <span className="hidden md:block text-xs text-slate-400">
            {t("Hujjatlarni boshqarish tizimi")}
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-10">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md card p-8"
        >
          <div className="mb-6 flex flex-col items-center text-center sm:items-start sm:text-left">
            <AppLogo size="lg" className="mb-4 sm:hidden" />
            <h2 className="text-xl font-semibold text-primary-900">
              {t("Tizimga kirish")}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {t("Arxiv hisobiga bog'lanish uchun quyidagi parametrlarni kiriting")}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 border border-red-200 bg-red-50 p-3 text-sm flex items-start gap-2 rounded-lg"
            >
              <span className="badge bg-red-600 text-white border-0 shrink-0">{t("Xato")}</span>
              <span className="text-red-800 font-medium text-plain">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">
                {t("Foydalanuvchi nomi (Username)")}
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("Masalan: xodim yoki admin")}
                className="w-full bg-white border border-slate-300 hover:border-slate-400 px-4 py-2.5 rounded-lg transition-all disabled:bg-slate-100 text-sm"
              />
            </div>

            <div>
              <label className="field-label">
                {t("Tizim paroli (Password)")}
              </label>
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 hover:border-slate-400 px-4 py-2.5 rounded-lg transition-all disabled:bg-slate-100 text-sm"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t("Yuklanmoqda...")}
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {t("Tizimga Kirish")}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      <div className="w-full max-w-5xl mx-auto border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
        <div>
          &copy; {new Date().getFullYear()} {t("Inkubatsiya va Akseleratsiya markazi. Barcha huquqlar himoyalangan.")}
        </div>
        <div>
          <span>{t("Xavfsizlik sertifikatlangan")}</span>
        </div>
      </div>
    </div>
  );
}
