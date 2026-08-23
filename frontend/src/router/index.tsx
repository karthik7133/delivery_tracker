import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute, RoleRoute } from './guards';
import AppLayout from '../components/layout/AppLayout';

// Pages
import LandingPage from '../pages/auth/LandingPage';

// Customer
import ECommerceHomePage from '../pages/customer/ECommerceHomePage';
import CartCheckoutPage from '../pages/customer/CartCheckoutPage';
import CustomerProfilePage from '../pages/customer/CustomerProfilePage';
import OrderListPage from '../pages/customer/OrderListPage';
import CreateOrderPage from '../pages/customer/CreateOrderPage';
import OrderDetailPage from '../pages/customer/OrderDetailPage';
import TrackingPage from '../pages/customer/TrackingPage';

// Agent
import AgentDashboard from '../pages/agent/AgentDashboard';
import AgentOrderListPage from '../pages/agent/AgentOrderListPage';
import AgentOrderDetailPage from '../pages/agent/AgentOrderDetailPage';

// Admin
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage';
import AdminAgentsPage from '../pages/admin/AdminAgentsPage';
import AdminZonesPage from '../pages/admin/AdminZonesPage';
import AdminRateCardsPage from '../pages/admin/AdminRateCardsPage';
import AdminCustomersPage from '../pages/admin/AdminCustomersPage';

function WithLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  const map: Record<string, string> = { CUSTOMER: '/customer', AGENT: '/agent', ADMIN: '/admin' };
  return <Navigate to={map[user.role] ?? '/'} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* Authenticated routes wrapped in AppLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<WithLayout />}>

          {/* Customer (Flipkart-Style E-Commerce Platform) */}
          <Route element={<RoleRoute role="CUSTOMER" />}>
            <Route path="/customer" element={<ECommerceHomePage />} />
            <Route path="/customer/cart" element={<CartCheckoutPage />} />
            <Route path="/customer/profile" element={<CustomerProfilePage />} />
            <Route path="/customer/orders" element={<OrderListPage />} />
            <Route path="/customer/orders/:id" element={<OrderDetailPage />} />
            <Route path="/customer/create-order" element={<CreateOrderPage />} />
            <Route path="/customer/track" element={<TrackingPage />} />
          </Route>

          {/* Agent Portal */}
          <Route element={<RoleRoute role="AGENT" />}>
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="/agent/orders" element={<AgentOrderListPage />} />
            <Route path="/agent/orders/:id" element={<AgentOrderDetailPage />} />
          </Route>

          {/* Admin Console */}
          <Route element={<RoleRoute role="ADMIN" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="/admin/agents" element={<AdminAgentsPage />} />
            <Route path="/admin/zones" element={<AdminZonesPage />} />
            <Route path="/admin/rate-cards" element={<AdminRateCardsPage />} />
            <Route path="/admin/customers" element={<AdminCustomersPage />} />
          </Route>

        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
