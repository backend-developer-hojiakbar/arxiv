/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ListFilter } from "lucide-react";
import type { ExpiryFilter } from "../utils/tableSort.ts";

interface ExpiryFilterHeaderProps {
  label: string;
  filter: ExpiryFilter;
  onCycle: () => void;
  className?: string;
}

export default function ExpiryFilterHeader({
  label,
  filter,
  onCycle,
  className = "",
}: ExpiryFilterHeaderProps) {
  const active = filter !== "all";

  return (
    <th className={className}>
      <button
        type="button"
        onClick={onCycle}
        className={`sortable-th-btn ${active ? "sortable-th-btn--active" : ""}`}
        title={
          filter === "all"
            ? label
            : filter === "expired"
              ? `${label} — Eskirgan`
              : `${label} — Amalda`
        }
      >
        <span className="sortable-th-label">{label}</span>
        <span className="expiry-filter-indicator" aria-hidden>
          <ListFilter className="expiry-filter-icon" strokeWidth={2.5} />
          {filter === "expired" && <span className="expiry-filter-dot expiry-filter-dot--expired" />}
          {filter === "active" && <span className="expiry-filter-dot expiry-filter-dot--active" />}
        </span>
      </button>
    </th>
  );
}
