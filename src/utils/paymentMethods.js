import { Building2, Smartphone, QrCode, Wallet, CreditCard } from 'lucide-react';

export const PAYMENT_METHODS = {
  transfer_bank: { label: 'Transfer Bank',         desc: 'BCA, Mandiri, BNI, BRI',            icon: Building2,  color: '#0D0B0A' },
  e_wallet:      { label: 'E-Wallet',              desc: 'GoPay, OVO, DANA, ShopeePay',       icon: Smartphone, color: '#6B3A2A' },
  qris:          { label: 'QRIS',                  desc: 'Scan & bayar via aplikasi apapun', icon: QrCode,     color: '#B8562F' },
  cod:           { label: 'Bayar di Tempat (COD)', desc: 'Bayar tunai saat barang tiba',      icon: Wallet,     color: '#2C1810' },
  credit_card:   { label: 'Kartu Kredit/Debit',    desc: 'Visa, Mastercard',                   icon: CreditCard, color: '#A67C5B' },
};

//ubah objek jadi array biar gampang di-loop di JSX
export const PAYMENT_METHOD_LIST = Object.entries(PAYMENT_METHODS).map(([value, cfg]) => ({ value, ...cfg }));