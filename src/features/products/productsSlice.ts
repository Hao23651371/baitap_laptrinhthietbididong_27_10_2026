
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
}

interface ProductsState {
  items: Product[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

export const fetchProducts = createAsyncThunk<
  Product[],
  void,
  { rejectValue: string }
>(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        'https://fakestoreapi.com/products'
      );

      if (!response.ok) {
        return rejectWithValue(
          `Lỗi HTTP: ${response.status}`
        );
      }

      return (await response.json()) as Product[];
    } catch {
      return rejectWithValue(
        'Không thể kết nối API. Hãy kiểm tra mạng.'
      );
    }
  }
);

const initialState: ProductsState = {
  items: [],
  status: 'idle',
  error: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error =
          action.payload ?? 'Đã xảy ra lỗi không xác định.';
      });
  },
});

export default productsSlice.reducer;
