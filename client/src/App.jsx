/**
 * App — root component
 *
 * Wraps everything with auth and cart providers,
 * then renders the route tree.
 */
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}
