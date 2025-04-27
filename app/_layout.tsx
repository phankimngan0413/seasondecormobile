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
  AppState
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useCallback } from "react";
import { useFonts } from "expo-font";
import { usePathname } from "expo-router";
import React from "react";
import { CartProvider, useCart } from "@/constants/CartContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <CartProvider>
        <ThemedStack />
      </CartProvider>
    </ThemeProvider>
  );
}

function ThemedStack() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const { cartItemCount, refreshCartCount } = useCart();
  const [refreshing, setRefreshing] = useState(false);

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
    "/screens/checkout",
    "/screens/address/address-list",
    "/screens/address/add-address",
    "/screens/payment/transactions",
    "/screens/orders/order-success",
    "/screens/Orders",
    "/screens/Following",
    "/screens/Bookings",
    "/screens/Favorites",
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

  // Refresh cart count when navigating to cart
  useEffect(() => {
    if (pathname === "/cart") {
      refreshCartCount();
    }
  }, [pathname, refreshCartCount]);

  // Refresh data when application becomes active (for example, when switching back to the app)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshCartCount();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshCartCount]);

  if (!loaded) {
    return null;
  }

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
function StackNavigator({ 
  hideHeader, 
  theme, 
  toggleTheme, 
  router, 
  cartItemCount, 
  navigateToHome 
}: StackNavigatorProps) {
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
}