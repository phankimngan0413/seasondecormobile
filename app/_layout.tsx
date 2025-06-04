import { ThemeProvider } from "@/constants/ThemeContext";
import { Stack } from "expo-router/stack";
import { useTheme } from "@/constants/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { 
  TouchableOpacity, 
  View, 
  BackHandler, 
  Platform, 
  Text, 
  ScrollView,
  RefreshControl,
  AppStateStatus,
  AppState,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useCallback, useRef } from "react";
import { useFonts } from "expo-font";
import { usePathname } from "expo-router";
import React from "react";
import { CartProvider, useCart } from "@/constants/CartContext";
import { setCartDebugLogging } from '@/services/CartService';
import * as Linking from 'expo-linking';
import { NotificationProvider, useNotificationContext } from '@/services/NotificationHubContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

// Helper function to get user ID
const getUserId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('userId');
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
};

// Improved DeepLinkHandler component that combines functionality from both files
function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    
    // Test URL to see if app can handle it
    Linking.canOpenURL('com.baymaxphan.seasondecormobileapp://signature_success?token=test');
     
    // Handle initial URL (app opened from link)
    const handleInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        if (initialURL) {
          processURL(initialURL);
        }
      } catch (error) {
      }
    };

    // Handle URLs when app is already open
    const handleURLEvent = (event: { url: string }) => {
      processURL(event.url);
    };

    // Process deep link URLs
    const processURL = (url: string) => {
      if (!url) return;
      
      try {
        // Parse the URL
        const parsedURL = Linking.parse(url);
        
        // Check for signature_success in any part of the URL
        if (url.includes('signature_success')) {
          
          // Check if this is a verification request with a token
          if (parsedURL.queryParams?.token) {
            // Token from email
            const token = parsedURL.queryParams.token;
            
            // Navigate to signature screen with a small delay to ensure navigation works
            setTimeout(() => {
              router.replace({
                pathname: '/signature_success',
                params: { token }
              });
            }, 500);
          } 
          // Check if this is a return from verification
          else if (parsedURL.queryParams?.verified || parsedURL.queryParams?.success) {
            // Result from verification page
            const success = parsedURL.queryParams?.success === 'true' || parsedURL.queryParams?.verified === 'true';
            const contractCode = parsedURL.queryParams?.contractCode as string;
            const error = parsedURL.queryParams?.error as string;
            
            // Show result alert
            if (success) {
              Alert.alert(
                'Verification Successful',
                'Your contract has been successfully signed.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate to bookings
                      router.push('/screens/Bookings');
                    }
                  }
                ]
              );
            } else {
              Alert.alert(
                'Verification Failed',
                error || 'There was an issue with verification.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate home
                      router.push('/');
                    }
                  }
                ]
              );
            }
          }
        }
      } catch (error) {
      }
    };

    // Set up deep link handlers
    handleInitialURL();
    const subscription = Linking.addEventListener('url', handleURLEvent);

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null; // This component doesn't render anything
}

// NotificationInitializer component to handle notification connections
// Enhanced NotificationInitializer component with better connection management
function NotificationInitializer() {
  const { connect, isConnected, fetchUnreadNotifications } = useNotificationContext();
  
  // Use refs to track connection state across renders
  const connectionAttemptsRef = useRef(0);
  const lastConnectionTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isConnectingRef = useRef(false);
  
  // Enhanced connection function with retry logic and exponential backoff
  const initializeConnection = useCallback(async () => {
    try {
      // Skip if already connecting
      if (isConnectingRef.current) {
        console.log('📱 Connection already in progress, skipping');
        return;
      }
      
      // Skip if already connected
      if (isConnected) {
        console.log('📱 Already connected to notification hub');
        return;
      }
      
      // Connection throttling to prevent excessive requests
      const now = Date.now();
      if (now - lastConnectionTimeRef.current < 5000) { // 5 seconds minimum between attempts
        console.log('📱 Connection attempt throttled');
        return;
      }
      
      // Limit maximum connection attempts to prevent battery drain
      if (connectionAttemptsRef.current >= 5) {
        console.log('📱 Maximum connection attempts reached, will try again when app returns to foreground');
        return;
      }
      
      // Set connection flags
      isConnectingRef.current = true;
      lastConnectionTimeRef.current = now;
      connectionAttemptsRef.current++;
      
      console.log(`📱 Attempting to connect to notification hub (Attempt ${connectionAttemptsRef.current})`);
      
      // Get user ID for connection
      const userId = await getUserId();
      if (!userId) {
        console.log('📱 No user ID available, skipping notification connection');
        isConnectingRef.current = false;
        return;
      }
      
      // Attempt connection
      const connected = await connect(userId);
      
      if (connected) {
        console.log('🟢 Successfully connected to notification hub');
        connectionAttemptsRef.current = 0; // Reset counter on success
        
        // Immediately fetch notifications after successful connection
        await fetchUnreadNotifications();
      } else {
        console.log('🔴 Failed to connect to notification hub, will retry with backoff');
        
        // Clear any existing retry timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Calculate retry delay with exponential backoff (1s, 2s, 4s, 8s, 16s)
        // But cap at 30 seconds maximum
        const delay = Math.min(Math.pow(2, connectionAttemptsRef.current - 1) * 1000, 30000);
        console.log(`📱 Will retry connection in ${delay}ms`);
        
        // Schedule retry
        timeoutRef.current = setTimeout(() => {
          isConnectingRef.current = false; // Reset connecting flag before retry
          initializeConnection();
        }, delay);
      }
    } catch (error) {
      console.error('❌ Error connecting to notification hub:', error);
    } finally {
      // Always reset connecting flag when done, unless we're waiting for a retry
      if (!timeoutRef.current) {
        isConnectingRef.current = false;
      }
    }
  }, [connect, isConnected, fetchUnreadNotifications]);
  
  // Initialize connection on first render
  useEffect(() => {
    if (!isConnected) {
      initializeConnection();
    }
    
    // Clean up function to clear any pending timeouts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isConnected, initializeConnection]);
  
  // Set up app state change handler
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Only attempt reconnection when app comes back to foreground
      if (
        appStateRef.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        console.log('📱 App has come to the foreground, checking notification connection');
        
        // Reset connection attempt counter when returning to app
        connectionAttemptsRef.current = 0;
        
        // Check connection and reconnect if needed
        if (!isConnected) {
          initializeConnection();
        } else {
          // If already connected, just refresh notifications
          await fetchUnreadNotifications();
        }
      }
      
      appStateRef.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [isConnected, initializeConnection, fetchUnreadNotifications]);
  
  // Periodically check connection status and refresh notifications
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (isConnected) {
        // If connected, just refresh notifications
        console.log('📱 Refreshing notifications (periodic check)');
        await fetchUnreadNotifications();
      } else if (!isConnectingRef.current && connectionAttemptsRef.current === 0) {
        // If disconnected and not currently attempting connection,
        // try to reconnect
        console.log('📱 Connection check: not connected, attempting to reconnect');
        initializeConnection();
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isConnected, initializeConnection, fetchUnreadNotifications]);
  
  return null; // This component doesn't render anything
}

export default function RootLayout() {
  const router = useRouter();
  
  // Turn off debug logging for CartService
  useEffect(() => {
    setCartDebugLogging(false);
  }, []);

  return (
    <ThemeProvider>
      <CartProvider>
        <NotificationProvider>
          {/* Add the notification initializer */}
          <NotificationInitializer />
          {/* Add the improved DeepLinkHandler component */}
          <DeepLinkHandler />
          <ThemedStack />
        </NotificationProvider>
      </CartProvider>
    </ThemeProvider>
  );
}

function ThemedStack() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const { cartItemCount, refreshCartCount } = useCart();
  const { unreadNotifications, connect, isConnected } = useNotificationContext();
  const [refreshing, setRefreshing] = useState(false);
  
  // Track app state changes with ref to avoid unnecessary re-renders
  const lastRefreshTimeRef = useRef(0);
  const MIN_REFRESH_INTERVAL = 60000; // 1 minute
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh cart count
      await refreshCartCount();
      
      // Ensure notification hub connection
      if (!isConnected) {
        const userId = await getUserId();
        if (userId) {
          try {
            await connect(userId);
          } catch (error) {
            console.error("Error connecting to notification hub:", error);
          }
        }
      }
      
      // Add any other refresh logic here
      
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCartCount, connect, isConnected]);

  // Check if current page is login or signup to hide header
  const hideHeader = [
    "/login", 
    "/signup", 
    "/chat/[userId]", 
    "/cart",
    "/notifications",
    "/signature_success",
    "/screens/checkout",
    "/screens/address/address-list",
    "/screens/address/add-address",
    "/screens/payment/transactions",
    "/screens/orders/order-success",
    "/screens/Orders",
    "/screens/Following",
    "/screens/Reviews",
    "/screens/Bookings",
    "/screens/Favorites",
    "/booking/tracking-view",
    "/booking/rate-booking",
    "/quotation/quotation-detail/[code]",
    "/quotation/list",
    "/booking/[id]",
    "/booking/survey-form",
    "/booking/review",
    "/quotation/contract/[code]",
    "/booking/initial-deposit",
    "/booking/deposit-payment",
    "/booking/cancel-request",
    "/screens/review/product-review",
    "/support/[id]",
  ].includes(pathname) || pathname.includes("/quotation/quotation-detail/") || pathname.includes("/quotation/contract/");

  // Only enable pull-to-refresh on specific screens
  const enablePullToRefresh = [
    "/",
    "/index",
    "/(tabs)",
    "/(tabs)/index",
    "/(tabs)/home",
    "/(tabs)/decor"
  ].includes(pathname);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // If we're on the home screen or tabs, prevent going back
        if (pathname === "/" || pathname === "/index" || pathname === "(tabs)") {
          return true; // Prevents default back behavior
        }
        return false; // Allow back navigation on other screens
      });

      return () => backHandler.remove(); // Clean up
    }
  }, [pathname]);

  // Load fonts
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Refresh cart count when navigating to cart - using throttling
  useEffect(() => {
    // Only refresh when going to cart page and past the specified time interval
    const now = Date.now();
    if (pathname === "/cart" && now - lastRefreshTimeRef.current > MIN_REFRESH_INTERVAL) {
      refreshCartCount();
      lastRefreshTimeRef.current = now;
    }
  }, [pathname, refreshCartCount]);

  // Refresh data when application becomes active (for example, when switching back to the app)
  // Using refs to avoid unnecessary re-renders
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Only refresh when app state changes from background to active
      if (
        appStateRef.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        const now = Date.now();
        if (now - lastRefreshTimeRef.current > MIN_REFRESH_INTERVAL) {
          refreshCartCount();
          lastRefreshTimeRef.current = now;
        }
      }
      
      appStateRef.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
  
    return () => {
      subscription.remove();
    };
  }, [refreshCartCount]);

  // Function to navigate to home screen
  const navigateToHome = () => {
    router.push("/");
  };

  // Calculate notification count
  const notificationCount = unreadNotifications ? unreadNotifications.length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme === "dark" ? "#151718" : "#ffffff" }}>
      <StatusBar hidden={false} style={theme === "dark" ? "light" : "dark"} />
      
      {enablePullToRefresh ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#5fc1f1"]} // Android
              tintColor={theme === "dark" ? "#ffffff" : "#5fc1f1"} // iOS
              title="Đang tải..." // iOS
              titleColor={theme === "dark" ? "#ffffff" : "#5fc1f1"} // iOS
            />
          }
        >
          <StackNavigator
            hideHeader={hideHeader}
            theme={theme}
            toggleTheme={toggleTheme}
            router={router}
            cartItemCount={cartItemCount}
            notificationCount={notificationCount}
            navigateToHome={navigateToHome}
          />
        </ScrollView>
      ) : (
        <StackNavigator
          hideHeader={hideHeader}
          theme={theme}
          toggleTheme={toggleTheme}
          router={router}
          cartItemCount={cartItemCount}
          notificationCount={notificationCount}
          navigateToHome={navigateToHome}
        />
      )}
    </View>
  );
}

// Define props interface for StackNavigator
interface StackNavigatorProps {
  hideHeader: boolean;
  theme: string;
  toggleTheme: () => void;
  router: any; // Ideally, this should be typed properly based on your router
  cartItemCount: number;
  notificationCount: number;
  navigateToHome: () => void;
}

// Separate component for Stack Navigator to avoid duplication
const StackNavigator = React.memo(({ 
  hideHeader, 
  theme, 
  toggleTheme, 
  router, 
  cartItemCount,
  notificationCount,
  navigateToHome 
}: StackNavigatorProps) => {
  return (
    <Stack
      screenOptions={{
        headerShown: !hideHeader,
        headerStyle: {
          backgroundColor: theme === "dark" ? "#151718" : "#ffffff"
        },
        headerTintColor: theme === "dark" ? "#ffffff" : "#000000",
        headerTitle: () => (
          <TouchableOpacity onPress={navigateToHome}>
            <Text style={{ 
              fontWeight: 'bold',
              fontSize: 18,
              color: theme === "dark" ? "#ffffff" : "#000000"
            }}>
              Seasonal Home Decor
            </Text>
          </TouchableOpacity>
        ),
        headerLeft: () => null, // This should remove the back button for all screens
        headerRight: () =>
          !hideHeader ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 15, marginRight: 10 }}>
              <TouchableOpacity onPress={toggleTheme}>
                <Ionicons
                  name={theme === "dark" ? "sunny-outline" : "moon-outline"}
                  size={26}
                  color={theme === "dark" ? "white" : "black"}
                />
              </TouchableOpacity>
              
              {/* Icon thông báo */}
              <TouchableOpacity onPress={() => router.push("/notifications")}>
                <View>
                  <Ionicons
                    name="notifications-outline"
                    size={26}
                    color={theme === "dark" ? "white" : "black"}
                  />
                  {notificationCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: -5,
                      right: -8,
                      backgroundColor: '#5fc1f1',
                      borderRadius: 10,
                      width: 18,
                      height: 18,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Text style={{
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold'
                      }}>
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              
              {/* Icon giỏ hàng */}
              <TouchableOpacity onPress={() => router.push("/cart")}>
                <View>
                  <Ionicons
                    name="cart-outline"
                    size={26}
                    color={theme === "dark" ? "white" : "black"}
                  />
                  {cartItemCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: -5,
                      right: -8,
                      backgroundColor: '#FF6B6B',
                      borderRadius: 10,
                      width: 18,
                      height: 18,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Text style={{
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold'
                      }}>
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          ) : null,
      }}
    >
      {/* Explicitly set headerLeft: null for the tabs screen */}
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerLeft: () => null,
          headerBackVisible: false,
          gestureEnabled: false, // Disable swipe back gesture
        }} 
      />
      <Stack.Screen name="cart" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ 
        headerShown: false,
        gestureEnabled: true // Enable swipe back for notifications
      }} />
      
      <Stack.Screen 
        name="product/product-detail/[id]" 
        options={{ 
          title: "Chi tiết sản phẩm",
          // For non-home screens, you can customize the back button if needed
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme === "dark" ? "white" : "black"}
              />
            </TouchableOpacity>
          )
        }} 
      />
      <Stack.Screen 
        name="provider/[slug]" 
        options={{ 
          title: "Thông tin nhà cung cấp",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme === "dark" ? "white" : "black"}
              />
            </TouchableOpacity>
          )
        }} 
      />
       <Stack.Screen 
        name="signature_success" 
        options={{ 
          headerShown: false,
          gestureEnabled: false, // Disable swipe back gesture for this screen
        }} 
      />
      <Stack.Screen 
        name="decor/[id]" 
        options={{ 
          title: "Chi tiết dịch vụ",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme === "dark" ? "white" : "black"}
              />
            </TouchableOpacity>
          )
        }} 
      />
       <Stack.Screen 
        name="booking/[id]" 
        options={{ 
          title: "Dịch vụ",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme === "dark" ? "white" : "black"}
              />
            </TouchableOpacity>
          )
        }} 
      />
    </Stack>
  );
});

// Add display name for debugging
StackNavigator.displayName = "StackNavigator";