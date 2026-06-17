import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ew_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('ew_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((product, size, qty = 1) => {
    const variant = product.variants?.find(v => v.size === size);
    if (!variant || variant.stock === 0) {
      toast.error('Ukuran ini habis!');
      return;
    }
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id && i.size === size);
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > variant.stock) {
          toast.error('Stok tidak mencukupi!');
          return prev;
        }
        return prev.map(i =>
          i.product_id === product.id && i.size === size
            ? { ...i, quantity: newQty }
            : i
        );
      }
      return [...prev, {
        product_id:   product.id,
        product_name: product.name,
        image_url:    product.image_url,
        size,
        quantity: Math.min(qty, variant.stock),
        price:    Number(product.price),
        maxStock: variant.stock,
      }];
    });
    toast.success(`${product.name} (${size}) ditambahkan!`);
  }, []);

  const removeFromCart = useCallback((product_id, size) =>
    setItems(prev => prev.filter(i => !(i.product_id === product_id && i.size === size))), []);

  const updateQuantity = useCallback((product_id, size, qty) => {
    if (qty <= 0) { removeFromCart(product_id, size); return; }
    setItems(prev => prev.map(i =>
      i.product_id === product_id && i.size === size
        ? { ...i, quantity: Math.min(qty, i.maxStock) }
        : i
    ));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  const value = useMemo(() => ({
    items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice,
  }), [items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);