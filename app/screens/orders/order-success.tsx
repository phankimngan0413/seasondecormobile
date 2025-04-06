import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getOrderByIdAPI } from '@/utils/orderAPI';

const PRIMARY_COLOR = "#5fc1f1";
const SUCCESS_COLOR = "#4CAF50";

const OrderSuccessScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId;

  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    if (!orderId) {
      setError("Order ID not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getOrderByIdAPI(Number(orderId));
      setOrderData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load order details");
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const getStatusText = (status: number) => {
    const statusMap: Record<number, string> = {
      0: "Pending",
      1: "Processing",
      2: "Shipped",
      3: "Delivered",
      4: "Canceled"
    };
    return statusMap[status] || "Unknown";
  };

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.push("/")}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Order Confirmation</Text>
      <View style={styles.spacer} />
    </View>
  );

  const renderSuccessMessage = () => (
    <View style={styles.successContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={50} color="white" />
      </View>
      <Text style={styles.successTitle}>Order Successful!</Text>
      <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
        Your order has been placed successfully. 
        Thank you for your purchase!
      </Text>
      <View style={[styles.orderCodeContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.orderCodeLabel, { color: colors.textSecondary }]}>Order Code:</Text>
        <Text style={[styles.orderCode, { color: colors.text }]}>{orderData?.orderCode}</Text>
      </View>
    </View>
  );

  const renderOrderSummary = () => (
    <View style={[styles.summaryContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
      
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Date</Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>{formatDate(orderData?.orderDate)}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${SUCCESS_COLOR}30` }]}>
          <Text style={[styles.statusText, { color: SUCCESS_COLOR }]}>{getStatusText(orderData?.status)}</Text>
        </View>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Payment Method</Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>{orderData?.paymentMethod}</Text>
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Amount</Text>
        <Text style={[styles.totalPrice, { color: PRIMARY_COLOR }]}>
          {new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
          }).format(orderData?.totalPrice || 0)}
        </Text>
      </View>
    </View>
  );

  const renderProductsList = () => (
    <View style={[styles.productsContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Products</Text>
      
      {orderData?.orderDetails.map((item: any, index: number) => (
        <View key={index} style={[styles.productItem, 
          index < orderData.orderDetails.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
        ]}>
          <Image 
            source={{ uri: item.image || 'https://via.placeholder.com/100' }} 
            style={styles.productImage} 
          />
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: colors.text }]}>{item.productName}</Text>
            <Text style={[styles.productQuantity, { color: colors.textSecondary }]}>Quantity: {item.quantity}</Text>
            <Text style={[styles.productPrice, { color: PRIMARY_COLOR }]}>
              {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(item.unitPrice || 0)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderShippingAddress = () => (
    <View style={[styles.addressContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Shipping Address</Text>
      
      <View style={styles.addressContent}>
        <Text style={[styles.addressName, { color: colors.text }]}>{orderData?.address?.fullName}</Text>
        <Text style={[styles.addressPhone, { color: colors.textSecondary }]}>{orderData?.address?.phone}</Text>
        <Text style={[styles.addressDetails, { color: colors.textSecondary }]}>
          {`${orderData?.address?.detail}, ${orderData?.address?.street}, ${orderData?.address?.ward}, ${orderData?.address?.district}, ${orderData?.address?.province}`}
        </Text>
      </View>
    </View>
  );

  const renderButtons = () => (
    <View style={styles.buttonsContainer}>
      <TouchableOpacity 
        style={[styles.button, styles.primaryButton]} 
        onPress={() => router.push("/product/productlist")}
      >
        <Text style={styles.primaryButtonText}>Continue Shopping</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton, { borderColor: PRIMARY_COLOR }]} 
        onPress={() => router.push("/screens/Orders")}
      >
        <Text style={[styles.secondaryButtonText, { color: PRIMARY_COLOR }]}>View My Orders</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading order details...</Text>
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
            onPress={fetchOrderDetails}
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
      {renderHeader()}
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderSuccessMessage()}
        {renderOrderSummary()}
        {renderProductsList()}
        {renderShippingAddress()}
        {renderButtons()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: StatusBar.currentHeight || 0 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1 
  },
  backButton: { 
    padding: 8 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    flex: 1, 
    textAlign: 'center' 
  },
  spacer: { 
    width: 40 
  },
  
  // Success Message
  successContainer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 30
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SUCCESS_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: SUCCESS_COLOR,
    marginBottom: 10
  },
  successMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20
  },
  orderCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 5
  },
  orderCodeLabel: {
    marginRight: 8,
    fontSize: 14
  },
  orderCode: {
    fontSize: 14,
    fontWeight: '600'
  },
  
  // Summary Section
  summaryContainer: {
    margin: 15,
    padding: 15,
    borderRadius: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  summaryLabel: {
    fontSize: 14
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500'
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  divider: {
    height: 1,
    marginVertical: 12
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  
  // Products Section
  productsContainer: {
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 10
  },
  productItem: {
    flexDirection: 'row',
    paddingVertical: 12
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between'
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5
  },
  productQuantity: {
    fontSize: 12,
    marginBottom: 5
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600'
  },
  
  // Address Section
  addressContainer: {
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 10
  },
  addressContent: {
    marginTop: 5
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 5
  },
  addressPhone: {
    fontSize: 14,
    marginBottom: 8
  },
  addressDetails: {
    fontSize: 14,
    lineHeight: 20
  },
  
  // Buttons Section
  buttonsContainer: {
    margin: 15,
    marginTop: 0,
    marginBottom: 30
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 16
  },
  
  // Loading & Error
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
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  }
});

export default OrderSuccessScreen;