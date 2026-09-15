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
        <Route path="/login" element={<PlaceholderPage title="Sign In" slice="D" />} />
        <Route path="/register" element={<PlaceholderPage title="Register" slice="D" />} />
        <Route path="/account" element={<PlaceholderPage title="Profile" slice="D" />} />
        <Route path="/account/addresses" element={<PlaceholderPage title="Addresses" slice="D" />} />

        {/* --- Slice A: orders --- */}
        <Route path="/orders" element={<PlaceholderPage title="Order History" slice="A" />} />
        <Route path="/orders/:orderId" element={<PlaceholderPage title="Order Detail" slice="A" />} />

        {/* --- Slice E: payments & staff --- */}
        <Route path="/orders/:orderId/pay" element={<PlaceholderPage title="Payment" slice="E" />} />
        <Route path="/staff" element={<PlaceholderPage title="Staff Dashboard" slice="E" />} />
        <Route path="/staff/catalogue" element={<PlaceholderPage title="Catalogue Management" slice="B" />} />
        <Route path="/staff/stock" element={<PlaceholderPage title="Stock Adjustments" slice="E" />} />
        <Route path="/staff/orders" element={<PlaceholderPage title="Order Console" slice="E" />} />
        <Route path="/staff/cities" element={<PlaceholderPage title="City Management" slice="D" />} />
        <Route path="/staff/users" element={<PlaceholderPage title="User Management" slice="D" />} />
        <Route path="/staff/reports" element={<PlaceholderPage title="Reports" slice="E" />} />

        {/* 404 */}
        <Route path="*" element={<PlaceholderPage title="Page Not Found" slice="" />} />
      </Route>
    </Routes>
  );
}
