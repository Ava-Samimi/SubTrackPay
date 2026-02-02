import { useMemo, useEffect, useState } from "react";
import EntityNavBar from "../../components/EntityNavBar.jsx";
import EntityLeftHeader from "../../components/EntityLeftHeader.jsx";
import "../shared/EntityPage.css";
import { useCustomersPage } from "./hooks/useCustomersPage.js";

function fullName(c) {
  const fn = (c?.firstName || "").trim();
  const ln = (c?.lastName || "").trim();
  const name = `${fn} ${ln}`.trim();
  return name || "(no name)";
}

// ✅ CSV helpers
function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Quote if needed
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCsv(headers, rows) {
  const head = headers.map(csvEscape).join(",");
  const body = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  return `${head}\n${body}\n`;
}

function downloadTextFile({ filename, text, mime = "text/plain;charset=utf-8" }) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function CustomersPage() {
  const {
    customers,
    subCounts,
    loading,
    error,

    editingId,
    isEditing,
    selectedCustomer,

    // list mode
    listMode,
    selectedIds,
    selectedCount,
    toggleListMode,
    toggleRowSelection,

    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    ccExpiration,
    setCcExpiration,

    loadAll,
    resetForm,
    selectCustomerRow,
    submitForm,
    deleteSelected,

    fmtDate,
  } = useCustomersPage();

  const listButtonEnabled = customers.length > 0;
  const blackoutLeft = listMode;

  const selectedNames = useMemo(() => {
    const map = new Map(
      customers.map((c) => [String(c.customerID), fullName(c) || c.email || "(no name)"])
    );
    return (selectedIds || []).map((id) => map.get(String(id))).filter(Boolean);
  }, [customers, selectedIds]);

  // ✅ Selected rows lookup for export
  const selectedCustomers = useMemo(() => {
    const idSet = new Set((selectedIds || []).map((x) => String(x)));
    return customers.filter((c) => idSet.has(String(c.customerID)));
  }, [customers, selectedIds]);

  const exportSelectedAsCsv = () => {
    if (!selectedIds || selectedIds.length === 0) return;

    // Build rows (choose whatever columns you want)
    const headers = [
      "customerID",
      "firstName",
      "lastName",
      "email",
      "createdAt",
      "ccExpiration",
      "subscriptionsCount",
    ];

    const rows = selectedCustomers.map((c) => {
      const id = c.customerID;
      return [
        id,
        c.firstName || "",
        c.lastName || "",
        c.email || "",
        c.createdAt ? new Date(c.createdAt).toISOString() : "",
        c.ccExpiration ? new Date(c.ccExpiration).toISOString() : "",
        subCounts?.[id] ?? 0,
      ];
    });

    const csv = buildCsv(headers, rows);

    const stamp = new Date()
      .toISOString()
      .replace(/[:]/g, "-")
      .replace(/\..+$/, ""); // YYYY-MM-DDTHH-mm-ss
    const filename = `customers_export_${stamp}.csv`;

    downloadTextFile({
      filename,
      text: csv,
      mime: "text/csv;charset=utf-8",
    });
  };

  // =========================
  // ✅ PAGINATION (client-side)
  // =========================
  const PAGE_SIZE = 50;

  const [page, setPage] = useState(1);

  const total = customers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // If data changes and current page becomes invalid, clamp it.
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return customers.slice(start, start + PAGE_SIZE);
  }, [customers, page]);

  // Build page buttons like: 1 2 3 4 ... N (windowed)
  const pageButtons = useMemo(() => {
    const maxButtons = 7; // change if you want more/less
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, page - half);
    let end = start + maxButtons - 1;

    if (end > totalPages) {
      end = totalPages;
      start = end - maxButtons + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div className="entity-page">
      {error && <div className="entity-error">{error}</div>}

      <div className="entity-layout">
        {/* LEFT */}
        <div className={`entity-left ${blackoutLeft ? "entity-left-blackout" : ""}`}>
          {/* ✅ Logo + Title */}
          <EntityLeftHeader title="Customer" logoSrc="/logo.png" />

          {!blackoutLeft ? (
            <form className="entity-card" onSubmit={submitForm}>
              <div className="entity-label">first name</div>
              <input
                className="entity-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />

              <div className="entity-label">last name</div>
              <input
                className="entity-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />

              <div className="entity-label">email</div>
              <input
                className="entity-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jdoe@gmail.com"
              />

              <div className="entity-label">cc expiration</div>
              <input
                className="entity-input"
                value={ccExpiration}
                onChange={(e) => setCcExpiration(e.target.value)}
                placeholder="YYYY-MM-DD (or blank)"
              />

              <div className="entity-label"># of subs</div>
              <input
                className="entity-input"
                value={selectedCustomer ? String(subCounts[selectedCustomer.customerID] || 0) : ""}
                readOnly
                style={{ opacity: 0.9 }}
              />

              <div className="entity-label">member since</div>
              <input
                className="entity-input"
                value={selectedCustomer ? fmtDate(selectedCustomer.createdAt) : ""}
                readOnly
                style={{ opacity: 0.9 }}
              />

              <button type="submit" className="entity-btn-big">
                {isEditing ? "Update" : "Create"}
              </button>

              <div className="entity-actions">
                <button
                  type="button"
                  className="entity-btn"
                  onClick={() => {
                    // ✅ optional: when you refresh, jump back to page 1
                    setPage(1);
                    loadAll();
                  }}
                >
                  Refresh
                </button>
                <button type="button" className="entity-btn" onClick={resetForm}>
                  Clear
                </button>
              </div>

              {isEditing && (
                <div className="entity-actions">
                  <button type="button" className="entity-btn-danger" onClick={deleteSelected}>
                    Delete
                  </button>
                </div>
              )}

              <div className="entity-muted" style={{ marginTop: 10 }}>
                Tip: click a row on the right to edit.
              </div>
            </form>
          ) : (
            <div className="entity-card">
              <div style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  className="entity-btn-big"
                  disabled={selectedCount === 0}
                  style={{
                    marginTop: 0,
                    width: "100%",
                    opacity: selectedCount === 0 ? 0.5 : 1,
                    cursor: selectedCount === 0 ? "not-allowed" : "pointer",
                  }}
                  onClick={exportSelectedAsCsv}
                  title={selectedCount === 0 ? "Select at least one customer" : "Download CSV"}
                >
                  Export
                </button>
              </div>

              <div className="entity-selected-title">Selected customers ({selectedCount})</div>

              {selectedNames.length === 0 ? (
                <div style={{ opacity: 0.8 }}>Click customer rows to add/remove selections.</div>
              ) : (
                selectedNames.map((nm, idx) => (
                  <div className="entity-selected-item" key={`${nm}-${idx}`}>
                    {nm}
                  </div>
                ))
              )}

              <div className="entity-muted" style={{ marginTop: 10 }}>
                Click a highlighted row again to deselect it.
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="entity-right">
          <EntityNavBar
            listMode={listMode}
            listButtonEnabled={listButtonEnabled}
            onToggleListMode={toggleListMode}
          />

          <div className="entity-header" style={{ gridTemplateColumns: "1fr 1fr 160px 110px" }}>
            <div>name</div>
            <div>email</div>
            <div>member since</div>
            <div># of subs</div>
          </div>

          {loading ? (
            <div className="entity-muted">Loading...</div>
          ) : customers.length === 0 ? (
            <div className="entity-muted">No customers yet.</div>
          ) : (
            <>
              {paginatedCustomers.map((c) => {
                const id = c.customerID;
                const selected = (selectedIds || []).includes(id);

                return (
                  <div
                    key={id}
                    className={`entity-row ${selected ? "selected" : ""}`}
                    style={{ gridTemplateColumns: "1fr 1fr 160px 110px" }}
                    onClick={() => (listMode ? toggleRowSelection(id) : selectCustomerRow(c))}
                    title={listMode ? "Click to select/deselect" : "Click to edit"}
                  >
                    <div>{fullName(c)}</div>
                    <div>{c.email || "-"}</div>
                    <div>{fmtDate(c.createdAt)}</div>
                    <div>{subCounts[id] || 0}</div>
                  </div>
                );
              })}

              {/* ✅ Pagination controls */}
              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="entity-btn"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  style={{ opacity: page === 1 ? 0.5 : 1 }}
                >
                  {"<<"}
                </button>

                <button
                  type="button"
                  className="entity-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ opacity: page === 1 ? 0.5 : 1 }}
                >
                  {"<"}
                </button>

                {/* always show 1 if window doesn't start at 1 */}
                {pageButtons.length > 0 && pageButtons[0] > 1 && (
                  <>
                    <button type="button" className="entity-btn" onClick={() => setPage(1)}>
                      1
                    </button>
                    <span style={{ opacity: 0.7, padding: "6px 4px" }}>…</span>
                  </>
                )}

                {pageButtons.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="entity-btn"
                    onClick={() => setPage(p)}
                    style={{
                      opacity: p === page ? 1 : 0.85,
                      border: p === page ? "1px solid rgba(120,255,120,0.9)" : undefined,
                    }}
                    title={`Page ${p}`}
                  >
                    {p}
                  </button>
                ))}

                {/* always show last if window doesn't end at last */}
                {pageButtons.length > 0 && pageButtons[pageButtons.length - 1] < totalPages && (
                  <>
                    <span style={{ opacity: 0.7, padding: "6px 4px" }}>…</span>
                    <button
                      type="button"
                      className="entity-btn"
                      onClick={() => setPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="entity-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ opacity: page === totalPages ? 0.5 : 1 }}
                >
                  {">"}
                </button>

                <button
                  type="button"
                  className="entity-btn"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  style={{ opacity: page === totalPages ? 0.5 : 1 }}
                >
                  {">>"}
                </button>

                <div style={{ opacity: 0.8, padding: "6px 6px" }}>
                  Page {page} / {totalPages} • {total} rows
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
