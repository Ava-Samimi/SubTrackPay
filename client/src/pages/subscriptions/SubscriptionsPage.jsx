import React, { useMemo } from "react";
import EntityNavBar from "../../components/EntityNavBar.jsx";
import AutocompleteInput from "../../components/AutocompleteInput.jsx";
import "../shared/EntityPage.css";
import { useSubscriptionsPage } from "./hooks/useSubscriptionsPage.js";

export default function SubscriptionsPage() {
  const {
    items,
    customers,
    packages,
    loading,
    error,
    editingId,
    isEditing,

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
    priceCents,
    setPriceCents,

    loadAll,
    resetForm,
    selectRow,
    submit,
    removeSelected,
    shortId,
    list,
  } = useSubscriptionsPage();

  const listEnabled = items.length > 0;
  const blackoutLeft = list.listMode;

  const selectedLabels = useMemo(() => {
    const map = new Map(
      items.map((s) => [
        s.id,
        `SUB ${shortId(s.id)} • ${shortId(s.customerId)} → ${shortId(s.packageId)}`,
      ])
    );
    return list.selectedIds.map((id) => map.get(id)).filter(Boolean);
  }, [items, list.selectedIds, shortId]);

  return (
    <div className="entity-page">
      {error && <div className="entity-error">{error}</div>}

      <div className="entity-layout">
        <div className={`entity-left ${blackoutLeft ? "entity-left-blackout" : ""}`}>
          <div className="entity-left-title">Subscription</div>

          {!blackoutLeft ? (
            <form className="entity-card" onSubmit={submit}>
              <div className="entity-label">customer (type name)</div>
              <AutocompleteInput
                value={customerQuery}
                onChange={onCustomerQueryChange}
                items={customers}
                getKey={(c) => c.id}
                getLabel={(c) => c.name || "(no name)"}
                getMeta={(c) => c.email || ""}
                onPick={pickCustomer}
                placeholder="Start typing customer name..."
                disabled={customers.length === 0}
              />
              {selectedCustomer && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                  Selected: <b>{selectedCustomer.name || "(no name)"}</b> • {selectedCustomer.email}
                </div>
              )}

              <div className="entity-label">package (type name)</div>
              <AutocompleteInput
                value={packageQuery}
                onChange={onPackageQueryChange}
                items={packages}
                getKey={(p) => p.id}
                getLabel={(p) => p.name || "(no name)"}
                getMeta={(p) => `M ${p.monthlyPrice} • A ${p.annualPrice}`}
                onPick={pickPackage}
                placeholder="Start typing package name..."
                disabled={packages.length === 0}
              />
              {selectedPackage && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                  Selected: <b>{selectedPackage.name}</b> • monthly {selectedPackage.monthlyPrice} • annual{" "}
                  {selectedPackage.annualPrice}
                </div>
              )}

              <div className="entity-label">billingCycle</div>
              <select className="entity-select" value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)}>
                <option value="MONTHLY">MONTHLY</option>
                <option value="ANNUAL">ANNUAL</option>
              </select>

              <div className="entity-label">status</div>
              <select className="entity-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="CANCELED">CANCELED</option>
              </select>

              <div className="entity-label">startDate</div>
              <input className="entity-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

              <div className="entity-label">endDate</div>
              <input className="entity-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

              <div className="entity-label">priceCents</div>
              <input className="entity-input" value={priceCents} onChange={(e) => setPriceCents(e.target.value)} />

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
              <div className="entity-selected-title">Selected subscriptions ({list.selectedCount})</div>
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

          <div className="entity-header" style={{ gridTemplateColumns: "70px 120px 120px 110px 110px 110px" }}>
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
            items.map((s) => (
              <div
                key={s.id}
                className={`entity-row ${list.isSelected(s.id) ? "selected" : ""}`}
                style={{ gridTemplateColumns: "70px 120px 120px 110px 110px 110px" }}
                onClick={() => (list.listMode ? list.toggleRowSelection(s.id) : selectRow(s))}
              >
                <div>{shortId(s.id)}</div>
                <div>{shortId(s.customerId)}</div>
                <div>{shortId(s.packageId)}</div>
                <div>{s.billingCycle}</div>
                <div>{s.status}</div>
                <div>{s.priceCents}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
