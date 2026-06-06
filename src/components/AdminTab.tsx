/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { UserRole } from "../types.js";
import { 
  Users, 
  ShieldAlert, 
  UserPlus, 
  Check, 
  X, 
  AlertTriangle,
  History,
  Lock,
  Globe
} from "lucide-react";
import { useTranslation } from "./LanguageContext.tsx";

export default function AdminTab() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [loading, setLoading] = useState(false);

  // User form states
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.XODIM);
  const [password, setPassword] = useState("");
  const [userError, setUserError] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Edit User details states
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>(UserRole.XODIM);
  const [editPassword, setEditPassword] = useState("");
  const [editActive, setEditActive] = useState(true);

  const bootstrapAdminData = async () => {
    setLoading(true);
    setUserError("");
    try {
      if (activeTab === "users") {
        const data = await api.getUsers();
        setUsers(data);
      } else {
        const logs = await api.getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err: any) {
      setUserError(err.message || t("Ma'lumotlarni olishda xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrapAdminData();
  }, [activeTab]);

  // Submit User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    if (!username.trim() || !fullName.trim() || !password.trim()) {
      setUserError("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }
    if (password.length < 8) {
      setUserError(t("Parol uzunligi kamida 8 belgidan iborat bo'lishi shart!"));
      return;
    }

    try {
      await api.createUser({
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        role,
        password: password.trim()
      });
      setUsername("");
      setFullName("");
      setPassword("");
      setRole(UserRole.XODIM);
      bootstrapAdminData();
    } catch (err: any) {
      setUserError(err.message || t("Xatolik sodir bo'ldi"));
    }
  };

  // Start edit
  const startEditUser = (u: any) => {
    setEditingUserId(u.id);
    setEditFullName(u.fullName);
    setEditRole(u.role);
    setEditActive(u.isActive);
    setEditPassword("");
  };

  // Submit edit user
  const handleSaveEditUser = async (id: string) => {
    setUserError("");
    if (!editFullName.trim()) return;
    if (editPassword && editPassword.length < 8) {
      setUserError("Yangi yoziladigan parol kamida 8 belgidan iborat bo'lishi shart");
      return;
    }

    try {
      const payload: any = {
        fullName: editFullName.trim(),
        role: editRole,
        isActive: editActive,
      };
      if (editPassword) {
        payload.password = editPassword.trim();
      }
      await api.updateUser(id, payload);
      setEditingUserId(null);
      bootstrapAdminData();
    } catch (err: any) {
      setUserError(err.message || t("Saqlashda xatolik"));
    }
  };

  return (
    <div className="space-y-6 selection:bg-primary-100 selection:text-primary-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl page-title">
          {t("Administrator Boshqaruv Markazi")}
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {t("Fizik arxiv xodimlari hisoblari hamda tizimdagi barcha faoliyatlar audit jurnalini nazorat qilish")}
        </p>
      </div>

      {userError && (
        <div className="border border-slate-200 bg-neutral-50 p-3 text-xs font-mono text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-800 shrink-0" />
          <span>{userError}</span>
        </div>
      )}

      {/* Admin subtabs selector */}
      <div className="flex border border-slate-200 p-1 bg-slate-50 rounded-lg w-full sm:w-fit text-sm">
        <button
          onClick={() => setActiveTab("users")}
          className={`py-2 px-4 font-medium flex items-center gap-2 cursor-pointer rounded-md transition-all ${activeTab === "users" ? "bg-primary-600 text-white shadow-sm" : "hover:bg-white text-slate-700"}`}
        >
          <Users className="w-4 h-4" /> {t("Foydalanuvchilar hisoblari")}
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`py-2 px-4 font-medium flex items-center gap-2 cursor-pointer rounded-md transition-all ${activeTab === "audit" ? "bg-primary-600 text-white shadow-sm" : "hover:bg-white text-slate-700"}`}
        >
          <History className="w-4 h-4" /> {t("Audit tizim jurnali")}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">{t("Markaziy so'rov ko'rib chiqilmoqda...")}</div>
      ) : activeTab === "users" ? (
        /* USERS CRUD VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-none">
          
          {/* User addition Form */}
          <div className="border border-slate-200 p-5 bg-white space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <UserPlus className="w-4 h-4 text-slate-800" />
              <h3 className="font-sans font-bold uppercase text-xs tracking-widest text-slate-800">
                {t("YANGI FOYDALANUVChI QO'ShISh")}
              </h3>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1 font-semibold">
                  {t("Foydalanuvchi nomi (Login) (*)")}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("masalan: rustam_a")}
                  className="w-full bg-white border border-neutral-300 px-3 py-1.5 focus:border-slate-200 font-mono-normal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1 font-semibold">
                  {t("Xodim to'liq Ism-Familiyasi (*)")}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("Ism Familiya Otasining ismi")}
                  className="w-full bg-white border border-neutral-300 px-3 py-1.5 focus:border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1 font-semibold">
                  {t("Tizimdagi Rollari (*)")}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-white border border-neutral-300 px-3 py-1.5 focus:border-slate-200 cursor-pointer"
                >
                  <option value={UserRole.XODIM}>{t("Arxiv xodimi (Operator)")}</option>
                  <option value={UserRole.ADMIN}>{t("Administrator (To'liq admin)")}</option>
                  <option value={UserRole.VIEWER}>{t("Faqat ko'ruvchi (Rahbariyat)")}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> {t("Boshlang'ich parol (≥ 8 belgi) (*)")}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("Kamida 8 dona belgi")}
                  className="w-full bg-white border border-neutral-300 px-3 py-1.5 focus:border-slate-200 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white hover:bg-primary-700 py-2 px-4 font-mono text-xs uppercase font-bold tracking-wider cursor-pointer"
                >
                  {t("Foydalanuvchi qo'shish")}
                </button>
              </div>
            </form>
          </div>

          {/* Users grid list */}
          <div className="lg:col-span-2 border border-slate-200 overflow-hidden bg-white">
            <div className="bg-primary-900 px-4 py-3 text-white flex justify-between items-center text-xs font-mono font-bold uppercase tracking-wider">
              <span>{t("Mavjud foiz xodimlari")}</span>
              <span>{t("Ro'yxati")}</span>
            </div>

            <div className="divide-y divide-neutral-200">
              {users.map((u) => {
                const isEditing = editingUserId === u.id;
                return (
                  <div key={u.id} className="p-4 bg-white transition-colors hover:bg-neutral-50">
                    {isEditing ? (
                      /* Inline editing inputs */
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-neutral-400 font-bold">Xodim F.I.Sh:</label>
                            <input
                              type="text"
                              value={editFullName}
                              onChange={(e) => setEditFullName(e.target.value)}
                              className="w-full bg-white border border-neutral-300 px-2 py-1"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-neutral-400 font-bold">{t("Roli:")}</label>
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as UserRole)}
                              className="w-full bg-white border border-neutral-300 px-2 py-1 cursor-pointer"
                            >
                              <option value={UserRole.XODIM}>{t("Arxiv xodimi (Operator)")}</option>
                              <option value={UserRole.ADMIN}>{t("Administrator (To'liq admin)")}</option>
                              <option value={UserRole.VIEWER}>{t("Faqat ko'ruvchi (Rahbariyat)")}</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-neutral-400 font-bold">{t("Yangi parol (Bo'sh qo'yilishi mumkin):")}</label>
                          <input
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder={t("O'zgartirmaslik uchun bo'sh qoldiring")}
                            className="w-full bg-white border border-neutral-300 px-2 py-1 font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 py-1">
                          <input
                            type="checkbox"
                            id={`user-active-${u.id}`}
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                            className="cursor-pointer"
                          />
                          <label htmlFor={`user-active-${u.id}`} className="text-[11px] font-medium font-bold text-neutral-500 cursor-pointer">
                            {t("Xodim faol va ishlashi mumkin")}
                          </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-2.5 py-1 border border-neutral-400 hover:border-slate-200 text-[11px] font-medium cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 inline mr-1" /> {t("Bekor qilish")}
                          </button>
                          <button
                            onClick={() => handleSaveEditUser(u.id)}
                            className="px-3 py-1 bg-primary-600 text-white hover:bg-primary-700 text-[11px] font-medium font-bold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 inline mr-1" /> {t("Saqlash")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display details */
                      <div className="flex justify-between items-start gap-4 text-xs font-sans">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-slate-800 leading-none">{u.fullName}</span>
                            <span className="text-[11px] font-medium font-black bg-neutral-100 px-1.5 py-0.5 border border-neutral-200">
                              @{u.username}
                            </span>
                            <span className={`font-mono text-[9.5px] uppercase font-bold border px-1.5 py-0.2 ml-1 ${u.role === 'admin' ? 'border-slate-200 text-slate-800 bg-primary-600 text-white' : u.role === 'xodim' ? 'border-neutral-400 text-neutral-700 bg-white' : 'border-neutral-200 text-neutral-400 bg-white'}`}>
                              {u.role === 'admin' ? t("Administrator") : u.role === 'xodim' ? t("Xodim") : t("Ko'ruvchi")}
                            </span>
                            {!u.isActive && (
                              <span className="text-[9px] font-mono font-bold border border-red-200 text-red-500 px-1 bg-red-50 uppercase">{t("Bloklangan")}</span>
                            )}
                          </div>
                          
                          <p className="text-[10px] text-neutral-400 font-mono">
                            {t("Arxivga kiritildi:")} {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                          {u.lastLoginAt ? (
                            <p className="text-[10px] text-neutral-500 font-mono">
                              {t("Oxirgi tizim faolligi:")} {new Date(u.lastLoginAt).toLocaleString("uz-UZ")}
                            </p>
                          ) : (
                            <p className="text-[10px] text-neutral-300 font-mono italic">
                              {t("Hali tizimga kirmagan")}
                            </p>
                          )}
                        </div>

                        {/* Can't edit yourself to prevent self de-activation lockouts */}
                        <button
                          disabled={u.id === "u-1"}
                          onClick={() => startEditUser(u)}
                          className="px-2 py-1.5 border border-neutral-300 hover:border-slate-200 text-[11px] font-medium font-bold text-neutral-500 hover:text-slate-800 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        >
                          {t("Tahrirlash")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* AUDIT SYSTEM LOGS TIMELINE LIST */
        <div className="border border-slate-200 bg-white">
          <div className="bg-primary-900 px-4 py-3 text-white flex justify-between items-center text-xs font-mono font-bold uppercase tracking-wider border-b border-slate-200">
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-white" /> {t("Xavfsizlik Audit Jurnali")}</span>
            <span>{t("Jami")} {auditLogs.length} {t("ta yozuv")}</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="border-b border-neutral-300 text-xs font-medium text-neutral-400 bg-neutral-50">
                  <th className="py-2 px-3">Log vaqti & Sana</th>
                  <th className="py-2 px-3">Tizim Foydalanuvchisi</th>
                  <th className="py-2 px-3">Bajarilgan Amallar</th>
                  <th className="py-2 px-3">Kategoriya burchagi</th>
                  <th className="py-2 px-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-[11px] font-mono text-neutral-600">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-2 px-3 font-semibold text-neutral-500">
                      {new Date(log.createdAt).toLocaleString("uz-UZ")}
                    </td>
                    <td className="py-2 px-3 font-sans text-xs text-slate-800 font-semibold">
                      {log.userFullName}
                    </td>
                    <td className="py-2 px-3 text-slate-800 font-semibold font-mono text-xs">
                      {log.action}
                    </td>
                    <td className="py-2 px-3 text-neutral-400 uppercase text-[9.5px]">
                      {log.entityType} ({log.entityId || "system"})
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-neutral-600">
                      {log.ip}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-neutral-400 uppercase font-bold">
                      {t("Audit jurnali bo'sh")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
