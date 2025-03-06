import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from "react-native";
import { Calendar } from "react-native-calendars";
import { useTheme } from "@/constants/ThemeContext"; // ✅ Import theme

// 🎯 Định nghĩa kiểu DayObject
interface DayObject {
  dateString: string;
}

interface BirthdayDatePickerProps {
  label: string;
  selectedDate?: Date;
  onChange: (date: Date) => void;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>; // ✅ Thêm textStyle để hỗ trợ màu chữ theo theme
}

const PRIMARY_COLOR = "#5fc1f1"; // Màu chủ đạo

const BirthdayDatePicker: React.FC<BirthdayDatePickerProps> = ({
  label,
  selectedDate,
  onChange,
  required = false,
  textStyle, // ✅ Nhận textStyle từ props
}) => {
  const { theme } = useTheme(); // ✅ Lấy theme từ Context
  const [date, setDate] = useState<Date>(selectedDate || new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);

  const handleDateChange = (day: DayObject) => {
    const selectedDate = new Date(day.dateString);
    setDate(selectedDate);
    onChange(selectedDate);
    setPickerVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, textStyle, { color: theme === "dark" ? "#ffffff" : "#333" }]}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity
        style={[
          styles.datePicker,
          {
            backgroundColor: theme === "dark" ? "#222" : "#ffffff",
            borderColor: theme === "dark" ? "#555" : "#ddd",
          },
        ]}
        onPress={() => setPickerVisible(!isPickerVisible)}
      >
        <Text style={[styles.dateText, textStyle, { color: theme === "dark" ? "#ffffff" : "#333" }]}>
          {date.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {isPickerVisible && (
        <Calendar
          theme={{
            backgroundColor: theme === "dark" ? "#222" : "#fff",
            calendarBackground: theme === "dark" ? "#222" : "#fff",
            textSectionTitleColor: theme === "dark" ? "#bbb" : "#000",
            selectedDayBackgroundColor: PRIMARY_COLOR,
            selectedDayTextColor: "#fff",
            todayTextColor: PRIMARY_COLOR,
            dayTextColor: theme === "dark" ? "#fff" : "#000",
            textDisabledColor: theme === "dark" ? "#555" : "#ccc",
            dotColor: PRIMARY_COLOR,
            arrowColor: PRIMARY_COLOR,
            monthTextColor: theme === "dark" ? "#fff" : "#000",
          }}
          markedDates={{
            [date.toISOString().split("T")[0]]: { selected: true, selectedColor: PRIMARY_COLOR },
          }}
          onDayPress={(day: any) => handleDateChange(day as DayObject)}
        />
      )}
    </View>
  );
};

// ✅ Cải thiện giao diện với Dark Mode & UI mềm mại hơn
const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  required: {
    color: "#ff4444",
  },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
  },
});

export default BirthdayDatePicker;
