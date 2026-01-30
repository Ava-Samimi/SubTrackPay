import { useMemo } from "react";
import EntityNavBar from "../../components/EntityNavBar.jsx";
import EntityLeftHeader from "../../components/EntityLeftHeader.jsx"; // ✅ NEW
import "../shared/EntityPage.css";
import { usePaymentsPage } from "./hooks/usePaymentsPage.js";

function subscriptionLabel(s, shortId) {
  if (!s) return "-";

  const cust =
    (s.customer?.firstName || "") || (s.customer?.lastName || "")
      ? `${s.customer.firstName || ""} ${s.customer.lastName || ""}`.trim()
      : shortId(s.customerID);

  const pkg =
    (s.package?.name ?? "").trim() ||
    (s.package?.packageName ?? "").trim() ||
    (s.package?.title ?? "").trim() ||
    shortId(s.packageID);

  return `${cust} → ${pkg}`;
}

export default function PaymentsPage() {
  const {
    items,
    subscriptions,
    loading,
    error,
    editingId,
    isEditing,

    // ✅ customers-style list mode
    listMode,
    selectedIds,
    selectedCount,
    toggleListMode,
    toggleRowSelection,

    subscriptionID,
    setSubscriptionID,
    dueDate,
    setDueDate,
    paidAt,
    setPaidAt,
    status,
    setStatus,

    loadAll,
    resetForm,
    selectRow,
    submit,
    removeSelected,
    shortId,
  } = usePaymentsPage();

  const listButtonEnabled = items.length > 0;
  const blackoutLeft = listMode;

  const selectedLabels = useMemo(() => {
    const map = new Map(
      items.map((p) => [
        String(p.paymentID),
        `PAY ${shortId(p.paymentID)} • ${
          p.subscription ? subscriptionLabel(p.subscription, shortId) : shortId(p.subscriptionID)
        } • ${p.status}`,
      ])
    );
    return (selectedIds || []).map((id) => map.get(String(id))).filter(Boolean);
  }, [items, selectedIds, shortId]);

  return (
    <div className="entity-page">
      {error && <div className="entity-error">{error}</div>}

      <div className="entity-layout">
        {/* LEFT */}
        <div className={`entity-left ${blackoutLeft ? "entity-left-blackout" : ""}`}>
          {/* ✅ Logo + Title */}
          <EntityLeftHeader title="Payment" logoSrc="/logo.png" />

          {!blackoutLeft ? (
            <form className="entity-card" onSubmit={submit}>
              <div className="entity-label">subscription</div>
              <select
                className="entity-select"
                value={subscriptionID}
                onChange={(e) => setSubscriptionID(e.target.value)}
              >
                <option value="">-- select subscription --</option>
                {(subscriptions || []).map((s) => (
                  <option key={s.subscriptionID} value={s.subscriptionID}>
                    {subscriptionLabel(s, shortId)}
                  </option>
                ))}
              </select>

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
                placeholder="optional"
              />

              <div className="entity-label">status</div>
              <select
                className="entity-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="DUE">DUE</option>
                <option value="PAID">PAID</option>
                <option value="FAILED">FAILED</option>
                <option value="VOID">VOID</option>
              </select>

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
              <div className="entity-selected-title">Selected payments ({selectedCount})</div>

              {selectedLabels.length === 0 ? (
                <div style={{ opacity: 0.8 }}>Click rows to select/deselect.</div>
              ) : (
                selectedLabels.map((t, i) => (
                  <div key={`${t}-${i}`} className="entity-selected-item">
                    {t}
                  </div>
                ))
              )}

              {selectedCount > 0 && (
                <div className="entity-actions" style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="entity-btn-danger"
                    onClick={removeSelected}
                    title="Deletes all selected payments"
                  >
                    Delete selected
                  </button>
                </div>
              )}
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

          <div
            className="entity-header"
            style={{ gridTemplateColumns: "70px 260px 110px 110px 110px" }}
          >
            <div>#</div>
            <div>subscription</div>
            <div>status</div>
            <div>due</div>
            <div>paid</div>
          </div>

          {loading ? (
            <div className="entity-muted">Loading...</div>
          ) : items.length === 0 ? (
            <div className="entity-muted">No payments yet.</div>
          ) : (
            items.map((p) => {
              const id = p.paymentID;
              const selected = (selectedIds || []).includes(String(id));

              return (
                <div
                  key={id}
                  className={`entity-row ${selected ? "selected" : ""}`}
                  style={{ gridTemplateColumns: "70px 260px 110px 110px 110px" }}
                  onClick={() =>
                    listMode ? toggleRowSelection(String(id)) : selectRow(p)
                  }
                  title={listMode ? "Click to select/deselect" : "Click to edit"}
                >
                  <div>{shortId(id)}</div>
                  <div>
                    {p.subscription
                      ? subscriptionLabel(p.subscription, shortId)
                      : shortId(p.subscriptionID)}
                  </div>
                  <div>{p.status}</div>
                  <div>{p.dueDate ? String(p.dueDate).slice(0, 10) : ""}</div>
                  <div>{p.paidAt ? String(p.paidAt).slice(0, 10) : "-"}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
