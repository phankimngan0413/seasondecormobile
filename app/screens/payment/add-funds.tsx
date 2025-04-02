import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Clipboard,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
import { topUpWalletAPI } from "@/utils/paymentAPI";
import { Linking } from "react-native";

// Predefined amounts
const PREDEFINED_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000];

const AddFundsScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  const [amount, setAmount] = useState<string>("");
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handlePredefinedAmount = (value: number) => {
    setAmount(value.toString());
    setIsCustomAmount(false);
  };

  
  const handleCustomAmount = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    setAmount(numericValue);
    setIsCustomAmount(true);
  };
  const handleAddFunds = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
  
      const response = await topUpWalletAPI(parseInt(amount));
  
      // Kiểm tra và xử lý URL thanh toán
      const paymentUrl = 
  typeof response === 'string' 
    ? response 
    : (response?.message || '');
      if (paymentUrl) {
        try {
          const canOpenUrl = await Linking.canOpenURL(paymentUrl);
          if (canOpenUrl) {
            await Linking.openURL(paymentUrl);
          } else {
            // Fallback nếu không thể mở URL
            Alert.alert(
              "Payment Required",
              "Unable to open payment URL automatically. Please copy the link.",
              [
                {
                  text: "Copy URL",
                  onPress: () => Clipboard.setString(paymentUrl)
                },
                { text: "OK" }
              ]
            );
          }
        } catch (urlError) {
          console.error("Failed to open payment URL:", urlError);
          Alert.alert(
            "Payment Error",
            "Could not open payment URL. Please try again."
          );
        }
      } else {
        // Trường hợp không có URL (thanh toán trực tiếp)
        Alert.alert(
          "Success", 
          `Added ${parseInt(amount).toLocaleString()} VND to your wallet!`
        );
      }
    } catch (err: any) {
      console.error("Error adding funds:", err);
      setError(err?.message || "Error processing payment");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    if (!value) return "";
    return parseInt(value).toLocaleString() + " VND";
  };
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      
      // Example deep link handling
      if (url.includes('/payment/success')) {
        // Handle successful payment
        Alert.alert(
          "Payment Successful", 
          "Funds have been added to your wallet."
        );
      } else if (url.includes('/payment/failure')) {
        // Handle payment failure
        Alert.alert(
          "Payment Failed", 
          "There was an issue processing your payment."
        );
      }
    };
  
    const subscription = Linking.addEventListener('url', handleDeepLink);
  
    // Initial deep link check
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });
  
    return () => {
      subscription.remove();
    };
  }, []);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Add Funds
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Body */}
        <View style={styles.content}>
          {/* Current selected amount */}
          <View
            style={[styles.amountContainer, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
              Amount to Add
            </Text>
            <Text style={[styles.amountValue, { color: colors.text }]}>
              {amount ? formatCurrency(amount) : "0 VND"}
            </Text>
          </View>

          {/* Predefined amounts */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Select Amount
          </Text>
          <View style={styles.predefinedAmounts}>
            {PREDEFINED_AMOUNTS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.amountButton,
                  {
                    backgroundColor:
                      amount === value.toString() && !isCustomAmount
                        ? colors.primary
                        : colors.card,
                  },
                ]}
                onPress={() => handlePredefinedAmount(value)}
              >
                <Text
                  style={[
                    styles.amountButtonText,
                    {
                      color:
                        amount === value.toString() && !isCustomAmount
                          ? "#fff"
                          : colors.text,
                    },
                  ]}
                >
                  {value.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom amount */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Or Enter Custom Amount
          </Text>
          <View
            style={[
              styles.customAmountContainer,
              { backgroundColor: colors.card },
            ]}
          >
            <TextInput
              style={[styles.customAmountInput, { color: colors.text }]}
              placeholder="Enter amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              value={isCustomAmount ? amount : ""}
              onChangeText={handleCustomAmount}
              onFocus={() => setIsCustomAmount(true)}
            />
            <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>
              VND
            </Text>
          </View>

          {/* Error message */}
          {error && (
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}

          {/* Payment button */}
          <TouchableOpacity
            style={[
              styles.payButton,
              {
                backgroundColor: loading ? colors.card : colors.primary,
                opacity: loading || amount === "" ? 0.7 : 1,
              },
            ]}
            onPress={handleAddFunds}
            disabled={loading || amount === ""}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="wallet-outline" size={20} color="#fff" />
                <Text style={styles.payButtonText}>Add Funds Now</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Payment information */}
          <View style={styles.infoContainer}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Funds will be immediately added to your wallet. The transaction will appear in your payment history.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  amountContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  predefinedAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  amountButton: {
    width: "30%",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  amountButtonText: {
    fontWeight: "500",
  },
  customAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  customAmountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  currencyLabel: {
    paddingLeft: 8,
    fontSize: 16,
  },
  errorText: {
    color: "#e74c3c",
    marginBottom: 16,
    textAlign: "center",
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default AddFundsScreen;