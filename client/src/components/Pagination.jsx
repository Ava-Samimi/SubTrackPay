import React from "react";
import "./Pagination.css";

/**
 * Reusable Pagination
 *
 * Props:
 * - page: number (1-based)
 * - pageSize: number
 * - total: number (total rows)
 * - onPageChange: (nextPage:number) => void
 * - maxButtons: number (how many page buttons to show)
 */
export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  maxButtons = 7,
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  if (totalPages <= 1) return null;

  const clamp = (n) => Math.min(totalPages, Math.max(1, n));

  const makeRange = (start, end) => {
    const out = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  };

  // windowed pages: e.g. 1 ... 4 5 6 ... 20
  const half = Math.floor(maxButtons / 2);
  let start = clamp(page - half);
  let end = clamp(start + maxButtons - 1);
  start = clamp(end - maxButtons + 1);

  const pages = makeRange(start, end);

  const showLeftEllipsis = start > 2;
  const showRightEllipsis = end < totalPages - 1;

  return (
    <div className="pg-wrap">
      <button
        className="pg-btn"
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        title="First"
      >
        {"<<"}
      </button>

      <button
        className="pg-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        title="Prev"
      >
        {"<"}
      </button>

      {/* Always show page 1 if we’re not already near it */}
      {start > 1 && (
        <button className="pg-btn" onClick={() => onPageChange(1)}>
          1
        </button>
      )}

      {showLeftEllipsis && <span className="pg-ellipsis">…</span>}

      {pages.map((p) => (
        <button
          key={p}
          className={`pg-btn ${p === page ? "active" : ""}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {showRightEllipsis && <span className="pg-ellipsis">…</span>}

      {/* Always show last page if we’re not already near it */}
      {end < totalPages && (
        <button className="pg-btn" onClick={() => onPageChange(totalPages)}>
          {totalPages}
        </button>
      )}

      <button
        className="pg-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        title="Next"
      >
        {">"}
      </button>

      <button
        className="pg-btn"
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        title="Last"
      >
        {">>"}
      </button>

      <div className="pg-meta">
        Page {page} / {totalPages} • {total} rows
      </div>
    </div>
  );
}
