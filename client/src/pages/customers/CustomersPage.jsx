import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import "./CustomersPage.css";
import { useCustomersPage } from "./hooks/useCustomersPage.js";

function fullName(c) {
  const fn = (c?.firstName || "").trim();
  const ln = (c?.lastName || "").trim();
  const name = `${fn} ${ln}`.trim();
  return name || "(no name)";
}

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
    toggleListMode,
    toggleRowSelection,
    selectCustomerRow,
    submitForm,
    deleteSelected,

    fmtDate,
    shortId,
    fmtCcExp, // ✅ we’ll add this helper in the hook
  } = useCustomersPage();

  const listButtonEnabled = customers.length > 0;
  const blackoutLeft = listMode;

  const selectedNames = useMemo(() => {
    const map = new Map(customers.map((c) => [c.customerID, fullName(c) || c.email || "(no name)"]));
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
              <div className="customers-label">first name</div>
              <input
                className="customers-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />

              <div className="customers-label">last name</div>
              <input
                className="customers-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />

              <div className="customers-label">email</div>
              <input
                className="customers-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jdoe@gmail.com"
              />

              <div className="customers-label">cc expiration</div>
              <input
                className="customers-input"
                value={ccExpiration}
                onChange={(e) => setCcExpiration(e.target.value)}
                placeholder="YYYY-MM-DD (or blank)"
              />

              <div className="customers-label"># of subs</div>
              <input
                className="customers-input-readonly"
                value={selectedCustomer ? String(subCounts[selectedCustomer.customerID] || 0) : ""}
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
                      alert(`Create Analysis for: ${selectedCount} customers`);
                    }}
                  >
                    Create Analysis
                  </button>
                </div>

                <div className="customers-selected-title">Selected customers ({selectedCount})</div>

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

                <div className="customers-selected-hint">Click a highlighted row again to deselect it.</div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="customers-right">
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
              <Link
                className={`customers-navbtn ${isActiveRoute("/analytics") ? "customers-navbtn-active" : ""}`}
                to="/analytics"
              >
                Analytics
              </Link>
            </div>

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
            <div>cc exp</div>
            <div># of subs</div>
          </div>

          {loading ? (
            <div className="customers-muted">Loading...</div>
          ) : customers.length === 0 ? (
            <div className="customers-muted">No customers yet.</div>
          ) : (
            customers.map((c) => {
              const id = c.customerID;
              const active = id === editingId;
              const selected = selectedIds.includes(id);

              return (
                <div
                  key={id}
                  className={[
                    "customers-row",
                    active ? "customers-row-active" : "",
                    selected ? "customers-row-selected" : "",
                  ].join(" ")}
                  onClick={() => {
                    if (listMode) toggleRowSelection(id);
                    else selectCustomerRow(c);
                  }}
                  title={listMode ? "Click to select/deselect" : "Click to edit"}
                >
                  <div style={{ opacity: 0.9 }}>{shortId(id)}</div>
                  <div>{fullName(c)}</div>
                  <div>{c.email || "-"}</div>
                  <div>{fmtDate(c.createdAt)}</div>
                  <div>{fmtCcExp(c.ccExpiration)}</div>
                  <div>{subCounts[id] || 0}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
