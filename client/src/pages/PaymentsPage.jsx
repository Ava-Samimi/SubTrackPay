import React from "react";
import "./PaymentsPage.css";

export default function PaymentsPage() {
  const noop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Hard-coded navigation (full page reload)
  const go = (path) => {
    window.location.href = `http://127.0.0.1:5173${path}`;
  };

  const payments = [
    {
      id: "PAY001",
      customer: "John Doe",
      amount: "$29.99",
      method: "Credit Card",
      date: "2025-12-05",
      status: "Paid",
    },
    {
      id: "PAY002",
      customer: "John Doe",
      amount: "$9.99",
      method: "Credit Card",
      date: "2025-11-05",
      status: "Paid",
    },
    {
      id: "PAY003",
      customer: "John Doe",
      amount: "$29.99",
      method: "Interac",
      date: "2025-12-20",
      status: "Failed",
    },
  ];

  return (
    <div className="payments-page">
      <div className="payments-layout">
        {/* LEFT */}
        <aside className="payments-left">
          <div className="payments-left-title">Payments</div>

          <div className="payments-formcard">
            <div className="payments-label">Payment ID</div>
            <input className="payments-input-readonly" value="PAY001" readOnly />

            <div className="payments-label">Customer</div>
            <input className="payments-input" value="John Doe" readOnly />

            <div className="payments-label">Amount</div>
            <input className="payments-input" value="$29.99" readOnly />

            <div className="payments-label">Method</div>
            <input className="payments-input" value="Credit Card" readOnly />

            <div className="payments-label">Status</div>
            <input className="payments-input" value="Paid" readOnly />

            <button className="payments-bigbtn" onClick={noop} type="button">
              Save
            </button>

            <div className="payments-actions">
              <button className="payments-btn" onClick={noop} type="button">
                Reset
              </button>
              <button
                className="payments-btn-delete"
                onClick={noop}
                type="button"
              >
                Refund
              </button>
            </div>

            <div className="payments-tip">UI-only mock.</div>
          </div>
        </aside>

        {/* RIGHT */}
        <main className="payments-right">
          <div className="payments-navbar">
            <button
              className="payments-navbtn"
              type="button"
              onClick={() => go("/customers")}
            >
              Customers
            </button>

            <button
              className="payments-navbtn"
              type="button"
              onClick={() => go("/packages")}
            >
              Packages
            </button>

            <button
              className="payments-navbtn"
              type="button"
              onClick={() => go("/subscriptions")}
            >
              Subscriptions
            </button>

            <button
              className="payments-navbtn payments-navbtn-active"
              type="button"
              onClick={() => go("/payments")}
            >
              Payments
            </button>
          </div>

          <div className="payments-header">
            <div>ID</div>
            <div>Customer</div>
            <div>Amount</div>
            <div>Method</div>
            <div>Date</div>
          </div>

          {payments.map((p) => (
            <div className="payments-row" key={p.id} onClick={noop}>
              <div>{p.id}</div>
              <div>{p.customer}</div>
              <div>{p.amount}</div>
              <div>{p.method}</div>
              <div>{p.date}</div>
            </div>
          ))}

          <div className="payments-muted">Static UI only.</div>
        </main>
      </div>
    </div>
  );
}
