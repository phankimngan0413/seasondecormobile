import React from "react";
import { Stack } from "expo-router";
import { useTheme } from "@/constants/ThemeContext"; // ✅ Import ThemeContext để đổi theme
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme(); // ✅ Lấy theme hiện tại

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme === "dark" ? "#151718" : "#ffffff" },
        headerTintColor: theme === "dark" ? "#ffffff" : "#000000",
        headerRight: () => (
          <View style={{ marginRight: 15 }}>
            <TouchableOpacity onPress={toggleTheme}>
              <Ionicons
                name={theme === "dark" ? "sunny-outline" : "moon-outline"}
                size={28}
                color={theme === "dark" ? "white" : "black"}
              />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Stack.Screen name="login" options={{ title: "Login" }} /> 
      <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
    </Stack>
  );
}
