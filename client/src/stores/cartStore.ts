import { create } from "zustand";
import type { CartItem, Product } from "../types";

type CartState = {
  items: CartItem[];
  add: (product: Product, quantity?: number) => { added: number; capped: boolean; max: number };
  remove: (productId: string) => void;
  setQty: (productId: string, quantity: number) => void;
  clear: () => void;
  totalRub: () => number;
  count: () => number;
};

const LS_CART = "pc_center_cart";

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_CART);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  localStorage.setItem(LS_CART, JSON.stringify(items));
}

export const useCartStore = create<CartState>((set, get) => ({
  items: load(),
  add: (product, quantity = 1) => {
    const items = [...get().items];
    const idx = items.findIndex((i) => i.product.id === product.id);
    const max = Math.max(0, Math.floor(product.stock ?? 0));
    const q = Math.max(1, Math.floor(quantity));
    if (idx >= 0) {
      const prev = items[idx].quantity;
      const next = Math.min(prev + q, max || 99);
      items[idx] = { ...items[idx], quantity: next };
      save(items);
      set({ items });
      return { added: next - prev, capped: next !== prev + q, max: max || 99 };
    } else {
      const next = Math.min(q, max || 99);
      items.push({ product, quantity: next });
      save(items);
      set({ items });
      return { added: next, capped: next !== q, max: max || 99 };
    }
  },
  remove: (productId) => {
    const items = get().items.filter((i) => i.product.id !== productId);
    save(items);
    set({ items });
  },
  setQty: (productId, quantity) => {
    const items = get().items.map((i) => {
      if (i.product.id !== productId) return i;
      const max = Math.max(1, Math.floor(i.product.stock ?? 1));
      const q = Math.max(1, Math.min(max, Math.floor(Number.isFinite(quantity) ? quantity : 1)));
      return { ...i, quantity: q };
    });
    save(items);
    set({ items });
  },
  clear: () => {
    save([]);
    set({ items: [] });
  },
  totalRub: () => get().items.reduce((sum, it) => sum + it.product.priceRub * it.quantity, 0),
  count: () => get().items.reduce((sum, it) => sum + it.quantity, 0)
}));

