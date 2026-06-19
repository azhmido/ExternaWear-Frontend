import { Link } from 'react-router-dom';
import { Info, ShoppingBag, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import BackToTop from '../components/BackToTop';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const AboutPage = () => {
  useDocumentTitle('Tentang');
  return (
    <div className="min-h-screen bg-linen">
    <Navbar />

    {/* Hero */}
    <div className="bg-ivory border-b border-parchment hero-pattern">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14 flex items-end justify-between gap-8">
        <div>
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-ink leading-none">
            Tentang
          </h1>
          <p className="text-caramel text-sm sm:text-base mt-3 max-w-xl leading-relaxed">
            Cerita singkat di balik layar toko ini.
          </p>
        </div>
        <div className="hidden lg:block font-display text-[6rem] xl:text-[8rem] font-bold text-parchment/40 leading-none select-none">ExternaWear</div>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 sm:space-y-14">
      {/* Awal Mula */}
      <section className="animate-fadeIn">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-mahogany rounded-full" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">Kenapa ExternaWear?</h2>
        </div>
        <p className="text-espresso leading-relaxed text-sm sm:text-base">
          ExternaWear ini sebenernya lahir dari tugas akhir pelatihan React Lanjutan yang harus kelar
          dalam 10 hari. Daripada bikin project yang gitu-gitu aja, sekalian aja bikin toko online
          outerwear pria yang lumayan—biar semua materi pelatihan kebelajar sambil bikin sesuatu yang
          beneran kepake.
        </p>
      </section>

      {/* Produk */}
      <section className="animate-fadeIn">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-mahogany rounded-full" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">Fokus ke Outerwear Pria</h2>
        </div>
        <p className="text-espresso leading-relaxed text-sm sm:text-base">
          Isinya jaket coach, jaket bomber, hoodie, sweater, jaket denim, vest—pokoknya outerwear
          cowok yang bisa dipakai hangout atau daily look aja. Produk-produknya dipilih yang
          keliatannya oke dan bahan nyaman dipake.
        </p>
      </section>

      {/* Fitur */}
      <section className="animate-fadeIn">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-mahogany rounded-full" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">Fitur yang Dicoba</h2>
        </div>
        <p className="text-espresso leading-relaxed text-sm sm:text-base">
          Karena targetnya implementasi semua materi, jadinya hampir semua fitur dasar toko online
          ada di sini: routing multi-halaman, context buat state global, login & register pake JWT,
          cart & checkout, integrasi payment gateway Xendit, sama admin dashboard buat ngelola
          produk dan pesanan.
        </p>
      </section>

      {/* Teknis */}
      <section className="animate-fadeIn">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-mahogany rounded-full" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">Dibangun Pake Apa</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {['React 19','Vite','Tailwind CSS','Express','PostgreSQL','Xendit'].map(t => (
            <span key={t} className="bg-ink text-linen text-xs font-medium px-3 py-1.5 rounded-full">{t}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ivory border border-parchment rounded-3xl p-6 sm:p-8 text-center animate-fadeIn">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-ink text-linen p-2.5 rounded-xl">
            <ShoppingBag size={20} />
          </div>
          <span className="font-display text-xl font-bold text-ink">ExternaWear</span>
        </div>
        <p className="text-espresso text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Penasaran? Langsung aja cek katalog buat liat-liat koleksinya.
        </p>
        <Link to="/"
          className="inline-flex items-center gap-2 mt-5 bg-ink hover:bg-espresso text-linen font-semibold px-6 py-3 rounded-xl transition active:scale-95">
          Lihat Katalog <ArrowRight size={18} />
        </Link>
      </section>
    </div>

    <BackToTop />
    <Footer />
  </div>
  );
};

export default AboutPage;
