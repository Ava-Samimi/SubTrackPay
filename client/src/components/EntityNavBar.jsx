import { Link, useLocation } from "react-router-dom";
import LogoutButton from "./LogoutButton.jsx";
import "./EntityNavBar.css";

export default function EntityNavBar({
  className = "",
  listMode = false,
  listButtonEnabled = true,
  onToggleListMode = () => {},
}) {
  const location = useLocation();
  const isActiveRoute = (path) => location.pathname === path;

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
