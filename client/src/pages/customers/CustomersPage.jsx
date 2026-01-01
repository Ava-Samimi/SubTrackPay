import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import "./CustomersPage.css";
import { useCustomersPage } from "./hooks/useCustomersPage.js";

export default function CustomersPage() {
  const location = useLocation();

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

    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,

    loadAll,
    resetForm,
    toggleListMode,
    toggleRowSelection,
    selectCustomerRow,
    submitForm,
    deleteSelected,

    fmtDate,
    shortId,
  } = useCustomersPage();

  // List is always visible but disabled when no customers
  const listButtonEnabled = customers.length > 0;
  const blackoutLeft = listMode;

  // Names array derived from selectedIds
  const selectedNames = useMemo(() => {
    const map = new Map(customers.map((c) => [c.id, c.name || c.email || "(no name)"]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean);
  }, [customers, selectedIds]);

  const isActiveRoute = (path) => location.pathname === path;

  return (
    <div className="customers-page">
      {error && <div className="customers-error">{error}</div>}

      <div className="customers-layout">
        {/* LEFT */}
        <div className={`customers-left ${blackoutLeft ? "customers-left-blackout" : ""}`}>
          <div className="customers-left-title">Customer</div>

          {!blackoutLeft ? (
            <form className="customers-formcard" onSubmit={submitForm}>
              <div className="customers-label">name</div>
              <input
                className="customers-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />

              <div className="customers-label">email</div>
              <input
                className="customers-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jdoe@gmail.com"
              />

              <div className="customers-label">phone</div>
              <input
                className="customers-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="514..."
              />

              <div className="customers-label"># of subs</div>
              <input
                className="customers-input-readonly"
                value={selectedCustomer ? String(subCounts[selectedCustomer.id] || 0) : ""}
                readOnly
              />

              <div className="customers-label">member since</div>
              <input
                className="customers-input-readonly"
                value={selectedCustomer ? fmtDate(selectedCustomer.createdAt) : ""}
                readOnly
              />

              <button type="submit" className="customers-bigbtn">
                {isEditing ? "Update" : "Create"}
              </button>

              <div className="customers-actions">
                <button type="button" className="customers-btn" onClick={loadAll}>
                  Refresh
                </button>
                <button type="button" className="customers-btn" onClick={resetForm}>
                  Clear
                </button>
              </div>

              {isEditing && (
                <div className="customers-actions">
                  <button type="button" className="customers-btn-delete" onClick={deleteSelected}>
                    Delete
                  </button>
                </div>
              )}

              <div className="customers-tip">Tip: click a row on the right to edit.</div>
            </form>
          ) : (
            <div className="customers-formcard">
              <div className="customers-selected-box">
                {/* ✅ NEW: Create Analysis button ABOVE selected list */}
                <div style={{ marginBottom: 12 }}>
                  <button
                    type="button"
                    className="customers-bigbtn"
                    disabled={selectedCount === 0}
                    style={{
                      marginTop: 0,
                      width: "100%",
                      opacity: selectedCount === 0 ? 0.5 : 1,
                      cursor: selectedCount === 0 ? "not-allowed" : "pointer",
                    }}
                    onClick={() => {
                      // Later: navigate to /analytics with selectedIds, or POST to API
                      alert(`Create Analysis for: ${selectedCount} customers`);
                    }}
                  >
                    Create Analysis
                  </button>
                </div>

                <div className="customers-selected-title">
                  Selected customers ({selectedCount})
                </div>

                {selectedNames.length === 0 ? (
                  <div style={{ color: "rgba(231,255,224,0.75)" }}>
                    Click customer rows to add/remove selections.
                  </div>
                ) : (
                  <div className="customers-selected-list">
                    {selectedNames.map((nm, idx) => (
                      <div className="customers-selected-item" key={`${nm}-${idx}`}>
                        <div className="customers-selected-name">{nm}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="customers-selected-hint">
                  Click a highlighted row again to deselect it.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="customers-right">
          {/* ✅ NAVBAR ABOVE LIST */}
          <div className="customers-navbar">
            <div className="customers-navgroup">
              <Link
                className={`customers-navbtn ${isActiveRoute("/customers") ? "customers-navbtn-active" : ""}`}
                to="/customers"
              >
                Customers
              </Link>
              <Link
                className={`customers-navbtn ${isActiveRoute("/packages") ? "customers-navbtn-active" : ""}`}
                to="/packages"
              >
                Packages
              </Link>
              <Link
                className={`customers-navbtn ${isActiveRoute("/subscriptions") ? "customers-navbtn-active" : ""}`}
                to="/subscriptions"
              >
                Subscriptions
              </Link>
              <Link
                className={`customers-navbtn ${isActiveRoute("/payments") ? "customers-navbtn-active" : ""}`}
                to="/payments"
              >
                Payments
              </Link>
              {/* If you already added Analytics to navbar elsewhere, add it here too */}
              <Link
                className={`customers-navbtn ${isActiveRoute("/analytics") ? "customers-navbtn-active" : ""}`}
                to="/analytics"
              >
                Analytics
              </Link>
            </div>

            {/* LIST button on far right */}
            <button
              type="button"
              className={[
                "customers-navbtn",
                "customers-listbtn",
                listMode ? "customers-navbtn-active" : "",
                !listButtonEnabled ? "customers-navbtn-disabled" : "",
              ].join(" ")}
              onClick={() => {
                if (!listButtonEnabled) return;
                toggleListMode();
              }}
              title={listButtonEnabled ? "Toggle list mode" : "Add at least 1 customer to enable"}
            >
              List
            </button>
          </div>

          <div className="customers-header">
            <div>#</div>
            <div>name</div>
            <div>email</div>
            <div>member since</div>
            <div># of subs</div>
          </div>

          {loading ? (
            <div className="customers-muted">Loading...</div>
          ) : customers.length === 0 ? (
            <div className="customers-muted">No customers yet.</div>
          ) : (
            customers.map((c) => {
              const active = c.id === editingId;
              const selected = selectedIds.includes(c.id);

              return (
                <div
                  key={c.id}
                  className={[
                    "customers-row",
                    active ? "customers-row-active" : "",
                    selected ? "customers-row-selected" : "",
                  ].join(" ")}
                  onClick={() => {
                    if (listMode) toggleRowSelection(c.id);
                    else selectCustomerRow(c);
                  }}
                  title={listMode ? "Click to select/deselect" : "Click to edit"}
                >
                  <div style={{ opacity: 0.9 }}>{shortId(c.id)}</div>
                  <div>{c.name || "-"}</div>
                  <div>{c.email || "-"}</div>
                  <div>{fmtDate(c.createdAt)}</div>
                  <div>{subCounts[c.id] || 0}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
