import { useMemo } from "react";
import EntityNavBar from "../../components/EntityNavBar.jsx";
import "../shared/EntityPage.css";
import { usePackagesPage } from "./hooks/usePackagesPage.js";

function pkgLabel(p) {
  const id = p?.packageID;
  const m = p?.monthlyCost ?? "-";
  const a = p?.annualCost ?? "-";
  return `Pkg #${String(id ?? "").slice(0, 4)} (M: ${m} / A: ${a})`;
}

export default function PackagesPage() {
  const {
    items,
    loading,
    error,
    editingId,
    isEditing,

    monthlyCost,
    setMonthlyCost,
    annualCost,
    setAnnualCost,

    loadAll,
    resetForm,
    selectRow,
    submit,

    // edit delete OR list delete
    removeSelected,

    shortId,
    list,
  } = usePackagesPage();

  const listEnabled = items.length > 0;
  const blackoutLeft = list.listMode;

  const selectedLabels = useMemo(() => {
    const map = new Map(items.map((x) => [String(x.packageID), pkgLabel(x)]));
    return (list.selectedIds || []).map((id) => map.get(String(id))).filter(Boolean);
  }, [items, list.selectedIds]);

  return (
    <div className="entity-page">
      {error && <div className="entity-error">{error}</div>}

      <div className="entity-layout">
        {/* LEFT */}
        <div className={`entity-left ${blackoutLeft ? "entity-left-blackout" : ""}`}>
          <div className="entity-left-title">Package</div>

          {!blackoutLeft ? (
            <form className="entity-card" onSubmit={submit}>
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
              <div className="entity-selected-title">Selected packages ({list.selectedCount})</div>

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
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="entity-right">
          <EntityNavBar
            listEnabled={listEnabled}
            listMode={list.listMode}
            onToggleList={list.toggleListMode}
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
              return (
                <div
                  key={id}
                  className={`entity-row ${list.isSelected(String(id)) ? "selected" : ""}`}
                  style={{ gridTemplateColumns: "70px 1fr 140px 140px" }}
                  onClick={() => (list.listMode ? list.toggleRowSelection(String(id)) : selectRow(p))}
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
