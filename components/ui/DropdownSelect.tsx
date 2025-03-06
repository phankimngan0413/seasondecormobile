import React, { useState } from "react";
import { View, Text, StyleSheet, TextStyle, StyleProp, ViewStyle } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/ThemeContext"; // ✅ Import theme

// 🎯 Định nghĩa kiểu dữ liệu cho props (nếu dùng TypeScript)
interface DropdownSelectProps {
  label: string;
  gender?: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>; // ✅ Thêm textStyle
}

// ✅ Danh sách giới tính
const genderOptions = [
  { label: "Female", value: "Female" },
  { label: "Male", value: "Male" },
];

const PRIMARY_COLOR = "#5fc1f1"; // Màu chủ đạo

const DropdownSelect: React.FC<DropdownSelectProps> = ({ label, gender, onChange, textStyle }) => {
  const { theme } = useTheme(); // ✅ Lấy theme từ Context
  const [selectedGender, setSelectedGender] = useState<string>(gender || "");

  return (
    <View style={styles.container}>
      <Text style={[styles.label, textStyle, { color: theme === "dark" ? "#fff" : "#333" }]}>
        {label}
      </Text>
      <View
        style={[
          styles.pickerWrapper,
          {
            backgroundColor: theme === "dark" ? "#222" : "#fff",
            borderColor: theme === "dark" ? "#666" : "#ddd",
          },
        ]}
      >
        <RNPickerSelect
          onValueChange={(value) => {
            setSelectedGender(value);
            onChange(value);
          }}
          items={genderOptions}
          value={selectedGender}
          useNativeAndroidPickerStyle={false}
          style={{
            inputIOS: [styles.input, textStyle, { color: theme === "dark" ? "#fff" : "#333" }],
            inputAndroid: [styles.input, textStyle, { color: theme === "dark" ? "#fff" : "#333" }],
            iconContainer: styles.iconContainer,
          }}
          Icon={() => <Ionicons name="chevron-down" size={24} color={theme === "dark" ? "#bbb" : "#aaa"} />}
          placeholder={{ label: "Select Gender", value: "" }}
        />
      </View>
    </View>
  );
};

// ✅ CSS Style cho Component
const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  pickerWrapper: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: "SpaceMono",
    minWidth: 0,
    width: "100%",
  },
  iconContainer: {
    top: 10,
    right: 10,
  },
});

export default DropdownSelect;
