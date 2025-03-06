import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext"; // ✅ Sử dụng ThemeContext

export default function TabLayout() {
  const { theme } = useTheme(); // ✅ Lấy theme từ Context
  const validTheme = theme as "light" | "dark"; // ✅ Ép kiểu theme

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[validTheme].tint || "#007AFF", // ✅ Không còn lỗi
        tabBarInactiveTintColor: Colors[validTheme].icon || "#888", // ✅ Không còn lỗi
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: validTheme === "dark" ? "rgba(21, 23, 24, 0.8)" : "rgba(255, 255, 255, 0.8)", // ✅ Không còn lỗi
            borderTopWidth: 0,
            elevation: 0,
          },
          android: {
            elevation: 5,
            backgroundColor: Colors[validTheme].background || "#FFFFFF", // ✅ Không còn lỗi
            borderTopWidth: 0,
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="decor"
        options={{
          title: "Decor",
          tabBarIcon: ({ color }) => <Ionicons size={28} name="color-palette-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
