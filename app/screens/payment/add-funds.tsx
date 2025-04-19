import React, { useEffect, useState, useRef } from "react";
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
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
import { topUpWalletAPI } from "@/utils/paymentAPI";
import { WebView, WebViewNavigation } from "react-native-webview";

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
  const [linkingInitialized, setLinkingInitialized] = useState<boolean>(false);
  const [showWebView, setShowWebView] = useState<boolean>(false);
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Create a WebView reference
  const webViewRef = useRef<WebView>(null);
  
  // Sử dụng ref để theo dõi trạng thái đã xử lý thanh toán thành công chưa
  const hasProcessedPayment = useRef(false);

  // Handle predefined amount selection
  const handlePredefinedAmount = (value: number) => {
    setAmount(value.toString());
    setIsCustomAmount(false);
  };

  // Handle custom amount input
  const handleCustomAmount = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    setAmount(numericValue);
    setIsCustomAmount(true);
  };

  // Format currency display
  const formatCurrency = (value: string) => {
    if (!value) return "";
    return parseInt(value).toLocaleString() + " VND";
  };

  // Handle successful payment completion
  const handlePaymentSuccess = () => {
    // Kiểm tra nếu đã đánh dấu thanh toán thành công, không làm gì cả
    if (hasProcessedPayment.current || paymentSuccess) {
      console.log("Payment already marked as successful, ignoring duplicate call");
      return;
    }
    
    console.log("Payment successful - marking payment as successful");
    hasProcessedPayment.current = true;
    
    // Đánh dấu thanh toán thành công
    setPaymentSuccess(true);
  };

  // Handle WebView navigation state changes
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    console.log("WebView navigating to:", navState.url);
    
    const url = navState.url;
    
    // Check if we're on the ngrok warning page
    if (url.includes('ngrok-free.app') && 
        url.includes('You are about to visit:')) {
      // We'll handle this with injectedJavaScript, just log it
      console.log("Detected ngrok warning page, auto-click script will handle it");
      return;
    }
    
    // Check for successful payment in the return URL
    if ((url.includes('/api/Payment/mobileReturn') || 
         url.includes('mobileReturn')) && 
        url.includes('vnp_ResponseCode=')) {
      
      console.log("Payment return URL detected:", url);
      
      // Check for successful payment codes
      if (url.includes('vnp_ResponseCode=00') && 
          url.includes('vnp_TransactionStatus=00')) {
        console.log("Payment successful! Marking as successful...");
        handlePaymentSuccess();
        return;
      } else if (url.includes('vnp_ResponseCode')) {
        // Payment was completed but not successful
        console.log("Payment completed but not successful");
        setShowWebView(false);
        setError("Payment was not successful. Please try again.");
        return;
      }
    }
    
    // Check for app scheme URLs that might indicate success
    if (url.startsWith('com.baymaxphan.seasondecormobileapp://')) {
      console.log("App scheme URL detected:", url);
      
      if (url.includes('/success') || url.includes('success')) {
        console.log("Success detected in app scheme URL");
        handlePaymentSuccess();
        
        // Chuyển hướng đến trang thành công trong ứng dụng
        setTimeout(() => {
          setShowWebView(false);
          router.push("/screens/payment/success");
        }, 500);
        
        return;
      }
    }
  };

  // Handle deep linking for payment responses
  useEffect(() => {
    if (linkingInitialized) return;
  
    const handleDeepLink = (event: { url: string }) => {
      try {
        const { url } = event;
        console.log("Received deep link URL:", url);
  
        // Check if this is a success URL
        if (url.includes('success') || 
            (url.includes('vnp_ResponseCode=00') && url.includes('vnp_TransactionStatus=00'))) {
          console.log("Success detected in deep link");
          handlePaymentSuccess();
          
          // Chuyển hướng đến trang thành công
          setTimeout(() => {
            setShowWebView(false);
            router.push("/screens/payment/success");
          }, 500);
        }
      } catch (error) {
        console.error("Error handling deep link:", error);
      }
    };
  
    const subscription = Linking.addEventListener('url', handleDeepLink);
  
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("Initial URL on mount:", url);
        handleDeepLink({ url });
      }
    }).catch(err => {
      console.error("Error getting initial URL:", err);
    });
  
    setLinkingInitialized(true);
  
    return () => {
      subscription.remove();
    };
  }, [router, linkingInitialized]);
  
  // Handle adding funds
  const handleAddFunds = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the mobile top-up endpoint
      const response = await topUpWalletAPI(parseInt(amount));
      console.log("Payment API response:", response);

      // Extract payment URL - UPDATED LOGIC
      let paymentUrl = "";
      
      if (typeof response === 'object' && response !== null) {
        // Check if paymentUrl is at the root level
        if (response.paymentUrl) {
          paymentUrl = response.paymentUrl;
        }
        // Or check if it's in the data object as originally expected
        else if (response.data && typeof response.data === 'object' && response.data.paymentUrl) {
          paymentUrl = response.data.paymentUrl;
        }
        console.log("Found payment URL:", paymentUrl);
      }

      if (paymentUrl) {
        // Reset payment tracking status for new payment
        hasProcessedPayment.current = false;
        setPaymentSuccess(false);
        
        // Open the payment URL in a WebView
        setPaymentUrl(paymentUrl);
        setShowWebView(true);
      } else {
        setError("Could not find payment URL. Please try again.");
      }
    } catch (err) {
      console.error("Error adding funds:", err);
      setError(err instanceof Error ? err.message : "Error processing payment");
    } finally {
      setLoading(false);
    }
  };

  // If WebView is active, show it
  if (showWebView && paymentUrl) {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={{ flex: 1 }}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          originWhitelist={['*', 'com.baymaxphan.seasondecormobileapp://*']}  // Allow app scheme
          onShouldStartLoadWithRequest={(request) => {
            // Log tất cả các yêu cầu để debug
            console.log("WebView request:", request.url);
            
            // Kiểm tra nếu URL là đường dẫn mobileReturn
            if (request.url.includes('/api/Payment/mobileReturn')) {
              console.log("Detected mobileReturn URL:", request.url);
              
              try {
                // Đọc tham số từ URL
                const urlParts = request.url.split('?');
                if (urlParts.length > 1) {
                  const queryString = urlParts[1];
                  const params = new URLSearchParams(queryString);
                  const responseCode = params.get('vnp_ResponseCode');
                  const transactionStatus = params.get('vnp_TransactionStatus');
                  
                  console.log("Payment response code:", responseCode);
                  console.log("Transaction status:", transactionStatus);
                  
                  // Nếu thanh toán thành công
                  if (responseCode === '00' && transactionStatus === '00') {
                    console.log("Payment successful based on URL parameters");
                    
                    // Đánh dấu thành công
                    handlePaymentSuccess();
                    
                    // Để backend xử lý API, trả về true để tiếp tục tải
                    return true;
                  }
                }
              } catch (error) {
                console.error("Error parsing URL parameters:", error);
              }
            }
            
            // Xử lý đặc biệt cho app scheme URLs
            if (request.url.startsWith('com.baymaxphan.seasondecormobileapp://')) {
              console.log("Intercepted app scheme URL:", request.url);
              
              // Đây là URL chuyển hướng từ backend
              if (request.url.includes('/success') || request.url.includes('success')) {
                console.log("Detected success URL from backend - handling redirect");
                
                // Đánh dấu thành công (nếu chưa)
                handlePaymentSuccess();
                
                // Đóng WebView và chuyển hướng trong ứng dụng
                setTimeout(() => {
                  setShowWebView(false);
                  router.push("/screens/payment/success");
                }, 500);
                
                // Không để WebView tải URL không hợp lệ
                return false;
              }
            }
            
            // Allow all other URLs
            return true;
          }}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 10, color: colors.text }}>Loading payment page...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            
            // If the error is related to localhost but contains valid payment parameters, treat it as success
            if (nativeEvent.url && 
                (nativeEvent.url.includes('localhost') || nativeEvent.code === -6) && 
                nativeEvent.url.includes('vnp_ResponseCode=00') && 
                nativeEvent.url.includes('vnp_TransactionStatus=00')) {
              
              console.log("Detected successful payment on localhost URL");
              
              // Extract the parameters from the URL to pass to the success endpoint
              let params = "";
              try {
                const urlParts = nativeEvent.url.split('?');
                if (urlParts.length > 1) {
                  params = "?" + urlParts[1];
                }
              } catch (e) {
                console.error("Error extracting URL parameters:", e);
              }
              
              // Handle success directly
              handlePaymentSuccess();
              
              // Chuyển hướng sau một khoảng thời gian ngắn
              setTimeout(() => {
                setShowWebView(false);
                router.push("/screens/payment/success");
              }, 500);
              
              return;
            }
            
            // If the error is related to the app scheme, don't show an error
            if (nativeEvent.url && nativeEvent.url.startsWith('com.baymaxphan.seasondecormobileapp://')) {
              console.log("Ignoring expected error for app scheme URL");
              
              // Check if it's a success URL
              if (nativeEvent.url.includes('/success') || nativeEvent.url.includes('success')) {
                // Đánh dấu thành công
                handlePaymentSuccess();
                
                // Chuyển hướng đến trang thành công
                setTimeout(() => {
                  setShowWebView(false);
                  router.push("/screens/payment/success");
                }, 500);
              }
              
              return;
            }
            
            // For other errors, close WebView and show error
            setShowWebView(false);
            setError("Failed to load payment page. Please try again.");
          }}
          incognito={false}
          cacheEnabled={true}
          allowsBackForwardNavigationGestures={true}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
          // Auto-click the "Visit Site" button on ngrok warning pages
          injectedJavaScript={`
            (function() {
              function autoClickVisitSite() {
                // Look for the "Visit Site" button on ngrok warning pages
                const visitButtons = document.querySelectorAll('a, button');
                for (let i = 0; i < visitButtons.length; i++) {
                  const button = visitButtons[i];
                  if (button.textContent && button.textContent.includes('Visit Site')) {
                    console.log('Auto-clicking Visit Site button');
                    button.click();
                    return true;
                  }
                }
                return false;
              }
              
              // Try immediately
              if (!autoClickVisitSite()) {
                // If not found, try again after the page fully loads
                window.addEventListener('load', function() {
                  autoClickVisitSite();
                  
                  // And try one more time after a slight delay
                  setTimeout(autoClickVisitSite, 500);
                });
              }
              
              // Monitor URL changes to detect successful payments
              let lastUrl = '';
              setInterval(() => {
                if (window.location.href !== lastUrl) {
                  lastUrl = window.location.href;
                  console.log('URL changed to: ' + lastUrl);
                  
                  // Check if the URL indicates a successful payment
                  if ((lastUrl.includes('/api/Payment/mobileReturn') || 
                       lastUrl.includes('mobileReturn')) && 
                      lastUrl.includes('vnp_ResponseCode=00') && 
                      lastUrl.includes('vnp_TransactionStatus=00')) {
                    
                    console.log('Detected successful payment in URL!');
                    // Send message to React Native
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'PAYMENT_SUCCESS',
                      url: lastUrl
                    }));
                  }
                }
              }, 300);
              
              true;
            })();
          `}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              console.log("Message from WebView:", data);
              
              if (data.type === 'PAYMENT_SUCCESS') {
                console.log("Received payment success message from WebView JS");
                // Gọi hàm handlePaymentSuccess trực tiếp (đã có kiểm tra bên trong)
                handlePaymentSuccess();
              }
            } catch (e) {
              console.error("Error parsing WebView message:", e);
            }
          }}
        />
      </View>
    );
  }

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
  // WebView styles
  webViewLoading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  }
});

export default AddFundsScreen;