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

const PRIMARY_COLOR = "#3498db";      // Xanh dương mới
const SUCCESS_COLOR = "#2ecc71";      // Xanh lá mới
const PENDING_COLOR = "#636e72";      // Vàng cam mới
const PROCESSING_COLOR = "#f39c12"; 
const SHIPPED_COLOR = "#1abc9c";      // Xanh ngọc mới 
const CANCELED_COLOR = "#e74c3c";     // Đỏ mới
const TOTAL_PRICE_COLOR = "#3498db";  // Xanh dương cho giá


const OrderListScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();

  // State initialization with empty array
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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
      case 0: return PENDING_COLOR;      // Pending
      case 1: return PROCESSING_COLOR;   // Processing
      case 2: return SHIPPED_COLOR;      // Shipped
      case 3: return SUCCESS_COLOR;      // Delivered
      case 4: return CANCELED_COLOR;     // Canceled
      default: return colors.textSecondary;
    }
  };
  const getStatusText = (status: number): string => {
    const statusMap: Record<number, string> = {
      0: "Pending",
      1: "Processing",
      2: "Shipped",
      3: "Delivered",
      4: "Canceled"
    };
    return statusMap[status] || "Unknown";
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount || 0);
  };

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

  // Render item - styling giống OrderSuccessScreen
  const renderItem = ({ item }: { item: Order }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity 
        style={[styles.orderItem, { 
          backgroundColor: colors.card,
          borderLeftWidth: 4,
          borderLeftColor: statusColor,
          borderRadius: 12,
        }]}
        onPress={() => router.push({
          pathname: "/screens/orders/order-success",
          params: { orderId: item.id }
        })}
      >
        <View style={styles.orderHeader}>
          <Text style={[styles.orderCode, { color: colors.text }]}>
            {item.orderCode}
          </Text>
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
            <Text style={[styles.statusText, { color: statusColor, fontWeight: 'bold' }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Date
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(item.orderDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Payment
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {item.paymentMethod}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Total
            </Text>
            <Text style={[styles.totalPrice, { color: TOTAL_PRICE_COLOR }]}>
              {formatCurrency(item.totalPrice)}
            </Text>
          </View>
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

  // Debug component to show order count
  const DebugBar = () => (
    <View style={styles.debugBar}>
      <Text style={styles.debugText}>Orders count: {orders.length}</Text>
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
      <DebugBar />
      
      {orders.length > 0 ? (
        <FlatList
          data={orders}
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
  debugBar: {
    padding: 8,
    backgroundColor: '#FFD700',
  },
  debugText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  orderItem: {
    borderRadius: 10,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  orderCode: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {},
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