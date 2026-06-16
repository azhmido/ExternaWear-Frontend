import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  //baca localStorage pas pertama render
  //ambil data keranjang dari localStorage (biar awet walau browser ditutup)
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ew_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  //setiap items berubah simpan ke localStorage
  useEffect(() => {
    localStorage.setItem('ew_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, size) => {
    const variant = product.variants?.find(v => v.size === size);
    if (!variant || variant.stock === 0) {
      toast.error('Ukuran ini habis!');
      return;
    }
    //cari item yang sama
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id && i.size === size);
      if (existing) {
        if (existing.quantity >= variant.stock) {
          toast.error('Stok tidak mencukupi!');
          return prev;
        }
        return prev.map(i =>
          i.product_id === product.id && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      //tambah item baru ke dalam array
      return [...prev, {
        product_id:   product.id,
        product_name: product.name,
        image_url:    product.image_url,
        size,
        quantity: 1,
        price:    Number(product.price),
        maxStock: variant.stock,
      }];
    });
    toast.success(`${product.name} (${size}) ditambahkan!`);
  };

  //hapus item 
  const removeFromCart = (product_id, size) =>
    setItems(prev => prev.filter(i => !(i.product_id === product_id && i.size === size)));

  const updateQuantity = (product_id, size, qty) => {
    if (qty <= 0) { removeFromCart(product_id, size); return; }
    setItems(prev => prev.map(i =>
      i.product_id === product_id && i.size === size
        ? { ...i, quantity: Math.min(qty, i.maxStock) }
        : i
    ));
  };

  const clearCart = () => setItems([]);

  //hasil kalkulasi di cache
  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity,
      clearCart, totalItems, totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);