import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Kalau ada error di komponen aktifkan state error
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-linen flex items-center justify-center p-6">
          <div className="bg-ivory rounded-3xl border border-parchment max-w-md w-full p-8 text-center space-y-5">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink mb-1">Terjadi Kesalahan</h2>
              <p className="text-caramel text-sm leading-relaxed">
                Maaf, terjadi kesalahan yang tidak terduga. Silakan muat ulang halaman.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-ink hover:bg-espresso text-linen font-semibold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw size={16} /> Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;