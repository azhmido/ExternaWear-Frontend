import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ErrorBoundary><App /></ErrorBoundary>
          {/* sonner: notifikasi toast — durasi 2 detik, tombol tutup, warna sesuai varian */}
          <Toaster position="top-right" richColors duration={2000} closeButton />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);