
/**
 * AppRoutes — route map for BrightBuy
 * OWNER: shared (everyone adds inside their own block)
 *
 * Route map is defined in docs/UI-GUIDE.md §2.
 * Group routes by slice with a comment header, in the order in the table.
 * Always git pull immediately before editing this file.
 */
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '../components/layout';
import { useCart } from '../context/CartContext';

/* ── Slice C: cart & checkout ─────────────────────────────────────── */
import CartPage from '../features/cart/CartPage';
import CheckoutPage from '../features/cart/CheckoutPage';
import CheckoutSuccessPage from '../features/cart/CheckoutSuccessPage';

/* ── Slice B: catalogue ───────────────────────────────────────────── */
import HomePage from '../features/catalogue/HomePage';

/* ── Slice D: auth & profile ──────────────────────────────────────── */
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import ProfilePage from '../features/auth/ProfilePage';
import AddressBookPage from '../features/auth/AddressBookPage';
import ProtectedRoute from './ProtectedRoute';
import CityManagementPage from '../features/auth/CityManagementPage';
import UserManagementPage from '../features/auth/UserManagementPage';
import AuditLogPage from '../features/auth/AuditLogPage';

/* ── Placeholder pages (replaced as each slice lands) ─────────────── */
import PlaceholderPage from '../features/PlaceholderPage';

export default function AppRoutes() {
  const { itemCount } = useCart();

  return (
    <Routes>
      <Route element={<AppShell cartItemCount={itemCount} />}>
        {/* --- Slice B: catalogue --- */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<PlaceholderPage title="Products" slice="B" />} />
        <Route path="/products/:productId" element={<PlaceholderPage title="Product Detail" slice="B" />} />

        {/* --- Slice C: cart & checkout --- */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success/:orderId" element={<CheckoutSuccessPage />} />

        {/* --- Slice D: auth & profile --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/addresses"
          element={
            <ProtectedRoute>
              <AddressBookPage />
            </ProtectedRoute>
          }
        />

        {/* --- Slice A: orders --- */}
        <Route path="/orders" element={<PlaceholderPage title="Order History" slice="A" />} />
        <Route path="/orders/:orderId" element={<PlaceholderPage title="Order Detail" slice="A" />} />

        {/* --- Slice E: payments & staff --- */}
        <Route path="/orders/:orderId/pay" element={<PlaceholderPage title="Payment" slice="E" />} />
        <Route
          path="/staff"
          element={
            <ProtectedRoute requireStaff>
              <PlaceholderPage title="Staff Dashboard" slice="E" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/catalogue"
          element={
            <ProtectedRoute requireStaff>
              <PlaceholderPage title="Catalogue Management" slice="B" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/stock"
          element={
            <ProtectedRoute requireStaff>
              <PlaceholderPage title="Stock Adjustments" slice="E" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/orders"
          element={
            <ProtectedRoute requireStaff>
              <PlaceholderPage title="Order Console" slice="E" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/cities"
          element={
            <ProtectedRoute requireStaff>
              <CityManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/users"
          element={
            <ProtectedRoute requireAdmin>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/staff/audit-log"
          element={
            <ProtectedRoute requireAdmin>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/reports"
          element={
            <ProtectedRoute requireStaff>
              <PlaceholderPage title="Reports" slice="E" />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<PlaceholderPage title="Page Not Found" slice="" />} />
      </Route>
    </Routes>
  );
}
