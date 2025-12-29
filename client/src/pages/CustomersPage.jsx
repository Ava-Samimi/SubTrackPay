// client/src/pages/customers/CustomersPage.jsx
import React from "react";
import "./CustomersPage.css";

export default function CustomersPage() {
  const noop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const customers = [
    {
      id: "C001",
      name: "Alice Martin",
      email: "alice.martin@example.com",
      phone: "514-555-0101",
      createdAt: "2025-12-01",
    },
    {
      id: "C002",
      name: "John Doe",
      email: "john.doec@example.com",
      phone: "438-555-0112",
      createdAt: "2025-12-10",
    },
    {
      id: "C003",
      name: "Sam Dupont",
      email: "sam.dupont@example.com",
      phone: "418-555-0199",
      createdAt: "2025-12-18",
    },
    {
      id: "C004",
      name: "Mina Chen",
      email: "mina.chen@example.com",
      phone: "647-555-0147",
      createdAt: "2025-12-22",
    },
  ];

  // purely visual styling (hardcoded)
  const selectedCustomerId = "C002";
  const selectedIds = new Set(["C001"]);

  return (
    <div className="customers-page">
      <div className="customers-layout">
        {/* LEFT */}
        <aside className="customers-left">
          <div className="customers-left-title">Customers</div>

          <div className="customers-formcard">
            <div className="customers-label">Customer ID</div>
            <input
              className="customers-input-readonly"
              value="C002"
              readOnly
            />

            <div className="customers-label">Name</div>
            <input className="customers-input" value="Bojan Babic" readOnly />

            <div className="customers-label">Email</div>
            <input
              className="customers-input"
              value="bojan.babic@example.com"
              readOnly
            />

            <div className="customers-label">Phone</div>
            <input className="customers-input" value="438-555-0112" readOnly />

            <button className="customers-bigbtn" type="button" onClick={noop}>
              Save
            </button>

            <div className="customers-actions">
              <button className="customers-btn" type="button" onClick={noop}>
                Reset
              </button>
              <button
                className="customers-btn-delete"
                type="button"
                onClick={noop}
              >
                Delete Selected
              </button>
            </div>

            <div className="customers-tip">
              UI-only page: buttons don’t perform any actions yet.
            </div>
          </div>
        </aside>

        {/* RIGHT */}
        <main className="customers-right">
          {/* NAVBAR (hard-coded, no routing) */}
          <div className="customers-navbar">
            <div className="customers-navgroup">
              <button
                className="customers-navbtn customers-navbtn-active"
                type="button"
                onClick={noop}
              >
                Customers
              </button>

              <button className="customers-navbtn" type="button" onClick={noop}>
                Packages
              </button>

              <button className="customers-navbtn" type="button" onClick={noop}>
                Subscriptions
              </button>

              <button className="customers-navbtn" type="button" onClick={noop}>
                Payments
              </button>

              <button
                className="customers-navbtn customers-navbtn-disabled"
                type="button"
                onClick={noop}
                aria-disabled="true"
              >
                Stats
              </button>
            </div>

            <button
              className="customers-navbtn customers-listbtn"
              type="button"
              onClick={noop}
            >
              List Mode
            </button>
          </div>

          {/* TABLE HEADER */}
          <div className="customers-header">
            <div>ID</div>
            <div>Name</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Created</div>
          </div>

          {/* ROWS */}
          {customers.map((c) => {
            const isActive = c.id === selectedCustomerId;
            const isSelected = selectedIds.has(c.id);

            return (
              <div
                key={c.id}
                className={[
                  "customers-row",
                  isActive ? "customers-row-active" : "",
                  isSelected ? "customers-row-selected" : "",
                ].join(" ")}
                onClick={noop}
                role="button"
                tabIndex={0}
                onKeyDown={noop}
              >
                <div>{c.id}</div>
                <div>{c.name}</div>
                <div>{c.email}</div>
                <div>{c.phone}</div>
                <div>{c.createdAt}</div>
              </div>
            );
          })}

          <div className="customers-muted">
            UI mock only — no CRUD, no API, no database.
          </div>
        </main>
      </div>
    </div>
  );
}
