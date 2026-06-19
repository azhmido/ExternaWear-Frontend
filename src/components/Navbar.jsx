import { useState, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShoppingBag, LogOut, ShoppingCart,
  LayoutGrid, User, Menu, X, LayoutDashboard, Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer';

//di-render ulang kalau context berubah
const Navbar = memo(() => {
  const { user, logout }  = useAuth();
  const { totalItems }    = useCart();
  const navigate          = useNavigate();
  const location          = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  //baca pathname dari react-router
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/products');
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navLinkClass = (path, extra = '') =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
      isActive(path) ? 'bg-parchment/15 text-linen' : 'text-caramel hover:text-linen hover:bg-parchment/10'
    } ${extra}`;

  const closeMenu = () => setMenuOpen(false);

  //backend hapus cookie JWT redirect ke login
  const handleLogout = async () => {
    closeMenu();
    await logout();
    toast.success('Sampai jumpa!');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <nav className="bg-ink sticky top-0 z-30 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-3 sm:py-4 gap-2 sm:gap-3">

            {/* ─── Brand ─── */}
              <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
              <div className="border border-parchment/30 p-1.5 sm:p-2 rounded-xl group-hover:border-parchment/60 transition">
                <ShoppingBag size={18} className="text-linen" />
              </div>
              <div className="sm:block">
                <span className="font-display text-lg sm:text-2xl font-bold text-linen leading-none whitespace-nowrap">ExternaWear</span>
              </div>
            </Link>

            {/* ─── Nav Links (desktop) ─── */}
            <div className="hidden lg:flex items-center gap-1">
              <Link to="/" className={navLinkClass('/')}>
                <LayoutGrid size={15} /> Katalog
              </Link>
              <Link to="/tentang" className={navLinkClass('/tentang')}>
                <Info size={15} /> Tentang
              </Link>
              {user?.role === 'user' && (
                <Link to="/profile" className={navLinkClass('/profile')}>
                  <User size={15} /> Akun Saya
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className={navLinkClass('/admin')}>
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
              )}
            </div>

            {/* ─── Right side ─── */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!user ? (
                <>
                  <Link to="/register" className="text-sm text-caramel hover:text-linen hover:bg-parchment/10 px-4 py-2 rounded-xl transition">
                    Daftar
                  </Link>
                  <Link to="/login" className="text-sm text-linen border border-parchment/40 hover:bg-parchment/10 px-4 py-2 rounded-xl transition">
                    Masuk
                  </Link>
                </>
              ) : (
                <>
                  {/* Cart — untuk user biasa */}
                  {user.role === 'user' && (
                    <button
                      onClick={() => setCartOpen(true)}
                      aria-label="Buka keranjang belanja"
                      className="relative border border-parchment/40 hover:bg-parchment/10 text-linen p-2.5 rounded-xl transition"
                    >
                      <ShoppingCart size={19} />
                      {totalItems > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-mahogany text-linen text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {totalItems > 9 ? '9+' : totalItems}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Akun + Logout — desktop */}
                  <div className="hidden lg:flex items-center gap-2">
                    <div className="flex items-center gap-2 border border-parchment/30 px-3 py-2 rounded-xl">
                      <div className="w-6 h-6 bg-mahogany rounded-full flex items-center justify-center text-linen text-xs font-bold select-none">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-linen">{user.username}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      aria-label="Keluar"
                      className="flex items-center gap-1.5 text-sm text-caramel hover:text-red-400 hover:bg-parchment/10 px-3 py-2 rounded-xl transition"
                    >
                      <LogOut size={16} /> Keluar
                    </button>
                  </div>

                  {/* Hamburger — mobile/tablet */}
                  <button
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
                    className="lg:hidden border border-parchment/40 hover:bg-parchment/10 text-linen p-2.5 rounded-xl transition"
                  >
                    {menuOpen ? <X size={19} /> : <Menu size={19} />}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ─── Mobile Menu Panel ─── */}
          {user && (
            <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="pb-4 pt-3 space-y-1 border-t border-parchment/15">
                <Link to="/" onClick={closeMenu} className={navLinkClass('/', 'w-full')}>
                  <LayoutGrid size={15} /> Katalog
                </Link>
                <Link to="/tentang" onClick={closeMenu} className={navLinkClass('/tentang', 'w-full')}>
                  <Info size={15} /> Tentang
                </Link>
                {user.role === 'user' && (
                  <Link to="/profile" onClick={closeMenu} className={navLinkClass('/profile', 'w-full')}>
                    <User size={15} /> Akun Saya
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={closeMenu} className={navLinkClass('/admin', 'w-full')}>
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                )}

                <div className="flex items-center justify-between gap-2 mt-2 pt-3 border-t border-parchment/15 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-mahogany rounded-full flex items-center justify-center text-linen text-xs font-bold select-none">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-linen">{user.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm text-caramel hover:text-red-400 hover:bg-parchment/10 px-3 py-2 rounded-xl transition"
                  >
                    <LogOut size={16} /> Keluar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {user?.role === 'user' && (
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      )}
    </>
  );
});

export default Navbar;