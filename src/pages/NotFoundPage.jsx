import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import Navbar from '../components/Navbar';
import BackToTop from '../components/BackToTop';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const NotFoundPage = () => {
  useDocumentTitle('Halaman Tidak Ditemukan');
  return (
    <div className="min-h-screen bg-linen flex flex-col">
    <Navbar />
    <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4 px-4">
      <div className="bg-parchment/50 rounded-full p-5">
        <SearchX size={48} className="text-caramel" />
      </div>
      <h1 className="font-display text-5xl sm:text-7xl font-bold text-ink">404</h1>
      <p className="text-espresso text-sm sm:text-base">Halaman yang kamu cari nggak ada.</p>
      <Link to="/"
        className="inline-flex items-center gap-2 mt-2 bg-ink hover:bg-espresso text-linen font-semibold px-6 py-3 rounded-xl transition active:scale-95">
        <Home size={18} /> Kembali ke Beranda
      </Link>
    </div>
    <BackToTop />
    <Footer />
  </div>
  );
};

export default NotFoundPage;
