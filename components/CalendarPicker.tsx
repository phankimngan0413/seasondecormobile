import React, { useState, useEffect } from "react";
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
  minDate?: Date; // Add minDate prop
};

// Get current date in Vietnam timezone (GMT+7)
const getVietnamDate = () => {
  const now = new Date();
  
  // Vietnam is UTC+7
  const vietnamOffset = 7 * 60; // 7 hours in minutes
  const utcOffset = now.getTimezoneOffset(); // Local timezone offset in minutes
  
  // Calculate the difference between local time and Vietnam time
  const offsetDiff = utcOffset + vietnamOffset;
  
  // Create a new date adjusted to Vietnam time
  const vietnamDate = new Date(now.getTime() + offsetDiff * 60 * 1000);
  return vietnamDate;
};

// Helper function to check if a date is before another date (ignoring time)
const isDateBefore = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return d1 < d2;
};

// Helper function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
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
  // Get current year in Vietnam for the range upper limit
  const vietnamDate = getVietnamDate();
  const endYear = vietnamDate.getFullYear() + 5; // Allow selection 5 years into the future
  
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
  onClose,
  minDate // Add minDate prop
}: CalendarPickerProps) => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  // Initialize with Vietnam time
  const [currentDate, setCurrentDate] = useState(selectedDate || getVietnamDate());
  const [currentMonth, setCurrentMonth] = useState((selectedDate || getVietnamDate()).getMonth());
  const [currentYear, setCurrentYear] = useState((selectedDate || getVietnamDate()).getFullYear());
  const [showYearSelector, setShowYearSelector] = useState(false);
  
  // Create a reference for today's date in Vietnam timezone
  const todayInVietnam = getVietnamDate();
  const todayDay = todayInVietnam.getDate();
  const todayMonth = todayInVietnam.getMonth();
  const todayYear = todayInVietnam.getFullYear();
  
  // Update calendar when becoming visible
  useEffect(() => {
    if (isVisible) {
      // If no date is selected, use current Vietnam time
      if (!selectedDate) {
        const vietnamDate = getVietnamDate();
        setCurrentDate(vietnamDate);
        setCurrentMonth(vietnamDate.getMonth());
        setCurrentYear(vietnamDate.getFullYear());
      }
    }
  }, [isVisible, selectedDate]);
  
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
    // Create a new date using the selected calendar date
    const selectedDate = new Date(currentYear, currentMonth, day);
    
    // Check if the selected date is before minDate
    if (minDate && isDateBefore(selectedDate, minDate)) {
      // Don't allow selection of dates before minDate
      return;
    }
    
    // Create a new date using the selected calendar date
    // but convert to Vietnam timezone
    const localDate = new Date(currentYear, currentMonth, day);
    
    // Adjust for Vietnam timezone
    // For a calendar selection, we want to preserve the day/month/year as selected,
    // and adjust the time to midnight in Vietnam's timezone
    
    // Calculate the difference between local timezone and Vietnam timezone
    const now = new Date();
    const utcOffset = now.getTimezoneOffset(); // Minutes
    const vietnamOffset = 7 * 60; // Vietnam is UTC+7, converted to minutes
    const offsetDiff = utcOffset + vietnamOffset;
    
    // Set the date to midnight (in Vietnam's timezone)
    const vietnamDate = new Date(localDate.getTime());
    vietnamDate.setHours(0, 0, 0, 0);
    
    // Adjust by the timezone difference
    const adjustedDate = new Date(vietnamDate.getTime() + offsetDiff * 60 * 1000);
    
    setCurrentDate(adjustedDate);
    onSelectDate(adjustedDate);
    onClose(); // Close the calendar after selection
  };

  const handleYearSelection = (year: number) => {
    setCurrentYear(year);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
    
    // Create header row (S M T W T F S)
    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
    const headerRow = (
      <View style={styles.calendarRow} key="header-row">
        {dayNames.map((name, index) => (
          <View key={`day-name-${index}`} style={styles.calendarHeaderCell}>
            <Text style={[styles.calendarDayName, { color: colors.text }]}>{name}</Text>
          </View>
        ))}
      </View>
    );
    
    // Create array for calendar rows
    const rows = [headerRow];
    
    // Calculate how many days to include in each week/row
    let days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarCell} />
      );
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = 
        date.getDate() === currentDate.getDate() && 
        date.getMonth() === currentDate.getMonth() && 
        date.getFullYear() === currentDate.getFullYear();
      
      // Check if this day is today (in Vietnam time)
      const isToday = 
        day === todayDay && 
        currentMonth === todayMonth && 
        currentYear === todayYear;
      
      // Check if this day is disabled (before minDate)
      const isDisabled = minDate && isDateBefore(date, minDate);
      
      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.calendarCell,
            isSelected && [styles.selectedCalendarCell, { backgroundColor: "#5fc1f1" }],
            isDisabled && styles.disabledCalendarCell
          ]}
          onPress={() => handleDateSelection(day)}
          disabled={isDisabled}
        >
          <View style={[
            isToday && styles.todayIndicator, 
            isSelected && { backgroundColor: 'transparent' },
            isDisabled && styles.disabledIndicator
          ]}>
            <Text style={[
              styles.calendarDay,
              { color: isSelected ? '#fff' : colors.text },
              isSelected && styles.selectedCalendarDay,
              isToday && !isSelected && styles.todayCalendarDay,
              isDisabled && styles.disabledCalendarDay
            ]}>
              {day}
            </Text>
          </View>
        </TouchableOpacity>
      );
      
      // When we reach the end of a week, create a new row
      if ((firstDayOfMonth + day) % 7 === 0 || day === daysInMonth) {
        // If this is the last day of the month and doesn't end on Saturday
        // add empty cells to fill the row
        if (day === daysInMonth && (firstDayOfMonth + day) % 7 !== 0) {
          const remainingCells = 7 - ((firstDayOfMonth + day) % 7);
          for (let i = 0; i < remainingCells; i++) {
            days.push(
              <View key={`empty-end-${i}`} style={styles.calendarCell} />
            );
          }
        }
        
        rows.push(
          <View style={styles.calendarRow} key={`row-${rows.length}`}>
            {days}
          </View>
        );
        days = [];
      }
    }
    
    return rows;
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
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
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
                  
                  <View style={styles.calendarGridContainer}>
                    {renderCalendarDays()}
                  </View>
                  
                  {/* Display minimum date info if provided */}
                  {minDate && (
                    <View style={styles.minDateInfoContainer}>
                      <Text style={[styles.minDateInfoText, { color: colors.textSecondary }]}>
                        Minimum date: {minDate.toLocaleDateString([], { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </View>
                  )}
                  
                  {/* Display current time in Vietnam timezone */}
                  <View style={styles.timeInfoContainer}>
                    <Text style={[styles.timeInfoText, { color: colors.text }]}>
                      Vietnam Time: {todayInVietnam.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
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
  calendarGridContainer: {
    width: '100%'
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  calendarHeaderCell: {
    width: '14.28%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  calendarDayName: {
    fontWeight: '500',
    fontSize: 14
  },
  calendarCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedCalendarCell: {
    borderRadius: 20
  },
  disabledCalendarCell: {
    opacity: 0.3
  },
  calendarDay: {
    fontSize: 16
  },
  selectedCalendarDay: {
    fontWeight: 'bold'
  },
  disabledCalendarDay: {
    color: '#ccc',
    textDecorationLine: 'line-through'
  },
  // Today highlight styles
  todayIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#5fc1f1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  todayCalendarDay: {
    fontWeight: 'bold',
    color: '#5fc1f1'
  },
  disabledIndicator: {
    borderColor: '#ccc',
    backgroundColor: 'transparent'
  },
  minDateInfoContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4
  },
  minDateInfoText: {
    fontSize: 12,
    fontStyle: 'italic'
  },
  timeInfoContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8
  },
  timeInfoText: {
    fontSize: 14,
    fontStyle: 'italic'
  },
  calendarDoneButton: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 12
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