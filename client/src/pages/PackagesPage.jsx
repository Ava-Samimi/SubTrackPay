import React from "react";
import "./PackagesPage.css";

export default function PackagesPage() {
  const noop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const packages = [
    {
      id: "P001",
      name: "SportsTV",
      price: "$9.99",
      billing: "Monthly",
      createdAt: "2025-11-15",
    },
    {
      id: "P002",
      name: "TMN",
      price: "$29.99",
      billing: "Monthly",
      createdAt: "2025-12-01",
    },
    {
      id: "P003",
      name: "NewsCTV",
      price: "$299.00",
      billing: "Yearly",
      createdAt: "2025-12-20",
    },
  ];

  return (
    <div className="packages-page">
      <div className="packages-layout">
        {/* LEFT */}
        <aside className="packages-left">
          <div className="packages-left-title">Packages</div>

          <div className="packages-formcard">
            <div className="packages-label">Package ID</div>
            <input className="packages-input-readonly" value="P002" readOnly />

            <div className="packages-label">Name</div>
            <input className="packages-input" value="Pro Plan" readOnly />

            <div className="packages-label">Price</div>
            <input className="packages-input" value="$29.99" readOnly />

            <div className="packages-label">Billing Cycle</div>
            <input className="packages-input" value="Monthly" readOnly />

            <button className="packages-bigbtn" onClick={noop}>
              Save
            </button>

            <div className="packages-actions">
              <button className="packages-btn" onClick={noop}>
                Reset
              </button>
              <button className="packages-btn-delete" onClick={noop}>
                Delete
              </button>
            </div>

            <div className="packages-tip">UI mock only.</div>
          </div>
        </aside>

        {/* RIGHT */}
        <main className="packages-right">
          <div className="packages-navbar">
            <button className="packages-navbtn" onClick={noop}>
              Customers
            </button>
            <button className="packages-navbtn packages-navbtn-active" onClick={noop}>
              Packages
            </button>
            <button className="packages-navbtn" onClick={noop}>
              Subscriptions
            </button>
            <button className="packages-navbtn" onClick={noop}>
              Payments
            </button>
          </div>

          <div className="packages-header">
            <div>ID</div>
            <div>Name</div>
            <div>Price</div>
            <div>Billing</div>
            <div>Created</div>
          </div>

          {packages.map((p) => (
            <div className="packages-row" key={p.id} onClick={noop}>
              <div>{p.id}</div>
              <div>{p.name}</div>
              <div>{p.price}</div>
              <div>{p.billing}</div>
              <div>{p.createdAt}</div>
            </div>
          ))}

          <div className="packages-muted">Static UI preview.</div>
        </main>
      </div>
    </div>
  );
}
