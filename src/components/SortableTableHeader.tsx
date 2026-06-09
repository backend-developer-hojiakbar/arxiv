/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDir } from "../utils/tableSort.ts";

interface SortableTableHeaderProps {
  label: React.ReactNode;
  active: boolean;
  direction: SortDir;
  onSort: () => void;
  align?: "left" | "right" | "center";
  className?: string;
}

export default function SortableTableHeader({
  label,
  active,
  direction,
  onSort,
  align = "left",
  className = "",
}: SortableTableHeaderProps) {
  const alignClass =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th className={className}>
      <button
        type="button"
        onClick={onSort}
        className={`flex w-full items-center gap-1 ${alignClass} text-left font-semibold text-slate-600 transition-colors hover:text-primary-700`}
      >
        <span>{label}</span>
        <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary-600" : "text-slate-400"}`} />
      </button>
    </th>
  );
}
