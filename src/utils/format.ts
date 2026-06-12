/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentStatus } from "../types.ts";

export function formatPersonName(
  person?: {
    lastName?: string;
    firstName?: string;
    middleName?: string;
  } | null,
  fallback = "—"
): string {
  if (!person) return fallback;
  return [person.lastName, person.firstName, person.middleName]
    .filter(Boolean)
    .join(" ")
    .trim() || fallback;
}

export function getDocumentLocationLabel(doc: {
  cabinet?: { name?: string } | null;
  cabinetId?: string;
  floor?: number;
  notes?: string | null;
}): string {
  const cabinet = doc.cabinet?.name || doc.cabinetId || "noma'lum shkaf";
  const floor = doc.floor ?? "?";
  let text = `${cabinet}, ${floor}-qavat`;
  if (doc.notes?.trim()) {
    text += `. ${doc.notes.trim()}`;
  }
  return text;
}

export function formatDocumentForVoice(doc: {
  docName?: string;
  floor?: number;
  notes?: string | null;
  cabinet?: { name?: string } | null;
  cabinetId?: string;
  category?: { name?: string } | null;
  student?: { lastName?: string; firstName?: string; middleName?: string; studentId?: string } | null;
  employee?: { lastName?: string; firstName?: string; middleName?: string; employeeId?: string } | null;
  studentName?: string | null;
  employeeName?: string | null;
  personType?: string;
}) {
  const person = getDocumentPersonLabel(doc);
  const locationText = getDocumentLocationLabel(doc);
  return {
    person_name: person.name,
    person_type: person.type,
    doc_name: doc.docName || "",
    category_name: doc.category?.name || "",
    cabinet_name: doc.cabinet?.name || doc.cabinetId || "",
    floor: doc.floor,
    location_text: locationText,
    verbal: `${person.name}. Hujjat: ${doc.docName || "hujjat"}. Joylashuv: ${locationText}.`,
  };
}

export function getDocumentPersonLabel(doc: {
  student?: { lastName?: string; firstName?: string; middleName?: string; studentId?: string } | null;
  employee?: { lastName?: string; firstName?: string; middleName?: string; employeeId?: string } | null;
  studentName?: string | null;
  employeeName?: string | null;
  personType?: string;
  docName?: string;
}): { name: string; subtitle: string; type: "student" | "employee" | "institut" } {
  if (doc.student || doc.studentName) {
    return {
      name: doc.student ? formatPersonName(doc.student) : doc.studentName || "—",
      subtitle: doc.student?.studentId ? `ID: ${doc.student.studentId}` : "Talaba",
      type: "student",
    };
  }
  if (doc.employee || doc.employeeName) {
    return {
      name: doc.employee ? formatPersonName(doc.employee) : doc.employeeName || "—",
      subtitle: doc.employee?.employeeId ? `ID: ${doc.employee.employeeId}` : "Xodim",
      type: "employee",
    };
  }
  return {
    name: doc.docName || "Institut hujjati",
    subtitle: "Umumiy hujjat",
    type: "institut",
  };
}

export function isDocumentExpired(expiryYear?: number | null): boolean {
  if (expiryYear == null || Number.isNaN(expiryYear)) return false;
  return new Date().getFullYear() > expiryYear;
}

export function getDocumentRowClass(expired: boolean, base = "group cursor-pointer"): string {
  if (expired) {
    return `${base} bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500`;
  }
  return `${base} hover:bg-slate-50`;
}

export function getExpiryBadgeClass(expired: boolean): string {
  return expired ? "status-badge status-eskirgan" : "status-badge status-yaroqli";
}

export function getStatusStyle(status: string): string {
  switch (status) {
    case DocumentStatus.JOYIDA:
      return "status-badge status-joyida";
    case DocumentStatus.BERILGAN:
      return "status-badge status-berilgan";
    case DocumentStatus.YOQ_QILINGAN:
      return "status-badge status-yoq";
    default:
      return "status-badge status-neutral";
  }
}
