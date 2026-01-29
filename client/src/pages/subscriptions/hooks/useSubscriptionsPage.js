import { useMemo } from "react";
import EntityNavBar from "../../components/EntityNavBar.jsx";
import EntityLeftHeader from "../../components/EntityLeftHeader.jsx"; // ✅ NEW
import AutocompleteInput from "../../components/AutocompleteInput.jsx";
import "../shared/EntityPage.css";
import { useSubscriptionsPage } from "./hooks/useSubscriptionsPage.js";

function customerLabel(c) {
  const fn = (c?.firstName || "").trim();
  const ln = (c?.lastName || "").trim();
  const name = `${fn} ${ln}`.trim();
  return name || "(no name)";
}

function packageLabel(p) {
  const id = p?.packageID ?? "";

  // ✅ prefer real package name
  const name =
    (p?.name ?? "").trim() ||
    (p?.packageName ?? "").trim() ||
    (p?.title ?? "").trim() ||
    (p?.package ?? "").trim() ||
    (p?.label ?? "").trim();

  const m = p?.monthlyCost ?? "-";
  const a = p?.annualCost ?? "-";

  if (name) return `${name} • M ${m} • A ${a}`;
  return `Pkg ${String(id).slice(0, 4)} • M ${m} • A ${a}`;
}

export default function SubscriptionsPage() {
  const {
    items,
    customers,
    packages,
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

    customerQuery,
    packageQuery,
    onCustomerQueryChange,
    onPackageQueryChange,
    pickCustomer,
    pickPackage,

    selectedCustomer,
    selectedPackage,

    billingCycle,
    setBillingCycle,
    status,
    setStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    price,
    setPrice,

    loadAll,
    resetForm,
    selectRow,
    submit,
    removeSelected,
    shortId,
  } = useSubscriptionsPage();

  const listButtonEnabled = items.length > 0;
  const blackoutLeft = listMode;

  const selectedLabels = useMemo(() => {
    const map = new Map(
      items.map((s) => [
        String(s.subscriptionID),
        `SUB ${shortId(s.subscriptionID)} • ${customerLabel(s.customer)} → ${
          s.package ? packageLabel(s.package) : shortId(s.packageID)
        }`,
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
          <EntityLeftHeader title="Subscription" logoSrc="/logo.png" />

          {!blackoutLeft ? (
            <form className="entity-card" onSubmit={submit}>
              <div className="entity-label">customer (type name)</div>
              <AutocompleteInput
                value={customerQuery}
                onChange={onCustomerQueryChange}
                items={customers}
                getKey={(c) => c.customerID}
                getLabel={(c) => customerLabel(c)}
                getMeta={(c) => c.email || ""}
                onPick={pickCustomer}
                placeholder="Start typing customer name..."
                disabled={customers.length === 0}
              />
              {selectedCustomer && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                  Selected: <b>{customerLabel(selectedCustomer)}</b> •{" "}
                  {selectedCustomer.email || "-"}
                </div>
              )}

              <div className="entity-label">package</div>
              <AutocompleteInput
                value={packageQuery}
                onChange={onPackageQueryChange}
                items={packages}
                getKey={(p) => p.packageID}
                getLabel={(p) => packageLabel(p)}
                getMeta={(p) => `M ${p.monthlyCost} • A ${p.annualCost}`}
                onPick={pickPackage}
                placeholder="Pick a package..."
                disabled={packages.length === 0}
              />
              {selectedPackage && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                  Selected: <b>{packageLabel(selectedPackage)}</b>
                </div>
              )}

              <div className="entity-label">billingCycle</div>
              <select
                className="entity-select"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
              >
                <option value="MONTHLY">MONTHLY</option>
                <option value="ANNUAL">ANNUAL</option>
              </select>

              <div className="entity-label">status</div>
              <select
                className="entity-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="CANCELED">CANCELED</option>
              </select>

              <div className="entity-label">startDate</div>
              <input
                className="entity-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <div className="entity-label">endDate</div>
              <input
                className="entity-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />

              <div className="entity-label">price</div>
              <input
                className="entity-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="integer (e.g. 999)"
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
              <div className="entity-selected-title">
                Selected subscriptions ({selectedCount})
              </div>

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

        {/* RIGHT */}
        <div className="entity-right">
          <EntityNavBar
            listMode={listMode}
            listButtonEnabled={listButtonEnabled}
            onToggleListMode={toggleListMode}
          />

          <div
            className="entity-header"
            style={{ gridTemplateColumns: "70px 220px 220px 110px 110px 110px" }}
          >
            <div>#</div>
            <div>customer</div>
            <div>package</div>
            <div>cycle</div>
            <div>status</div>
            <div>price</div>
          </div>

          {loading ? (
            <div className="entity-muted">Loading...</div>
          ) : items.length === 0 ? (
            <div className="entity-muted">No subscriptions yet.</div>
          ) : (
            items.map((s) => {
              const id = s.subscriptionID;
              const selected = (selectedIds || []).includes(String(id));

              return (
                <div
                  key={id}
                  className={`entity-row ${selected ? "selected" : ""}`}
                  style={{ gridTemplateColumns: "70px 220px 220px 110px 110px 110px" }}
                  onClick={() => (listMode ? toggleRowSelection(String(id)) : selectRow(s))}
                  title={listMode ? "Click to select/deselect" : "Click to edit"}
                >
                  <div>{shortId(id)}</div>
                  <div>{s.customer ? customerLabel(s.customer) : shortId(s.customerID)}</div>
                  <div>{s.package ? packageLabel(s.package) : shortId(s.packageID)}</div>
                  <div>{s.billingCycle}</div>
                  <div>{s.status}</div>
                  <div>{s.price}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
