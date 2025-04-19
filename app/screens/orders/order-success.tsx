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
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getOrderByIdAPI, payOrderWithWalletAPI } from '@/utils/orderAPI';
import { getWalletBalanceAPI } from "@/utils/walletAPI";

const PRIMARY_COLOR = "#3498db";      // Blue
const PENDING_COLOR = "#f39c12";      // Orange
const PAYMENT_COLOR = "#9b59b6";      // Purple
const SHIPPING_COLOR = "#1abc9c";     // Teal
const COMPLETED_COLOR = "#2ecc71";    // Green
const CANCELLED_COLOR = "#e74c3c";    // Red

const OrderSuccessScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId;
  const isPaid = params.paid === "true";

  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [insufficientFunds, setInsufficientFunds] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const response = await getWalletBalanceAPI();
      setWalletBalance(response.balance || 0);
    } catch (err) {
      console.error("Failed to fetch wallet balance", err);
    }
  };

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
      
      // Check if wallet balance is sufficient for the order
      const walletData = await getWalletBalanceAPI();
      setWalletBalance(walletData.balance || 0);
      setInsufficientFunds(walletData.balance < data.totalPrice);
    } catch (err: any) {
      setError(err.message || "Failed to load order details");
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (insufficientFunds) {
      Alert.alert(
        "Insufficient Funds",
        "Your wallet balance is insufficient to complete this payment. Would you like to add funds?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Add Funds",
            onPress: () => router.push({
              pathname: '/screens/payment/add-funds',
              params: { orderId: orderId }
            })
          }
        ]
      );
      return;
    }

    try {
      setPaymentLoading(true);
      await payOrderWithWalletAPI(Number(orderId));
      Alert.alert(
        "Payment Successful",
        "Your order has been paid successfully!",
        [
          {
            text: "OK",
            onPress: () => fetchOrderDetails() // Refresh order details
          }
        ]
      );
    } catch (err: any) {
      Alert.alert("Payment Failed", err.message || "There was a problem processing your payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Updated status mapping to match your requirements
  const getStatusText = (status: number) => {
    const statusMap: Record<number, string> = {
      0: "Pending",          // Pending
      1: "Payment Complete", // Payment completed
      2: "Processing",       // Processing
      3: "Shipping",         // Shipping
      4: "Completed",        // Completed
      5: "Cancelled"         // Cancelled
    };
    return statusMap[status] || "Unknown";
  };

  const getStatusIcon = (status: number) => {
    const iconMap: Record<number, string> = {
      0: "time-outline",              // Pending
      1: "checkmark-circle-outline",  // Payment complete
      2: "construct-outline",         // Processing
      3: "car-outline",               // Shipping
      4: "checkmark-circle-outline",  // Completed
      5: "close-circle-outline"       // Cancelled
    };
    return iconMap[status] || "help-circle-outline";
  };

  const getStatusColor = (status: number) => {
    const statusColorMap: Record<number, string> = {
      0: PENDING_COLOR,      // Pending (Orange)
      1: PAYMENT_COLOR,      // Payment Complete (Purple)
      3: SHIPPING_COLOR,     // Shipping (Teal)
      4: COMPLETED_COLOR,    // Completed (Green)
      5: CANCELLED_COLOR     // Cancelled (Red)
    };
    return statusColorMap[status] || "#8E8E93"; // Gray for unknown
  };

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.push("/")}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Order Details</Text>
      <View style={styles.spacer} />
    </View>
  );

  const renderOrderStatus = () => {
    const status = orderData?.status || 0;
    const statusColor = getStatusColor(status);
    const statusIcon = getStatusIcon(status);
    const statusText = getStatusText(status);
    
    let messageText = "";
    
    switch(status) {
      case 0:
        messageText = "Your order is pending payment.";
        break;
      case 1:
        messageText = "Your payment has been processed successfully. Your order is being prepared.";
        break;
      case 2:
        messageText = "Your order is being processed.";
        break;
      case 3:
        messageText = "Your order is on the way!";
        break;
      case 4:
        messageText = "Your order has been delivered successfully. Thank you for your purchase!";
        break;
      case 5:
        messageText = "This order has been cancelled.";
        break;
      default:
        messageText = "Thank you for your order.";
    }
    
    return (
      <View style={styles.successContainer}>
        <View style={[styles.iconCircle, { backgroundColor: statusColor }]}>
          <Ionicons name={statusIcon} size={40} color="white" />
        </View>
        
        <Text style={[styles.successTitle, { color: statusColor }]}>
          {statusText}
        </Text>
        
        <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
          {messageText}
        </Text>
        
        <View style={[styles.orderCodeContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.orderCodeLabel, { color: colors.textSecondary }]}>Order Code:</Text>
          <Text style={[styles.orderCode, { color: colors.text }]}>{orderData?.orderCode}</Text>
        </View>
      </View>
    );
  };

  const renderOrderProgress = () => {
    const status = orderData?.status || 0;
    
    // Skip rendering for cancelled orders
    if (status === 5) return null;
    
    // Define steps for the progress indicator
    const steps = [
      { label: "Pending", value: 0 },
      { label: "Payment", value: 1 },
      { label: "Shipping", value: 3 }, // Changed to value 3 for shipping
      { label: "Completed", value: 4 }
    ];
    
    return (
      <View style={[styles.progressContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Progress</Text>
        
        <View style={styles.stepperContainer}>
          {steps.map((step, index) => {
            // For completed orders (status 4), all steps should be active
            let isActive = status === 4 ? true : status >= step.value;
            
            const isLast = index === steps.length - 1;
            
            return (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepContent}>
                  <View style={[
                    styles.stepCircle, 
                    { 
                      backgroundColor: isActive ? getStatusColor(step.value) : colors.border,
                      borderColor: isActive ? getStatusColor(step.value) : colors.border
                    }
                  ]}>
                    {isActive && <Ionicons name="checkmark" size={12} color="white" />}
                  </View>
                  <Text style={[
                    styles.stepLabel, 
                    { 
                      color: isActive ? getStatusColor(step.value) : colors.textSecondary,
                      fontWeight: isActive ? '600' : 'normal'
                    }
                  ]}>
                    {step.label}
                  </Text>
                </View>
                
                {!isLast && (
                  <View style={[
                    styles.stepperLine, 
                    { backgroundColor: isActive && status === 4 ? getStatusColor(step.value) : 
                                       status > step.value ? getStatusColor(step.value) : colors.border }
                  ]} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderOrderSummary = () => (
    <View style={[styles.summaryContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
      
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Date</Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>{formatDate(orderData?.orderDate)}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Status</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: `${getStatusColor(orderData?.status)}20` }
        ]}>
          <Ionicons 
            name={getStatusIcon(orderData?.status)} 
            size={14} 
            color={getStatusColor(orderData?.status)} 
            style={styles.statusIcon} 
          />
          <Text style={[
            styles.statusText, 
            { color: getStatusColor(orderData?.status) }
          ]}>
            {getStatusText(orderData?.status)}
          </Text>
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

      {/* Only show payment section if status is 0 (Pending) */}
      {orderData?.status === 0 && (
        <View style={styles.paymentStatusContainer}>
          <View style={styles.walletBalanceRow}>
            <Text style={[styles.walletBalanceLabel, { color: colors.textSecondary }]}>
              Wallet Balance:
            </Text>
            <Text style={[
              styles.walletBalanceValue, 
              { color: insufficientFunds ? CANCELLED_COLOR : COMPLETED_COLOR }
            ]}>
              {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(walletBalance || 0)}
            </Text>
          </View>
          
          {insufficientFunds && (
            <Text style={[styles.insufficientFundsText, { color: CANCELLED_COLOR }]}>
              Insufficient balance. Please add funds to your wallet.
            </Text>
          )}
          
          <TouchableOpacity
            style={[
              styles.payNowButton,
              { backgroundColor: insufficientFunds ? CANCELLED_COLOR : PAYMENT_COLOR },
              paymentLoading && { opacity: 0.7 }
            ]}
            onPress={handlePayNow}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.payNowButtonText}>
                {insufficientFunds ? "Add Funds" : "Pay Now"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderActionButtons = () => {
    const status = orderData?.status || 0;
    
    // Different actions based on status
    return (
      <View style={styles.actionButtonsContainer}>
        {status === 0 && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: CANCELLED_COLOR }]}
            onPress={() => Alert.alert(
              "Cancel Order",
              "Are you sure you want to cancel this order?",
              [
                { text: "No", style: "cancel" },
                { text: "Yes", onPress: () => console.log("Cancel order", orderId) }
              ]
            )}
          >
            <Ionicons name="close-circle-outline" size={18} color="white" style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
        
        {status === 3 && (
          <TouchableOpacity 
            // style={[styles.actionButton, { backgroundColor: SHIPPING_COLOR }]}
            // onPress={() => router.push({
            //   pathname: "/screens/orders/track-order",
            //   params: { orderId: orderId }
            // })}
          >
            {/* <Ionicons name="location-outline" size={18} color="white" style={styles.actionButtonIcon} /> */}
            {/* <Text style={styles.actionButtonText}>Track Shipment</Text> */}
          </TouchableOpacity>
        )}
        
        {status === 4 && (
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]}
          onPress={() => router.push({
            pathname: "/screens/review/product-review",
            params: { 
              orderId: orderId,
              productId: orderData?.orderDetails[0]?.productId // Passing the first product by default
            }
          })}
        >
          <Ionicons name="star-outline" size={18} color="white" style={styles.actionButtonIcon} />
          <Text style={styles.actionButtonText}>Write a Review</Text>
        </TouchableOpacity>
      )}
      </View>
    );
  };

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
        style={[styles.button, styles.primaryButton, { backgroundColor: PRIMARY_COLOR }]} 
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
        {renderOrderStatus()}
        {renderOrderProgress()}
        {renderOrderSummary()}
        {renderActionButtons()}
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
  
  // Status Message
  successContainer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 25
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
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
    marginTop: 5,
    width: '100%',
    justifyContent: 'center'
  },
  orderCodeLabel: {
    marginRight: 8,
    fontSize: 14
  },
  orderCode: {
    fontSize: 14,
    fontWeight: '600'
  },

  // Progress Stepper
  progressContainer: {
    margin: 15,
    padding: 15,
    borderRadius: 10
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  stepItem: {
    flex: 1,
    alignItems: 'center'
  },
  stepContent: {
    alignItems: 'center'
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 8
  },
  stepLabel: {
    fontSize: 11,
    textAlign: 'center'
  },
  stepperLine: {
    position: 'absolute',
    top: 12,
    right: '50%',
    left: '50%',
    height: 2
  },
  
  // Summary Section
  summaryContainer: {
    margin: 15,
    marginTop: 0,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  statusIcon: {
    marginRight: 4
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 10
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    margin: 5,
    flex: 1,
  },
  actionButtonIcon: {
    marginRight: 6
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600'
  },
  
  // Payment Section
  paymentStatusContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  walletBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  walletBalanceLabel: {
    fontSize: 14
  },
  walletBalanceValue: {
    fontSize: 14,
    fontWeight: '600'
  },
  insufficientFundsText: {
    fontSize: 12,
    marginBottom: 10
  },
  payNowButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5
  },
  payNowButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
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