// client/src/components/HelpModal.jsx
import { useLocation } from "react-router-dom";

export default function HelpModal({ open, onClose }) {
  const location = useLocation();

  if (!open) return null;

  const hackerGreen = "#39ff14";

  const helpContentByPath = {
    "/customers": {
      title: "CUSTOMERS PAGE",
      items: [
        "View the full list of customers",
        "Add new customer records",
        "Modify existing customer information",
        "Delete customer records",
        "Browse customer records and account details",
        "Inspect client information stored in the billing system",
      ],
    },
    "/packages": {
      title: "PACKAGES PAGE",
      items: [
        "View available subscription packages",
        "Add new packages",
        "Modify package pricing and structure",
        "Delete packages",
        "Compare package details",
        "Review packages assigned to customers",
      ],
    },
    "/subscriptions": {
      title: "SUBSCRIPTIONS PAGE",
      items: [
        "Review active and inactive subscriptions",
        "Add new subscriptions",
        "Modify existing subscriptions",
        "Delete subscriptions",
        "Inspect customer-package relationships",
        "Monitor subscription status",
      ],
    },
    "/payments": {
      title: "PAYMENTS PAGE",
      items: [
        "Inspect payment history",
        "Add new payment entries",
        "Modify payment records",
        "Delete payment records",
        "Review payment status",
        "Identify failed or overdue payments",
      ],
    },
    "/analytics": {
      title: "ANALYTICS PAGE",
      items: [
        "Explore charts and metrics",
        "Analyze customers and subscriptions",
        "Review revenue trends",
        "Visualize data across the billing platform",
        "Inspect business patterns and summaries",
      ],
    },
  };

  const currentHelp = helpContentByPath[location.pathname] || {
    title: "BILLING APP",
    items: ["General help for the application"],
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10001,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(820px, 96vw)",
          background: "#0d1117",
          border: "1px solid rgba(57,255,20,0.35)",
          borderRadius: 14,
          padding: 24,
          fontFamily: "Courier New, Courier, monospace",
          boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 28,
              color: "#ff3b3b",
              letterSpacing: 1,
              fontWeight: "bold",
            }}
          >
            HELP
          </h2>

          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid rgba(57,255,20,0.4)",
              background: "rgba(57,255,20,0.08)",
              color: hackerGreen,
              cursor: "pointer",
              fontFamily: "Courier New, monospace",
            }}
          >
            CLOSE
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: hackerGreen,
                marginBottom: 12,
              }}
            >
              {currentHelp.title}
            </div>

            <div
              style={{
                background: "rgba(57,255,20,0.05)",
                border: "1px solid rgba(57,255,20,0.2)",
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div
                style={{
                  marginBottom: 10,
                  color: hackerGreen,
                  fontSize: 16,
                }}
              >
                What can be done on this page:
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  color: hackerGreen,
                }}
              >
                {currentHelp.items.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      marginBottom: 10,
                      fontSize: 15,
                    }}
                  >
                    - {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            style={{
              width: 180,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src="/bird.png"
              alt="Bird logo"
              style={{
                maxWidth: "100%",
                objectFit: "contain",
                filter:
                  "drop-shadow(0 0 10px rgba(57,255,20,0.25)) drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}