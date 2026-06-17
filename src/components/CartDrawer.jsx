import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft,
  MapPin, Phone, User, CheckCircle, Home, Building2, AlertTriangle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { confirmToast } from '../utils/confirmToast';
import { PAYMENT_METHOD_LIST } from '../utils/paymentMethods';
import api from '../api/apiClient';

const STEPS = [
  { id: 1, label: 'Keranjang' },
  { id: 2, label: 'Pengiriman' },
  { id: 3, label: 'Konfirmasi' },
];

const CartDrawer = ({ isOpen, onClose }) => {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [step, setStep]                         = useState(1);
  const [loading, setLoading]                   = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false); // ← modal konfirmasi tutup
  const [delivery, setDelivery]                 = useState({
    name: user?.username || '', phone: '', address: '', city: '', postalCode: '',
  });
  const [errors, setErrors]                     = useState({});
  const [addresses, setAddresses]               = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [savingAddress, setSavingAddress]         = useState(false);
  const [shippingRates, setShippingRates]         = useState([]);
  const [selectedPayment, setSelectedPayment]     = useState('transfer_bank');

  const LABEL_ICONS = { Rumah: Home, Kantor: Building2 };

  const shippingCost = useMemo(() => {
    const city = delivery.city?.toLowerCase().trim();
    const rate = shippingRates.find(r => r.city.toLowerCase() === city);
    return rate ? Number(rate.cost) : 50000;
  }, [delivery.city, shippingRates]);

  const isCityRegistered = delivery.city?.trim() && shippingRates.some(
    r => r.city.toLowerCase() === delivery.city.trim().toLowerCase()
  );

  const computedTotal = useMemo(() => totalPrice + shippingCost, [totalPrice, shippingCost]);

  const refetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data);
      const defaultAddr = res.data.find(a => a.is_default) || res.data[0];
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
    } catch { setAddresses([]); }
  };

  // Fetch ongkir & alamat paralel saat masuk step pengiriman
  useEffect(() => {
    if (step !== 2 || !user) return;
    let cancelled = false;
    setAddressesLoading(true);
    Promise.all([
      api.get('/shipping').catch(() => ({ data: [] })),
      api.get('/addresses').catch(() => ({ data: [] })),
    ]).then(([shipRes, addrRes]) => {
      if (cancelled) return;
      setShippingRates(shipRes.data);
      setAddresses(addrRes.data);
      const defaultAddr = addrRes.data.find(a => a.is_default) || addrRes.data[0];
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      setAddressesLoading(false);
    });
    return () => { cancelled = true; };
  }, [step, user]);

  const handleSaveNewAddress = async () => {
    const { name, phone, address, city, postalCode } = delivery;
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !postalCode.trim()) {
      toast.error('Semua field alamat wajib diisi.');
      return;
    }
    setSavingAddress(true);
    try {
      const res = await api.post('/addresses', {
        label: delivery.addressLabel || 'Rumah',
        name, phone, address, city, postalCode,
      });
      await refetchAddresses();
      setSelectedAddressId(res.data.id);
      setShowNewAddressForm(false);
      toast.success('Alamat baru berhasil disimpan.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan alamat.');
    } finally {
      setSavingAddress(false);
    }
  };

  // ─── Eksekusi reset & tutup yang sesungguhnya ─────────────────────────────
  const performClose = () => {
    setShowCloseConfirm(false);
    setStep(1);
    setErrors({});
    setShowNewAddressForm(false);
    setSelectedAddressId(null);
    setAddresses([]);
    onClose();
  };

  // ─── Tampilkan modal konfirmasi jika sudah di step 2+ ─────────────────────
  const handleClose = () => {
    if (step > 1) {
      setShowCloseConfirm(true);
      return;
    }
    performClose();
  };

  const validateDelivery = () => {
    const e = {};
    if (!delivery.name.trim())       e.name       = 'Nama penerima wajib diisi.';
    if (!delivery.phone.trim())      e.phone      = 'Nomor HP wajib diisi.';
    else if (!/^[0-9]{10,15}$/.test(delivery.phone.replace(/\s/g, ''))) e.phone = 'Nomor HP tidak valid.';
    if (!delivery.address.trim())    e.address    = 'Alamat lengkap wajib diisi.';
    if (!delivery.city.trim())       e.city       = 'Kota wajib diisi.';
    if (!delivery.postalCode.trim()) e.postalCode = 'Kode pos wajib diisi.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && items.length === 0) { toast.error('Keranjang masih kosong!'); return; }
    if (step === 2) {
      if (showNewAddressForm && !validateDelivery()) return;
      if (!showNewAddressForm && addresses.length === 0 && !validateDelivery()) return;
      if (addresses.length > 0 && !showNewAddressForm && !selectedAddressId) {
        toast.error('Pilih alamat pengiriman.');
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleConfirm = async () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu!');
      navigate('/login');
      handleClose();
      return;
    }
    setLoading(true);
    try {
      const payload = { items, paymentMethod: selectedPayment };
      if (selectedAddressId) {
        payload.addressId = selectedAddressId;
      } else {
        payload.deliveryInfo = delivery;
      }

      const res = await api.post('/orders', payload);
      const { paymentUrl, isCod } = res.data;

      clearCart();
      handleClose();

      if (isCod || !paymentUrl) {
        toast.success('Pesanan COD berhasil dibuat! Bayar saat barang tiba. 🎉');
        navigate('/profile');
      } else {
        toast.success('Pesanan dibuat! Mengarahkan ke halaman pembayaran...');
        window.location.href = paymentUrl;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pesanan.');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay latar */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/60 z-40"
          onClick={handleClose}
          aria-label="Tutup keranjang"
          role="presentation"
        />
      )}

      {/* Drawer — fixed agar overlay penuh, modal konfirmasi absolute tetap berfungsi karena fixed jadi containing block */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-ivory z-50 shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* ─── Modal Konfirmasi Tutup ─────────────────────────────────────── */}
        {showCloseConfirm && (
          <div className="absolute inset-0 z-10 flex items-end justify-center p-5 bg-ink/50 backdrop-blur-sm">
            <div className="bg-ivory rounded-3xl w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="bg-yellow-100 p-3 rounded-2xl flex-shrink-0">
                  <AlertTriangle size={24} className="text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold text-ink leading-tight">
                    Tutup Keranjang?
                  </h3>
                  <p className="text-caramel text-sm mt-1.5 leading-relaxed">
                    Data pengiriman yang sudah Anda isi akan{' '}
                    <span className="text-ink font-medium">hilang</span> dan tidak tersimpan.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 border border-parchment text-espresso hover:bg-parchment/40 py-3 rounded-xl text-sm font-medium transition active:scale-95"
                >
                  Lanjut Belanja
                </button>
                <button
                  onClick={performClose}
                  className="flex-1 bg-ink hover:bg-espresso active:scale-95 text-linen font-semibold py-3 rounded-xl text-sm transition"
                >
                  Ya, Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────────── */}
        <div className="bg-ink px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="font-display text-lg sm:text-xl font-semibold text-linen">Keranjang Belanja</h2>
          <button onClick={handleClose} aria-label="Tutup keranjang" className="text-caramel hover:text-linen transition p-1">
            <X size={20} />
          </button>
        </div>

        {/* ─── Step Indicator ─────────────────────────────────────────────── */}
        <div className="flex items-center px-4 sm:px-6 py-3 sm:py-4 bg-espresso/5 border-b border-parchment flex-shrink-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition flex-shrink-0 ${step >= s.id ? 'bg-ink text-linen' : 'bg-parchment text-caramel'}`}>
                  {step > s.id ? <CheckCircle size={14} /> : s.id}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium hidden sm:inline ${step >= s.id ? 'text-ink' : 'text-caramel'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded ${step > s.id ? 'bg-ink' : 'bg-parchment'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ─── Content ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Step 1: Cart */}
          {step === 1 && (
            <div className="p-4 sm:p-5 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 gap-4">
                  <ShoppingBag size={48} className="text-parchment" />
                  <p className="text-espresso font-medium">Keranjang kosong</p>
                  <button onClick={handleClose} className="text-sm text-mahogany hover:text-ink transition">← Lihat Katalog</button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.product_id}-${item.size}`} className="flex gap-3 sm:gap-4 bg-linen rounded-2xl p-3 sm:p-4 border border-parchment">
                    <img src={item.image_url} alt={item.product_name} loading="lazy"
                      className="w-16 h-16 sm:w-[72px] sm:h-[72px] object-cover rounded-xl flex-shrink-0"
                      onError={(e) => { e.target.src = 'https://placehold.co/72x72/E8D9C8/6B3A2A?text=EW'; }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-xs sm:text-sm truncate">{item.product_name}</p>
                      <p className="text-[11px] sm:text-xs text-caramel">Ukuran: <span className="font-medium text-espresso">{item.size}</span></p>
                      <p className="text-mahogany font-bold text-xs sm:text-sm mt-0.5 sm:mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 border border-parchment rounded-lg overflow-hidden">
                          <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity - 1)} aria-label="Kurangi jumlah" className="px-2 sm:px-2.5 py-1 sm:py-1.5 hover:bg-parchment/50 transition"><Minus size={11} /></button>
                          <span className="text-xs sm:text-sm font-semibold px-1.5 sm:px-2 min-w-6 sm:min-w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity + 1)} disabled={item.quantity >= item.maxStock} aria-label="Tambah jumlah" className="px-2 sm:px-2.5 py-1 sm:py-1.5 hover:bg-parchment/50 transition disabled:opacity-40"><Plus size={11} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.product_id, item.size)} aria-label="Hapus item" className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 2: Delivery Info */}
          {step === 2 && (
            <div className="p-4 sm:p-5 space-y-4">
              <p className="text-xs sm:text-sm text-caramel">Pilih alamat pengiriman Anda.</p>

              {/* Loading */}
              {addressesLoading && (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-3 border-ink border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Daftar alamat tersimpan */}
              {!addressesLoading && addresses.length > 0 && !showNewAddressForm && (
                <div className="space-y-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const LabelIcon = LABEL_ICONS[addr.label] || MapPin;
                    return (
                      <button key={addr.id} type="button"
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setDelivery({
                            name: addr.name, phone: addr.phone,
                            address: addr.address, city: addr.city, postalCode: addr.postal_code,
                          });
                        }}
                        className={`w-full text-left border rounded-2xl p-3 sm:p-4 transition ${isSelected ? 'border-ink bg-linen' : 'border-parchment hover:border-mahogany/40'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${isSelected ? 'border-ink' : 'border-parchment'}`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-ink" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <LabelIcon size={14} className="text-mahogany" />
                              <span className="text-sm font-semibold text-ink">{addr.label}</span>
                              {addr.is_default && (
                                <span className="text-[10px] bg-ink/10 text-ink px-1.5 py-0.5 rounded-full font-medium">Utama</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-ink">{addr.name}</p>
                            <p className="text-xs text-caramel">{addr.phone}</p>
                            <p className="text-xs text-caramel mt-0.5">{addr.address}, {addr.city} {addr.postal_code}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <button type="button" onClick={() => setShowNewAddressForm(true)}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-parchment text-caramel hover:text-ink hover:border-mahogany/40 py-3.5 rounded-2xl transition text-sm font-medium">
                    <Plus size={16} /> Tambah Alamat Baru
                  </button>
                </div>
              )}

              {/* Form alamat baru */}
              {(showNewAddressForm || addresses.length === 0) && !addressesLoading && (
                <div className="space-y-4">
                  {addresses.length > 0 && (
                    <button type="button" onClick={() => setShowNewAddressForm(false)}
                      className="text-sm text-mahogany hover:text-ink transition flex items-center gap-1">
                      <ArrowLeft size={14} /> Kembali ke alamat tersimpan
                    </button>
                  )}

                  {/* Label */}
                  <div>
                    <label className="block text-sm font-medium text-espresso mb-1.5">Label Alamat</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Rumah', 'Kantor', 'Lainnya'].map((l) => (
                        <button key={l} type="button"
                          onClick={() => setDelivery(d => ({ ...d, addressLabel: l }))}
                          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition flex-1 sm:flex-none justify-center ${
                            (delivery.addressLabel || 'Rumah') === l
                              ? 'border-ink bg-ink text-linen'
                              : 'border-parchment text-espresso hover:border-mahogany/40'
                          }`}>
                          {l === 'Rumah' ? <Home size={14} /> : l === 'Kantor' ? <Building2 size={14} /> : <MapPin size={14} />}
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {[
                    { key:'name',       label:'Nama Penerima',    icon: User,   type:'text', placeholder:'Nama lengkap penerima' },
                    { key:'phone',      label:'Nomor HP',         icon: Phone,  type:'tel',  placeholder:'Cth: 08123456789' },
                    { key:'address',    label:'Alamat Lengkap',   icon: MapPin, type:'text', placeholder:'Jl. nama jalan, No. rumah' },
                    { key:'city',       label:'Kota / Kabupaten', icon: MapPin, type:'text', placeholder:'Cth: Jakarta Selatan' },
                    { key:'postalCode', label:'Kode Pos',         icon: MapPin, type:'text', placeholder:'Cth: 12345' },
                  ].map(({ key, label, icon: Icon, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-espresso mb-1.5">{label}</label>
                      <div className="relative">
                        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-caramel" />
                        <input
                          type={key === 'phone' ? 'tel' : type}
                          inputMode={key === 'phone' ? 'numeric' : undefined}
                          placeholder={placeholder}
                          value={delivery[key]}
                          onChange={(e) => {
                            const val = key === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value;
                            setDelivery(d => ({ ...d, [key]: val }));
                            setErrors(er => ({ ...er, [key]: '' }));
                          }}
                          className={`w-full bg-linen border rounded-xl pl-10 pr-4 py-3 text-sm text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink transition ${errors[key] ? 'border-red-400' : 'border-parchment'}`}
                        />
                      </div>
                      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
                    </div>
                  ))}

                  {addresses.length > 0 && (
                    <button onClick={handleSaveNewAddress} disabled={savingAddress}
                      className="w-full flex items-center justify-center gap-2 bg-mahogany hover:bg-espresso text-linen font-semibold py-3.5 rounded-xl transition disabled:opacity-60 text-sm">
                      {savingAddress
                        ? <><span className="w-4 h-4 border-2 border-linen border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
                        : <><CheckCircle size={16} /> Simpan & Gunakan Alamat Ini</>}
                    </button>
                  )}
                </div>
              )}

              {/* Info ongkir */}
              {delivery.city && isCityRegistered && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
                  <div className="text-blue-600 font-bold text-lg">🚚</div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-blue-800">
                      Ongkos Kirim ke <span className="font-semibold">{delivery.city}</span>
                    </p>
                    <p className="text-[11px] sm:text-xs text-blue-600 mt-0.5">
                      Rp {shippingCost.toLocaleString('id-ID')}
                      {(() => {
                        const r = shippingRates.find(x => x.city.toLowerCase() === delivery.city?.toLowerCase());
                        return r?.estimated_days ? ` · Estimasi ${r.estimated_days}` : '';
                      })()}
                    </p>
                  </div>
                </div>
              )}
              {delivery.city && !isCityRegistered && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
                  <span className="text-yellow-700 text-lg">🚚</span>
                  <p className="text-xs sm:text-sm text-yellow-800">
                    Kota <span className="font-semibold">{delivery.city}</span> belum terdaftar. Ongkos kirim dihitung sebagai{' '}
                    <span className="font-semibold">Luar Kota (Rp 50.000)</span>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Konfirmasi */}
          {step === 3 && (
            <div className="p-4 sm:p-5 space-y-5">
              {/* Ringkasan alamat */}
              <div className="bg-linen border border-parchment rounded-2xl p-4">
                <p className="text-xs font-semibold text-espresso uppercase tracking-wide mb-3">Info Pengiriman</p>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-ink">{delivery.name}</p>
                  <p className="text-caramel">{delivery.phone}</p>
                  <p className="text-caramel">{delivery.address}, {delivery.city} {delivery.postalCode}</p>
                </div>
              </div>

              {/* Ringkasan item */}
              <div>
                <p className="text-xs font-semibold text-espresso uppercase tracking-wide mb-3">Ringkasan Pesanan</p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={`${item.product_id}-${item.size}`} className="flex justify-between items-center text-sm">
                      <span className="text-espresso">
                        {item.product_name} <span className="text-caramel">({item.size}) ×{item.quantity}</span>
                      </span>
                      <span className="font-medium text-ink">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <p className="text-xs font-semibold text-espresso uppercase tracking-wide mb-3">Metode Pembayaran</p>
                <div className="space-y-2">
                  {PAYMENT_METHOD_LIST.map(pm => {
                    const isSelected = selectedPayment === pm.value;
                    const Icon = pm.icon;
                    return (
                      <button key={pm.value} type="button" onClick={() => setSelectedPayment(pm.value)}
                        className={`w-full flex items-center gap-3 border rounded-2xl p-3 text-left transition ${
                          isSelected ? 'border-ink bg-linen' : 'border-parchment hover:border-mahogany/40'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-ink' : 'border-parchment'}`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-ink" />}
                        </div>
                        <div className="p-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: `${pm.color}1A` }}>
                          <Icon size={16} style={{ color: pm.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink">{pm.label}</p>
                          <p className="text-xs text-caramel">{pm.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-parchment pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-caramel">Subtotal</span>
                  <span className="text-sm text-ink font-medium">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-caramel">
                    Ongkos Kirim
                    {shippingCost > 0 && delivery.city && (
                      <span className="text-xs ml-1">({delivery.city})</span>
                    )}
                  </span>
                  <span className="text-sm text-mahogany font-medium">
                    {shippingCost > 0 ? `Rp ${shippingCost.toLocaleString('id-ID')}` : 'Gratis'}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-parchment">
                  <span className="font-semibold text-ink">Total</span>
                  <span className="font-display text-xl font-bold text-ink">Rp {computedTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t border-parchment p-4 sm:p-5 space-y-3 flex-shrink-0 bg-white">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="w-full flex items-center justify-center gap-2 border border-parchment text-espresso py-3 rounded-xl hover:bg-parchment/30 transition text-sm font-medium">
              <ArrowLeft size={16} /> Kembali
            </button>
          )}
          {step < 3 ? (
            <button onClick={handleNext} disabled={step === 1 && items.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-espresso active:scale-95 text-linen font-semibold py-3.5 rounded-xl transition disabled:opacity-50">
              {step === 1 ? 'Lanjutkan ke Pengiriman' : 'Lanjut ke Konfirmasi'} <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-espresso active:scale-95 text-linen font-semibold py-3.5 rounded-xl transition disabled:opacity-60">
              {loading
                ? <><span className="w-4 h-4 border-2 border-linen border-t-transparent rounded-full animate-spin" /> Memproses...</>
                : <><CheckCircle size={18} /> Konfirmasi Pesanan</>}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;