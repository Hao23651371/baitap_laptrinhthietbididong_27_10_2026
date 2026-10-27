
import type { RootState } from '../../store/store';

export const selectCartItems = (state: RootState) =>
  state.cart.items;

export const selectSubtotal = (state: RootState) =>
  state.cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

export const selectItemCount = (state: RootState) =>
  state.cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

export const selectDiscount = (state: RootState) => {
  const subtotal = selectSubtotal(state);

  const rates: Record<string, number> = {
    SUMMER10: 0.1,
    SPECIAL20: 0.2,
  };

  const rate = rates[state.cart.discountCode ?? ''] ?? 0;

  return subtotal * rate;
};

export const selectTax = (state: RootState) => {
  const subtotal = selectSubtotal(state);
  const discount = selectDiscount(state);

  // Tính thuế trên số tiền sau giảm giá
  return Math.max(0, subtotal - discount) * state.cart.taxRate;
};

export const selectCartSummary = (state: RootState) => {
  const subtotal = selectSubtotal(state);
  const discount = selectDiscount(state);
  const tax = selectTax(state);
  const shipping = state.cart.shippingCost;

  return {
    subtotal,
    discount,
    tax,
    shipping,
    total: subtotal - discount + tax + shipping,
    itemCount: selectItemCount(state),
  };
};
