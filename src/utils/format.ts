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
