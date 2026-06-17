import { memo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { PAYMENT_METHODS } from '../utils/paymentMethods';

const PIE_COLORS = ['#0D0B0A','#2C1810','#6B3A2A','#A67C5B','#E8D9C8'];

const DashboardContent = memo(({ stats }) => {
  const pieData = stats?.byStatus?.map(d => ({
    name: d.status === 'pending' ? 'Menunggu' :
          d.status === 'confirmed' ? 'Dikonfirmasi' :
          d.status === 'shipped' ? 'Dikirim' :
          d.status === 'delivered' ? 'Diterima' :
          d.status === 'cancelled' ? 'Dibatalkan' : d.status,
    value: d.count,
  })) || [];

  const paymentChartData = stats?.byPaymentMethod?.map(d => {
    const cfg = PAYMENT_METHODS[d.payment_method];
    return {
      name:    cfg?.label || d.payment_method,
      value:   d.count,
      revenue: d.revenue,
      color:   cfg?.color || '#A67C5B',
      icon:    cfg?.icon,
    };
  }) || [];
  const totalPaymentOrders = paymentChartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue line chart */}
        <div className="bg-ivory border border-parchment rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold text-ink mb-1">Pendapatan 7 Hari</h3>
          <p className="text-caramel text-xs mb-5">Pendapatan harian (tanpa pesanan batal)</p>
          {stats.revenueByDay?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.revenueByDay}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6B3A2A" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6B3A2A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize:11, fill:'#A67C5B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:'#A67C5B' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `Rp${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v) => [`Rp ${Number(v).toLocaleString('id-ID')}`, 'Pendapatan']}
                  contentStyle={{ border:'1px solid #E8D9C8', borderRadius:12, fontSize:12 }} />
                <Area type="monotone" dataKey="revenue" fill="url(#revenueGrad)" stroke="none" />
                <Line isAnimationActive animationDuration={800} type="monotone" dataKey="revenue" stroke="#0D0B0A" strokeWidth={2.5} dot={{ fill:'#0D0B0A', r:4 }} activeDot={{ r:6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-caramel text-sm">Belum ada data.</div>
          )}
        </div>

        {/* Order status pie */}
        <div className="bg-ivory border border-parchment rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold text-ink mb-1">Status Pesanan</h3>
          <p className="text-caramel text-xs mb-5">Lihat persebaran status pesanan</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie isAnimationActive animationDuration={800} data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ border:'1px solid #E8D9C8', borderRadius:12, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize:11, color:'#2C1810' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-caramel text-sm">Belum ada data.</div>
          )}
        </div>
      </div>

      {/* Top products + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-ivory border border-parchment rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold text-ink mb-1">Produk Terlaris</h3>
          <p className="text-caramel text-xs mb-5">Top 5 berdasarkan jumlah terjual</p>
          {stats.topProducts?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.topProducts.map((d, i) => ({ ...d, fill: PIE_COLORS[i % PIE_COLORS.length] }))} layout="vertical">
                <XAxis type="number" tick={{ fontSize:10, fill:'#A67C5B' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize:10, fill:'#2C1810' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [v, 'Terjual']} contentStyle={{ border:'1px solid #E8D9C8', borderRadius:12, fontSize:12 }} />
                <Bar isAnimationActive animationDuration={800} dataKey="total_sold" radius={[0,6,6,0]}>
                  {stats.topProducts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-caramel text-sm">Belum ada data penjualan.</div>
          )}
        </div>

        <div className="bg-ivory border border-parchment rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-yellow-600" />
            <h3 className="font-display text-lg font-semibold text-ink">Stok Menipis</h3>
          </div>
          <p className="text-caramel text-xs mb-5">Produk dengan stok ≤ 5 unit</p>
          {stats.lowStock?.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-green-600">
              <Package size={32} />
              <p className="text-sm font-medium">Semua stok aman!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.lowStock.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink truncate max-w-32">{item.name}</p>
                    <p className="text-xs text-caramel">{item.category} · Ukuran {item.size}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item.stock === 0 ? 'Habis' : `${item.stock} sisa`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-ivory border border-parchment rounded-3xl p-6">
        <h3 className="font-display text-lg font-semibold text-ink mb-1">Metode Pembayaran</h3>
        <p className="text-caramel text-xs mb-5">Distribusi metode pembayaran dari seluruh transaksi</p>
        {paymentChartData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {paymentChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} pesanan`, 'Jumlah']} contentStyle={{ border:'1px solid #E8D9C8', borderRadius:12, fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {paymentChartData.map((item, i) => {
                const pct = totalPaymentOrders > 0 ? Math.round((item.value / totalPaymentOrders) * 100) : 0;
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: `${item.color}1A` }}>
                      {Icon && <Icon size={14} style={{ color: item.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-ink font-medium truncate">{item.name}</span>
                        <span className="text-caramel text-xs flex-shrink-0 ml-2">{pct}% · {item.value}x</span>
                      </div>
                      <div className="w-full bg-parchment/40 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                    <span className="text-xs text-mahogany font-semibold flex-shrink-0">
                      Rp {item.revenue.toLocaleString('id-ID')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-caramel text-sm">Belum ada data pembayaran.</div>
        )}
      </div>
    </div>
  );
});