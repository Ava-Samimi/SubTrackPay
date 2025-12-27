import { Link, Routes, Route, Navigate } from "react-router-dom";
import CustomersPage from "./pages/CustomersPage.jsx";
import PackagesPage from "./pages/PackagesPage.jsx";
import SubscriptionsPage from "./pages/SubscriptionsPage.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";

export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 18 }}>
      <h1>Billing App</h1>
      <p>Entities: Customer • Package • Subscription • Payment</p>

      <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/customers">Customers</Link>
        <Link to="/packages">Packages</Link>
        <Link to="/subscriptions">Subscriptions</Link>
        <Link to="/payments">Payments</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/customers" />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/packages" element={<PackagesPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Routes>
    </div>
  );
}
