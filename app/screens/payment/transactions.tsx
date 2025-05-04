import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getTransactionsDetailsAPI, ITransaction } from "@/utils/walletAPI";

const TransactionsScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Fetch transaction data
  const fetchTransactions = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      
      const response = await getTransactionsDetailsAPI();
      
      // Check if the response was successful
      if (response && response.success) {
        // Even if transactions array is empty, we consider this a success
        setTransactions(response.transactions || []);
        setError(false);
      } else {
        console.log("API error:", response);
        setError(true);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when screen opens
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions(true);
  };

  // Format date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'failed': return '#e74c3c';
      default: return colors.textSecondary;
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Processing';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  // Render a transaction
  const renderItem = ({ item }: { item: ITransaction }) => (
    <View style={[styles.itemContainer, { backgroundColor: colors.card }]}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={item.type === 'credit' ? "arrow-down" : "arrow-up"}
          size={16} 
          color={item.type === 'credit' ? "#27ae60" : "#e74c3c"} 
        />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={[styles.amount, { 
            color: item.type === 'credit' ? '#27ae60' : '#e74c3c' 
          }]}>
            {item.type === 'credit' ? '+' : '-'} {item.amount.toLocaleString()} VND
          </Text>
        </View>
        
        <View style={styles.bottomRow}>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDate(item.timestamp)}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.status, { color: colors.textSecondary }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Display when list is empty
  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Loading transactions...
          </Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#e74c3c" />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Cannot load transaction history
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => fetchTransactions()}
          >
            <Text style={styles.actionButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // This case is when API succeeded but no transactions exist
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="wallet-outline" size={40} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          You don't have any transactions yet
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/screens/payment/add-funds')} // Navigate to your add transaction screen
        >
          <Text style={styles.actionButtonText}>Add Transaction</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transaction History</Text>
        <View style={styles.placeholder} />
      </View>
      
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.transactionId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 30,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  status: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    flex: 1,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TransactionsScreen;