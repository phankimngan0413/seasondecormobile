import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

const Logo: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push("/")} // ✅ Điều hướng về trang chủ "/"
        style={[styles.logoWrapper, { borderColor: colors.icon, backgroundColor: "transparent" }]} // ✅ Xóa nền xám
      >
        <Image
          source={
            validTheme === "dark"
              ? require("../../assets/images/logo/logo-black.png")
              : require("../../assets/images/logo/logo-white.png")
          }
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.logoText, { color: colors.text }]}>SeasonDecor</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  logoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoImage: {
    width: 50,
    height: 50,
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Logo;
