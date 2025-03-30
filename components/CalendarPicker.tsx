import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

// Props for CalendarPicker component
type CalendarPickerProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  isVisible: boolean;
  onClose: () => void;
};

// Component for year selector
const YearSelector = ({ 
  currentYear, 
  onSelectYear,
  onClose
}: { 
  currentYear: number;
  onSelectYear: (year: number) => void;
  onClose: () => void;
}) => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  const years = [];
  const startYear = 1950;
  const endYear = 2025; // Fixed to show years up to 2025
  
  // Generate years for selection in a grid-like layout (4 columns)
  for (let year = startYear; year <= endYear; year++) {
    years.push(
      <TouchableOpacity
        key={`year-${year}`}
        style={[
          styles.yearItem,
          currentYear === year && [styles.selectedYearItem, { backgroundColor: "#5fc1f1" }]
        ]}
        onPress={() => {
          onSelectYear(year);
          onClose();
        }}
      >
        <Text style={[
          styles.yearText,
          { color: currentYear === year ? '#fff' : colors.text },
          currentYear === year && styles.selectedYearText
        ]}>
          {year}
        </Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[styles.yearSelectorContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.yearHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.yearTitle, { color: colors.text }]}>Select Year</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView style={{maxHeight: 350}} showsVerticalScrollIndicator={false}>
        <View style={styles.yearList}>
          {years}
        </View>
      </ScrollView>
    </View>
  );
};

// Main calendar picker component
const CalendarPicker = ({ 
  selectedDate, 
  onSelectDate, 
  isVisible, 
  onClose 
}: CalendarPickerProps) => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [showYearSelector, setShowYearSelector] = useState(false);
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelection = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setCurrentDate(newDate);
    onSelectDate(newDate);
  };

  const handleYearSelection = (year: number) => {
    setCurrentYear(year);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
    
    const days = [];
    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
    
    // Render day names (S M T W T F S)
    dayNames.forEach((name, index) => {
      days.push(
        <View key={`day-name-${index}`} style={styles.calendarHeaderCell}>
          <Text style={[styles.calendarDayName, { color: colors.text }]}>{name}</Text>
        </View>
      );
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = 
        date.getDate() === currentDate.getDate() && 
        date.getMonth() === currentDate.getMonth() && 
        date.getFullYear() === currentDate.getFullYear();
      
      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.calendarCell,
            isSelected && [styles.selectedCalendarCell, { backgroundColor: "#5fc1f1" }]
          ]}
          onPress={() => handleDateSelection(day)}
        >
          <Text style={[
            styles.calendarDay,
            { color: isSelected ? '#fff' : colors.text },
            isSelected && styles.selectedCalendarDay
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              {showYearSelector ? (
                <YearSelector
                  currentYear={currentYear}
                  onSelectYear={handleYearSelection}
                  onClose={() => setShowYearSelector(false)}
                />
              ) : (
                <View style={[styles.calendarContainer, { backgroundColor: colors.background }]}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity 
                      onPress={() => setShowYearSelector(true)}
                      style={styles.monthYearSelector}
                    >
                      <Text style={[styles.calendarTitle, { color: colors.text }]}>
                        {months[currentMonth]} {currentYear}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={colors.text} style={{marginLeft: 5}} />
                    </TouchableOpacity>
                    <View style={styles.calendarNavigation}>
                      <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
                        <Ionicons name="chevron-forward" size={24} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.calendarGrid}>
                    {renderCalendarDays()}
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.calendarDoneButton, { backgroundColor: "#5fc1f1" }]} 
                    onPress={onClose}
                  >
                    <Text style={styles.calendarDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '90%',
    maxWidth: 360,
    borderRadius: 10,
    overflow: 'hidden'
  },
  calendarContainer: {
    padding: 15,
    borderRadius: 10
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "bold"
  },
  monthYearSelector: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  calendarNavigation: {
    flexDirection: 'row'
  },
  calendarNavButton: {
    padding: 5
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  calendarHeaderCell: {
    width: '14.28%',
    padding: 10,
    alignItems: 'center'
  },
  calendarDayName: {
    fontWeight: '500'
  },
  calendarCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2
  },
  selectedCalendarCell: {
    borderRadius: 20
  },
  calendarDay: {
    fontSize: 16
  },
  selectedCalendarDay: {
    fontWeight: 'bold'
  },
  calendarDoneButton: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20
  },
  calendarDoneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  // Year selector styles
  yearSelectorContainer: {
    padding: 15,
    borderRadius: 10,
    maxHeight: 500
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1
  },
  yearTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  yearList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  yearItem: {
    width: '25%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 45
  },
  selectedYearItem: {
    borderRadius: 25
  },
  yearText: {
    fontSize: 16
  },
  selectedYearText: {
    fontWeight: 'bold'
  }
});

export default CalendarPicker;