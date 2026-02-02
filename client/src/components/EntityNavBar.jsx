import { Link, useLocation } from "react-router-dom";
import LogoutButton from "./LogoutButton.jsx";
import "./EntityNavBar.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export default function EntityNavBar({
  className = "",
  listMode = false,
  listButtonEnabled = true,
  onToggleListMode = () => {},
}) {
  const location = useLocation();
  const isActiveRoute = (path) => location.pathname === path;

  async function repopulateDb() {
    const ok = window.confirm(
      "This will DELETE all demo data and REPOPULATE the database. Continue?"
    );
    if (!ok) return;

    try {
      const res = await fetch(`${API}/api/admin/repopulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const t = await res.text();
        alert("Repopulate failed: " + t);
        return;
      }

      alert("DB repopulated. Reloading…");
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Repopulate failed: " + (e?.message || String(e)));
    }
  }

  return (
    <div className={`entity-navbar ${className}`}>
      <div className="entity-navgroup">
        <Link
          className={`entity-navbtn ${isActiveRoute("/customers") ? "entity-navbtn-active" : ""}`}
          to="/customers"
        >
          Customers
        </Link>

        <Link
          className={`entity-navbtn ${isActiveRoute("/packages") ? "entity-navbtn-active" : ""}`}
          to="/packages"
        >
          Packages
        </Link>

        <Link
          className={`entity-navbtn ${isActiveRoute("/subscriptions") ? "entity-navbtn-active" : ""}`}
          to="/subscriptions"
        >
          Subscriptions
        </Link>

        <Link
          className={`entity-navbtn ${isActiveRoute("/payments") ? "entity-navbtn-active" : ""}`}
          to="/payments"
        >
          Payments
        </Link>

        <Link
          className={`entity-navbtn ${isActiveRoute("/analytics") ? "entity-navbtn-active" : ""}`}
          to="/analytics"
        >
          Analytics
        </Link>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>


        <button
          type="button"
          className={[
            "entity-navbtn",
            "entity-listbtn",
            listMode ? "entity-navbtn-active" : "",
            !listButtonEnabled ? "entity-navbtn-disabled" : "",
          ].join(" ")}
          onClick={() => {
            if (!listButtonEnabled) return;
            onToggleListMode();
          }}
          title={listButtonEnabled ? "Toggle list mode" : "Add at least 1 item to enable"}
        >
          List
        </button>

        <LogoutButton className="entity-navbtn" />
      </div>
    </div>
  );
}
