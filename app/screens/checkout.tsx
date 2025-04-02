import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAddressesAPI } from '@/utils/addressAPI';
import { getCartAPI } from '@/utils/cartAPI';
import { getUserIdFromToken } from '@/services/auth';
import { IProduct } from '@/utils/productAPI';
import { IAddress } from '@/utils/addressAPI';

const PRIMARY_COLOR = "#5fc1f1";

const CheckoutScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();
  const params = useLocalSearchParams();

  const [address, setAddress] = useState<IAddress | null>(null);
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (params.selectedAddressId) {
        const selectedAddress = addresses.find(
            addr => addr.id.toString() === params.selectedAddressId
          );
      
      if (selectedAddress) {
        setAddress(selectedAddress);
      }
    }
  }, [params.selectedAddressId, addresses]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = await getUserIdFromToken();
      if (!userId) {
        setError("Please log in to checkout");
        setLoading(false);
        return;
      }

      const addressData = await getAddressesAPI();
      const validAddresses = Array.isArray(addressData) ? addressData : [];
      setAddresses(validAddresses);

      const defaultAddress = validAddresses.find(addr => addr.isDefault);
      setAddress(defaultAddress || validAddresses[0]);

      const cartData = await getCartAPI(userId);
      if (cartData?.cartItems && cartData.cartItems.length > 0) {
        setProducts(cartData.cartItems);
      } else {
        setError("Your cart is empty");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load checkout information");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = () => {
    router.push({
      pathname: "/screens/address/address-list",
      params: { fromCheckout: "true", currentAddressId: address?.id || "" }
    });
  };

  const subtotal = products.reduce((sum, product) => sum + (product.unitPrice * product.quantity), 0);
  const total = subtotal;

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
      <View style={styles.spacer} />
    </View>
  );

  const renderAddressSection = () => {
    if (!address) {
      return (
        <TouchableOpacity 
          style={[styles.addressContainer, { backgroundColor: colors.card }]} 
          onPress={handleSelectAddress}
        >
          <View style={styles.addressIconContainer}>
            <Ionicons name="location" size={24} color={PRIMARY_COLOR} />
          </View>
          <Text style={[styles.noAddressText, { color: colors.text }]}>Add Shipping Address</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    const fullAddress = `${address.detail}, ${address.street}, ${address.ward}, ${address.district}, ${address.province}`;
    return (
      <TouchableOpacity 
        style={[styles.addressContainer, { backgroundColor: colors.card }]} 
        onPress={handleSelectAddress}
      >
        <View style={styles.addressIconContainer}>
          <Ionicons name="location" size={24} color={PRIMARY_COLOR} />
        </View>
        <View style={styles.addressDetails}>
          <Text style={[styles.addressName, { color: colors.text }]}>{address.fullName}</Text>
          <Text style={[styles.addressPhone, { color: colors.textSecondary }]}>{address.phone}</Text>
          <Text style={[styles.addressFull, { color: colors.textSecondary }]}>{fullAddress}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderProductSection = () => (
    <View style={[styles.productSection, { backgroundColor: colors.card }]}>
      {products.map((product, index) => (
        <View key={index} style={[styles.productItem, { borderBottomColor: colors.border }]}>
          <Image source={{ uri: product.image || 'https://via.placeholder.com/100' }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: colors.text }]}>{product.productName}</Text>
            <Text style={[styles.productPrice, { color: PRIMARY_COLOR }]}>${product.unitPrice.toLocaleString()}</Text>
            <Text style={[styles.productQuantity, { color: colors.textSecondary }]}>x{product.quantity}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderPriceBreakdown = () => (
    <View style={[styles.priceBreakdownSection, { backgroundColor: colors.card }]}>
      <View style={styles.priceRow}>
        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Subtotal</Text>
        <Text style={[styles.priceValue, { color: colors.text }]}>${subtotal.toLocaleString()}</Text>
      </View>
      <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.totalLabel, { color: colors.text }]}>Total Payment</Text>
        <Text style={[styles.totalValue, { color: PRIMARY_COLOR }]}>${total.toLocaleString()}</Text>
      </View>
    </View>
  );

  const handlePlaceOrder = () => {
    console.log('Order placed!', {
      address,
      products,
      total
    });
  };

  const renderCheckoutButton = () => (
    <TouchableOpacity 
      style={[
        styles.checkoutButton, 
        { backgroundColor: PRIMARY_COLOR },
        (!address || products.length === 0) && styles.disabledButton
      ]}
      disabled={!address || products.length === 0}
      onPress={handlePlaceOrder}
    >
      <Text style={styles.checkoutButtonText}>Place Order</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading checkout information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={PRIMARY_COLOR} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: PRIMARY_COLOR }]} 
            onPress={fetchData}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <View style={styles.scrollContent}>
        {renderHeader()}
        {renderAddressSection()}
        {renderProductSection()}
        {renderPriceBreakdown()}
      </View>
      {renderCheckoutButton()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: StatusBar.currentHeight || 0 
  },
  scrollContent: { 
    flex: 1,
    paddingBottom: 60 // Space for checkout button
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1 
  },
  backButton: { padding: 8 },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    flex: 1, 
    textAlign: 'center' 
  },
  spacer: { width: 40 },
  addressContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  addressIconContainer: { marginRight: 15 },
  addressDetails: { flex: 1 },
  addressName: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 5 
  },
  addressPhone: { fontSize: 14 },
  addressFull: { fontSize: 14 },
  noAddressText: { 
    fontSize: 16, 
    fontWeight: '500' 
  },
  productSection: { marginTop: 10 },
  productItem: { 
    flexDirection: 'row', 
    padding: 15, 
    borderBottomWidth: 1 
  },
  productImage: { 
    width: 80, 
    height: 80, 
    marginRight: 15, 
    borderRadius: 4 
  },
  productInfo: { flex: 1 },
  productName: { 
    fontSize: 14, 
    marginBottom: 10 
  },
  productPrice: { 
    color: '#5fc1f1' 
  },
  productQuantity: { 
    fontSize: 12 
  },
  priceBreakdownSection: { 
    marginTop: 10, 
    padding: 15 
  },
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10 
  },
  priceLabel: { 
    fontSize: 14 
  },
  priceValue: { 
    fontWeight: '500', 
    fontSize: 14 
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    paddingTop: 10 
  },
  totalLabel: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  totalValue: { 
    fontSize: 16, 
    color: '#5fc1f1', 
    fontWeight: '600' 
  },
  checkoutButton: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#5fc1f1', 
    padding: 15, 
    alignItems: 'center' 
  },
  disabledButton: { 
    backgroundColor: '#cccccc' 
  },
  checkoutButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  loadingText: { 
    marginTop: 15, 
    fontSize: 16, 
    textAlign: 'center' 
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  errorText: { 
    color: '#666', 
    fontSize: 16, 
    textAlign: 'center', 
    marginTop: 15, 
    marginBottom: 20 
  },
  retryButton: { 
    backgroundColor: '#5fc1f1', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 5 
  },
  retryButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '500' 
  },
});

export default CheckoutScreen;