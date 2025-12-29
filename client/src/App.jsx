// client/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import CustomersPage from "./pages/CustomersPage.jsx";
import PackagesPage from "./pages/PackagesPage.jsx";
import SubscriptionsPage from "./pages/SubscriptionsPage.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Default */}
      <Route path="/" element={<Navigate to="/customers" replace />} />

      {/* Pages */}
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/packages" element={<PackagesPage />} />
      <Route path="/subscriptions" element={<SubscriptionsPage />} />
      <Route path="/payments" element={<PaymentsPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  );
}
