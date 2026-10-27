
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider, useDispatch, useSelector } from 'react-redux';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  store,
  type RootState,
  type AppDispatch,
} from './src/store/store';

import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  hydrateCart,
  applyDiscount,
  setShippingCost,
} from './src/features/cart/cartSlice';

import { fetchProducts } from './src/features/products/productsSlice';

import { selectCartSummary } from './src/features/cart/cartSelectors';

function ShoppingCart() {
  const dispatch = useDispatch<AppDispatch>();

  const products = useSelector(
    (state: RootState) => state.products.items
  );
  const status = useSelector(
    (state: RootState) => state.products.status
  );
  const error = useSelector(
    (state: RootState) => state.products.error
  );

  const cartItems = useSelector(
    (state: RootState) => state.cart.items
  );
  const shippingCost = useSelector(
    (state: RootState) => state.cart.shippingCost
  );
  const discountCode = useSelector(
    (state: RootState) => state.cart.discountCode
  );
  const summary = useSelector(selectCartSummary);

  const [discountInput, setDiscountInput] = useState('');
  const [cartLoaded, setCartLoaded] = useState(false);
  const [storageError, setStorageError] = useState('');

  // Tải sản phẩm từ API
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProducts());
    }
  }, [dispatch, status]);

  // Khôi phục giỏ hàng khi mở ứng dụng
  useEffect(() => {
    let active = true;

    async function loadCart() {
      try {
        const saved = await AsyncStorage.getItem('cartItems');

        if (saved && active) {
          const parsed: unknown = JSON.parse(saved);

          if (
            Array.isArray(parsed) &&
            parsed.every(
              (item) =>
                item &&
                Number.isInteger(item.id) &&
                typeof item.name === 'string' &&
                Number.isFinite(item.price) &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
            )
          ) {
            dispatch(hydrateCart(parsed));
          }
        }
      } catch {
        if (active) {
          setStorageError('Không thể đọc giỏ hàng đã lưu.');
        }
      } finally {
        if (active) setCartLoaded(true);
      }
    }

    loadCart();

    return () => {
      active = false;
    };
  }, [dispatch]);

  // Lưu lại mỗi khi giỏ hàng thay đổi
  useEffect(() => {
    if (!cartLoaded) return;

    AsyncStorage.setItem('cartItems', JSON.stringify(cartItems))
      .then(() => setStorageError(''))
      .catch(() => {
        setStorageError('Không thể lưu giỏ hàng.');
      });
  }, [cartItems, cartLoaded]);

  function handleApplyDiscount() {
    dispatch(applyDiscount(discountInput));
  }

  function handleClearCart() {
    dispatch(clearCart());
  }

  async function handleRetry() {
    await dispatch(fetchProducts());
  }

  if (!cartLoaded || status === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>
          {!cartLoaded
            ? 'Đang khôi phục giỏ hàng...'
            : 'Đang tải sản phẩm...'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          🛍️ Cửa hàng Redux Toolkit
        </Text>

        {storageError ? (
          <Text style={styles.error}>{storageError}</Text>
        ) : null}

        <Text style={styles.heading}>Danh sách sản phẩm</Text>

        {status === 'failed' ? (
          <View style={styles.notice}>
            <Text style={styles.error}>
              {error ?? 'Không tải được sản phẩm.'}
            </Text>
            <Button title="Thử lại" onPress={handleRetry} />
          </View>
        ) : (
          <View style={styles.productGrid}>
            {products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  resizeMode="contain"
                />

                <Text style={styles.productName} numberOfLines={2}>
                  {product.title}
                </Text>

                <Text style={styles.price}>
                  ${product.price.toFixed(2)}
                </Text>

                <Button
                  title="Thêm vào giỏ"
                  onPress={() =>
                    dispatch(
                      addToCart({
                        id: product.id,
                        name: product.title,
                        price: product.price,
                      })
                    )
                  }
                />
              </View>
            ))}
          </View>
        )}

        <Text style={styles.heading}>
          Giỏ hàng ({summary.itemCount} sản phẩm)
        </Text>

        {cartItems.length === 0 ? (
          <Text style={styles.message}>Giỏ hàng đang trống.</Text>
        ) : (
          cartItems.map((item) => (
            <View key={item.id} style={styles.cartRow}>
              <View style={styles.cartInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text>
                  ${item.price.toFixed(2)} × {item.quantity}
                </Text>
                <Text style={styles.price}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>

              <View style={styles.quantityRow}>
                <Button
                  title="-"
                  disabled={item.quantity <= 1}
                  onPress={() =>
                    dispatch(decreaseQuantity(item.id))
                  }
                />
                <Text style={styles.quantity}>{item.quantity}</Text>
                <Button
                  title="+"
                  onPress={() =>
                    dispatch(increaseQuantity(item.id))
                  }
                />
                <Button
                  title="Xóa"
                  color="#c62828"
                  onPress={() =>
                    dispatch(removeFromCart(item.id))
                  }
                />
              </View>
            </View>
          ))
        )}

        <Text style={styles.heading}>Mã giảm giá</Text>

        <View style={styles.discountRow}>
          <TextInput
            style={styles.input}
            value={discountInput}
            onChangeText={setDiscountInput}
            placeholder="SUMMER10 hoặc SPECIAL20"
            autoCapitalize="characters"
          />
          <Button title="Áp dụng" onPress={handleApplyDiscount} />
        </View>

        <Text>
          Mã đang áp dụng: {discountCode ?? 'Chưa có'}
        </Text>

        <Text style={styles.heading}>Phí vận chuyển</Text>

        {[
          { label: 'Miễn phí', value: 0 },
          { label: 'Tiêu chuẩn ($10)', value: 10 },
          { label: 'Nhanh ($25)', value: 25 },
        ].map((option) => (
          <View key={option.value} style={styles.shippingRow}>
            <Text>{option.label}</Text>
            <Button
              title={
                shippingCost === option.value
                  ? 'Đang chọn'
                  : 'Chọn'
              }
              onPress={() =>
                dispatch(setShippingCost(option.value))
              }
            />
          </View>
        ))}

        <Text style={styles.heading}>Tóm tắt hóa đơn</Text>

        <View style={styles.summaryRow}>
          <Text>Tiền hàng</Text>
          <Text>${summary.subtotal.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text>Giảm giá</Text>
          <Text>-${summary.discount.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text>Thuế (10%)</Text>
          <Text>${summary.tax.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text>Vận chuyển</Text>
          <Text>${summary.shipping.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.total}>Thành tiền</Text>
          <Text style={styles.total}>
            ${summary.total.toFixed(2)}
          </Text>
        </View>

        <Button
          title="Xóa toàn bộ giỏ hàng"
          color="#c62828"
          onPress={handleClearCart}
          disabled={cartItems.length === 0}
        />

        <Text style={styles.footer}>
          Demo học tập — chưa tích hợp thanh toán thực tế.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ShoppingCart />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#ffffff',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
  },
  price: {
    color: '#16803c',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  cartRow: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    gap: 10,
  },
  cartInfo: {
    gap: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  quantity: {
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  shippingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  total: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#16803c',
  },
  message: {
    marginVertical: 12,
    color: '#555555',
  },
  error: {
    color: '#c62828',
    marginVertical: 8,
  },
  notice: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  footer: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
