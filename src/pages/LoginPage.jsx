import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/apiClient';

const LoginPage = () => {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]               = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  if (loading) return (
    <div className="min-h-screen bg-linen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin" />
    </div>
  );

  //kalau sudah login redirect ke halaman utama
  if (user) return <Navigate to="/" replace />;

  //server validasi JWT via cookie
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedInUser = await login(form.username, form.password);
      toast.success('Selamat datang kembali!');
      navigate(loggedInUser.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linen flex">

      {/* ─── Panel kiri ─── */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="border border-parchment/30 p-2.5 rounded-xl">
            <ShoppingBag size={22} className="text-linen" />
          </div>
          <span className="font-display text-2xl font-bold text-linen">ExternaWear</span>
        </div>
        <div>
          <h1 className="font-display text-7xl font-bold text-linen leading-tight">
            Selamat<br />
            <em className="text-caramel">Datang</em><br />
            Kembali
          </h1>
          <p className="text-parchment/50 mt-6 max-w-xs leading-relaxed text-sm">
            Masuk ke akun Anda untuk menikmati pengalaman berbelanja outerwear premium.
          </p>
        </div>
        <p className="text-parchment/25 text-sm">© 2026 ExternaWear</p>
      </div>

      {/* ─── Panel kanan ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="bg-ink p-2.5 rounded-xl">
              <ShoppingBag size={20} className="text-linen" />
            </div>
            <span className="font-display text-2xl font-bold text-ink">ExternaWear</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-4xl font-bold text-ink">Masuk</h2>
            <p className="text-caramel mt-2 text-sm">
              Belum punya akun?{' '}
              <Link to="/register" className="text-mahogany hover:text-ink font-medium transition">
                Daftar sekarang
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-espresso mb-2">Username</label>
              <input
                type="text"
                placeholder="Masukkan username"
                className="w-full bg-ivory border border-parchment rounded-xl px-4 py-3.5 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-espresso mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  className="w-full bg-ivory border border-parchment rounded-xl px-4 py-3.5 pr-12 text-ink placeholder-caramel/50 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-caramel hover:text-ink transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-ink hover:bg-espresso active:scale-95 text-linen font-semibold py-3.5 rounded-xl transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-linen border-t-transparent rounded-full animate-spin" />
                  Memuat...
                </span>
              ) : 'Masuk'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-parchment text-center">
            <Link to="/" className="text-sm text-caramel hover:text-ink transition">
              ← Kembali ke Katalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;