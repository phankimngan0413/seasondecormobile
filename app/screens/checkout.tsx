import React, { useEffect, useState, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getAddressesAPI } from '@/utils/AddressAPI';
import { getCartAPI } from '@/utils/cartAPI';
import { getUserIdFromToken } from '@/services/auth';
import { IProduct } from '@/utils/productAPI';
import { IAddress } from '@/utils/AddressAPI';
import { createOrderAPI, payOrderWithWalletAPI } from '@/utils/orderAPI';
import { getWalletBalanceAPI } from "@/utils/walletAPI";

const PRIMARY_COLOR = "#5fc1f1";

// Define custom global interface for TypeScript
interface CustomGlobal {
  addressSelection?: {
    id: string;
    details: IAddress;
    timestamp: string;
    fullName: string;
    phone: string;
    formattedAddress: string;
  };
  selectedAddressId?: string;
  selectedAddressDetails?: IAddress;
  addressTimestamp?: string;
}

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
  const [orderLoading, setOrderLoading] = useState(false);
  const [cartId, setCartId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  // Add state to track if we need to refresh
  const [lastAddressTimestamp, setLastAddressTimestamp] = useState<string>("");

  // Load initial data
  useEffect(() => {
    fetchData();
  }, []);

  // Check for address updates when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("CheckoutScreen focused - checking for address updates");
      
      // Safely access global state
      const globalData = globalThis as unknown as CustomGlobal;
      
      // Check if there's a new address selection
      if (globalData.addressTimestamp && globalData.addressTimestamp !== lastAddressTimestamp) {
        console.log("Detected new address selection with timestamp:", globalData.addressTimestamp);
        
        // Update timestamp to prevent duplicate processing
        setLastAddressTimestamp(globalData.addressTimestamp);
        
        // Handle the selected address
        handleGlobalAddressUpdate(globalData);
      }
      
      return () => {
        // Clean up if needed
      };
    }, [lastAddressTimestamp])
  );

  // Function to handle address updates from global state
  const handleGlobalAddressUpdate = (globalData: CustomGlobal) => {
    // Check if we have detailed address info in the newer format
    if (globalData.addressSelection && globalData.addressSelection.details) {
      console.log("Using addressSelection.details from global state");
      setAddress(globalData.addressSelection.details);
    } 
    // Fallback to older format
    else if (globalData.selectedAddressDetails) {
      console.log("Using selectedAddressDetails from global state");
      setAddress(globalData.selectedAddressDetails);
    } 
    // If we only have an ID, find the address in our loaded addresses
    else if (globalData.selectedAddressId) {
      console.log("Looking up address by ID from global state:", globalData.selectedAddressId);
      const selectedAddress = addresses.find(addr => addr.id === globalData.selectedAddressId);
      if (selectedAddress) {
        setAddress(selectedAddress);
      } else {
        // If we can't find it in our current list, refresh all addresses
        refreshAddresses(globalData.selectedAddressId);
      }
    }
  };

  // Function to refresh addresses and select by ID
  const refreshAddresses = async (addressIdToSelect?: string) => {
    try {
      console.log("Refreshing addresses list");
      const addressData = await getAddressesAPI();
      const validAddresses = Array.isArray(addressData) ? addressData : [];
      setAddresses(validAddresses);

      if (addressIdToSelect) {
        const selectedAddress = validAddresses.find(addr => addr.id === addressIdToSelect);
        if (selectedAddress) {
          console.log("Found and selected address by ID:", addressIdToSelect);
          setAddress(selectedAddress);
        }
      }
    } catch (err) {
      console.error("Error refreshing addresses:", err);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      setWalletLoading(true);
      const response = await getWalletBalanceAPI();
      setWalletBalance(response.balance || 0);
    } catch (err) {
      console.error("Failed to fetch wallet balance", err);
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  };

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

      setUserId(userId);

      // Fetch wallet balance
      await fetchWalletBalance();

      const addressData = await getAddressesAPI();
      const validAddresses = Array.isArray(addressData) ? addressData : [];
      setAddresses(validAddresses);

      // Check if there's a selected address in global state first
      const globalData = globalThis as unknown as CustomGlobal;
      
      if (globalData.selectedAddressId || 
          (globalData.addressSelection && globalData.addressSelection.id)) {
        // Use the handleGlobalAddressUpdate function to set the address
        handleGlobalAddressUpdate(globalData);
      } else {
        // Fall back to default address selection
        const defaultAddress = validAddresses.find(addr => addr.isDefault);
        setAddress(defaultAddress || validAddresses[0] || null);
      }

      const cartData = await getCartAPI(userId);
      if (cartData?.cartItems && cartData.cartItems.length > 0) {
        setProducts(cartData.cartItems);
        setCartId(cartData.id);
        
        // Log the products for debugging
        console.log("Cart items for checkout:", cartData.cartItems);
      } else {
        setError("Your cart is empty");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load checkout information");
    } finally {
      setLoading(false);
    }
  };

  const renderWalletBalance = () => {
    if (walletLoading) {
      return null;
    }

    return (
      <TouchableOpacity 
        style={[styles.walletBalanceContainer, { 
          backgroundColor: colors.card,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 15,
          borderRadius: 10,
          marginHorizontal: 15,
          marginTop: 10
        }]}
        onPress={() => router.push('/screens/payment/transactions')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons 
            name="wallet" 
            size={24} 
            color={PRIMARY_COLOR} 
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.walletBalanceText, { color: colors.text }]}>
            Wallet Balance
          </Text>
        </View>
        <Text style={[
          styles.walletBalanceAmount, 
          { color: insufficientFunds ? '#FF3B30' : PRIMARY_COLOR }
        ]}>
          {walletBalance.toLocaleString()} VND
        </Text>
      </TouchableOpacity>
    );
  };

  const renderInsufficientFundsWarning = () => {
    if (!insufficientFunds || walletLoading) {
      return null;
    }

    return (
      <View style={styles.warningContainer}>
        <Ionicons name="alert-circle" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
        <Text style={styles.warningText}>
          Insufficient funds. Please add money to your wallet.
        </Text>
        <TouchableOpacity 
          style={styles.topUpButton}
          onPress={() => router.push('/screens/payment/add-funds')}
        >
          <Text style={styles.topUpButtonText}>Add Fund</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSelectAddress = () => {
    router.push({
      pathname: "/screens/address/address-list",
      params: { fromCheckout: "true", currentAddressId: address?.id || "" }
    });
  };

  // Fix: Calculate subtotal directly from unitPrice without multiplying by quantity again
  const subtotal = products.reduce((sum, product) => sum + product.unitPrice, 0);
  const total = subtotal;

  // Check if wallet balance is sufficient
  useEffect(() => {
    if (!walletLoading) {
      setInsufficientFunds(walletBalance < total);
    }
  }, [walletBalance, total, walletLoading]);

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
        testID="selected-address-container"
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
            <Text style={[styles.productPrice, { color: PRIMARY_COLOR }]}>
              {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(product.unitPrice)}
            </Text>
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
        <Text style={[styles.priceValue, { color: colors.text }]}>
          {new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
          }).format(subtotal)}
        </Text>
      </View>
      <View style={[styles.totalRow, { borderTopColor: colors.border }]} >
        <Text style={[styles.totalLabel, { color: colors.text }]}>Total Payment</Text>
        <Text style={[styles.totalValue, { color: PRIMARY_COLOR }]}>
          {new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
          }).format(total)}
        </Text>
      </View>
    </View>
  );

  const handlePlaceOrder = async () => {
    if (!address) {
      Alert.alert("Missing Address", "Please select a shipping address");
      return;
    }

    if (!cartId) {
      Alert.alert("Cart Error", "There was an issue with your cart. Please try again.");
      return;
    }

    if (insufficientFunds) {
      Alert.alert(
        "Insufficient Funds", 
        "Your wallet balance is insufficient to complete this order. Would you like to add funds?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Add Funds",
            onPress: () => router.push('/screens/payment/add-funds')
          }
        ]
      );
      return;
    }

    try {
      setOrderLoading(true);
      
      const orderDetails = {
        total: total,
        paymentMethod: "Wallet",
        note: ""
      };

      // Step 1: Create the order
      const orderResult = await createOrderAPI(cartId, Number(address.id), orderDetails);
      
      try {
        // Step 2: Process payment immediately
        await payOrderWithWalletAPI(orderResult.id);
        
        // Step 3: Navigate to success page
        router.replace({
          pathname: "/screens/orders/order-success",
          params: { 
            orderId: orderResult.id, 
            total: total,
            paid: "true"
          }
        });
      } catch (paymentError: any) {
        // If payment fails, show specific error but don't delete the order
        Alert.alert(
          "Payment Failed", 
          paymentError.message || "There was a problem processing your payment.",
          [
            {
              text: "Try Again Later",
              style: "cancel"
            },
            {
              text: "Add Funds",
              onPress: () => router.push({
                pathname: '/screens/payment/add-funds',
                params: { orderId: orderResult.id }
              })
            }
          ]
        );
      }
      
    } catch (err: any) {
      Alert.alert("Order Failed", err.message || "There was a problem creating your order. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  const renderCheckoutButton = () => (
    <TouchableOpacity 
      style={[
        styles.checkoutButton, 
        { backgroundColor: insufficientFunds ? '#FF3B30' : PRIMARY_COLOR },
        (orderLoading || !address || products.length === 0) && styles.disabledButton
      ]}
      disabled={orderLoading || !address || products.length === 0}
      onPress={handlePlaceOrder}
    >
      {orderLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.checkoutButtonText}>
          {insufficientFunds ? "Add Funds to Place Order" : "Place Order & Pay Now"}
        </Text>
      )}
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
      <ScrollView style={styles.scrollContent}>
        {renderHeader()}
        {renderAddressSection()}
        {renderProductSection()}
        {renderPriceBreakdown()}
        {renderWalletBalance()}
        {renderInsufficientFundsWarning()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  },
  bottomSpacing: {
    height: 80, // Space for checkout button
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
    alignItems: 'center',
    height: 60,
    justifyContent: 'center'
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
  walletBalanceContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.62,
    elevation: 3,
  },
  walletBalanceText: {
    fontSize: 16,
    fontWeight: '500',
  },
  walletBalanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    marginHorizontal: 15,
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  warningText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 14,
  },
  topUpButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  topUpButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
});

export default CheckoutScreen;