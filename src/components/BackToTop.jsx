import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

// Tombol floating "kembali ke atas" — muncul pas scroll melewati threshold
const BackToTop = ({ threshold = 500 }) => {
  const [visible, setVisible] = useState(false);

  // useEffect: side effect — pasang event listener scroll, bersihin pas komponen dilepas
  // passive: true biar nggak blocking scroll performance
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Kembali ke atas"
      className="fixed bottom-6 right-6 z-40 bg-ink hover:bg-espresso text-linen p-3 rounded-2xl shadow-lg shadow-ink/20 transition-all duration-200 hover:scale-105 active:scale-95"
    >
      <ArrowUp size={20} />
    </button>
  );
};

export default BackToTop;