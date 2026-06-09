/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import type { ExpiryFilter } from "../utils/tableSort.ts";

interface ExpiryFilterHeaderProps {
  label: string;
  filter: ExpiryFilter;
  sublabel: string;
  onCycle: () => void;
  className?: string;
}

export default function ExpiryFilterHeader({
  label,
  filter,
  sublabel,
  onCycle,
  className = "",
}: ExpiryFilterHeaderProps) {
  return (
    <th className={className}>
      <button
        type="button"
        onClick={onCycle}
        className={`sortable-th-btn expiry-filter-btn ${
          filter !== "all" ? "sortable-th-btn--active" : ""
        }`}
      >
        <span className="sortable-th-label">{label}</span>
        <span className={`expiry-filter-pill expiry-filter-pill--${filter}`}>{sublabel}</span>
      </button>
    </th>
  );
}
