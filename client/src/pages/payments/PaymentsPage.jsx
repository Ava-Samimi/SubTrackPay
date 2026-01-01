import { useMemo } from "react";
import EntityNavBar from "../../components/EntityNavBar.jsx";
import "../shared/EntityPage.css";
import { usePaymentsPage } from "./hooks/usePaymentsPage.js";

export default function PaymentsPage() {
  const {
    items,
    subscriptions, // ✅ NEW: used to populate the dropdown
    loading,
    error,
    editingId,
    isEditing,

    subscriptionId,
    setSubscriptionId,
    amountCents,
    setAmountCents,
    dueDate,
    setDueDate,
    paidAt,
    setPaidAt,
    status,
    setStatus,
    periodStart,
    setPeriodStart,
    periodEnd,
    setPeriodEnd,

    loadAll,
    resetForm,
    selectRow,
    submit,
    removeSelected,
    shortId,
    list,
  } = usePaymentsPage();

  const listEnabled = items.length > 0;
  const blackoutLeft = list.listMode;

  const selectedLabels = useMemo(() => {
    const map = new Map(
      items.map((p) => [p.id, `PAY ${shortId(p.id)} • sub ${shortId(p.subscriptionId)} • ${p.status}`])
    );
    return list.selectedIds.map((id) => map.get(id)).filter(Boolean);
  }, [items, list.selectedIds, shortId]);

  return (
    <div className="entity-page">
      {error && <div className="entity-error">{error}</div>}

      <div className="entity-layout">
        <div className={`entity-left ${blackoutLeft ? "entity-left-blackout" : ""}`}>
          <div className="entity-left-title">Payment</div>

          {!blackoutLeft ? (
            <form className="entity-card" onSubmit={submit}>
              {/* ✅ CHANGED: subscriptionId is now a dropdown */}
              <div className="entity-label">subscriptionId</div>
              <select
                className="entity-select"
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
              >
                <option value="">-- select subscription --</option>
                {(subscriptions || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {shortId(s.id)}
                  </option>
                ))}
              </select>

              <div className="entity-label">amountCents</div>
              <input
                className="entity-input"
                value={amountCents}
                onChange={(e) => setAmountCents(e.target.value)}
              />

              <div className="entity-label">dueDate</div>
              <input
                className="entity-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />

              <div className="entity-label">paidAt</div>
              <input
                className="entity-input"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />

              <div className="entity-label">status</div>
              <select className="entity-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="DUE">DUE</option>
                <option value="PAID">PAID</option>
                <option value="FAILED">FAILED</option>
                <option value="VOID">VOID</option>
              </select>

              <div className="entity-label">periodStart</div>
              <input
                className="entity-input"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />

              <div className="entity-label">periodEnd</div>
              <input
                className="entity-input"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
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
                  <button type="button" className="entity-btn-danger" onClick={removeSelected}>
                    Delete
                  </button>
                </div>
              )}
            </form>
          ) : (
            <div className="entity-card">
              <div className="entity-selected-title">Selected payments ({list.selectedCount})</div>
              {selectedLabels.length === 0 ? (
                <div style={{ opacity: 0.8 }}>Click rows to select/deselect.</div>
              ) : (
                selectedLabels.map((t, i) => (
                  <div key={`${t}-${i}`} className="entity-selected-item">
                    {t}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="entity-right">
          <EntityNavBar listEnabled={listEnabled} listMode={list.listMode} onToggleList={list.toggleListMode} />

          <div className="entity-header" style={{ gridTemplateColumns: "70px 140px 120px 110px 110px" }}>
            <div>#</div>
            <div>subscription</div>
            <div>amount</div>
            <div>status</div>
            <div>due</div>
          </div>

          {loading ? (
            <div className="entity-muted">Loading...</div>
          ) : items.length === 0 ? (
            <div className="entity-muted">No payments yet.</div>
          ) : (
            items.map((p) => (
              <div
                key={p.id}
                className={`entity-row ${list.isSelected(p.id) ? "selected" : ""}`}
                style={{ gridTemplateColumns: "70px 140px 120px 110px 110px" }}
                onClick={() => (list.listMode ? list.toggleRowSelection(p.id) : selectRow(p))}
              >
                <div>{shortId(p.id)}</div>
                <div>{shortId(p.subscriptionId)}</div>
                <div>{p.amountCents}</div>
                <div>{p.status}</div>
                <div>{p.dueDate ? String(p.dueDate).slice(0, 10) : ""}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
