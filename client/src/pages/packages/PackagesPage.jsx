// client/src/pages/packages/PackagesPage.jsx
import { useMemo } from "react";
import EntityNavBar from "../../components/EntityNavBar.jsx";
import EntityLeftHeader from "../../components/EntityLeftHeader.jsx";
import "../shared/EntityPage.css";
import { usePackagesPage } from "./hooks/usePackagesPage.js";

function getPackageName(p) {
  return (
    (p?.name ?? "").trim() ||
    (p?.packageName ?? "").trim() ||
    (p?.title ?? "").trim() ||
    (p?.package ?? "").trim() ||
    (p?.label ?? "").trim() ||
    ""
  );
}

function pkgLabel(p) {
  const id = p?.packageID;
  const name = getPackageName(p);
  const m = p?.monthlyCost ?? "-";
  const a = p?.annualCost ?? "-";

  if (name) return `${name} (M: ${m} / A: ${a})`;
  return `Pkg #${String(id ?? "").slice(0, 4)} (M: ${m} / A: ${a})`;
}

// CSV helpers
function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
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

export default function PackagesPage() {
  const {
    items,
    loading,
    error,
    editingId,
    isEditing,

    listMode,
    selectedIds,
    selectedCount,
    toggleListMode,
    toggleRowSelection,

    // ✅ NEW: name field
    name,
    setName,

    monthlyCost,
    setMonthlyCost,
    annualCost,
    setAnnualCost,

    loadAll,
    resetForm,
    selectRow,
    submit,

    removeSelected,
    shortId,
  } = usePackagesPage();

  const listButtonEnabled = items.length > 0;
  const blackoutLeft = listMode;

  const selectedLabels = useMemo(() => {
    const map = new Map(items.map((x) => [String(x.packageID), pkgLabel(x)]));
    return (selectedIds || []).map((id) => map.get(String(id))).filter(Boolean);
  }, [items, selectedIds]);

  const selectedPackages = useMemo(() => {
    const idSet = new Set((selectedIds || []).map((x) => String(x)));
    return items.filter((p) => idSet.has(String(p.packageID)));
  }, [items, selectedIds]);

  const exportSelectedAsCsv = () => {
    if (!selectedIds || selectedIds.length === 0) return;

    const headers = ["packageID", "name", "monthlyCost", "annualCost"];
    const rows = selectedPackages.map((p) => [
      p.packageID,
      getPackageName(p),
      p.monthlyCost ?? "-",
      p.annualCost ?? "-",
    ]);

    const csv = buildCsv(headers, rows);

    const stamp = new Date()
      .toISOString()
      .replace(/[:]/g, "-")
      .replace(/\..+$/, "");
    const filename = `packages_export_${stamp}.csv`;

    downloadTextFile({
      filename,
      text: csv,
      mime: "text/csv;charset=utf-8",
    });
  };

  return (
    <div className="entity-page">
      {error && <div className="entity-error">{error}</div>}

      <div className="entity-layout">
        {/* LEFT */}
        <div className={`entity-left ${blackoutLeft ? "entity-left-blackout" : ""}`}>
          <EntityLeftHeader title="Package" logoSrc="/logo.png" />

          {!blackoutLeft ? (
            <form className="entity-card" onSubmit={submit}>
              {/* ✅ NEW: package name */}
              <div className="entity-label">name</div>
              <input
                className="entity-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Movies"
              />

              <div className="entity-label">monthlyCost</div>
              <input
                className="entity-input"
                type="number"
                step="1"
                value={monthlyCost}
                onChange={(e) => setMonthlyCost(e.target.value)}
                placeholder="e.g. 10"
              />

              <div className="entity-label">annualCost</div>
              <input
                className="entity-input"
                type="number"
                step="1"
                value={annualCost}
                onChange={(e) => setAnnualCost(e.target.value)}
                placeholder="e.g. 100"
              />

              <button className="entity-btn-big" type="submit">
                {isEditing ? "Update" : "Create"}
              </button>

              <div className="entity-actions">
                <button type="button" className="entity-btn" onClick={loadAll}>
                  Refresh
                </button>
                <button type="button" className="entity-btn" onClick={resetForm}>
                  Clear
                </button>
              </div>

              {editingId && (
                <div className="entity-actions">
                  <button
                    type="button"
                    className="entity-btn-danger"
                    onClick={removeSelected}
                    title="Deletes the currently selected/edited package"
                  >
                    Delete
                  </button>
                </div>
              )}
            </form>
          ) : (
            <div className="entity-card">
              <div className="entity-selected-title">Selected packages ({selectedCount})</div>

              {selectedLabels.length === 0 ? (
                <div style={{ opacity: 0.8 }}>Click rows to select/deselect.</div>
              ) : (
                <>
                  {selectedLabels.map((t, i) => (
                    <div key={`${t}-${i}`} className="entity-selected-item">
                      {t}
                    </div>
                  ))}

                  <div className="entity-actions" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="entity-btn-danger"
                      onClick={removeSelected}
                      title="Deletes all selected packages"
                    >
                      Delete selected
                    </button>
                  </div>
                </>
              )}

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="entity-btn-big"
                  disabled={selectedCount === 0}
                  onClick={exportSelectedAsCsv}
                  style={{
                    marginTop: 0,
                    width: "100%",
                    opacity: selectedCount === 0 ? 0.5 : 1,
                    cursor: selectedCount === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Export
                </button>
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

          <div className="entity-header" style={{ gridTemplateColumns: "70px 1fr 140px 140px" }}>
            <div>#</div>
            <div>package</div>
            <div>monthlyCost</div>
            <div>annualCost</div>
          </div>

          {loading ? (
            <div className="entity-muted">Loading...</div>
          ) : items.length === 0 ? (
            <div className="entity-muted">No packages yet.</div>
          ) : (
            items.map((p) => {
              const id = p.packageID;
              const selected = (selectedIds || []).includes(String(id));

              return (
                <div
                  key={id}
                  className={`entity-row ${selected ? "selected" : ""}`}
                  style={{ gridTemplateColumns: "70px 1fr 140px 140px" }}
                  onClick={() => (listMode ? toggleRowSelection(String(id)) : selectRow(p))}
                  title={listMode ? "Click to select/deselect" : "Click to edit"}
                >
                  <div>{shortId(id)}</div>
                  <div>{pkgLabel(p)}</div>
                  <div>{p.monthlyCost ?? "-"}</div>
                  <div>{p.annualCost ?? "-"}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
