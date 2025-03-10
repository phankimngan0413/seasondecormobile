import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import CustomButton from "@/components/ui/Button/Button";
import { getCartAPI, removeProductFromCartAPI } from "@/utils/cartAPI";
import { getUserIdFromToken } from "@/services/auth";
import { useRouter } from "expo-router";

const CartScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();

  interface CartItem {
    productId: number;
    productName: string;
    productPrice: number;
    quantity: number;
    imageUrls: string[];
  }
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const userId = await getUserIdFromToken();
      if (!userId) {
        setError("User is not logged in.");
        return;
      }

      const cartData = await getCartAPI(userId);
      console.log("🟢 API Response:", cartData);

      if (cartData?.cartItems) {
        setCartItems(cartData.cartItems || []);
        calculateTotal(cartData.cartItems || []);
      } else {
        setCartItems([]);
        setError("No cart items found.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch cart.");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (items: any[]) => {
    const total = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
    setTotalPrice(total);
  };

  const handleDeleteCartItem = async (productId: number) => {
    try {
      setLoading(true);
      const userId = await getUserIdFromToken();
      if (!userId) {
        Alert.alert("❌ Error", "You need to log in first.");
        return;
      }

      await removeProductFromCartAPI(userId, productId);

      // Animation trước khi xóa sản phẩm
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        const updatedCart = cartItems.filter((item) => item.productId !== productId);
        setCartItems(updatedCart);
        calculateTotal(updatedCart);
      });

      Alert.alert("✅ Removed", "Product removed from cart.");
    } catch (error) {
      Alert.alert("❌ Error", "Failed to remove product.");
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <Animated.View style={[styles.productCard, { backgroundColor: colors.card, opacity: fadeAnim }]}>
      <Image source={{ uri: item.imageUrls?.[0] || "https://via.placeholder.com/150" }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={[styles.productTitle, { color: colors.text }]}>{item.productName}</Text>
        <Text style={[styles.productPrice, { color: colors.primary }]}>₫{item.productPrice.toFixed(2)}</Text>
        <Text style={[styles.productQuantity, { color: colors.text }]}>Quantity: {item.quantity}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteCartItem(item.productId)}>
        <Ionicons name="trash-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>Your Cart</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : cartItems.length === 0 ? (
        <EmptyState onBrowseProducts={() => router.push("/(tabs)/decor")} />
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.productId.toString()}
            contentContainerStyle={styles.productList}
          />

          <View style={[styles.orderSummary, { backgroundColor: colors.card }]}>
            <Text style={[styles.orderSummary, { color: colors.text }]}>Order Summary</Text>

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Total Price</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>₫{totalPrice.toFixed(0)}</Text>
            </View>

            <CustomButton
              title="Proceed to Checkout"
              onPress={() => Alert.alert("Proceeding to Checkout")}
              btnStyle={{ backgroundColor: colors.button }}
              labelStyle={{ color: colors.buttonText }}
            />
          </View>
        </>
      )}
    </View>
  );
};

// Giao diện giỏ hàng trống + Nút chuyển sang trang danh sách sản phẩm
const EmptyState = ({ onBrowseProducts }: { onBrowseProducts: () => void }) => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];

  return (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyState, { color: colors.text }]}>Your Cart is Empty</Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.icon }]}>Go buy some products now</Text>

      <CustomButton
        title="Browse Products"
        onPress={onBrowseProducts}
        btnStyle={{ backgroundColor: colors.primary, marginTop: 20, paddingVertical: 12 }}
        labelStyle={{ color: "#fff", fontSize: 16 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  screenTitle: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  productCard: { flexDirection: "row", padding: 16, borderRadius: 12, marginBottom: 16, elevation: 5 },
  productImage: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  productInfo: { flex: 1 },
  deleteButton: { backgroundColor: "#FF5722", padding: 8, borderRadius: 50 },
  productTitle: { fontSize: 18, fontWeight: "bold" },
  orderSummary: { padding: 16, borderRadius: 12, marginTop: 20 },
  productQuantity: { fontSize: 16, marginTop: 4 },
  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 40 },
  summaryItem: { flexDirection: "row", justifyContent: "space-between", marginVertical: 8 },
  summaryLabel: { fontSize: 16, fontWeight: "bold" },
  emptyStateSubtitle: { fontSize: 16, marginTop: 8 },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center', marginVertical: 10 },
  summaryValue: { fontSize: 16, fontWeight: "bold" },
  productList: { paddingBottom: 20 },
  productPrice: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
});

export default CartScreen;
