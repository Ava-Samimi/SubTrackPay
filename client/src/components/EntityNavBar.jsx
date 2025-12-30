import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./EntityNavBar.css";

export default function EntityNavBar({ listEnabled, listMode, onToggleList }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="entity-navbar">
      <div className="entity-navgroup">
        <Link
          className={`entity-navbtn ${isActive("/customers") ? "active" : ""}`}
          to="/customers"
        >
          Customers
        </Link>

        <Link
          className={`entity-navbtn ${isActive("/packages") ? "active" : ""}`}
          to="/packages"
        >
          Packages
        </Link>

        <Link
          className={`entity-navbtn ${isActive("/subscriptions") ? "active" : ""}`}
          to="/subscriptions"
        >
          Subscriptions
        </Link>

        <Link
          className={`entity-navbtn ${isActive("/payments") ? "active" : ""}`}
          to="/payments"
        >
          Payments
        </Link>

        {/* ✅ NEW */}
        <Link
          className={`entity-navbtn ${isActive("/analytics") ? "active" : ""}`}
          to="/analytics"
        >
          Analytics
        </Link>
      </div>

      <button
        type="button"
        className={[
          "entity-navbtn",
          "entity-listbtn",
          listMode ? "active" : "",
          !listEnabled ? "disabled" : "",
        ].join(" ")}
        onClick={() => {
          if (!listEnabled) return;
          onToggleList();
        }}
        title={listEnabled ? "Toggle list mode" : "Add at least 1 item to enable"}
      >
        List
      </button>
    </div>
  );
}
