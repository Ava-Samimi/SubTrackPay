import { Routes, Route, Navigate } from "react-router-dom";

import CustomersPage from "./pages/customers/CustomersPage.jsx";
import PackagesPage from "./pages/packages/PackagesPage.jsx";
import SubscriptionsPage from "./pages/subscriptions/SubscriptionsPage.jsx";
import PaymentsPage from "./pages/payments/PaymentsPage.jsx";
import AnalyticsPage from "./pages/analytics/AnalyticsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/customers" />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/packages" element={<PackagesPage />} />
      <Route path="/subscriptions" element={<SubscriptionsPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
    </Routes>
  );
}
