import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/ThemeContext";

interface InputFieldProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  rightIcon?: React.ReactNode;
}

const PRIMARY_COLOR = "#ff6347"; // Coral red - thay đổi màu chính
const ERROR_COLOR = "#ff4444";

const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  error,
  rightIcon,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    setIsTouched(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Màu sắc dựa trên theme
  const isDark = theme === "dark";
  const inputTextColor = isDark ? "#ffffff" : "#333333"; // Đảm bảo text luôn tương phản với background
  const placeholderColor = isDark ? "#aaaaaa" : "#888888"; // Màu placeholder rõ hơn
  const labelColor = isDark ? "#ffffff" : "#333333"; // Label rõ ràng
  const backgroundColor = isDark ? "#222222" : "#ffffff";
  const borderColor = error && isTouched
    ? ERROR_COLOR
    : isFocused
      ? PRIMARY_COLOR
      : isDark
        ? "#555555"
        : "#dddddd";

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: backgroundColor,
            borderColor: borderColor,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={error && isTouched ? ERROR_COLOR : isFocused ? PRIMARY_COLOR : isDark ? "#bbbbbb" : "#cccccc"}
          style={styles.icon}
        />
        <TextInput
          {...props}
          placeholderTextColor={placeholderColor}
          style={[
            styles.input, 
            { 
              color: inputTextColor,
              fontSize: 16 // Kích thước font rõ ràng
            }
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {error && isTouched ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={ERROR_COLOR} style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    marginBottom: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    minWidth: 0,
    width: "100%",
    fontWeight: "500", // Font weight rõ hơn
  },
  icon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 12
  },
  errorIcon: {
    marginRight: 5,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "bold",
    color: ERROR_COLOR,
  },
});

export default InputField;