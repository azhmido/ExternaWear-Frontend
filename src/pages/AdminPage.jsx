import { useState, useEffect, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, X, Package, Users, ShoppingCart, TrendingUp, AlertTriangle, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BackToTop from '../components/BackToTop';
import api from '../api/apiClient';
import { confirmToast } from '../utils/confirmToast';
import Pagination from '../components/Pagination';
import { PAYMENT_METHODS } from '../utils/paymentMethods';

const DashboardContent = lazy(() => import('../components/DashboardContent'));

const abbreviate = (num) => {
  if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(1)}M`;
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`;
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}rb`;
  return `Rp ${Number(num).toLocaleString('id-ID')}`;
};

const CATEGORIES   = ['Jaket Coach','Jaket Bomber','Hoodie','Sweater','Jaket Denim','Vest'];
const SIZES        = ['XS','S','M','L','XL','XXL'];
const STATUS_OPT   = ['pending','confirmed','shipped','delivered','cancelled'];
const STATUS_LABEL = { pending:'Menunggu', confirmed:'Dikonfirmasi', shipped:'Dikirim', delivered:'Diterima', cancelled:'Dibatalkan' };
const STATUS_COLOR = { pending:'bg-yellow-100 text-yellow-800', confirmed:'bg-blue-100 text-blue-800', shipped:'bg-purple-100 text-purple-800', delivered:'bg-green-100 text-green-800', cancelled:'bg-red-100 text-red-800' };
const defaultForm = {
  name:'', description:'', price:'',
  category: CATEGORIES[0], image_url:'',
  variants:[{ size:'S', stock:0 }],
};

const AdminPage = () => {
  const { user }                = useAuth();
  const [stats, setStats]       = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [form, setForm]         = useState(defaultForm);
  const [editId, setEditId]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [shippingRates, setShippingRates] = useState([]);
  const [rateForm, setRateForm] = useState({ city: '', cost: '', estimated_days: '3-5 hari' });
  const [editingRate, setEditingRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);

  //crud kategori produk
  const [categories, setCategories] = useState([]);
  const [catForm, setCatForm] = useState({ name: '' });
  const [editingCat, setEditingCat] = useState(null);
  const [catLoading, setCatLoading] = useState(false);

  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);

  //ambil semua data admin dalam 1 Promise.all
  //5 endpoint API paralel ke semua state React ke UI tiap tab
  const fetchData = (pp, op) => {
    const pg = pp ?? productPage;
    const og = op ?? orderPage;
    Promise.all([
      api.get(`/products?page=${pg}&limit=20`).catch(() => ({ data: { data: [], totalPages: 1 } })),
      api.get(`/orders?page=${og}&limit=20`).catch(() => ({ data: { data: [], totalPages: 1 } })),
      api.get('/orders/stats').catch(() => ({ data: null })),
      api.get('/shipping').catch(() => ({ data: [] })),
      api.get('/categories').catch(() => ({ data: [] })),
    ]).then(([pRes, oRes, sRes, shipRes, catRes]) => {
      setProducts(pRes.data.data || []);
      setProductTotalPages(pRes.data.totalPages || 1);
      setOrders(oRes.data.data || []);
      setOrderTotalPages(oRes.data.totalPages || 1);
      setStats(sRes.data);
      setShippingRates(shipRes.data);
      setCategories(catRes.data);
    });
  };

  //fetch semua data pas pertama render
  useEffect(() => { fetchData(); }, []);

  //scroll ke atas tiap ganti tab atau halaman
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, productPage, orderPage]);

  const handleProductPageChange = (p) => {
    setProductPage(p);
    fetchData(p, null);
  };

  const handleOrderPageChange = (p) => {
    setOrderPage(p);
    fetchData(null, p);
  };

  //update array dalam state
  const handleVariantChange = (i, field, value) => {
    const updated = [...form.variants];
    updated[i][field] = value;
    setForm({ ...form, variants: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.patch(`/products/${editId}`, form);
        toast.success('Produk diperbarui!');
      } else {
        await api.post('/products', form);
        toast.success('Produk ditambahkan!');
      }
      setForm(defaultForm);
      setEditId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  // Update object dalam state: isi form dari data produk yang mau diedit
  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({ name:p.name, description:p.description, price:p.price, category:p.category, image_url:p.image_url, variants:p.variants });
    setActiveTab('products');
  };

  const handleDelete = (id, name) => {
    confirmToast(`Hapus "${name}"?`, async () => {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Produk dihapus!');
        fetchData();
      } catch { toast.error('Gagal menghapus produk.'); }
    }, {
      description: 'Produk dan seluruh data stoknya akan dihapus permanen.',
    });
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success('Status diperbarui!');
      fetchData();
    } catch { toast.error('Gagal update status.'); }
  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (!rateForm.city.trim() || !rateForm.cost) {
      toast.error('Kota dan biaya kirim wajib diisi.');
      return;
    }
    setRateLoading(true);
    try {
      if (editingRate) {
        await api.patch(`/shipping/${editingRate.id}`, rateForm);
        toast.success('Tarif diperbarui!');
      } else {
        await api.post('/shipping', rateForm);
        toast.success('Tarif ditambahkan!');
      }
      setRateForm({ city: '', cost: '', estimated_days: '3-5 hari' });
      setEditingRate(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan tarif.');
    } finally {
      setRateLoading(false);
    }
  };

  const handleEditRate = (rate) => {
    setRateForm({ city: rate.city, cost: String(rate.cost), estimated_days: rate.estimated_days || '3-5 hari' });
    setEditingRate(rate);
  };

  const handleDeleteRate = (id, city) => {
    confirmToast(`Hapus tarif "${city}"?`, async () => {
      try {
        await api.delete(`/shipping/${id}`);
        toast.success('Tarif dihapus!');
        fetchData();
      } catch { toast.error('Gagal menghapus tarif.'); }
    });
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) { toast.error('Nama kategori wajib diisi.'); return; }
    setCatLoading(true);
    try {
      if (editingCat) {
        await api.patch(`/categories/${editingCat.id}`, catForm);
        toast.success('Kategori diperbarui!');
      } else {
        await api.post('/categories', catForm);
        toast.success('Kategori ditambahkan!');
      }
      setCatForm({ name: '' });
      setEditingCat(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kategori.');
    } finally { setCatLoading(false); }
  };

  const handleEditCat = (cat) => {
    setCatForm({ name: cat.name });
    setEditingCat(cat);
  };

  const handleDeleteCat = (id, name) => {
    confirmToast(`Hapus kategori "${name}"?`, async () => {
      try {
        await api.delete(`/categories/${id}`);
        toast.success('Kategori dihapus!');
        fetchData();
      } catch { toast.error('Gagal menghapus kategori.'); }
    });
  };

  const handleDeleteOrder = (id) => {
    confirmToast(`Hapus EW-${String(id).padStart(6, '0')}?`, async () => {
      try {
        await api.delete(`/orders/${id}`);
        toast.success('Pesanan berhasil dihapus!');
        setOrders(prev => prev.filter(o => o.id !== id));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Gagal menghapus pesanan.');
      }
    }, {
      description: 'Data pesanan ini akan dihapus permanen dari sistem.',
    });
  };

  return (
    <div className="min-h-screen bg-linen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Stat Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label:'Total Produk',     value: stats.totalProducts, icon: Package,      bg:'bg-ink' },
              { label:'Total Pelanggan',  value: stats.totalUsers,    icon: Users,        bg:'bg-mahogany' },
              { label:'Total Pesanan',    value: stats.totalOrders,   icon: ShoppingCart, bg:'bg-espresso' },
              { label:'Total Pendapatan', value: abbreviate(stats.totalRevenue), icon: TrendingUp, bg:'bg-caramel' },
            ].map(({ label, value, icon: Icon, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-4 sm:p-5 text-linen`}>
                <Icon size={18} className="opacity-70 mb-2 sm:mb-3" />
                <p className="font-display text-lg sm:text-2xl font-bold leading-tight break-words">{value}</p>
                <p className="text-[10px] sm:text-xs opacity-60 mt-0.5 sm:mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-parchment/40 p-1 rounded-xl overflow-x-auto scrollbar-thin w-full sm:w-fit">
          {[
            { key:'dashboard', label:'Dashboard' },
            { key:'products',  label:`Produk (${products.length})` },
            { key:'orders',    label:`Pesanan (${orders.length})` },
            { key:'shipping',  label:`Ongkir (${shippingRates.length})` },
            { key:'categories', label:`Kategori (${categories.length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${activeTab === key ? 'bg-ink text-linen' : 'text-espresso hover:text-ink'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ─── Tab: Dashboard ─── */}
        {/* Suspense: fallback loading spinner sambil nunggu DashboardContent (lazy) di-download */}
        {activeTab === 'dashboard' && stats && (
          <Suspense fallback={
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <DashboardContent stats={stats} />
          </Suspense>
        )}

        {/* ─── Tab: Produk ─── */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Form */}
            <div className="bg-ivory rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="bg-ink px-4 sm:px-6 py-4 sm:py-5">
                <h2 className="font-display text-lg sm:text-xl font-semibold text-linen">{editId ? 'Edit Produk' : 'Tambah Produk'}</h2>
                <p className="text-parchment/40 text-xs sm:text-sm mt-0.5">{editId ? 'Ubah data produk yang ingin diedit' : 'Lengkapi data produk di bawah ini'}</p>
              </div>
              <div className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key:'name',      label:'Nama Produk', type:'text',   placeholder:'Cth: Jaket Bomber Classic' },
                        { key:'price',     label:'Harga (Rp)',  type:'number', placeholder:'Cth: 350000' },
                        { key:'image_url', label:'URL Gambar',  type:'text',   placeholder:'https://...' },
                      ].map(({ key, label, type, placeholder }) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-espresso mb-1.5">{label}</label>
                          <input type={type} required placeholder={placeholder} value={form[key]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            className="w-full bg-linen border border-parchment rounded-xl px-4 py-2.5 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-sm font-medium text-espresso mb-1.5">Kategori</label>
                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="w-full bg-linen border border-parchment rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-ink transition">
                          {(categories.length > 0 ? categories.map(c => c.name) : ['Jaket Coach','Jaket Bomber','Hoodie','Sweater','Jaket Denim','Vest']).map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-espresso mb-1.5">Deskripsi</label>
                    <textarea required rows={3} placeholder="Deskripsikan produk..." value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full bg-linen border border-parchment rounded-xl px-4 py-2.5 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink transition resize-none" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium text-espresso">Varian Ukuran & Stok</label>
                      <button type="button" onClick={() => setForm({ ...form, variants:[...form.variants,{size:'S',stock:0}] })}
                        className="flex items-center gap-1.5 text-sm text-mahogany hover:text-ink font-medium transition">
                        <Plus size={14} /> Tambah
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {form.variants.map((v, i) => (
                        <div key={i} className="flex gap-2 sm:gap-3 items-center bg-linen border border-parchment p-2.5 sm:p-3 rounded-xl">
                          <select value={v.size} onChange={(e) => handleVariantChange(i,'size',e.target.value)}
                            className="bg-ivory border border-parchment rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink">
                            {SIZES.map(s => <option key={s}>{s}</option>)}
                          </select>
                          <input type="number" placeholder="Stok" min={0} value={v.stock}
                            onChange={(e) => handleVariantChange(i,'stock',Number(e.target.value))}
                            className="bg-ivory border border-parchment rounded-lg px-2 sm:px-3 py-2 w-20 sm:w-28 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink" />
                          <span className="text-caramel text-xs sm:text-sm flex-1">unit</span>
                          {form.variants.length > 1 && (
                            <button type="button" onClick={() => setForm({...form,variants:form.variants.filter((_,idx)=>idx!==i)})}
                              className="text-caramel hover:text-red-500 p-1.5 rounded-lg transition"><X size={16} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={loading}
                      className="bg-ink hover:bg-espresso text-linen font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-60 flex items-center gap-2">
                      {loading ? <><span className="w-4 h-4 border-2 border-linen border-t-transparent rounded-full animate-spin"/>Menyimpan...</> : editId ? 'Update' : 'Tambah Produk'}
                    </button>
                    {editId && (
                      <button type="button" onClick={() => { setForm(defaultForm); setEditId(null); }}
                        className="border border-parchment text-espresso hover:bg-parchment/30 px-6 py-2.5 rounded-xl transition">Batal</button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Product list */}
            <div className="bg-ivory rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-semibold text-ink">Daftar Produk</h2>
                  <p className="text-caramel text-xs sm:text-sm mt-0.5">{products.length} produk terdaftar</p>
                </div>
                <Package size={20} className="text-parchment" />
              </div>
              <div className="p-4 sm:p-6">
                {products.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <Package size={40} className="text-parchment" />
                    <p className="text-caramel">Belum ada produk.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map((p) => {
                      const totalStock = p.variants?.reduce((s, v) => s + v.stock, 0) ?? 0;
                      return (
                        <div key={p.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-parchment hover:border-mahogany/40 hover:bg-parchment/20 transition group">
                          <img src={p.image_url} alt={p.name} loading="lazy"
                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-parchment flex-shrink-0 mt-0.5"
                            onError={(e) => { e.target.src='https://placehold.co/64x64/E8D9C8/6B3A2A?text=EW'; }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-ink text-sm sm:text-base truncate">{p.name}</p>
                              {totalStock === 0 && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Habis</span>
                              )}
                              {totalStock > 0 && totalStock <= 10 && (
                                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Hampir Habis</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] bg-parchment/60 text-espresso px-2 py-0.5 rounded-full">{p.category}</span>
                              <span className="text-xs sm:text-sm text-mahogany font-bold">Rp {Number(p.price).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {p.variants?.map((v, i) => (
                                <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${v.stock === 0 ? 'text-parchment border-parchment' : 'text-espresso border-parchment bg-linen'}`}>
                                  {v.size}: {v.stock}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1 sm:gap-2 opacity-70 hover:opacity-100 transition flex-shrink-0">
                            <button onClick={() => handleEdit(p)} aria-label="Edit produk" className="p-1.5 sm:p-2 text-mahogany hover:bg-parchment/50 rounded-xl transition"><Pencil size={15} /></button>
                            <button onClick={() => handleDelete(p.id, p.name)} aria-label="Hapus produk" className="p-1.5 sm:p-2 text-red-400 hover:bg-red-50 rounded-xl transition"><Trash2 size={15} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              <Pagination page={productPage} totalPages={productTotalPages} onPageChange={handleProductPageChange} />
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab: Kategori ─── */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Form */}
            <div className="bg-ivory rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="bg-ink px-4 sm:px-6 py-4 sm:py-5">
                <h2 className="font-display text-lg sm:text-xl font-semibold text-linen">
                  {editingCat ? 'Edit Kategori' : 'Tambah Kategori'}
                </h2>
                <p className="text-parchment/40 text-xs sm:text-sm mt-0.5">
                  {editingCat ? 'Perbarui nama kategori' : 'Tambah kategori produk baru'}
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <form onSubmit={handleCatSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end">
                  <div className="flex-1 max-w-sm">
                    <label className="block text-sm font-medium text-espresso mb-1.5">Nama Kategori</label>
                    <input type="text" required placeholder="Cth: Jaket Parka" value={catForm.name}
                      onChange={(e) => setCatForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-linen border border-parchment rounded-xl px-4 py-2.5 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink transition" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={catLoading}
                      className="bg-ink hover:bg-espresso text-linen font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-60 flex items-center gap-2">
                      {catLoading ? <span className="w-4 h-4 border-2 border-linen border-t-transparent rounded-full animate-spin" /> : editingCat ? 'Update' : 'Tambah'}
                    </button>
                    {editingCat && (
                      <button type="button" onClick={() => { setCatForm({ name: '' }); setEditingCat(null); }}
                        className="border border-parchment text-espresso hover:bg-parchment/30 px-5 py-2.5 rounded-xl transition">Batal</button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Daftar kategori */}
            <div className="bg-ivory rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-semibold text-ink">Daftar Kategori</h2>
                  <p className="text-caramel text-xs sm:text-sm mt-0.5">{categories.length} kategori terdaftar</p>
                </div>
                <Tag size={20} className="text-parchment" />
              </div>
              <div className="p-4 sm:p-6">
                {categories.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <Tag size={40} className="text-parchment" />
                    <p className="text-caramel">Belum ada kategori.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2 bg-linen border border-parchment rounded-xl px-4 py-2.5 hover:border-mahogany/40 transition group">
                        <span className="text-ink font-medium text-sm">{cat.name}</span>
                        <button onClick={() => handleEditCat(cat)}
                          className="p-1 text-caramel hover:text-mahogany opacity-70 hover:opacity-100 transition"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteCat(cat.id, cat.name)}
                          className="p-1 text-caramel hover:text-red-500 opacity-70 hover:opacity-100 transition"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab: Ongkir ─── */}
        {activeTab === 'shipping' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Form */}
            <div className="bg-ivory rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="bg-ink px-4 sm:px-6 py-4 sm:py-5">
                <h2 className="font-display text-lg sm:text-xl font-semibold text-linen">
                  {editingRate ? 'Edit Tarif' : 'Tambah Tarif'}
                </h2>
                <p className="text-parchment/40 text-xs sm:text-sm mt-0.5">
                  {editingRate ? 'Perbarui biaya pengiriman' : 'Tambah biaya pengiriman untuk kota baru'}
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <form onSubmit={handleRateSubmit} className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-espresso mb-1.5">Kota</label>
                    <input type="text" required placeholder="Cth: Jakarta Selatan" value={rateForm.city}
                      onChange={(e) => setRateForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full bg-linen border border-parchment rounded-xl px-4 py-2.5 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink transition" />
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-espresso mb-1.5">Biaya (Rp)</label>
                    <input type="number" required min={0} placeholder="15000" value={rateForm.cost}
                      onChange={(e) => setRateForm(f => ({ ...f, cost: e.target.value }))}
                      className="w-full bg-linen border border-parchment rounded-xl px-4 py-2.5 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink transition" />
                  </div>
                  <div className="w-36">
                    <label className="block text-sm font-medium text-espresso mb-1.5">Estimasi</label>
                    <input type="text" placeholder="3-5 hari" value={rateForm.estimated_days}
                      onChange={(e) => setRateForm(f => ({ ...f, estimated_days: e.target.value }))}
                      className="w-full bg-linen border border-parchment rounded-xl px-4 py-2.5 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink transition" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={rateLoading}
                      className="bg-ink hover:bg-espresso text-linen font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-60 flex items-center gap-2">
                      {rateLoading ? <span className="w-4 h-4 border-2 border-linen border-t-transparent rounded-full animate-spin" /> : editingRate ? 'Update' : 'Tambah'}
                    </button>
                    {editingRate && (
                      <button type="button" onClick={() => { setRateForm({ city:'', cost:'', estimated_days:'3-5 hari' }); setEditingRate(null); }}
                        className="border border-parchment text-espresso hover:bg-parchment/30 px-5 py-2.5 rounded-xl transition">Batal</button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Daftar tarif */}
            <div className="bg-ivory rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-semibold text-ink">Daftar Tarif</h2>
                  <p className="text-caramel text-xs sm:text-sm mt-0.5">{shippingRates.length} kota terdaftar</p>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {shippingRates.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <p className="text-caramel">Belum ada tarif pengiriman.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-parchment">
                          <th className="text-left px-4 py-3 text-espresso font-semibold">Kota</th>
                          <th className="text-right px-4 py-3 text-espresso font-semibold">Biaya</th>
                          <th className="text-center px-4 py-3 text-espresso font-semibold">Estimasi</th>
                          <th className="text-right px-4 py-3 text-espresso font-semibold">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shippingRates.map((rate, idx) => (
                          <tr key={rate.id} className={`border-b border-parchment/50 hover:bg-parchment/30 transition ${idx % 2 === 0 ? 'bg-linen/50' : ''}`}>
                            <td className="px-4 py-3.5 font-medium text-ink">{rate.city}</td>
                            <td className="px-4 py-3.5 text-right text-mahogany font-semibold">
                              Rp {Number(rate.cost).toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3.5 text-center text-caramel">{rate.estimated_days}</td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => handleEditRate(rate)}
                                  aria-label="Edit tarif" className="p-2 text-mahogany hover:bg-parchment/50 rounded-xl transition"><Pencil size={15} /></button>
                                <button onClick={() => handleDeleteRate(rate.id, rate.city)}
                                  aria-label="Hapus tarif" className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition"><Trash2 size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab: Orders ─── */}
        {activeTab === 'orders' && (
          <div className="bg-ivory rounded-3xl border border-stone-100 shadow-sm overflow-hidden animate-fadeIn">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-stone-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-semibold text-ink">Semua Pesanan</h2>
                <p className="text-caramel text-xs sm:text-sm mt-0.5">{orders.length} pesanan masuk</p>
              </div>
              <ShoppingCart size={20} className="text-parchment flex-shrink-0" />
            </div>
            <div className="p-4 sm:p-6">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <ShoppingCart size={40} className="text-parchment" />
                  <p className="text-caramel">Belum ada pesanan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-parchment rounded-2xl p-4 sm:p-5 hover:border-mahogany/30 transition">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-ink">EW-${String(order.id).padStart(6, '0')}</p>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                          </div>
                          <p className="text-xs text-caramel mt-0.5">
                            oleh <span className="font-medium text-espresso">{order.username}</span>
                            {' · '}{new Date(order.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                          </p>
                          {order.delivery_info && (
                            <p className="text-xs text-caramel mt-1">
                              📍 {order.delivery_info.city} · {order.delivery_info.phone}
                            </p>
                          )}
                          {order.payment_method && PAYMENT_METHODS[order.payment_method] && (
                            <p className="text-xs text-caramel mt-1 flex items-center gap-1">
                              {(() => { const Icon = PAYMENT_METHODS[order.payment_method].icon; return <Icon size={11} />; })()}
                              {PAYMENT_METHODS[order.payment_method].label}
                            </p>
                          )}
                        </div>

                        {/* Kontrol status + tombol hapus */}
                        <div className="flex items-center gap-2 self-end sm:self-start">
                          <select value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="text-[11px] sm:text-xs border border-parchment rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-espresso bg-linen focus:outline-none focus:ring-2 focus:ring-ink cursor-pointer">
                            {STATUS_OPT.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                          </select>

                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            aria-label="Hapus pesanan permanen"
                            className="p-1.5 sm:p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition flex-shrink-0"
                            title="Hapus pesanan permanen"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1 border-t border-parchment pt-3">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-espresso">{item.product_name} <span className="text-caramel">· {item.size} ×{item.quantity}</span></span>
                            <span className="text-mahogany font-medium">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-bold pt-1 border-t border-parchment mt-2">
                          <span className="text-espresso">Total</span>
                          <span className="text-ink">Rp {Number(order.total_price).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Pagination page={orderPage} totalPages={orderTotalPages} onPageChange={handleOrderPageChange} />
            </div>
          </div>
        )}

      </div>
      <BackToTop />
    </div>
  );
};

export default AdminPage;