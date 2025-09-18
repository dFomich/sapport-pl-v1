import React, { createContext, useContext, useMemo, useState } from 'react';
import axios from 'axios';

export type CartItem = {
  id: number;
  title: string;
  materialCode: string;
  imageUrl?: string;
  availableStock: number;
  qty: number;
};

type CartState = {
  orderId?: string;
  storageType?: string;
  items: CartItem[];
};

type CartCtx = {
  state: CartState;
  setOrderId: (id: string) => void;
  addItem: (tile: Omit<CartItem, 'qty'>, storage: string) => void;
  setQty: (id: number, qty: number) => void;
  inc: (id: number) => void;
  dec: (id: number) => void;
  remove: (id: number) => void;
  reset: () => void;
  positionsCount: number;
  totalQty: number;
  confirmOrder: (onDone: (resp: any) => void, onFail: (e: any) => void) => Promise<void>;
};

const Ctx = createContext<CartCtx | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CartState>({ items: [] });

  const setOrderId = (id: string) => setState(s => ({ ...s, orderId: id }));

  const addItem: CartCtx['addItem'] = (t, storage) => {
    setState(s => {
      if (s.storageType && s.storageType !== storage) return s;
      if (s.items.some(i => i.id === t.id)) return s;
      return {
        ...s,
        storageType: s.storageType ?? storage,
        items: [...s.items, { ...t, qty: 1 }],
      };
    });

    // 👉 Триггерим анимацию кнопки корзины
    const btn = document.querySelector('.tractor-btn');
    if (btn) {
      btn.classList.add('shake');
      setTimeout(() => btn.classList.remove('shake'), 600);
    }
  };

  const clamp = (q: number, max: number) => Math.max(1, Math.min(q, max));

  const setQty: CartCtx['setQty'] = (id, qty) =>
    setState(s => ({
      ...s,
      items: s.items.map(it => (it.id === id ? { ...it, qty: clamp(qty, it.availableStock) } : it)),
    }));

  const inc: CartCtx['inc'] = id =>
    setState(s => ({
      ...s,
      items: s.items.map(it => (it.id === id ? { ...it, qty: clamp(it.qty + 1, it.availableStock) } : it)),
    }));

  const dec: CartCtx['dec'] = id =>
    setState(s => ({
      ...s,
      items: s.items.map(it => (it.id === id ? { ...it, qty: clamp(it.qty - 1, it.availableStock) } : it)),
    }));

  const remove: CartCtx['remove'] = id =>
    setState(s => {
      const next = s.items.filter(i => i.id !== id);
      return { ...s, items: next, storageType: next.length ? s.storageType : undefined };
    });

  const reset = () => setState({ items: [] });

  const positionsCount = state.items.length;
  const totalQty = useMemo(() => state.items.reduce((sum, i) => sum + i.qty, 0), [state.items]);

  const confirmOrder: CartCtx['confirmOrder'] = async (onDone, onFail) => {
    try {
      if (!state.orderId || !state.storageType || state.items.length === 0) {
        throw new Error('Корзина пуста или не указан номер заказа.');
      }
      const payload = {
        orderName: state.orderId, // было: orderId
        storageType: state.storageType,
        items: state.items.map(i => ({
          tileId: i.id,
          materialCode: i.materialCode, // было: material
          qty: i.qty,
          title: i.title,
        })),
      };
      const { data } = await axios.post('/api/mechanic-orders/checkout', payload);
      onDone(data);
      reset();
    } catch (e: any) {
      onFail(e?.response?.data ?? e);
    }
  };

  const value: CartCtx = {
    state,
    setOrderId,
    addItem,
    setQty,
    inc,
    dec,
    remove,
    reset,
    positionsCount,
    totalQty,
    confirmOrder,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useCart = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart must be used within CartProvider');
  return v;
};
