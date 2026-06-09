/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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

  return (
    <th className={className}>
      <button
        type="button"
        onClick={onSort}
        className={`sortable-th-btn ${active ? "sortable-th-btn--active" : ""} ${alignClass}`}
      >
        <span className="sortable-th-label">{label}</span>
        <span className="sortable-th-indicator" aria-hidden>
          <ChevronUp
            className={`sortable-th-chevron sortable-th-chevron--up ${
              active && direction === "asc" ? "sortable-th-chevron--on" : ""
            }`}
          />
          <ChevronDown
            className={`sortable-th-chevron sortable-th-chevron--down ${
              active && direction === "desc" ? "sortable-th-chevron--on" : ""
            }`}
          />
        </span>
      </button>
    </th>
  );
}
