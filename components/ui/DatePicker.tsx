import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CalendarPicker from "@/components/CalendarPicker"; 
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

interface BirthdayDatePickerProps {
  label?: string;
  selectedDate: Date;
  onChange: (date: Date) => void;
}

const BirthdayDatePicker = ({ label, selectedDate, onChange }: BirthdayDatePickerProps) => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Format date for display
  const formatDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) return "Select date";
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };
  
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      
      <TouchableOpacity
        style={[styles.dateButton, { backgroundColor: colors.background }]}
        onPress={() => setShowCalendar(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={styles.icon} />
        <Text style={[styles.dateText, { color: colors.text }]}>
          {formatDate(selectedDate)}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      
      <CalendarPicker
        selectedDate={selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date()}
        onSelectDate={onChange}
        isVisible={showCalendar}
        onClose={() => setShowCalendar(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
  },
  icon: {
    marginRight: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
  },
});

export default BirthdayDatePicker;