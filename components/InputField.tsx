import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/ThemeContext"; // ✅ Import theme

interface InputFieldProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  rightIcon?: React.ReactNode; // ✅ Hỗ trợ thêm biểu tượng bên phải
}

const PRIMARY_COLOR = "#5fc1f1"; // Màu chủ đạo

const InputField: React.FC<InputFieldProps> = ({ icon, error, rightIcon, ...props }) => {
  const { theme } = useTheme(); // ✅ Lấy theme từ Context
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme === "dark" ? "#222" : "#ffffff",
            borderColor: error
              ? "#ff4444"
              : isFocused
              ? PRIMARY_COLOR
              : theme === "dark"
              ? "#555"
              : "#ddd",
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={error ? "#ff4444" : isFocused ? PRIMARY_COLOR : theme === "dark" ? "#bbb" : "#ccc"}
          style={styles.icon}
        />
        <TextInput
          {...props}
          placeholderTextColor={theme === "dark" ? "#aaa" : "#888"}
          style={[
            styles.input,
            {
              color: theme === "dark" ? "#ffffff" : "#333",
            },
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {/* Hiển thị `rightIcon` nếu có */}
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {/* Chỉ hiển thị `error` nếu có lỗi */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 15,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },

  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: "SpaceMono",
    minWidth: 0,
    width: "100%",
  },

  icon: {
    marginRight: 10,
  },

  rightIcon: {
    marginLeft: 8,
  },

  errorText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff4444",
  },
});

export default InputField;
