import { PackageOpen } from 'lucide-react';

const EmptyState = ({ title = 'Data Kosong', message = 'Belum ada data untuk ditampilkan.', icon: Icon = PackageOpen, action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-parchment/60 rounded-3xl bg-ivory/30">
    <Icon size={48} className="text-caramel/40 mb-4" strokeWidth={1.5} />
    <h3 className="text-ink font-semibold text-lg">{title}</h3>
    <p className="text-caramel text-sm max-w-sm mt-1">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
