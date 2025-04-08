import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
import { getWalletBalanceAPI } from "@/utils/walletAPI";

interface WalletData {
  walletId: number;
  balance: number;
}

const WalletBalance = () => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
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
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const toggleBalanceVisibility = () => {
    setHideBalance(!hideBalance);
  };

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
          <View style={[styles.balanceRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.balanceText, { color: colors.text }]}>
              {displayBalance()}
            </Text>
            <TouchableOpacity onPress={toggleBalanceVisibility}>
              <Ionicons 
                name={hideBalance ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={16} color="#e74c3c" />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Failed to load wallet data
          </Text>
        </View>
      ) : loading ? (
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading wallet data...
        </Text>
      ) : null}
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
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});

export default WalletBalance;
