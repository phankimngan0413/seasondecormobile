import { ThemeProvider } from "@/constants/ThemeContext"; // ✅ Import ThemeProvider
import { Stack } from "expo-router/stack";
import { useTheme } from "@/constants/ThemeContext"; // ✅ Import useTheme
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { TouchableOpacity, View, TextInput } from "react-native";
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
  const { theme, toggleTheme } = useTheme(); // ✅ Lấy theme từ Context
  const pathname = usePathname(); // ✅ Lấy đường dẫn hiện tại

  // **🔍 Kiểm tra nếu trang hiện tại là `/login` hoặc `/signup`, thì ẩn header**
  const hideHeader = ["/login", "/signup"].includes(pathname);

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
          headerShown: !hideHeader, // ✅ Ẩn header nếu đang ở trang login hoặc signup
          headerStyle: { backgroundColor: theme === "dark" ? "#151718" : "#ffffff" },
          headerTintColor: theme === "dark" ? "#ffffff" : "#000000",
          headerTitle: () =>
            !hideHeader ? ( // ✅ Chỉ hiện header nếu không ở login/signup
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: theme === "dark" ? "#222" : "#f0f0f0",
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  flex: 1,
                  height: 40,
                }}
              >
                <Ionicons name="search" size={20} color={theme === "dark" ? "white" : "gray"} />
                <TextInput
                  placeholder="Tìm kiếm..."
                  placeholderTextColor={theme === "dark" ? "#aaa" : "#555"}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    fontSize: 16,
                    color: theme === "dark" ? "white" : "black",
                  }}
                />
              </View>
            ) : null, // ✅ Ẩn tiêu đề header trên login/signup
          headerLeft: () => null, // ✅ Không có icon bên trái
          headerRight: () =>
            !hideHeader ? ( // ✅ Chỉ hiển thị khi không ở trang login/signup
              <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
                <TouchableOpacity onPress={toggleTheme}>
                  <Ionicons
                    name={theme === "dark" ? "sunny-outline" : "moon-outline"}
                    size={30}
                    color={theme === "dark" ? "white" : "black"}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/cart")}>
                  <Ionicons name="cart-outline" size={30} color={theme === "dark" ? "white" : "black"} />
                </TouchableOpacity>
              </View>
            ) : null, // ✅ Ẩn icon khi ở trang login/signup
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cart" options={{ title: "Giỏ hàng" }} />

    
      </Stack>
    </View>
  );
}
