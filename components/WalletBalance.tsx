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
import { initApiClient } from "@/config/axiosConfig";
import { useRouter } from "expo-router";

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

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const apiClient = await initApiClient();
        const response = await apiClient.get("/api/wallet/getWalletBalance");
        
        // Check for wallet data in the response
        if (response?.data?.walletId !== undefined && response?.data?.balance !== undefined) {
          setWalletData({
            walletId: response.data.walletId,
            balance: response.data.balance
          });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Wallet error:", err);
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
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Balance</Text>
          <Text style={[styles.balanceText, { color: colors.text }]}>
            {walletData?.balance.toLocaleString()} VND
          </Text>
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
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 22,
    fontWeight: "700",
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
});

export default WalletBalance;