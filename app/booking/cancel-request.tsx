import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { requestCancelBookingAPI, getAllCancelTypesAPI } from '@/utils/bookingAPI';

const PRIMARY_COLOR = "#5fc1f1";
const DANGER_COLOR = "#ff3b30";

// Updated interface to match API response
interface ICancelType {
  id: number;
  type: string;  // Changed from 'name' to 'type' to match the API response
}

const CancelRequestScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingCode = params.bookingCode as string;

  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [cancelTypes, setCancelTypes] = useState<ICancelType[]>([]);
  const [selectedCancelTypeId, setSelectedCancelTypeId] = useState<number | null>(null);
  const [selectedCancelType, setSelectedCancelType] = useState<ICancelType | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);

  useEffect(() => {
    fetchCancelTypes();
  }, []);

  const fetchCancelTypes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getAllCancelTypesAPI();
      
      // Handle direct array response from API
      if (Array.isArray(response)) {
        setCancelTypes(response);
        
        if (response.length > 0) {
          setSelectedCancelTypeId(response[0].id);
          setSelectedCancelType(response[0]);
        }
      } 
      // Handle wrapped response
      else if (response.success && response.data) {
        setCancelTypes(response.data);
        
        if (response.data.length > 0) {
          setSelectedCancelTypeId(response.data[0].id);
          setSelectedCancelType(response.data[0]);
        }
      } 
      else {
        console.error('❌ Failed to fetch cancellation types:', response.message);
        setError('Failed to load cancellation types. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Error fetching cancellation types:', err);
      setError('An error occurred while loading cancellation types.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCancelType = (type: ICancelType) => {
    setSelectedCancelTypeId(type.id);
    setSelectedCancelType(type);
    setDropdownVisible(false);
  };
  const handleSubmitCancellation = async () => {
    if (!selectedCancelTypeId) {
      Alert.alert('Error', 'Please select a cancellation reason');
      return;
    }
  
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please provide a detailed explanation');
      return;
    }
  
    try {
      setSubmitting(true);
      setError('');
      
      console.log('📘 Submitting cancellation request', {
        bookingCode,
        cancelTypeId: selectedCancelTypeId,
        cancelReason
      });
      
      const result = await requestCancelBookingAPI(
        bookingCode,
        selectedCancelTypeId,
        cancelReason
      );
      
      
      // Check for success in the response
      if (result.success) {
        Alert.alert(
          'Success',
          'Your cancellation request has been submitted successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to booking list with refresh flag
                router.replace({
                  pathname: '/screens/Bookings',
                  params: { refresh: 'true' }
                });
              }
            }
          ]
        );
      } else {
        // Display the specific error message from the API
        const errorMessage = result.message || 'Failed to submit cancellation request';
        console.error('❌ Cancellation request failed:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (err: any) {
      console.error('❌ Error in cancellation request:', err);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      // Try to extract error message from response if available
      if (err.response && err.response.data) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  const renderDropdownItem = ({ item }: { item: ICancelType }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        selectedCancelTypeId === item.id && styles.selectedDropdownItem
      ]}
      onPress={() => handleSelectCancelType(item)}
    >
      <Text style={styles.dropdownItemText}>{item.type}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cancel Booking</Text>
        <View style={styles.spacer} />
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Booking Code Display */}
        <View style={[styles.bookingCodeContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.bookingCodeLabel, { color: colors.textSecondary }]}>
            Booking Code
          </Text>
          <Text style={[styles.bookingCodeValue, { color: colors.text }]}>
            {bookingCode}
          </Text>
        </View>
        
        {/* Warning Message */}
        <View style={styles.warningContainer}>
          <Ionicons name="warning-outline" size={24} color={DANGER_COLOR} />
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            Please note that cancellation is subject to approval from the service provider. 
            Any paid deposits may be subject to the terms and conditions of your booking.
          </Text>
        </View>
        
        {/* Cancellation Type Selection Dropdown */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Cancellation Reason
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading cancellation reasons...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: DANGER_COLOR }]}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchCancelTypes}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.dropdownContainer}>
            <TouchableOpacity 
              style={[styles.dropdownSelector, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setDropdownVisible(true)}
            >
              <Text style={{ color: colors.text }}>
                {selectedCancelType ? selectedCancelType.type : 'Select a reason'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Additional Details Input */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
          Detailed Explanation
        </Text>
        <TextInput
          style={[
            styles.reasonInput,
            { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }
          ]}
          placeholder="Please provide more details about your cancellation request..."
          placeholderTextColor={colors.textSecondary}
          value={cancelReason}
          onChangeText={setCancelReason}
          multiline
          textAlignVertical="top"
        />
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || !selectedCancelTypeId || !cancelReason.trim()) && styles.disabledButton
          ]}
          onPress={handleSubmitCancellation}
          disabled={submitting || !selectedCancelTypeId || !cancelReason.trim()}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Cancellation Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select a Reason
              </Text>
              <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={cancelTypes}
              renderItem={renderDropdownItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.dropdownList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  bookingCodeContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  bookingCodeLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  bookingCodeValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: `${DANGER_COLOR}15`,
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    alignItems: 'flex-start',
  },
  warningText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    padding: 15,
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  // Dropdown styles
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dropdownList: {
    padding: 10,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  selectedDropdownItem: {
    backgroundColor: `${PRIMARY_COLOR}20`,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  reasonInput: {
    height: 120,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: DANGER_COLOR,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CancelRequestScreen;