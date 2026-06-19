import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Package, SlidersHorizontal, Search, ShoppingCart, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Pagination from '../components/Pagination';
import BackToTop from '../components/BackToTop';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { SkeletonCard } from '../components/Skeleton';
import api from '../api/apiClient';

const FALLBACK_CATEGORIES = ['Semua','Jaket Coach','Jaket Bomber','Hoodie','Sweater','Jaket Denim','Vest'];
const SORT_OPTIONS = [
  { value:'newest',    label:'Terbaru' },
  { value:'price_asc', label:'Harga Terendah' },
  { value:'price_desc',label:'Harga Tertinggi' },
  { value:'name_asc',  label:'Nama A–Z' },
  { value:'name_desc', label:'Nama Z–A' },
];

const ProductsPage = () => {
  const { user }                                    = useAuth();
  const [products, setProducts]                     = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [selectedCategory, setSelectedCategory]     = useState('Semua');
  const [sort, setSort]                             = useState('newest');
  const [searchQuery, setSearchQuery]               = useState('');
  const [debouncedSearch, setDebouncedSearch]       = useState('');
  const [inStock, setInStock]                       = useState(false);
  const [showFilters, setShowFilters]               = useState(false);
  const [categories, setCategories]                 = useState(FALLBACK_CATEGORIES);
  const [page, setPage]                             = useState(1);
  const [totalPages, setTotalPages]                 = useState(1);
  const abortRef = useRef(null);
  useDocumentTitle('Katalog');

  //delay pencarian 350ms biar nggak fetch tiap huruf diketik
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  //reset ke halaman 1 tiap filter/search/sort berubah
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, sort, inStock]);

  //scroll ke atas tiap page/filter berubah
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page, selectedCategory, debouncedSearch, sort, inStock]);

  //fetch daftar kategori dari API
  useEffect(() => {
    api.get('/categories').then(res => {
      if (res.data?.length) setCategories(['Semua', ...res.data.map(c => c.name)]);
    }).catch(() => {});
  }, []);

  //fungsi fetchProducts dibungkus biar referensinya stabil
  const fetchProducts = useCallback(async (p) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategory !== 'Semua') params.set('category', selectedCategory);
      if (sort)     params.set('sort', sort);
      if (inStock)  params.set('inStock', 'true');
      const pg = p ?? page;
      params.set('page', pg);
      params.set('limit', '12');
      const res = await api.get(`/products?${params.toString()}`, { signal: controller.signal });
      setProducts(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch { setProducts([]); }
    finally   { setLoading(false); }
  }, [debouncedSearch, selectedCategory, sort, inStock, page]);

  //fetch produk tiap kali fungsi fetchProducts berubah
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handlePageChange = useCallback((p) => {
    setPage(p);
    fetchProducts(p);
  }, [fetchProducts]);

  //daftar filter aktif di-cache
  const activeFilters = useMemo(() => [
    debouncedSearch && { key:'search', label:`"${debouncedSearch}"`, clear: () => setSearchQuery('') },
    selectedCategory !== 'Semua' && { key:'cat', label: selectedCategory, clear: () => setSelectedCategory('Semua') },
    inStock  && { key:'stock', label:'Tersedia saja', clear: () => setInStock(false) },
  ].filter(Boolean), [debouncedSearch, selectedCategory, inStock]);

  const clearAllFilters = () => {
    setSearchQuery(''); setSelectedCategory('Semua');
    setInStock(false); setSort('newest');
  };

  return (
    <div className="min-h-screen bg-linen animate-fadeIn">
      <Navbar />

      {/* Hero */}
      <div className="bg-ivory border-b border-parchment hero-pattern">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14 flex items-end justify-between gap-8">
          <div>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-ink leading-none">
              Outerwear<br />
              <em className="text-mahogany not-italic">Premium</em>
            </h1>
          </div>
          <div className="hidden lg:block font-display text-[6rem] xl:text-[8rem] font-bold text-parchment/40 leading-none select-none">ExternaWear</div>
        </div>
      </div>

      <div className="        max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-caramel" />
            <input
              type="text"
              placeholder="Cari produk, kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ivory border border-parchment rounded-xl pl-10 pr-10 py-2.5 text-sm text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-caramel hover:text-ink">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-ivory border border-parchment rounded-xl px-4 py-2.5 pr-10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink transition cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-caramel pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${showFilters ? 'bg-ink text-linen border-ink' : 'bg-ivory text-espresso border-parchment hover:border-mahogany'}`}
          >
            <SlidersHorizontal size={15} />
            Filter {activeFilters.length > 0 && `(${activeFilters.length})`}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-ivory border border-parchment rounded-2xl p-4 sm:p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Kategori */}
            <div>
              <p className="text-xs font-semibold text-espresso uppercase tracking-wide mb-2">Kategori</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedCategory === cat ? 'bg-ink text-linen' : 'bg-linen text-espresso border border-parchment hover:border-mahogany'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Stok */}
            <div>
              <p className="text-xs font-semibold text-espresso uppercase tracking-wide mb-2">Ketersediaan</p>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className={`w-10 h-5.5 rounded-full transition relative ${inStock ? 'bg-ink' : 'bg-parchment'}`}
                  onClick={() => setInStock(!inStock)}>
                  <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${inStock ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-espresso">Tersedia saja</span>
              </label>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-xs text-caramel">Filter aktif:</span>
            {activeFilters.map(f => (
              <button key={f.key} onClick={f.clear}
                className="flex items-center gap-1.5 bg-ink text-linen text-xs px-3 py-1.5 rounded-full hover:bg-espresso transition">
                {f.label} <X size={11} />
              </button>
            ))}
            <button onClick={clearAllFilters} className="text-xs text-caramel hover:text-mahogany transition">Hapus semua</button>
          </div>
        )}

        {/* Result count */}
        <p className="text-sm text-caramel mb-6">
          {loading ? 'Memuat...' : `${products.length} produk ditemukan`}
          {debouncedSearch && ` untuk "${debouncedSearch}"`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Package size={52} className="text-parchment" />
            <p className="text-espresso font-medium">Produk tidak ditemukan.</p>
            <button onClick={clearAllFilters} className="text-sm text-mahogany hover:text-ink transition">Hapus semua filter</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
            {products.map((product, idx) => {
              const totalStock = product.variants?.reduce((s, v) => s + v.stock, 0) ?? 0;
              const stagger = `animate-fadeIn stagger-${Math.min(idx + 1, 6)}`;
              return (
                <div key={product.id} className={`${stagger} bg-ivory rounded-2xl overflow-hidden border border-parchment hover:border-mahogany/40 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-espresso/10 transition-transform duration-300 shadow group flex flex-col`}>
                  <Link to={`/products/${product.id}`} className="relative overflow-hidden h-60 bg-parchment/30 block">
                    <img src={product.image_url} alt={product.name} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x300/E8D9C8/6B3A2A?text=ExternaWear'; }} />
                    <div className="absolute top-3 left-3">
                      <span className="bg-ink text-linen text-xs font-medium px-3 py-1.5 rounded-full">{product.category}</span>
                    </div>
                    {totalStock === 0 && (
                      <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                        <span className="bg-white text-ink text-xs font-bold px-3 py-1.5 rounded-full">Stok Habis</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-5 flex flex-col flex-1">
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-display text-xl font-semibold text-ink leading-snug hover:text-mahogany transition">{product.name}</h3>
                    </Link>
                    <p className="text-caramel text-sm mt-1.5 line-clamp-2 flex-1">{product.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-mahogany font-bold text-xl">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-caramel">{totalStock} tersisa</p>
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {product.variants?.map(v => (
                        <span key={v.size} className={`text-xs px-2 py-0.5 rounded-full border ${v.stock === 0 ? 'text-parchment border-parchment line-through' : 'text-espresso border-parchment'}`}>
                          {v.size}
                        </span>
                      ))}
                    </div>
                    {user?.role === 'user' && totalStock > 0 && (
                      <Link to={`/products/${product.id}`}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-ink hover:bg-espresso text-linen text-sm font-semibold py-2.5 rounded-xl transition">
                        <ShoppingCart size={15} /> Pilih & Tambah
                      </Link>
                    )}
                    {!user && (
                      <Link to={`/products/${product.id}`}
                        className="mt-4 w-full flex items-center justify-center text-sm text-mahogany hover:text-ink border border-parchment hover:border-mahogany py-2.5 rounded-xl transition">
                        Lihat Detail
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
      <BackToTop />
      <Footer />
    </div>
  );
};

export default ProductsPage;