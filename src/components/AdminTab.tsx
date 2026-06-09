/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from "react";
import { api } from "../api.js";
import { UserRole } from "../types.js";
import {
  Users,
  ShieldAlert,
  UserPlus,
  Check,
  X,
  Lock,
  ScrollText,
  Download,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "./LanguageContext.tsx";
import { downloadAuditExcel } from "../utils/exportAudit.ts";
import SortableTableHeader from "./SortableTableHeader.tsx";
import {
  type AuditSortKey,
  type SortDir,
  sortAuditLogs,
  toggleSortKey,
} from "../utils/tableSort.ts";

const AUDIT_UI_LIMIT = 10;
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500";

function roleBadgeClass(role: string): string {
  if (role === UserRole.ADMIN) return "badge badge-primary";
  if (role === UserRole.XODIM) return "badge badge-neutral";
  return "badge badge-neutral";
}

function roleLabel(role: string, t: (s: string) => string): string {
  if (role === UserRole.ADMIN) return t("Administrator");
  if (role === UserRole.XODIM) return t("Xodim");
  return t("Ko'ruvchi");
}

export default function AdminTab() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [auditSortKey, setAuditSortKey] = useState<AuditSortKey | null>(null);
  const [auditSortDir, setAuditSortDir] = useState<SortDir>("asc");

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.XODIM);
  const [password, setPassword] = useState("");
  const [userError, setUserError] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>(UserRole.XODIM);
  const [editPassword, setEditPassword] = useState("");
  const [editActive, setEditActive] = useState(true);

  const bootstrapAdminData = async () => {
    setUsersLoading(true);
    setUserError("");
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setUserError(err.message || t("Ma'lumotlarni olishda xatolik yuz berdi"));
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const logs = await api.getAuditLogs(1, AUDIT_UI_LIMIT);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error("Audit logs load error", err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleExportAudit = async () => {
    setExporting(true);
    try {
      const logs = await api.getAllAuditLogs();
      if (!logs.length) {
        alert(t("Eksport qilish uchun yozuvlar yo'q"));
        return;
      }
      downloadAuditExcel(logs);
    } catch (err: any) {
      alert(err.message || t("Excel yuklab olishda xatolik"));
    } finally {
      setExporting(false);
    }
  };

  const handleAuditSort = (key: AuditSortKey) => {
    const next = toggleSortKey(auditSortKey, auditSortDir, key);
    setAuditSortKey(next.key);
    setAuditSortDir(next.dir);
  };

  const sortedAuditLogs = useMemo(
    () => sortAuditLogs(auditLogs, auditSortKey, auditSortDir),
    [auditLogs, auditSortKey, auditSortDir]
  );

  useEffect(() => {
    bootstrapAdminData();
    loadAuditLogs();
  }, []);

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
        password: password.trim(),
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

  const startEditUser = (u: any) => {
    setEditingUserId(u.id);
    setEditFullName(u.fullName);
    setEditRole(u.role);
    setEditActive(u.isActive);
    setEditPassword("");
  };

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
    <div className="space-y-8 selection:bg-primary-100 selection:text-primary-900">
      <div className="page-header">
        <h2 className="page-title">{t("Administrator Boshqaruv Markazi")}</h2>
        <p className="page-subtitle">
          {t("Fizik arxiv xodimlari hisoblarini boshqarish")}
        </p>
      </div>

      {userError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{userError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
        <div className="card space-y-5 p-6 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <UserPlus className="h-4 w-4" />
            </div>
            <h3 className="card-section-title">{t("Yangi foydalanuvchi qo'shish")}</h3>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="field-label">{t("Foydalanuvchi nomi (Login) (*)")}</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("masalan: rustam_a")}
                className={`${inputClass} font-mono-normal`}
              />
            </div>

            <div>
              <label className="field-label">{t("Xodim to'liq Ism-Familiyasi (*)")}</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("Ism Familiya Otasining ismi")}
                className={inputClass}
              />
            </div>

            <div>
              <label className="field-label">{t("Tizimdagi Rollari (*)")}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className={inputClass}
              >
                <option value={UserRole.XODIM}>{t("Arxiv xodimi (Operator)")}</option>
                <option value={UserRole.ADMIN}>{t("Administrator (To'liq admin)")}</option>
                <option value={UserRole.VIEWER}>{t("Faqat ko'ruvchi (Rahbariyat)")}</option>
              </select>
            </div>

            <div>
              <label className="field-label flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                {t("Boshlang'ich parol (≥ 8 belgi) (*)")}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("Kamida 8 dona belgi")}
                className={`${inputClass} font-mono`}
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              {t("Foydalanuvchi qo'shish")}
            </button>
          </form>
        </div>

        <div className="card overflow-hidden !p-0 lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary-600" />
              <h3 className="card-section-title">{t("Foydalanuvchilar")}</h3>
              <span className="badge badge-neutral">{users.length}</span>
            </div>
            {usersLoading && (
              <span className="text-xs text-slate-500">{t("Yuklanmoqda...")}</span>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {usersLoading && users.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                {t("Ro'yxat yuklanmoqda...")}
              </div>
            ) : (
              users.map((u) => {
                const isEditing = editingUserId === u.id;
                return (
                  <div key={u.id} className="bg-white p-5 transition-colors hover:bg-slate-50/80">
                    {isEditing ? (
                      <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="field-label">Xodim F.I.Sh</label>
                            <input
                              type="text"
                              value={editFullName}
                              onChange={(e) => setEditFullName(e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="field-label">{t("Roli:")}</label>
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as UserRole)}
                              className={inputClass}
                            >
                              <option value={UserRole.XODIM}>{t("Arxiv xodimi (Operator)")}</option>
                              <option value={UserRole.ADMIN}>{t("Administrator (To'liq admin)")}</option>
                              <option value={UserRole.VIEWER}>{t("Faqat ko'ruvchi (Rahbariyat)")}</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="field-label">
                            {t("Yangi parol (Bo'sh qo'yilishi mumkin):")}
                          </label>
                          <input
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder={t("O'zgartirmaslik uchun bo'sh qoldiring")}
                            className={`${inputClass} font-mono`}
                          />
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                            className="rounded border-slate-300"
                          />
                          {t("Xodim faol va ishlashi mumkin")}
                        </label>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="btn-secondary"
                          >
                            <X className="h-3.5 w-3.5" /> {t("Bekor qilish")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditUser(u.id)}
                            className="btn-primary"
                          >
                            <Check className="h-3.5 w-3.5" /> {t("Saqlash")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold text-slate-800 text-plain">
                              {u.fullName}
                            </span>
                            <span className="badge badge-neutral font-mono text-xs">
                              @{u.username}
                            </span>
                            <span className={roleBadgeClass(u.role)}>
                              {roleLabel(u.role, t)}
                            </span>
                            {!u.isActive && (
                              <span className="badge border border-red-200 bg-red-50 text-red-600">
                                {t("Bloklangan")}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>
                              {t("Arxivga kiritildi:")}{" "}
                              {new Date(u.createdAt).toLocaleDateString("uz-UZ")}
                            </span>
                            {u.lastLoginAt ? (
                              <span>
                                {t("Oxirgi tizim faolligi:")}{" "}
                                {new Date(u.lastLoginAt).toLocaleString("uz-UZ")}
                              </span>
                            ) : (
                              <span className="italic text-slate-400">
                                {t("Hali tizimga kirmagan")}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={u.id === "u-1"}
                          onClick={() => startEditUser(u)}
                          className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {t("Tahrirlash")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <div>
              <h3 className="card-section-title">{t("Audit jurnali")}</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {t("Oxirgi 10 ta yozuv ko'rsatiladi. To'liq tarix Excel faylida yuklab olinadi.")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={loadAuditLogs}
              disabled={auditLoading}
              className="btn-secondary"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${auditLoading ? "animate-spin" : ""}`} />
              {t("Yangilash")}
            </button>
            <button
              type="button"
              onClick={handleExportAudit}
              disabled={exporting}
              className="btn-primary"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? t("Yuklanmoqda...") : t("Excel ga yuklash")}
            </button>
          </div>
        </div>

        {auditLoading && auditLogs.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">{t("Jurnal yuklanmoqda...")}</div>
        ) : auditLogs.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">{t("Hozircha yozuvlar yo'q")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left">
              <thead>
                <tr>
                  <th className="col-index">{t("№")}</th>
                  <SortableTableHeader
                    label={t("Vaqt")}
                    active={auditSortKey === "time"}
                    direction={auditSortDir}
                    onSort={() => handleAuditSort("time")}
                  />
                  <SortableTableHeader
                    label={t("Foydalanuvchi")}
                    active={auditSortKey === "user"}
                    direction={auditSortDir}
                    onSort={() => handleAuditSort("user")}
                  />
                  <SortableTableHeader
                    label={t("Amal")}
                    active={auditSortKey === "action"}
                    direction={auditSortDir}
                    onSort={() => handleAuditSort("action")}
                  />
                  <SortableTableHeader
                    label={t("Ob'ekt")}
                    active={auditSortKey === "entity"}
                    direction={auditSortDir}
                    onSort={() => handleAuditSort("entity")}
                  />
                </tr>
              </thead>
              <tbody>
                {sortedAuditLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="col-index font-mono text-xs text-slate-500">{index + 1}</td>
                    <td className="whitespace-nowrap text-slate-500">
                      {new Date(log.createdAt).toLocaleString("uz-UZ")}
                    </td>
                    <td className="text-plain font-medium text-slate-800">
                      {log.userFullName || log.userId}
                    </td>
                    <td className="text-slate-700">{log.action}</td>
                    <td className="text-slate-600">
                      {log.entityType}
                      {log.entityId ? (
                        <span className="ml-1 font-mono text-xs text-slate-400">
                          {log.entityId.length > 12
                            ? `${log.entityId.slice(0, 12)}…`
                            : log.entityId}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
