import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, TextInputProps, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/ThemeContext";

interface InputFieldProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  rightIcon?: React.ReactNode;
}

const PRIMARY_COLOR = "#5fc1f1";
const ERROR_COLOR = "#ff4444";

const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  error,
  rightIcon,
  onFocus,
  onBlur,
  ...props
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // States
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [inputRef, setInputRef] = useState<TextInput | null>(null);

  // Colors based on theme
  const textColor = isDark ? "#ffffff" : "#333333";
  const labelColor = isDark ? "#dddddd" : "#666666";
  const placeholderColor = isDark ? "#aaaaaa" : "#888888";
  const backgroundColor = isDark ? "transparent" : "transparent";
  const cardColor = isDark ? "#222222" : "#ffffff";

  // Handle focus
  const handleFocus = (e: any) => {
    setIsFocused(true);
    setIsTouched(true);
    if (onFocus) onFocus(e);
  };

  // Handle blur
  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // Focus input when container is pressed
  const focusInput = () => {
    inputRef?.focus();
  };

  // Determine status color
  const getStatusColor = () => {
    if (error && isTouched) return ERROR_COLOR;
    if (isFocused) return PRIMARY_COLOR;
    return isDark ? "#555555" : "#dddddd";
  };

  const statusColor = getStatusColor();

  return (
    <View style={styles.wrapper}>
      {/* Label */}
      <Text
        style={[
          styles.label,
          {
            color: error && isTouched ? ERROR_COLOR : labelColor,
            fontWeight: isFocused ? "600" : "500",
          },
        ]}
      >
        {label}
      </Text>

      {/* Input Card */}
      <Pressable onPress={focusInput}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardColor,
              borderLeftWidth: 4,
              borderLeftColor: statusColor,
              shadowOpacity: isDark ? 0.1 : 0.15,
            },
          ]}
        >
          {/* Input Container */}
          <View style={styles.inputContainer}>
            <Ionicons
              name={icon}
              size={20}
              color={error && isTouched ? ERROR_COLOR : isFocused ? PRIMARY_COLOR : isDark ? "#bbbbbb" : "#999999"}
              style={styles.icon}
            />

            <TextInput
              {...props}
              ref={(ref) => setInputRef(ref)}
              placeholderTextColor={placeholderColor}
              style={[
                styles.input,
                {
                  color: textColor,
                  backgroundColor,
                  height: props.multiline ? 100 : "auto",
                  textAlignVertical: props.multiline ? "top" : "center",
                },
              ]}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </View>
        </View>
      </Pressable>

      {/* Error message */}
      {error && isTouched && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={ERROR_COLOR} style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    minWidth: 0,
    width: "100%",
  },
  icon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginLeft: 6,
  },
  errorIcon: {
    marginRight: 5,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: ERROR_COLOR,
  },
});

export default InputField;