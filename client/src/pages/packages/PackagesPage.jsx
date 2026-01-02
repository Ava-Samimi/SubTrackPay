import { useMemo } from "react";
import EntityNavBar from "../../components/EntityNavBar.jsx";
import "../shared/EntityPage.css";
import { usePackagesPage } from "./hooks/usePackagesPage.js";

export default function PackagesPage() {
  const {
    items,
    loading,
    error,
    editingId,
    isEditing,

    name,
    setName,
    monthlyPrice,
    setMonthlyPrice,
    annualPrice,
    setAnnualPrice,

    loadAll,
    resetForm,
    selectRow,
    submit,

    // now works for:
    // - edit mode delete (current editingId)
    // - list mode delete (selectedIds)
    removeSelected,

    shortId,
    list,
  } = usePackagesPage();

  const listEnabled = items.length > 0;
  const blackoutLeft = list.listMode;

  const selectedLabels = useMemo(() => {
    const map = new Map(items.map((x) => [String(x.id), x.name || "(no name)"]));
    return (list.selectedIds || [])
      .map((id) => map.get(String(id)))
      .filter(Boolean);
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
              <div className="entity-label">name</div>
              <input
                className="entity-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pro Plan"
              />

              <div className="entity-label">monthlyPrice</div>
              <input
                className="entity-input"
                type="number"
                step="0.01"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="e.g. 9.99"
              />

              <div className="entity-label">annualPrice</div>
              <input
                className="entity-input"
                type="number"
                step="0.01"
                value={annualPrice}
                onChange={(e) => setAnnualPrice(e.target.value)}
                placeholder="e.g. 99.99"
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
              <div className="entity-selected-title">
                Selected packages ({list.selectedCount})
              </div>

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
            <div>name</div>
            <div>monthly</div>
            <div>annual</div>
          </div>

          {loading ? (
            <div className="entity-muted">Loading...</div>
          ) : items.length === 0 ? (
            <div className="entity-muted">No packages yet.</div>
          ) : (
            items.map((p) => (
              <div
                key={p.id}
                className={`entity-row ${list.isSelected(String(p.id)) ? "selected" : ""}`}
                style={{ gridTemplateColumns: "70px 1fr 140px 140px" }}
                onClick={() =>
                  list.listMode
                    ? list.toggleRowSelection(String(p.id))
                    : selectRow(p)
                }
              >
                <div>{shortId(p.id)}</div>
                <div>{p.name || "-"}</div>
                <div>{p.monthlyPrice ?? "-"}</div>
                <div>{p.annualPrice ?? "-"}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
