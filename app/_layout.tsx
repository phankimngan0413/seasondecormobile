import { ThemeProvider } from "@/constants/ThemeContext";
import { Stack } from "expo-router/stack";
import { useTheme } from "@/constants/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { usePathname } from "expo-router";
import React from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}

function ThemedStack() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  // Check if current page is login or signup to hide header
  const hideHeader = ["/login", "/signup", "/chat/[userId]", "/cart","/screens/checkout","/screens/address/address-list","/screens/address/add-address"].includes(pathname);

  // Load fonts
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme === "dark" ? "#151718" : "#ffffff" }}>
      <StatusBar hidden={false} style={theme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: !hideHeader,
          headerStyle: {
            backgroundColor: theme === "dark" ? "#151718" : "#ffffff"
          },
          headerTintColor: theme === "dark" ? "#ffffff" : "#000000",
          headerTitle: "Seasonal Home Decor", // Simple text title instead of search bar
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => null,
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
                  <Ionicons
                    name="cart-outline"
                    size={26}
                    color={theme === "dark" ? "white" : "black"}
                  />
                </TouchableOpacity>
              </View>
            ) : null,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cart" options={{ headerShown: false }} />

        <Stack.Screen name="product/product-detail/[id]" options={{ title: "Chi tiết sản phẩm" }} />
        <Stack.Screen name="provider/[slug]" options={{ title: "Thông tin nhà cung cấp" }} />
        <Stack.Screen name="decor/[id]" options={{ title: "Chi tiết dịch vụ" }} />
      </Stack>
    </View>
  );
}