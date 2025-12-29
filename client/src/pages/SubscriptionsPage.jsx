import React from "react";
import "./SubscriptionsPage.css";

export default function SubscriptionsPage() {
  const noop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Hard-coded navigation (full page reload)
  const go = (path) => {
    window.location.href = `http://127.0.0.1:5173${path}`;
  };

  const subscriptions = [
    {
      id: "S001",
      customer: "John Doe",
      package: "Pro Plan",
      status: "Active",
      startedAt: "2025-12-01",
    },
    {
      id: "S002",
      customer: "John Doe",
      package: "Basic Plan",
      status: "Canceled",
      startedAt: "2025-10-10",
    },
  ];

  return (
    <div className="subscriptions-page">
      <div className="subscriptions-layout">
        {/* LEFT */}
        <aside className="subscriptions-left">
          <div className="subscriptions-left-title">Subscriptions</div>

          <div className="subscriptions-formcard">
            <div className="subscriptions-label">Subscription ID</div>
            <input
              className="subscriptions-input-readonly"
              value="S001"
              readOnly
            />

            <div className="subscriptions-label">Customer</div>
            <input className="subscriptions-input" value="John Doe" readOnly />

            <div className="subscriptions-label">Package</div>
            <input className="subscriptions-input" value="Pro Plan" readOnly />

            <div className="subscriptions-label">Status</div>
            <input className="subscriptions-input" value="Active" readOnly />

            <button className="subscriptions-bigbtn" onClick={noop} type="button">
              Save
            </button>

            <div className="subscriptions-actions">
              <button className="subscriptions-btn" onClick={noop} type="button">
                Reset
              </button>
              <button
                className="subscriptions-btn-delete"
                onClick={noop}
                type="button"
              >
                Cancel
              </button>
            </div>

            <div className="subscriptions-tip">UI-only mock.</div>
          </div>
        </aside>

        {/* RIGHT */}
        <main className="subscriptions-right">
          <div className="subscriptions-navbar">
            <button
              className="subscriptions-navbtn"
              type="button"
              onClick={() => go("/customers")}
            >
              Customers
            </button>

            <button
              className="subscriptions-navbtn"
              type="button"
              onClick={() => go("/packages")}
            >
              Packages
            </button>

            <button
              className="subscriptions-navbtn subscriptions-navbtn-active"
              type="button"
              onClick={() => go("/subscriptions")}
            >
              Subscriptions
            </button>

            <button
              className="subscriptions-navbtn"
              type="button"
              onClick={() => go("/payments")}
            >
              Payments
            </button>
          </div>

          <div className="subscriptions-header">
            <div>ID</div>
            <div>Customer</div>
            <div>Package</div>
            <div>Status</div>
            <div>Started</div>
          </div>

          {subscriptions.map((s) => (
            <div className="subscriptions-row" key={s.id} onClick={noop}>
              <div>{s.id}</div>
              <div>{s.customer}</div>
              <div>{s.package}</div>
              <div>{s.status}</div>
              <div>{s.startedAt}</div>
            </div>
          ))}

          <div className="subscriptions-muted">Static UI only.</div>
        </main>
      </div>
    </div>
  );
}
