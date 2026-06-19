import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute      from './components/ProtectedRoute';
import ProductsPage        from './pages/ProductsPage';

const LoginPage         = lazy(() => import('./pages/LoginPage'));
const RegisterPage      = lazy(() => import('./pages/RegisterPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const AboutPage         = lazy(() => import('./pages/AboutPage'));
const ProfilePage       = lazy(() => import('./pages/ProfilePage'));
const AdminPage         = lazy(() => import('./pages/AdminPage'));
const PaymentStatusPage = lazy(() => import('./pages/PaymentStatusPage'));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage'));

const Fallback = () => (
  <div className="min-h-screen bg-linen flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-ink border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <Suspense fallback={<Fallback />}>
    <Routes>
      <Route path="/"              element={<ProductsPage />} />
      <Route path="/products/:id"  element={<ProductDetailPage />} />
      <Route path="/tentang"       element={<AboutPage />} />
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
      <Route path="*"      element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default App;