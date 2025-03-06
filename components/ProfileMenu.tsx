import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { menuItems } from "@/constants/menuItems";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";

export default function ProfileMenu() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];

  return (
    <View style={styles.menuContainer}>
      {menuItems.map((item, index) => (
        <TouchableOpacity key={index} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
          <Ionicons name={item.icon} size={24} color={colors.text} />
          <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: { padding: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  menuLabel: { fontSize: 18 },
});
