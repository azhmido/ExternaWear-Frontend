import { Routes, Route } from 'react-router-dom';
import ProtectedRoute      from './components/ProtectedRoute';
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import ProductsPage        from './pages/ProductsPage';
import ProductDetailPage   from './pages/ProductDetailPage';
import ProfilePage         from './pages/ProfilePage';
import AdminPage           from './pages/AdminPage';
import PaymentStatusPage   from './pages/PaymentStatusPage';

const App = () => (
  <Routes>
    <Route path="/"              element={<ProductsPage />} />
    <Route path="/products/:id"  element={<ProductDetailPage />} />
    <Route path="/login"         element={<LoginPage />} />
    <Route path="/register"      element={<RegisterPage />} />

    {/* Halaman status pembayaran — user diarahkan Xendit ke sini setelah bayar */}
    <Route path="/payment/success" element={
      <ProtectedRoute requiredRole="user">
        <PaymentStatusPage type="success" />
      </ProtectedRoute>
    } />
    <Route path="/payment/failure" element={
      <ProtectedRoute requiredRole="user">
        <PaymentStatusPage type="failure" />
      </ProtectedRoute>
    } />

    <Route path="/profile" element={
      <ProtectedRoute requiredRole="user">
        <ProfilePage />
      </ProtectedRoute>
    } />
    <Route path="/admin" element={
      <ProtectedRoute requiredRole="admin">
        <AdminPage />
      </ProtectedRoute>
    } />
  </Routes>
);

export default App;