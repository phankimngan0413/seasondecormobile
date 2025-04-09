import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter } from 'expo-router';
import { getOrderListAPI } from '@/utils/orderAPI';

// Define Order interface
interface Order {
  id: number;
  orderCode: string;
  paymentMethod: string;
  orderDate: string;
  totalPrice: number;
  status: number;
  accountId: number;
  addressId: number;
  orderDetails: any[];
}

const PRIMARY_COLOR = "#3498db";      // Blue
const PENDING_COLOR = "#f39c12";      // Orange
const PAYMENT_COLOR = "#9b59b6";      // Purple
const PROCESSING_COLOR = "#3498db";   // Blue
const SHIPPING_COLOR = "#1abc9c";     // Teal
const COMPLETED_COLOR = "#2ecc71";    // Green
const CANCELLED_COLOR = "#e74c3c";    // Red
const TOTAL_PRICE_COLOR = "#3498db";  // Blue for price

const OrderListScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();

  // State initialization with empty array
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);

  // Status filter options
  const statusFilters = [
    { label: "All", value: null },
    { label: "Pending", value: 0 },
    { label: "Payment", value: 1 },
    { label: "Processing", value: 2 },
    { label: "Shipping", value: 3 },
    { label: "Completed", value: 4 },
    { label: "Cancelled", value: 5 }
  ];

  // Fetch orders on mount
  useEffect(() => {
    console.log("Component mounted, fetching orders");
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log("Fetching orders...");
      
      // Gọi API
      const response = await getOrderListAPI();
      console.log("API response received");
      
      // Xử lý dữ liệu từ API - kiểm tra cấu trúc response
      if (response) {
        // Trường hợp 1: API trả về mảng trực tiếp (như log hiện tại)
        if (Array.isArray(response)) {
          console.log(`Found ${response.length} orders from API (array)`);
          setOrders(response);
        } 
        // Trường hợp 2: API trả về cấu trúc {success, message, errors, data}
        else if (response.success === true && Array.isArray(response.data)) {
          console.log(`Found ${response.data.length} orders from API (object)`);
          setOrders(response.data);
        }
        // Trường hợp không xác định được cấu trúc
        else {
          console.log("Unknown response structure:", response);
          setError("Invalid response format");
        }
      } else {
        setError("No response from server");
      }
    } catch (err: any) {
      console.error("Error in fetchOrders:", err);
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: number): string => {
    switch (status) {
      case 0: return PENDING_COLOR;     // Pending
      case 1: return PAYMENT_COLOR;     // OrderPayment
      case 2: return PROCESSING_COLOR;  // Processing
      case 3: return SHIPPING_COLOR;    // Shipping
      case 4: return COMPLETED_COLOR;   // Completed
      case 5: return CANCELLED_COLOR;   // Cancelled
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status: number): string => {
    const statusMap: Record<number, string> = {
      0: "Pending",
      1: "Awaiting Payment",
      2: "Processing",
      3: "Shipping",
      4: "Completed",
      5: "Cancelled"
    };
    return statusMap[status] || "Unknown";
  };

  const getStatusIcon = (status: number): string => {
    const iconMap: Record<number, string> = {
      0: "time-outline",           // Pending
      1: "card-outline",           // Awaiting Payment
      2: "construct-outline",      // Processing
      3: "car-outline",            // Shipping
      4: "checkmark-circle-outline", // Completed
      5: "close-circle-outline"    // Cancelled
    };
    return iconMap[status] || "help-circle-outline";
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount || 0);
  };

  const filteredOrders = selectedStatus !== null
    ? orders.filter(order => order.status === selectedStatus)
    : orders;

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        My Orders
      </Text>
      
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={() => {
          setRefreshing(true);
          fetchOrders();
        }}
        disabled={loading}
      >
        <Ionicons 
          name="refresh" 
          size={24} 
          color={loading ? colors.border : colors.text} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderStatusFilters = () => (
    <View style={styles.filtersContainer}>
      <FlatList
        horizontal
        data={statusFilters}
        keyExtractor={(item) => item.label}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedStatus === item.value && { 
                backgroundColor: item.value !== null 
                  ? getStatusColor(item.value) 
                  : PRIMARY_COLOR 
              }
            ]}
            onPress={() => setSelectedStatus(item.value)}
          >
            <Text 
              style={[
                styles.filterText, 
                selectedStatus === item.value && styles.activeFilterText
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filtersContentContainer}
      />
    </View>
  );

  // Render item with updated styling
  const renderItem = ({ item }: { item: Order }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    
    return (
      <TouchableOpacity 
        style={[styles.orderItem, { 
          backgroundColor: colors.card,
          borderLeftWidth: 4,
          borderLeftColor: statusColor,
        }]}
        onPress={() => router.push({
          pathname: "/screens/orders/order-success",
          params: { orderId: item.id }
        })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderCodeContainer}>
            <Text style={[styles.orderCode, { color: colors.text }]}>
              {item.orderCode}
            </Text>
            <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
              {new Date(item.orderDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View 
            style={[
              styles.statusBadge, 
              { 
                backgroundColor: `${statusColor}20`,
                borderWidth: 1,
                borderColor: `${statusColor}50` 
              }
            ]}
          >
            <Ionicons name={statusIcon} size={14} color={statusColor} style={styles.statusIcon} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Payment Method
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {item.paymentMethod}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalPrice, { color: TOTAL_PRICE_COLOR }]}>
              {formatCurrency(item.totalPrice)}
            </Text>
          </View>
        </View>
        
        <View style={styles.orderFooter}>
          {/* Action buttons based on status */}
          {item.status === 0 && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: PAYMENT_COLOR }]}>
              <Text style={styles.actionButtonText}>Pay Now</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 1 && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: PAYMENT_COLOR }]}>
              <Text style={styles.actionButtonText}>Complete Payment</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 3 && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: COMPLETED_COLOR }]}>
              <Text style={styles.actionButtonText}>Track Order</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 4 && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]}>
              <Text style={styles.actionButtonText}>Buy Again</Text>
            </TouchableOpacity>
          )}
          
          {/* Cancel button for orders that can be cancelled */}
          {(item.status === 0 || item.status === 1 || item.status === 2) && (
            <TouchableOpacity style={[styles.cancelButton, { borderColor: CANCELLED_COLOR }]}>
              <Text style={[styles.cancelButtonText, { color: CANCELLED_COLOR }]}>Cancel</Text>
            </TouchableOpacity>
          )}
          
          {/* View details button for all orders */}
          <TouchableOpacity style={[styles.detailsButton, { borderColor: PRIMARY_COLOR }]}>
            <Text style={[styles.detailsButtonText, { color: PRIMARY_COLOR }]}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="document-text-outline" 
        size={80} 
        color={colors.border} 
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Orders
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        You haven't placed any orders yet
      </Text>
      <TouchableOpacity
        style={[styles.shopButton, { backgroundColor: PRIMARY_COLOR }]}
        onPress={() => router.push("/product/productlist")}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading orders...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      {renderHeader()}
      {renderStatusFilters()}
      
      {filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={fetchOrders}
        />
      ) : (
        renderEmpty()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginTop: StatusBar.currentHeight,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersContentContainer: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  orderItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderCodeContainer: {
    flex: 1,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 12,
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  orderFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default OrderListScreen;