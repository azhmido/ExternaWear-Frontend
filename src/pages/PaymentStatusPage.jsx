import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle, XCircle, ShoppingBag, ArrowRight,
  RefreshCw, Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/apiClient';

const STATUS_TYPE = {
  success: {
    icon:    CheckCircle,
    iconBg:  'bg-green-100',
    iconColor: 'text-green-500',
    title:   'Pembayaran Berhasil!',
    message: 'Terima kasih! Pesanan Anda telah dikonfirmasi dan sedang diproses.',
    badge:   { text: 'Dikonfirmasi', color: 'bg-green-100 text-green-800' },
  },
  failure: {
    icon:    XCircle,
    iconBg:  'bg-red-100',
    iconColor: 'text-red-500',
    title:   'Pembayaran Gagal',
    message: 'Pembayaran tidak berhasil diselesaikan. Anda dapat mencoba kembali atau memilih metode pembayaran lain.',
    badge:   { text: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800' },
  },
};

const PaymentStatusPage = ({ type = 'success' }) => {
  const { user }                = useAuth();
  const [searchParams]          = useSearchParams();
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const orderId                 = searchParams.get('order_id');
  const cfg                     = STATUS_TYPE[type];
  const Icon                    = cfg.icon;

  const fetchAttempt = useRef(0);

  //polling status pesanan setelah redirect dari xendit
  //kalau type=success: polling 10x tiap 2 detik
  //kalau type=failure: fetch sekali aja
  useEffect(() => {
    if (!orderId || !user) { setLoading(false); return; }

    let cancelled = false;

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (cancelled) return;
        setOrder(res.data);
        if (res.data.status !== 'pending') {
          setLoading(false);
          return true;
        }
      } catch {
        if (!cancelled) setOrder(null);
      }
      return false;
    };

    const poll = async () => {
      fetchAttempt.current = 0;
      const maxAttempts = type === 'success' ? 10 : 1;
      const delay = type === 'success' ? 2000 : 0;

      const run = async () => {
        if (cancelled) return;
        const done = await fetchOrder();
        if (done || ++fetchAttempt.current >= maxAttempts) {
          setLoading(false);
          return;
        }
        setTimeout(run, delay);
      };

      setTimeout(run, delay);
    };

    poll();
    
    return () => { cancelled = true; };
  }, [orderId, user, type]);

  if (loading) return (
    <div className="min-h-screen bg-linen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-ink border-t-transparent rounded-full animate-spin" />
      <p className="text-caramel text-sm">Memverifikasi pembayaran...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">

        {/* Status Card */}
        <div className="bg-ivory rounded-3xl border border-parchment overflow-hidden">
          {/* Header */}
          <div className="bg-ink px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-3">
            <ShoppingBag size={20} className="text-linen" />
            <span className="font-display text-lg sm:text-xl font-bold text-linen">ExternaWear</span>
          </div>

          <div className="p-6 sm:p-8 text-center">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5`}>
              <Icon size={32} className={cfg.iconColor} />
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-ink mb-2">{cfg.title}</h1>
            <p className="text-caramel text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">{cfg.message}</p>
          </div>

          {/* Order Summary */}
          {order && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
              <div className="bg-linen border border-parchment rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-ink text-sm">EW-${String(order.id).padStart(6, '0')}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge.color}`}>
                    {cfg.badge.text}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-espresso">
                        {item.product_name}
                        <span className="text-caramel"> · {item.size} ×{item.quantity}</span>
                      </span>
                      <span className="text-mahogany font-medium">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-3 border-t border-parchment">
                  <span className="font-semibold text-ink text-sm">Total</span>
                  <span className="font-display text-lg font-bold text-ink">
                    Rp {Number(order.total_price).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Retry payment jika gagal dan masih punya payment URL */}
              {type === 'failure' && order.xendit_payment_url && order.xendit_status !== 'EXPIRED' && (
                <a
                  href={order.xendit_payment_url}
                  className="w-full flex items-center justify-center gap-2 bg-mahogany hover:bg-espresso text-linen font-semibold py-3.5 rounded-xl transition"
                >
                  <RefreshCw size={18} /> Coba Bayar Lagi
                </a>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link to="/"
            className="flex-1 flex items-center justify-center gap-2 border border-parchment text-espresso hover:bg-parchment/30 py-3 rounded-xl text-sm font-medium transition">
            <Home size={16} /> Beranda
          </Link>
          <Link to="/profile"
            className="flex-1 flex items-center justify-center gap-2 bg-ink hover:bg-espresso text-linen font-semibold py-3 rounded-xl text-sm transition">
            Lihat Pesanan <ArrowRight size={16} />
          </Link>
        </div>

        {type === 'success' && (
          <p className="text-center text-xs text-caramel">
            Status pesanan diperbarui otomatis setelah pembayaran dikonfirmasi Xendit.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;