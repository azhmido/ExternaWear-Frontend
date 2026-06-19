import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Package, Clock,
  ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Check, X,
  AlertTriangle, Trash2, ExternalLink, XCircle,
  MapPin, Plus, Star, Home, Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import FocusTrap from '../components/FocusTrap';
import { SkeletonOrderItem, SkeletonAddressItem } from '../components/Skeleton';
import api from '../api/apiClient';
import { confirmToast } from '../utils/confirmToast';
import { PAYMENT_METHODS } from '../utils/paymentMethods';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PROFILE_TABS = [
  { key:'orders',   label:'Pesanan' },
  { key:'profile',  label:'Profil' },
  { key:'addresses', label:'Alamat' },
  { key:'settings', label:'Pengaturan' },
];

const STATUS_CFG = {
  pending:   { label:'Menunggu Konfirmasi', color:'bg-yellow-100 text-yellow-800', dot:'bg-yellow-500' },
  confirmed: { label:'Dikonfirmasi',        color:'bg-blue-100 text-blue-800',     dot:'bg-blue-500'   },
  shipped:   { label:'Dalam Pengiriman',    color:'bg-purple-100 text-purple-800', dot:'bg-purple-500' },
  delivered: { label:'Pesanan Diterima',    color:'bg-green-100 text-green-800',   dot:'bg-green-500'  },
  cancelled: { label:'Dibatalkan',          color:'bg-red-100 text-red-800',       dot:'bg-red-400'    },
};

const ProfilePage = () => {
  const { user, checkAuth } = useAuth();
  const { clearCart }       = useCart();
  const navigate             = useNavigate();
  useDocumentTitle('Profil');

  const [activeTab, setActiveTab]         = useState('orders');
  const [orders, setOrders]               = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [orderPage, setOrderPage]         = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const abortRef = useRef(null);

  //cache hasil filter pesanan
  const statusCounts = useMemo(() => {
    const counts = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  //edit username
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername]         = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);

  //ubah password
  const [passForm, setPassForm]       = useState({ current:'', newPass:'', confirm:'' });
  const [showPass, setShowPass]       = useState({ current:false, newPass:false, confirm:false });
  const [passLoading, setPassLoading] = useState(false);

  //hapus akun
  const [showDeleteModal, setShowDeleteModal]       = useState(false);
  const [deletePassword, setDeletePassword]         = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteLoading, setDeleteLoading]           = useState(false);

  //manajemen alamat
  const [addresses, setAddresses]           = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress]     = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Rumah', name: '', phone: '', address: '', city: '', postalCode: '',
  });

  //fetch dari API, set state, render list
  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data);
    } catch { setAddresses([]); }
    finally { setLoadingAddresses(false); }
  };

  //isi form dari data alamat
  const resetAddressForm = (addr = null) => {
    setAddressForm(addr ? {
      label: addr.label,
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      postalCode: addr.postal_code,
    } : { label: 'Rumah', name: '', phone: '', address: '', city: '', postalCode: '' });
    setEditingAddress(addr);
    setShowAddressModal(true);
  };

  const openAddAddress = () => resetAddressForm(null);
  const openEditAddress = (addr) => resetAddressForm(addr);

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
  };

  const handleSaveAddress = async () => {
    const { name, phone, address, city, postalCode } = addressForm;
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !postalCode.trim()) {
      toast.error('Semua field alamat wajib diisi.');
      return;
    }
    try {
      if (editingAddress) {
        await api.patch(`/addresses/${editingAddress.id}`, addressForm);
        toast.success('Alamat berhasil diperbarui.');
      } else {
        await api.post('/addresses', addressForm);
        toast.success('Alamat baru berhasil ditambahkan.');
      }
      fetchAddresses();
      closeAddressModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan alamat.');
    }
  };

  //confirmToast pakai custom confirm
  const handleDeleteAddress = (addr) => {
    confirmToast(`Hapus alamat "${addr.label}"?`, async () => {
      try {
        await api.delete(`/addresses/${addr.id}`);
        toast.success('Alamat berhasil dihapus.');
        fetchAddresses();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Gagal menghapus alamat.');
      }
    }, { confirmLabel: 'Ya, Hapus' });
  };

  //alamat default 
  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      toast.success('Alamat utama berhasil diubah.');
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah alamat utama.');
    }
  };

  //fetch alamat pas pertama render
  useEffect(() => {
    fetchAddresses();
  }, []);

  //ambil pesanan user dengan pagination
  const fetchOrders = useCallback(async (p) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoadingOrders(true);
    try {
      const pg = p ?? orderPage;
      const res = await api.get(`/orders/mine?page=${pg}&limit=10`, { signal: controller.signal });
      setOrders(res.data.data || []);
      setOrderTotalPages(res.data.totalPages || 1);
    } catch { setOrders([]); }
    finally { setLoadingOrders(false); }
  }, [orderPage]);

  //fetch pesanan pas pertama render
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  //scroll ke atas tiap ganti tab atau halaman pesanan
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab, orderPage]);

  const handleOrderPageChange = useCallback((p) => {
    setOrderPage(p);
    fetchOrders(p);
  }, [fetchOrders]);

  //konfirmasi dulu lalu patch status ke cancelled lalu update state biar UI langsung berubah
  const handleCancel = (orderId) => {
    confirmToast(`Batalkan EW-${String(orderId).padStart(6, '0')}?`, async () => {
      try {
        await api.patch(`/orders/${orderId}/cancel`);
        toast.success('Pesanan berhasil dibatalkan.');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status:'cancelled' } : o));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Gagal membatalkan pesanan.');
      }
    }, {
      description:   'Pesanan yang dibatalkan tidak dapat diproses kembali.',
      confirmLabel: 'Ya, Batalkan',
    });
  };

  //username user diganti lewat form inline
  const startEditUsername = () => {
    setNewUsername(user?.username || '');
    setEditingUsername(true);
  };

  const cancelEditUsername = () => {
    setEditingUsername(false);
    setNewUsername('');
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername.trim() === user?.username) {
      cancelEditUsername();
      return;
    }
    setUsernameLoading(true);
    try {
      await api.patch('/users/profile', { username: newUsername.trim() });
      await checkAuth();
      toast.success('Username berhasil diperbarui!');
      setEditingUsername(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui username.');
    } finally {
      setUsernameLoading(false);
    }
  };

  //passForm di-update per field buat form ubah password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPass !== passForm.confirm) {
      toast.error('Konfirmasi password tidak cocok!');
      return;
    }
    setPassLoading(true);
    try {
      await api.patch('/users/profile/password', {
        currentPassword: passForm.current,
        newPassword:     passForm.newPass,
      });
      toast.success('Password berhasil diubah!');
      setPassForm({ current:'', newPass:'', confirm:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setPassLoading(false);
    }
  };

  //kirim password buat verifikasi sebelum hapus akun permanen
  //JWT tetap dikirim via cookie (httpOnly) untuk otentikasi endpoint ini
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setShowDeletePassword(false);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeleteLoading(true);
    try {
      await api.delete('/users/account', { data: { password: deletePassword } });
      toast.success('Akun berhasil dihapus. Sampai jumpa!');
      clearCart();
      setShowDeleteModal(false);
      await checkAuth();
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus akun.');
      setDeleteLoading(false);
    }
  };

  //cache hasil filter pesanan
  //biar nggak filter .reduce() tiap render
  const filteredOrders = useMemo(() =>
    statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter),
    [orders, statusFilter]
  );

  //total belanja cache biar nggak ngitung ulang tiap render
  const totalSpent = useMemo(() =>
    orders
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.total_price), 0),
    [orders]
  );

  //cek apakah invoice Xendit masih bisa dibayar
  const canPayNow = (order) =>
    order.xendit_payment_url
    && order.status === 'pending'
    && order.xendit_status !== 'EXPIRED'
    && order.payment_method !== 'cod';

  const isInvoiceExpired = (order) =>
    order.xendit_status === 'EXPIRED'
    && order.status === 'pending'
    && order.payment_method !== 'cod';

  return (
    <div className="min-h-screen bg-linen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">

        {/* ─── Profile Header ─── */}
          <div className="bg-ink rounded-3xl overflow-hidden">
          <div className="px-5 sm:px-8 py-5 sm:py-7 flex items-center gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-mahogany rounded-2xl flex items-center justify-center text-linen text-2xl sm:text-4xl font-display font-bold select-none flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl sm:text-3xl font-bold text-linen truncate">{user?.username}</h1>
              <span className="text-xs bg-parchment/20 text-caramel px-3 py-1 rounded-full mt-1.5 inline-block">
                {user?.role === 'user' ? '👤 Pelanggan' : user?.role}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-parchment/20">
            {[
              { label:'Total Pesanan',   value: orders.length },
              { label:'Total Belanja',   value: `Rp ${totalSpent.toLocaleString('id-ID')}` },
              { label:'Pesanan Aktif',   value: orders.filter(o => !['delivered','cancelled'].includes(o.status)).length },
            ].map(({ label, value }, i) => (
              <div key={label} className={`py-3 sm:py-5 text-center ${i < 2 ? 'border-r border-parchment/20' : ''}`}>
                <p className="font-display text-base sm:text-2xl font-bold text-linen truncate px-1">{value}</p>
                <p className="text-caramel text-[10px] sm:text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-1 bg-parchment/40 p-1 rounded-xl overflow-x-auto scrollbar-thin w-full sm:w-fit">
          {PROFILE_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${activeTab === key ? 'bg-ink text-linen' : 'text-espresso hover:text-ink'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ─── Tab: Pesanan ─── */}
        {activeTab === 'orders' && (
          <div className="bg-ivory rounded-3xl border border-parchment overflow-hidden animate-fadeIn">
            {/* Filter status */}
            <div className="px-4 sm:px-6 py-4 border-b border-parchment flex items-center gap-2 overflow-x-auto scrollbar-thin">
              {['all','pending','confirmed','shipped','delivered','cancelled'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${statusFilter === s ? 'bg-ink text-linen' : 'bg-linen text-espresso border border-parchment hover:border-mahogany'}`}>
                  {s === 'all'
                    ? `Semua (${orders.length})`
                    : `${STATUS_CFG[s]?.label} (${statusCounts[s] || 0})`}
                </button>
              ))}
            </div>

            <div className="p-6">
              {loadingOrders ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <SkeletonOrderItem key={i} />)}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Package size={48} className="text-parchment" />
                  <p className="text-caramel">Tidak ada pesanan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const cfg        = STATUS_CFG[order.status] || STATUS_CFG.pending;
                    const isExpanded = expandedOrder === order.id;
                    const delivery   = order.delivery_info;
                    const PaymentIcon = order.payment_method && PAYMENT_METHODS[order.payment_method]?.icon;

                    return (
                      <div key={order.id} className="border border-parchment rounded-2xl overflow-hidden hover:border-mahogany/30 transition">
                        {/* Header order */}
                        <div className="flex items-center justify-between p-4 sm:p-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                            <div>
                              <p className="font-semibold text-ink">EW-${String(order.id).padStart(6, '0')}</p>
                              <p className="text-xs text-caramel mt-0.5 flex items-center gap-1">
                                <Clock size={11} />
                                {new Date(order.created_at).toLocaleDateString('id-ID', {
                                  day:'numeric', month:'long', year:'numeric',
                                  hour:'2-digit', minute:'2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Badge Bayar Sekarang jika pending & invoice aktif */}
                            {canPayNow(order) && (
                              <span className="text-xs bg-mahogany/10 text-mahogany font-semibold px-2.5 py-1 rounded-full hidden sm:inline">
                                Belum Dibayar
                              </span>
                            )}
                            <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-full ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <button
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              className="text-caramel hover:text-ink transition"
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </div>
                        </div>

                        {/* Preview total */}
                        <div className="px-5 pb-4 border-t border-parchment">
                          <div className="flex items-center justify-between pt-3">
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-caramel">
                                {order.items?.length} item{order.items?.length > 1 ? 's' : ''}
                              </p>
                              {/* Badge metode pembayaran */}
                              {PaymentIcon && (
                                <span className="flex items-center gap-1 text-xs text-caramel bg-parchment/50 px-2 py-1 rounded-full">
                                  <PaymentIcon size={11} />
                                  {PAYMENT_METHODS[order.payment_method]?.label}
                                </span>
                              )}
                            </div>
                            <p className="font-display text-lg font-bold text-ink">
                              Rp {Number(order.total_price).toLocaleString('id-ID')}
                            </p>
                          </div>

                          {/* Detail expanded */}
                          {isExpanded && (
                            <div className="mt-4 space-y-4">
                              {/* Daftar item */}
                              <div className="space-y-2">
                                {order.items?.map((item, i) => (
                                  <div key={`${item.product_name}-${item.size}-${i}`} className="flex justify-between items-center bg-linen rounded-xl px-4 py-3 text-sm">
                                    <div>
                                      <p className="font-medium text-ink">{item.product_name}</p>
                                      <p className="text-caramel text-xs">{item.size} · ×{item.quantity}</p>
                                    </div>
                                    <p className="font-medium text-mahogany">
                                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Info pengiriman + metode pembayaran */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {delivery && (
                                  <div className="bg-linen border border-parchment rounded-xl p-4">
                                    <p className="text-xs font-semibold text-espresso uppercase tracking-wide mb-2">
                                      Alamat Pengiriman
                                    </p>
                                    <p className="text-sm font-medium text-ink">{delivery.name}</p>
                                    <p className="text-sm text-caramel">{delivery.phone}</p>
                                    <p className="text-sm text-caramel">
                                      {delivery.address}, {delivery.city} {delivery.postalCode}
                                    </p>
                                  </div>
                                )}

                                {order.payment_method && PAYMENT_METHODS[order.payment_method] && (
                                  <div className="bg-linen border border-parchment rounded-xl p-4 flex items-start gap-3">
                                    <div className="bg-ink text-linen p-2 rounded-lg flex-shrink-0">
                                      {(() => {
                                        const Icon = PAYMENT_METHODS[order.payment_method].icon;
                                        return <Icon size={16} />;
                                      })()}
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-espresso uppercase tracking-wide mb-2">
                                        Metode Pembayaran
                                      </p>
                                      <p className="text-sm font-medium text-ink">
                                        {PAYMENT_METHODS[order.payment_method].label}
                                      </p>
                                      {order.xendit_status && order.payment_method !== 'cod' && (
                                        <p className={`text-xs mt-1 font-medium ${
                                          order.xendit_status === 'PAID'    ? 'text-green-600' :
                                          order.xendit_status === 'EXPIRED' ? 'text-red-500'   :
                                          'text-yellow-600'
                                        }`}>
                                          {order.xendit_status === 'PAID'    ? '✅ Pembayaran diterima'  :
                                           order.xendit_status === 'EXPIRED' ? '⏱️ Invoice kedaluwarsa' :
                                           '⏳ Menunggu pembayaran'}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* ── Aksi ─────────────────────────────────── */}

                              {/* Tombol Bayar Sekarang — invoice Xendit masih aktif */}
                              {canPayNow(order) && (
                                <a
                                  href={order.xendit_payment_url}
                                  className="w-full flex items-center justify-center gap-2 bg-mahogany hover:bg-espresso text-linen font-semibold py-3 rounded-xl text-sm transition"
                                  target="_blank"
                                  rel="noreferrer noopener"
                                >
                                  <ExternalLink size={16} /> Bayar Sekarang
                                </a>
                              )}

                              {/* Badge invoice kedaluwarsa */}
                              {isInvoiceExpired(order) && (
                                <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 py-3 rounded-xl text-sm">
                                  <XCircle size={16} /> Invoice pembayaran telah kedaluwarsa
                                </div>
                              )}

                              {/* Tombol Batalkan Pesanan — hanya status pending */}
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => handleCancel(order.id)}
                                  className="w-full py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition"
                                >
                                  Batalkan Pesanan
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Pagination page={orderPage} totalPages={orderTotalPages} onPageChange={handleOrderPageChange} />
            </div>
          </div>
        )}

        {/* ─── Tab: Profil ─── */}
        {activeTab === 'profile' && (
          <div className="bg-ivory rounded-3xl border border-parchment p-6 sm:p-8 animate-fadeIn">
            <h2 className="font-display text-xl font-semibold text-ink mb-6">Informasi Akun</h2>
            <div className="space-y-1">
              {/* Username — editable */}
              <div className="flex items-center gap-4 py-4 border-b border-parchment">
                <p className="text-sm text-caramel w-28 flex-shrink-0">Username</p>
                {editingUsername ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')  handleUpdateUsername();
                        if (e.key === 'Escape') cancelEditUsername();
                      }}
                      className="flex-1 bg-linen border border-parchment rounded-xl px-4 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition"
                      autoFocus
                    />
                    <button onClick={handleUpdateUsername} disabled={usernameLoading}
                      className="p-2 bg-ink hover:bg-espresso text-linen rounded-xl transition disabled:opacity-60">
                      {usernameLoading
                        ? <span className="w-4 h-4 border-2 border-linen border-t-transparent rounded-full animate-spin block" />
                        : <Check size={16} />}
                    </button>
                    <button onClick={cancelEditUsername}
                      className="p-2 border border-parchment text-caramel hover:text-red-500 hover:border-red-200 rounded-xl transition">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-1">
                    <p className="font-medium text-ink">{user?.username}</p>
                    <button onClick={startEditUsername}
                      className="flex items-center gap-1.5 text-xs text-caramel hover:text-mahogany border border-parchment hover:border-mahogany px-3 py-1.5 rounded-full transition">
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 py-4 border-b border-parchment">
                <p className="text-sm text-caramel w-28">Role</p>
                <p className="font-medium text-ink">
                  {user?.role === 'user' ? 'Pelanggan' : user?.role}
                </p>
              </div>

              <div className="flex items-center gap-4 py-4">
                <p className="text-sm text-caramel w-28">Statistik</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-ink">{orders.length} pesanan</span>
                  <span className="text-caramel">·</span>
                  <span className="text-mahogany font-medium">
                    Rp {totalSpent.toLocaleString('id-ID')} dibelanjakan
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab: Alamat ─── */}
        {activeTab === 'addresses' && (
          <div className="bg-ivory rounded-3xl border border-parchment overflow-hidden animate-fadeIn">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-parchment flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-semibold text-ink">Alamat Tersimpan</h2>
                <p className="text-caramel text-xs sm:text-sm mt-0.5">
                  Kelola alamat pengiriman Anda.
                </p>
              </div>
              <button onClick={openAddAddress}
                className="flex items-center gap-1.5 sm:gap-2 bg-ink hover:bg-espresso text-linen px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap">
                <Plus size={15} /> Tambah
              </button>
            </div>

            <div className="p-6">
              {loadingAddresses ? (
                <div className="space-y-3">
                  {[1,2].map(i => <SkeletonAddressItem key={i} />)}
                </div>
              ) : addresses.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <MapPin size={48} className="text-parchment" />
                  <p className="text-caramel">Belum ada alamat tersimpan.</p>
                  <button onClick={openAddAddress}
                    className="flex items-center gap-2 bg-ink hover:bg-espresso text-linen px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                    <Plus size={16} /> Tambah Alamat Baru
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div key={addr.id}
                      className={`border rounded-2xl p-5 transition ${
                        addr.is_default ? 'border-ink bg-linen' : 'border-parchment hover:border-mahogany/40'
                      }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="flex items-center gap-1 text-sm font-semibold text-ink">
                              {addr.label === 'Rumah' ? <Home size={15} /> :
                               addr.label === 'Kantor' ? <Building2 size={15} /> :
                               <MapPin size={15} />}
                              {addr.label}
                            </span>
                            {addr.is_default && (
                              <span className="flex items-center gap-0.5 text-xs bg-ink text-linen px-2 py-0.5 rounded-full font-medium">
                                <Star size={10} /> Utama
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-ink">{addr.name}</p>
                          <p className="text-sm text-caramel">{addr.phone}</p>
                          <p className="text-sm text-caramel mt-0.5">
                            {addr.address}, {addr.city} {addr.postal_code}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!addr.is_default && (
                            <button onClick={() => handleSetDefault(addr.id)}
                              aria-label="Jadikan alamat utama"
                              className="p-2 text-caramel hover:text-ink hover:bg-parchment/50 rounded-xl transition"
                              title="Jadikan utama">
                              <Star size={15} />
                            </button>
                          )}
                          <button onClick={() => openEditAddress(addr)}
                            aria-label="Edit alamat"
                            className="p-2 text-caramel hover:text-mahogany hover:bg-parchment/50 rounded-xl transition"
                            title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDeleteAddress(addr)}
                            aria-label="Hapus alamat"
                            className="p-2 text-caramel hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                            title="Hapus">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Tab: Pengaturan ─── */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Ubah Password */}
            <div className="bg-ivory rounded-3xl border border-parchment overflow-hidden">
              <div className="px-6 py-5 border-b border-parchment">
                <h2 className="font-display text-xl font-semibold text-ink">Keamanan Akun</h2>
                <p className="text-caramel text-sm mt-0.5">
                  Perbarui password untuk menjaga keamanan akun Anda.
                </p>
              </div>
              <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                {[
                  { key:'current', label:'Password Saat Ini',   placeholder:'Masukkan password saat ini' },
                  { key:'newPass', label:'Password Baru',        placeholder:'Minimal 8 karakter' },
                  { key:'confirm', label:'Konfirmasi Password',  placeholder:'Ulangi password baru' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-espresso mb-1.5">{label}</label>
                    <div className="relative">
                      <input
                        type={showPass[key] ? 'text' : 'password'}
                        placeholder={placeholder}
                        value={passForm[key]}
                        onChange={(e) => setPassForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full bg-linen border border-parchment rounded-xl px-4 py-3 pr-12 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition"
                        required
                      />
                      <button type="button"
                        onClick={() => setShowPass(s => ({ ...s, [key]: !s[key] }))}
                        aria-label={showPass[key] ? 'Sembunyikan password' : 'Tampilkan password'}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-caramel hover:text-ink transition">
                        {showPass[key] ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                ))}
                <button type="submit" disabled={passLoading}
                  className="w-full bg-ink hover:bg-espresso active:scale-95 text-linen font-semibold py-3.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {passLoading
                    ? <><span className="w-4 h-4 border-2 border-linen border-t-transparent rounded-full animate-spin" /> Memproses...</>
                    : 'Ubah Password'}
                </button>
              </form>
            </div>

            {/* ─── Danger Zone ─── */}
            <div className="bg-ivory rounded-3xl border border-red-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-red-100 bg-red-50/60">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={19} className="text-red-500" />
                  <h2 className="font-display text-xl font-semibold text-ink">Zona Berbahaya</h2>
                </div>
                <p className="text-caramel text-sm mt-0.5">
                  Tindakan berikut bersifat permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium text-ink">Hapus Akun</p>
                    <p className="text-sm text-caramel mt-0.5 max-w-md">
                      Akun, profil, dan seluruh riwayat pesanan Anda akan dihapus permanen dari sistem kami.
                    </p>
                  </div>
                  <button onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 border border-red-300 text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-xl text-sm font-medium transition flex-shrink-0">
                    <Trash2 size={15} /> Hapus Akun Saya
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ─── Modal Tambah/Edit Alamat ─── */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4 transition-opacity duration-200">
          <FocusTrap><div className="bg-ivory rounded-3xl max-w-md w-full p-6 space-y-5 modal-enter">
            <div className="flex items-center gap-3">
              <div className="bg-ink text-linen p-3 rounded-2xl flex-shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink">
                  {editingAddress ? 'Edit Alamat' : 'Tambah Alamat Baru'}
                </h3>
                <p className="text-caramel text-sm mt-0.5">
                  {editingAddress ? 'Ubah detail alamat Anda.' : 'Simpan alamat untuk checkout lebih cepat.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-espresso mb-1.5">Label Alamat</label>
                <div className="flex gap-2">
                  {['Rumah', 'Kantor', 'Lainnya'].map((l) => (
                    <button key={l} type="button" onClick={() => setAddressForm(f => ({ ...f, label: l }))}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                        addressForm.label === l
                          ? 'border-ink bg-ink text-linen' : 'border-parchment text-espresso hover:border-mahogany/40'
                      }`}>
                      {l === 'Rumah' ? <Home size={15} /> : l === 'Kantor' ? <Building2 size={15} /> : <MapPin size={15} />}
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-espresso mb-1.5">Nama Penerima</label>
                <input type="text" value={addressForm.name}
                  onChange={(e) => setAddressForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nama lengkap penerima"
                  className="w-full bg-linen border border-parchment rounded-xl px-4 py-3 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink transition" />
              </div>

              {/* No HP */}
              <div>
                <label className="block text-sm font-medium text-espresso mb-1.5">Nomor HP</label>
                <input type="tel" inputMode="numeric" value={addressForm.phone}
                  onChange={(e) => setAddressForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Cth: 08123456789"
                  className="w-full bg-linen border border-parchment rounded-xl px-4 py-3 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink transition" />
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-sm font-medium text-espresso mb-1.5">Alamat Lengkap</label>
                <textarea value={addressForm.address}
                  onChange={(e) => setAddressForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Jl. nama jalan, No. rumah, RT/RW, Kelurahan"
                  rows={3}
                  className="w-full bg-linen border border-parchment rounded-xl px-4 py-3 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink transition resize-none" />
              </div>

              {/* Kota & Kode Pos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-espresso mb-1.5">Kota</label>
                  <input type="text" value={addressForm.city}
                    onChange={(e) => setAddressForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Cth: Jakarta Selatan"
                    className="w-full bg-linen border border-parchment rounded-xl px-4 py-3 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-espresso mb-1.5">Kode Pos</label>
                  <input type="text" value={addressForm.postalCode}
                    onChange={(e) => setAddressForm(f => ({ ...f, postalCode: e.target.value }))}
                    placeholder="Cth: 12345"
                    className="w-full bg-linen border border-parchment rounded-xl px-4 py-3 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink transition" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={closeAddressModal}
                className="flex-1 border border-parchment text-espresso hover:bg-parchment/30 py-3 rounded-xl text-sm font-medium transition">
                Batal
              </button>
              <button onClick={handleSaveAddress}
                className="flex-1 bg-ink hover:bg-espresso active:scale-95 text-linen font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
                <Check size={18} /> {editingAddress ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div></FocusTrap>
        </div>
      )}

      {/* ─── Modal Konfirmasi Hapus Akun ─── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4 transition-opacity duration-200">
          <FocusTrap><div className="bg-ivory rounded-3xl max-w-md w-full p-6 space-y-5 modal-enter">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-2xl flex-shrink-0">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink">Hapus Akun Permanen</h3>
                <p className="text-caramel text-sm mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 font-medium mb-1.5">Yang akan terjadi:</p>
              <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
                <li>Akun dan profil Anda dihapus permanen</li>
                <li>Seluruh riwayat pesanan ikut terhapus</li>
                <li>Anda akan langsung keluar dari sesi ini</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso mb-1.5">
                Masukkan password untuk konfirmasi
              </label>
              <div className="relative">
                <input
                  type={showDeletePassword ? 'text' : 'password'}
                  placeholder="Password Anda"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDeleteAccount(); }}
                  className="w-full bg-linen border border-parchment rounded-xl px-4 py-3 pr-12 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition"
                  autoFocus
                />
                <button type="button"
                  onClick={() => setShowDeletePassword(s => !s)}
                  aria-label={showDeletePassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-caramel hover:text-ink transition">
                  {showDeletePassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={closeDeleteModal}
                className="flex-1 border border-parchment text-espresso hover:bg-parchment/30 py-3 rounded-xl text-sm font-medium transition">
                Batal
              </button>
              <button onClick={handleDeleteAccount} disabled={!deletePassword || deleteLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteLoading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menghapus...</>
                  : 'Hapus Akun Saya'}
              </button>
            </div>
          </div></FocusTrap>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default ProfilePage;