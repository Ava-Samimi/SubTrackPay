// client/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import AuthGate from "./AuthGate.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";

import CustomersPage from "./pages/customers/CustomersPage.jsx";
import PackagesPage from "./pages/packages/PackagesPage.jsx";
import SubscriptionsPage from "./pages/subscriptions/SubscriptionsPage.jsx";
import PaymentsPage from "./pages/payments/PaymentsPage.jsx";
import AnalyticsPage from "./pages/analytics/AnalyticsPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <AuthGate>
            <Navigate to="/customers" replace />
          </AuthGate>
        }
      />
      <Route
        path="/customers"
        element={
          <AuthGate>
            <CustomersPage />
          </AuthGate>
        }
      />
      <Route
        path="/packages"
        element={
          <AuthGate>
            <PackagesPage />
          </AuthGate>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <AuthGate>
            <SubscriptionsPage />
          </AuthGate>
        }
      />
      <Route
        path="/payments"
        element={
          <AuthGate>
            <PaymentsPage />
          </AuthGate>
        }
      />
      <Route
        path="/analytics"
        element={
          <AuthGate>
            <AnalyticsPage />
          </AuthGate>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  );
}
