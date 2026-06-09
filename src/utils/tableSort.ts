/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDocumentPersonLabel } from "./format.ts";

export type SortDir = "asc" | "desc";

export function toggleSortKey<T extends string>(
  currentKey: T | null,
  currentDir: SortDir,
  nextKey: T
): { key: T; dir: SortDir } {
  if (currentKey !== nextKey) return { key: nextKey, dir: "asc" };
  return { key: nextKey, dir: currentDir === "asc" ? "desc" : "asc" };
}

function compareValues(a: string | number, b: string | number, dir: SortDir): number {
  const mult = dir === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * mult;
  }
  const as = String(a).toLowerCase();
  const bs = String(b).toLowerCase();
  if (as < bs) return -1 * mult;
  if (as > bs) return 1 * mult;
  return 0;
}

export type DocumentSortKey = "person" | "category" | "date" | "location" | "status";

export function sortDocuments(
  documents: any[],
  key: DocumentSortKey | null,
  dir: SortDir
): any[] {
  if (!key) return documents;

  return [...documents].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";

    switch (key) {
      case "person":
        av = getDocumentPersonLabel(a).name;
        bv = getDocumentPersonLabel(b).name;
        break;
      case "category":
        av = a.category?.name || "";
        bv = b.category?.name || "";
        break;
      case "date":
        av = new Date(a.docDate || a.receivedAt || 0).getTime();
        bv = new Date(b.docDate || b.receivedAt || 0).getTime();
        break;
      case "location":
        av = `${a.cabinet?.name || a.cabinetId}-${String(a.floor).padStart(2, "0")}`;
        bv = `${b.cabinet?.name || b.cabinetId}-${String(b.floor).padStart(2, "0")}`;
        break;
      case "status":
        av = a.status || "";
        bv = b.status || "";
        break;
    }

    return compareValues(av, bv, dir);
  });
}

export type AuditSortKey = "time" | "user" | "action" | "entity";

export function sortAuditLogs(
  logs: any[],
  key: AuditSortKey | null,
  dir: SortDir
): any[] {
  if (!key) return logs;

  return [...logs].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";

    switch (key) {
      case "time":
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
        break;
      case "user":
        av = a.userFullName || a.userId || "";
        bv = b.userFullName || b.userId || "";
        break;
      case "action":
        av = a.action || "";
        bv = b.action || "";
        break;
      case "entity":
        av = `${a.entityType || ""}${a.entityId || ""}`;
        bv = `${b.entityType || ""}${b.entityId || ""}`;
        break;
    }

    return compareValues(av, bv, dir);
  });
}
