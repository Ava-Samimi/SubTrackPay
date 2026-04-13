// client/src/components/CallModal.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { listPayments, updatePayment } from "../pages/payments/paymentsApi.js";

export default function CallModal({ open, onClose }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const loadPastDue = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const all = await listPayments();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pastDue = (Array.isArray(all) ? all : []).filter((p) => {
        if (p.status === "PAID" || p.status === "VOID") return false;
        const due = new Date(p.dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
      });

      setPayments(pastDue);
    } catch (e) {
      setFetchError(e?.message || "Failed to load overdue payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadPastDue();
  }, [open, loadPastDue]);

  const [payingId, setPayingId] = useState(null);

  const markAsPaid = useCallback(async (paymentID) => {
    setPayingId(paymentID);
    try {
      await updatePayment(paymentID, {
        status: "PAID",
        paidAt: new Date().toISOString(),
      });
      setPayments((prev) => prev.filter((p) => p.paymentID !== paymentID));
    } catch (e) {
      setFetchError(e?.message || "Failed to mark payment as paid");
    } finally {
      setPayingId(null);
    }
  }, []);

  const enrichedCustomers = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;

    return payments.map((p) => {
      const due = new Date(p.dueDate);
      due.setHours(0, 0, 0, 0);
      const daysLate = Math.max(0, Math.floor((today - due) / msPerDay));

      const customer = p.subscription?.customer;
      const name = customer
        ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || `Customer #${customer.customerID}`
        : "Unknown";

      const pkg = p.subscription?.package;
      const subscription =
        (pkg?.name ?? pkg?.packageName ?? pkg?.title ?? "").trim() ||
        `Sub #${p.subscriptionID}`;

      return {
        paymentID: p.paymentID,
        name,
        dueDate: String(p.dueDate).slice(0, 10),
        subscription,
        daysLate,
        status: p.status,
      };
    });
  }, [payments]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={styles.backdrop}>
      <div
        style={styles.modal}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>Call Center</h2>
          <button onClick={onClose} style={styles.xBtn} aria-label="Close">
            ✕
          </button>
        </div>

        <p style={styles.subtext}>
          Customers with overdue payments that should be contacted by customer
          service.
        </p>

        {fetchError && (
          <p style={{ color: "#ff8a8a", marginBottom: 12 }}>{fetchError}</p>
        )}

        <div style={styles.tableWrap}>
          {loading ? (
            <p style={{ padding: "20px 16px", opacity: 0.6, margin: 0 }}>Loading overdue payments…</p>
          ) : enrichedCustomers.length === 0 ? (
            <p style={{ padding: "20px 16px", opacity: 0.6, margin: 0 }}>
              🎉 No overdue payments found.
            </p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Due Date</th>
                  <th style={styles.th}>Days Late</th>
                  <th style={styles.th}>Subscription</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {enrichedCustomers.map((customer, index) => (
                  <tr key={`${customer.name}-${index}`} style={styles.tr}>
                    <td style={styles.td}>{customer.name}</td>
                    <td style={styles.td}>{customer.dueDate}</td>
                    <td style={styles.td}>
                      <span style={styles.lateBadge}>{customer.daysLate} days</span>
                    </td>
                    <td style={styles.td}>{customer.subscription}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.lateBadge,
                        background: customer.status === "FAILED"
                          ? "rgba(255,140,0,0.18)"
                          : "rgba(255,80,80,0.18)",
                        borderColor: customer.status === "FAILED"
                          ? "rgba(255,140,0,0.35)"
                          : "rgba(255,80,80,0.35)",
                        color: customer.status === "FAILED" ? "#ffb347" : "#ff8a8a",
                      }}>
                        {customer.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => markAsPaid(customer.paymentID)}
                        disabled={payingId === customer.paymentID}
                        style={{
                          ...styles.paidBtn,
                          opacity: payingId === customer.paymentID ? 0.5 : 1,
                          cursor: payingId === customer.paymentID ? "not-allowed" : "pointer",
                        }}
                      >
                        {payingId === customer.paymentID ? "Saving…" : "✓ Paid"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnSecondary}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999,
  },
  modal: {
    width: "min(980px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#0f1115",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    color: "white",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
  },
  subtext: {
    marginTop: 10,
    marginBottom: 16,
    opacity: 0.85,
  },
  tableWrap: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    overflow: "hidden",
    background: "rgba(255,255,255,0.04)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontSize: 14,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  td: {
    padding: "12px 14px",
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
  },
  lateBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(255,80,80,0.18)",
    border: "1px solid rgba(255,80,80,0.35)",
    color: "#ff8a8a",
    fontSize: 12,
    fontWeight: 600,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  paidBtn: {
    padding: "5px 12px",
    borderRadius: 8,
    border: "1px solid rgba(72,199,120,0.4)",
    background: "rgba(72,199,120,0.12)",
    color: "#48c778",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnSecondary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
};