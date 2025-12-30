import React from "react";
import EntityNavBar from "../../components/EntityNavBar.jsx";
import "../shared/EntityPage.css";

export default function AnalyticsPage() {
  return (
    <div className="entity-page">
      <div className="entity-layout">
        <div className="entity-left">
          <div className="entity-left-title">Analytics</div>
          <div className="entity-card">
            Analytics dashboard will go here.
          </div>
        </div>

        <div className="entity-right">
          <EntityNavBar
            listEnabled={false}
            listMode={false}
            onToggleList={() => {}}
          />

          <div className="entity-muted">
            Coming soon: charts, totals, monthly spend, paid vs due, etc.
          </div>
        </div>
      </div>
    </div>
  );
}
