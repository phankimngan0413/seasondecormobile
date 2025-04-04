import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { createBookingAPI, IBookingRequest } from "@/utils/bookingAPI";
import { getAddressesAPI, IAddress } from "@/utils/addressAPI";
import { getToken } from "@/services/auth";
import TimePicker from "@/components/ui/TimePicker";

// Import custom date and time pickers
import CalendarPicker from "@/components/CalendarPicker";

const BookingScreen = () => {
  // Get service information from route params
  const params = useLocalSearchParams();
  const id = params.id as string;
  const style = params.style as string;
  const price = params.price as string;
  
  // Get the selectedAddressId from params (will update when coming back from address list)
  const selectedAddressIdParam = params.selectedAddressId as string | undefined;
  const timestamp = params.timestamp; // Used to trigger useEffect when coming back from address list
  
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  // Add error state to track any booking errors
  const [error, setError] = useState<string | null>(null);
  
  // Set minimum date to today for the calendar
  const minDate = new Date();

  // Form booking state management
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [surveyDate, setSurveyDate] = useState(new Date());
  const [surveyTime, setSurveyTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load address list when component mounts
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Update selected address when the parameter changes (coming back from address list)
  useEffect(() => {
    console.log("Params changed, selectedAddressId:", selectedAddressIdParam, "timestamp:", timestamp);
    if (selectedAddressIdParam) {
      setSelectedAddress(selectedAddressIdParam);
    }
  }, [selectedAddressIdParam, timestamp]);

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      setAddressesLoading(true);
      const token = await getToken();
      if (!token) {
        Alert.alert("Error", "Please log in to continue");
        router.push("/login");
        return;
      }

      const fetchedAddresses = await getAddressesAPI();
      console.log("Fetched addresses:", fetchedAddresses);
      
      if (Array.isArray(fetchedAddresses) && fetchedAddresses.length > 0) {
        setAddresses(fetchedAddresses);
        
        // If we got a selectedAddressId from params, use that
        if (selectedAddressIdParam) {
          setSelectedAddress(selectedAddressIdParam);
        }
        // Otherwise, default to default address or first address
        else {
          // Automatically select default address if available
          const defaultAddress = fetchedAddresses.find(address => address.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress.id);
          } else {
            // If no default, select the first one
            setSelectedAddress(fetchedAddresses[0].id);
          }
        }
      } else if (Array.isArray(fetchedAddresses) && fetchedAddresses.length === 0) {
        // No addresses available, prompt user to add a new address
        Alert.alert(
          "No Addresses Found",
          "You need to add an address before booking.",
          [
            {
              text: "Add Address",
              onPress: () => {
                // Navigate to add address screen
                router.push("/screens/address/add-address");
              }
            },
            {
              text: "Cancel",
              onPress: () => router.back(),
              style: "cancel"
            }
          ]
        );
      }
    } catch (error) {
      console.error("Address loading error:", error);
      setError("Unable to load address list. Please try again.");
    } finally {
      setAddressesLoading(false);
    }
  };

  // Handle date change
  const onDateChange = (selectedDate: Date) => {
    setSurveyDate(selectedDate);
    setShowDatePicker(false);
  };

  // Handle time select
  const handleTimeSelect = (selectedTime: Date) => {
    setSurveyTime(selectedTime);
    setShowTimePicker(false);
  };

  // Handle booking
  const handleBooking = async () => {
    // Form validation
    if (!selectedAddress) {
      Alert.alert("Notification", "Please select an address");
      return;
    }
    
    // Validate date (must be today or future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (surveyDate < today) {
      Alert.alert("Invalid Date", "Please select today or a future date");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Booking data - Chuyển đổi kiểu dữ liệu sang số
      const bookingData: IBookingRequest = {
        decorServiceId: Number(id),
        addressId: Number(selectedAddress),
        surveyDate: surveyDate.toISOString().split('T')[0], // Format YYYY-MM-DD
        surveyTime: surveyTime.toTimeString().split(' ')[0] // Format HH:mm:ss
      };

      console.log("Sending booking data:", bookingData);

      // Call booking API
      const response = await createBookingAPI(bookingData);

      // Handle response
      if (response.success && response.booking) {
        Alert.alert(
          "Booking Successful", 
          `Booking ID: ${response.booking.id}. We will contact you shortly`,
          [
            {
              text: "Home",
              onPress: () => router.push("/"),
              style: "default"
            },
            {
              text: "View Details",
              onPress: () => {
                try {
                  if (response.booking && response.booking.id) {
                    // Use simple string URL for safer navigation
                    router.push(`/booking/${response.booking.id}`);
                  } else {
                    // Fallback if booking id is not available
                    console.log("Booking ID not available");
                    router.push("/");
                  }
                } catch (error) {
                  console.error("Navigation error:", error);
                  // Safe fallback
                  router.push("/");
                }
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Unable to book service");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      const errorMessage = err.message || "Unable to book service. Please try again.";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle select address - Navigate to address list
  const handleSelectAddress = () => {
    router.push({
      pathname: "/screens/address/address-list",
      params: { 
        fromBooking: "true", 
        currentAddressId: selectedAddress || "" 
      }
    });
  };

  // Get the selected address object
  const getSelectedAddressObject = () => {
    if (!selectedAddress) return null;
    return addresses.find(address => address.id === selectedAddress) || null;
  };

  // Format address for display
  const formatAddress = (address: IAddress): string => {
    const parts = [
      address.detail,
      address.street,
      address.ward,
      address.district,
      address.province
    ].filter(Boolean);
    
    return parts.join(", ");
  };

  // Render address section similar to checkout
  const renderAddressSection = () => {
    if (addressesLoading) {
      return (
        <View style={[styles.addressContainer, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading addresses...
          </Text>
        </View>
      );
    }

    const selectedAddressObj = getSelectedAddressObject();

    if (!selectedAddressObj) {
      return (
        <TouchableOpacity 
          style={[styles.addressContainer, { backgroundColor: colors.card }]} 
          onPress={() => router.push("/screens/address/add-address")}
        >
          <View style={styles.addressIconContainer}>
            <Ionicons name="location" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.noAddressText, { color: colors.text }]}>Add Shipping Address</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    const fullAddress = formatAddress(selectedAddressObj);
    
    return (
      <TouchableOpacity 
        style={[styles.addressContainer, { backgroundColor: colors.card }]} 
        onPress={handleSelectAddress}
      >
        <View style={styles.addressIconContainer}>
          <Ionicons name="location" size={24} color={colors.primary} />
        </View>
        <View style={styles.addressDetails}>
          <Text style={[styles.addressName, { color: colors.text }]}>{selectedAddressObj.fullName}</Text>
          <Text style={[styles.addressPhone, { color: colors.textSecondary }]}>{selectedAddressObj.phone}</Text>
          <Text style={[styles.addressFull, { color: colors.textSecondary }]}>{fullAddress}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Book Service: {style}
          </Text>
          <View style={styles.spacer} />
        </View>

        {/* Address Section */}
        <View style={styles.sectionTitle}>
          <Text style={[styles.sectionTitleText, { color: colors.text }]}>Shipping Address</Text>
        </View>
        {renderAddressSection()}

        {/* Booking Form */}
        <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
          {/* Survey Date */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} /> 
              {" "}Survey Date
            </Text>
            <TouchableOpacity 
              style={[styles.dateInput, { borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                {surveyDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {/* Custom Calendar Picker */}
            <CalendarPicker
              selectedDate={surveyDate}
              onSelectDate={onDateChange}
              isVisible={showDatePicker}
              onClose={() => setShowDatePicker(false)}
            />
          </View>

          {/* Survey Time */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              <Ionicons name="time-outline" size={18} color={colors.primary} /> 
              {" "}Survey Time
            </Text>
            <TouchableOpacity 
              style={[styles.dateInput, { borderColor: colors.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                {surveyTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Service Cost */}
          <View style={[styles.priceContainer, { borderTopColor: colors.border }]}>
            <Text style={[styles.priceLabel, { color: colors.text }]}>
              Total Cost
            </Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>
              {Number(price || 0).toLocaleString()} ₫
            </Text>
          </View>
        </View>

        {/* Custom Time Picker Modal */}
        <TimePicker
          visible={showTimePicker}
          initialTime={surveyTime}
          onTimeSelect={handleTimeSelect}
          onCancel={() => setShowTimePicker(false)}
        />
        
        {/* Display any errors */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: `${colors.error}10` }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Book Service Button */}
        <TouchableOpacity 
          style={[
            styles.bookButton, 
            { 
              backgroundColor: loading || !selectedAddress ? colors.card : colors.primary,
              opacity: loading || !selectedAddress ? 0.5 : 1
            }
          ]}
          onPress={handleBooking}
          disabled={loading || !selectedAddress}
        >
          {loading ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator size="small" color={colors.text} />
              <Text style={[styles.bookButtonText, { color: colors.text }]}>
                Processing...
              </Text>
            </View>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  // Section title
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Address Section styled like checkout
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 10,
  },
  addressIconContainer: {
    marginRight: 15,
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  addressPhone: {
    fontSize: 14,
    marginBottom: 4,
  },
  addressFull: {
    fontSize: 14,
  },
  noAddressText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
  },
  // Old form styles
  formContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: 'red',
  },
  errorText: {
    fontSize: 14,
  },
});

export default BookingScreen;