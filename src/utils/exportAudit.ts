/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type AuditRow = {
  createdAt: string;
  userFullName: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  ip?: string;
};

function csvCell(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function downloadAuditExcel(logs: AuditRow[], filenamePrefix = "audit_jurnali") {
  const headers = ["Vaqt", "Foydalanuvchi", "Foydalanuvchi ID", "Amal", "Ob'ekt turi", "Ob'ekt ID", "IP"];
  const rows = logs.map((log) => [
    new Date(log.createdAt).toLocaleString("uz-UZ"),
    log.userFullName || "",
    log.userId || "",
    log.action || "",
    log.entityType || "",
    log.entityId || "",
    log.ip || "",
  ]);

  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
