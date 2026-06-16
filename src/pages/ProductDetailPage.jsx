import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Package, Minus, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import { SkeletonProductDetail } from '../components/Skeleton';
import api from '../api/apiClient';

const TAB_INFO = [
  { key:'desc',  label:'Deskripsi' },
  { key:'spec',  label:'Spesifikasi' },
  { key:'ship',  label:'Info Pengiriman' },
];

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user }    = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct]       = useState(null);
  const [related, setRelated]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity]     = useState(1);
  const [activeTab, setActiveTab]   = useState('desc');

  //fetch detail produk
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [pRes, rRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/related`),
        ]);
        setProduct(pRes.data);
        setRelated(rRes.data);
        // Pilih ukuran pertama yang masih ada stok sebagai default
        const first = pRes.data.variants?.find(v => v.stock > 0);
        if (first) setSelectedSize(first.size);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    setQuantity(1);
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-linen">
      <Navbar />
      <SkeletonProductDetail />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-linen flex flex-col items-center justify-center gap-4">
      <Package size={52} className="text-parchment" />
      <p className="text-espresso font-medium">Produk tidak ditemukan.</p>
      <Link to="/" className="text-sm text-mahogany hover:text-ink transition">← Kembali ke Katalog</Link>
    </div>
  );

  const selectedVariant = product.variants?.find(v => v.size === selectedSize);
  const maxQty   = selectedVariant?.stock ?? 0;
  const totalStock = product.variants?.reduce((s, v) => s + v.stock, 0) ?? 0;

  // Tambah ke keranjang: panggil context CartContext.addToCart() sebanyak quantity
  // Data flow: CartContext manage state items → localStorage → CartDrawer baca dari context
  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize);
    }
  };

  return (
    <div className="min-h-screen bg-linen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-caramel mb-8">
          <Link to="/" className="hover:text-ink transition">Beranda</Link>
          <ChevronRight size={12} />
          <span className="text-caramel">{product.category}</span>
          <ChevronRight size={12} />
          <span className="text-ink font-medium truncate max-w-48">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gambar */}
          <div className="space-y-3">
            <div className="bg-parchment/20 rounded-3xl overflow-hidden aspect-square border border-parchment">
              <img
                src={product.image_url}
                alt={product.name} loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                onError={(e) => { e.target.src = 'https://placehold.co/600x600/E8D9C8/6B3A2A?text=ExternaWear'; }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <span className="bg-ink text-linen text-xs font-medium px-3 py-1.5 rounded-full">{product.category}</span>
              <h1 className="font-display text-4xl font-bold text-ink mt-3 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="font-display text-3xl font-bold text-mahogany">
                  Rp {Number(product.price).toLocaleString('id-ID')}
                </p>
                {totalStock === 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">Stok Habis</span>
                )}
              </div>
            </div>

            {/* Pilih Ukuran */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-espresso">Pilih Ukuran</p>
                {selectedSize && (
                  <p className="text-xs text-caramel">Stok: <span className="font-medium text-espresso">{maxQty}</span></p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {product.variants?.map((v) => (
                  <button key={v.size} onClick={() => { setSelectedSize(v.size); setQuantity(1); }}
                    disabled={v.stock === 0}
                    className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition ${
                      selectedSize === v.size ? 'bg-ink text-linen border-ink'
                      : v.stock === 0 ? 'border-parchment text-parchment cursor-not-allowed line-through'
                      : 'border-parchment text-espresso hover:border-mahogany hover:text-mahogany'
                    }`}>
                    {v.size}
                    {v.stock === 0 && ' (Habis)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Jumlah */}
            {selectedSize && maxQty > 0 && (
              <div>
                <p className="text-sm font-semibold text-espresso mb-2">Jumlah</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-parchment rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-4 py-2.5 hover:bg-parchment/50 transition disabled:opacity-40">
                      <Minus size={15} />
                    </button>
                    <span className="px-5 text-ink font-semibold min-w-12 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      className="px-4 py-2.5 hover:bg-parchment/50 transition disabled:opacity-40">
                      <Plus size={15} />
                    </button>
                  </div>
                  <p className="text-xs text-caramel">Tersedia {maxQty} pcs</p>
                </div>
              </div>
            )}

            {/* CTA */}
            {user?.role === 'user' ? (
              <button onClick={handleAddToCart}
                disabled={!selectedSize || maxQty === 0}
                className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-espresso active:scale-95 text-linen font-semibold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                <ShoppingBag size={20} />
                {maxQty === 0 ? 'Stok Habis' : `Tambah ${quantity > 1 ? `(${quantity}) ` : ''}ke Keranjang`}
              </button>
            ) : !user ? (
              <div className="border border-parchment rounded-2xl p-4 bg-ivory text-center space-y-2">
                <p className="text-sm text-espresso font-medium">Masuk untuk membeli produk ini</p>
                <div className="flex gap-2 justify-center">
                  <Link to="/login"    className="bg-ink text-linen text-sm font-medium px-5 py-2 rounded-xl transition hover:bg-espresso">Masuk</Link>
                  <Link to="/register" className="border border-parchment text-espresso text-sm font-medium px-5 py-2 rounded-xl transition hover:border-mahogany">Daftar</Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Detail Tabs */}
        <div className="mt-12 bg-ivory rounded-3xl border border-parchment overflow-hidden">
          <div className="flex border-b border-parchment">
            {TAB_INFO.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-4 text-sm font-medium transition ${activeTab === t.key ? 'text-ink border-b-2 border-ink bg-white' : 'text-caramel hover:text-espresso'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'desc' && (
              <p className="text-espresso leading-relaxed">{product.description}</p>
            )}
            {activeTab === 'spec' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-parchment/30">
                      <th className="text-left py-2.5 px-4 font-semibold text-espresso rounded-l-lg">Ukuran</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-espresso">Stok</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-espresso rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants?.map((v, i) => (
                      <tr key={i} className="border-b border-parchment last:border-0">
                        <td className="py-3 px-4 font-medium text-ink">{v.size}</td>
                        <td className="py-3 px-4 text-espresso">{v.stock} pcs</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${v.stock > 5 ? 'bg-green-100 text-green-700' : v.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {v.stock > 5 ? 'Tersedia' : v.stock > 0 ? 'Hampir Habis' : 'Habis'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'ship' && (
              <div className="space-y-4 text-sm text-espresso">
                {[
                  { title:'Estimasi Pengiriman', desc:'2–5 hari kerja untuk pulau Jawa, 5–10 hari untuk luar Jawa.' },
                  { title:'Kurir Tersedia', desc:'JNE, J&T Express, SiCepat, Anteraja, dan GoSend.' },
                  { title:'Gratis Ongkir', desc:'Untuk pembelian di atas Rp 500.000 ke seluruh Indonesia.' },
                  { title:'Kebijakan Retur', desc:'Produk dapat diretur dalam 7 hari sejak penerimaan dengan kondisi original.' },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-mahogany mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-ink">{title}</p>
                      <p className="text-caramel mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl font-bold text-ink mb-6">Produk Serupa</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`}
                  className="bg-ivory rounded-2xl overflow-hidden border border-parchment hover:border-mahogany/40 hover:-translate-y-1 transition-all duration-200 group">
                  <div className="h-40 overflow-hidden bg-parchment/20">
                    <img src={p.image_url} alt={p.name} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://placehold.co/200x160/E8D9C8/6B3A2A?text=EW'; }} />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-ink text-sm truncate">{p.name}</p>
                    <p className="text-mahogany font-bold text-sm mt-1">Rp {Number(p.price).toLocaleString('id-ID')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;