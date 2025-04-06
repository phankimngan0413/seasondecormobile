import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getWalletBalanceAPI } from "@/utils/walletAPI";

// Simple wallet data interface
interface WalletData {
  walletId: number;
  balance: number;
}

const WalletBalance = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  // Set hideBalance to true initially so balance is hidden when first loaded
  const [hideBalance, setHideBalance] = useState<boolean>(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const response = await getWalletBalanceAPI();
        
        if (response.balance !== undefined) {
          setWalletData({
            walletId: 1, // Default value or from response if available
            balance: response.balance
          });
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        console.log("Wallet error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const handleAddFunds = () => {
    router.push("/screens/payment/add-funds");
  };

  const handleViewTransactions = () => {
    router.push("/screens/payment/transactions");
  };

  const toggleBalanceVisibility = () => {
    setHideBalance(!hideBalance);
  };

  // Format the balance or display asterisks when hidden
  const displayBalance = () => {
    if (hideBalance) {
      return "••••••";
    }
    return `${walletData?.balance?.toLocaleString() || 0} VND`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>My Wallet</Text>
        
        {!error && !loading && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddFunds}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Add Funds</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: "rgba(231, 76, 60, 0.05)" }]}>
          <Ionicons name="alert-circle-outline" size={16} color="#e74c3c" />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Failed to load wallet data
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.contentContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading wallet data...
          </Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Balance</Text>
            <TouchableOpacity onPress={toggleBalanceVisibility}>
              <Ionicons 
                name={hideBalance ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.balanceText, { color: colors.text }]}>
            {displayBalance()}
          </Text>
          
          <TouchableOpacity 
            style={[styles.transactionButton, { borderColor: colors.border }]}
            onPress={handleViewTransactions}
          >
            <Ionicons name="list-outline" size={16} color={colors.text} />
            <Text style={[styles.transactionButtonText, { color: colors.text }]}>
              View Transactions
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  contentContainer: {
    paddingVertical: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceText: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  errorContainer: {
    padding: 10,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(231, 76, 60, 0.2)",
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
  loadingText: {
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  transactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  transactionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default WalletBalance;