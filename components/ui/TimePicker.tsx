import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  FlatList 
} from 'react-native';
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import Ionicons from "react-native-vector-icons/Ionicons";

// Generate hours and minutes arrays
const generateHours = () => 
  Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));

const generateMinutes = () => 
  Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'));

interface TimePickerProps {
  visible: boolean;
  initialTime?: Date;
  onTimeSelect: (date: Date) => void;
  onCancel: () => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ 
  visible, 
  initialTime = new Date(), 
  onTimeSelect, 
  onCancel 
}) => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  const [selectedHour, setSelectedHour] = useState(
    initialTime.getHours().toString().padStart(2, '0')
  );
  const [selectedMinute, setSelectedMinute] = useState(
    initialTime.getMinutes().toString().padStart(2, '0')
  );

  const hours = generateHours();
  const minutes = generateMinutes();

  const handleTimeSelect = () => {
    const newTime = new Date();
    newTime.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
    onTimeSelect(newTime);
  };

  const renderPickerItem = (
    data: string[], 
    selectedValue: string, 
    onSelect: (item: string) => void
  ) => {
    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.pickerItem,
              selectedValue === item && { 
                backgroundColor: colors.primary,
              }
            ]}
            onPress={() => onSelect(item)}
          >
            <Text 
              style={[
                styles.pickerItemText,
                selectedValue === item && { 
                  color: '#fff',
                  fontWeight: 'bold'
                }
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        snapToInterval={50}
        decelerationRate="fast"
      />
    );
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackground}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Chọn Giờ
            </Text>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons 
                name="close" 
                size={24} 
                color={colors.text} 
              />
            </TouchableOpacity>
          </View>

          {/* Time Selection */}
          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>Giờ</Text>
              {renderPickerItem(hours, selectedHour, setSelectedHour)}
            </View>
            <View style={styles.separator}>
              <Text style={[styles.separatorText, { color: colors.text }]}>:</Text>
            </View>
            <View style={styles.pickerColumn}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>Phút</Text>
              {renderPickerItem(minutes, selectedMinute, setSelectedMinute)}
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity 
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={handleTimeSelect}
          >
            <Text style={styles.confirmButtonText}>Xác Nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 250,
    paddingHorizontal: 16,
  },
  pickerColumn: {
    flex: 1,
    height: '100%',
  },
  pickerLabel: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
  },
  pickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 5,
  },
  pickerItemText: {
    fontSize: 16,
  },
  separator: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separatorText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  confirmButton: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TimePicker;