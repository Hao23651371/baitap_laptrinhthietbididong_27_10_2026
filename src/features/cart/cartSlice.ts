
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  discountCode: string | null;
  taxRate: number;
  shippingCost: number;
}

const initialState: CartState = {
  items: [],
  discountCode: null,
  taxRate: 0.1,
  shippingCost: 10,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<Omit<CartItem, 'quantity'>>
    ) => {
      const product = action.payload;
      const existing = state.items.find(
        (item) => item.id === product.id
      );

      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({
          ...product,
          quantity: 1,
        });
      }
    },

    increaseQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find(
        (item) => item.id === action.payload
      );
      if (item) item.quantity += 1;
    },

    decreaseQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find(
        (item) => item.id === action.payload
      );
      if (item && item.quantity > 1) item.quantity -= 1;
    },

    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(
        (item) => item.id !== action.payload
      );
    },

    clearCart: (state) => {
      state.items = [];
      state.discountCode = null;
    },

    hydrateCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },

    applyDiscount: (state, action: PayloadAction<string>) => {
      const code = action.payload.trim().toUpperCase();

      state.discountCode =
        code === 'SUMMER10' || code === 'SPECIAL20'
          ? code
          : null;
    },

    setShippingCost: (state, action: PayloadAction<number>) => {
      if ([0, 10, 25].includes(action.payload)) {
        state.shippingCost = action.payload;
      }
    },
  },
});

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  hydrateCart,
  applyDiscount,
  setShippingCost,
} = cartSlice.actions;

export default cartSlice.reducer;
