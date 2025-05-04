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

SplashScreen.preventAutoHideAsync();

// Improved DeepLinkHandler component that combines functionality from both files
function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    
    // Test URL to see if app can handle it
    Linking.canOpenURL('com.baymaxphan.seasondecormobileapp://signature_success?token=test')
     

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
        // Parse the URL - Add enhanced debugging
        
        // Handle both URL formats (single or double slash)
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

export default function RootLayout() {
  // Turn off debug logging for CartService
  useEffect(() => {
    setCartDebugLogging(false);
  }, []);

  return (
    <ThemeProvider>
      <CartProvider>
        {/* Add the improved DeepLinkHandler component */}
        <DeepLinkHandler />
        <ThemedStack />
      </CartProvider>
    </ThemeProvider>
  );
}

function ThemedStack() {
  // Rest of your ThemedStack component remains unchanged
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const { cartItemCount, refreshCartCount } = useCart();
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
      
      // Add any other refresh logic here
      // For example, you might want to refresh other data
      
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCartCount]);

  // Check if current page is login or signup to hide header
  const hideHeader = [
    "/login", 
    "/signup", 
    "/chat/[userId]", 
    "/cart",
    "/signature_success",
    "/screens/checkout",
    "/screens/address/address-list",
    "/screens/address/add-address",
    "/screens/payment/transactions",
    "/screens/orders/order-success",
    "/screens/Orders",
    "/screens/Following",
    "/screens/Bookings",
    "/screens/Favorites",
    "/booking/tracking-view",
    "/quotation/quotation-detail/[code]",
    "/quotation/list",
    "/quotation/contract/[code]"
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
          navigateToHome={navigateToHome}
        />
      )}
    </View>
  );
}

// StackNavigator component remains unchanged
// Define props interface for StackNavigator
interface StackNavigatorProps {
  hideHeader: boolean;
  theme: string;
  toggleTheme: () => void;
  router: any; // Ideally, this should be typed properly based on your router
  cartItemCount: number;
  navigateToHome: () => void;
}

// Separate component for Stack Navigator to avoid duplication
const StackNavigator = React.memo(({ 
  hideHeader, 
  theme, 
  toggleTheme, 
  router, 
  cartItemCount, 
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