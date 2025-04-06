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

const PRIMARY_COLOR = "#5fc1f1";
const SUCCESS_COLOR = "#4CAF50";
const PENDING_COLOR = "#FFA500";
const CANCELED_COLOR = "#FF5252";

const OrderListScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();

  // Sử dụng dữ liệu mẫu trực tiếp từ log
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Trường hợp API không hoạt động, sử dụng dữ liệu mẫu
      const sampleData: Order[] = [
        {"accountId": 2, "addressId": 2, "id": 1, "orderCode": "ODR-638793545813777039", "orderDate": "2025-04-04T16:09:41.3779177", "orderDetails": [], "paymentMethod": "Wallet Transaction", "status": 0, "totalPrice": 560000000},
        {"accountId": 10, "addressId": 2, "id": 2, "orderCode": "ODR-638793568825051814", "orderDate": "2025-04-04T16:48:02.5055079", "orderDetails": [], "paymentMethod": "Wallet Transaction", "status": 0, "totalPrice": 0},
        {"accountId": 2, "addressId": 2, "id": 3, "orderCode": "ODR-638793580958889976", "orderDate": "2025-04-04T17:08:15.8889997", "orderDetails": [], "paymentMethod": "Wallet Transaction", "status": 0, "totalPrice": 420000},
        {"accountId": 2, "addressId": 3, "id": 4, "orderCode": "ODR-638793591663641931", "orderDate": "2025-04-04T17:26:06.3641951", "orderDetails": [], "paymentMethod": "Wallet Transaction", "status": 0, "totalPrice": 120000}
      ];
      
      setOrders(sampleData);
      console.log("Orders set:", sampleData);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: number): string => {
    switch (status) {
      case 0: return PENDING_COLOR;   // Pending
      case 1: return PENDING_COLOR;   // Processing
      case 2: return PRIMARY_COLOR;   // Shipped
      case 3: return SUCCESS_COLOR;   // Delivered
      case 4: return CANCELED_COLOR;  // Canceled
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

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusColor = getStatusColor(item.status);
    const formattedDate = new Date(item.orderDate).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <TouchableOpacity 
        style={[styles.orderItem, { backgroundColor: colors.card }]}
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
                backgroundColor: `${statusColor}30`, 
                borderColor: statusColor 
              }
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
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
              {formattedDate}
            </Text>
          </View>
          
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
              Total
            </Text>
            <Text style={[styles.totalPrice, { color: PRIMARY_COLOR }]}>
              {formatCurrency(item.totalPrice)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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

  const renderEmptyList = () => (
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

  console.log("Rendering with", orders.length, "orders");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      {renderHeader()}
      
      <Text style={styles.debugText}>Orders count: {orders.length}</Text>
      
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={fetchOrders}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyList()
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
  debugText: {
    padding: 10,
    backgroundColor: '#FFD700',
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
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
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
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