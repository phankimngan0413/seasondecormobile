import React from "react";
import { TouchableOpacity, Text, StyleSheet, View, StyleProp, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  btnStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;

}

const PRIMARY_COLOR = "#5fc1f1"; // Màu chủ đạo mới

const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress, icon, btnStyle, labelStyle, disabled }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor: disabled ? "#aaa" : PRIMARY_COLOR }, btnStyle]} // Nền button với màu chủ đạo
    >
      <View style={styles.buttonWrapper}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={[styles.buttonText, labelStyle]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 50,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 5,
  },
  buttonWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  icon: {
    marginRight: 8,
  }
});

export default CustomButton;
