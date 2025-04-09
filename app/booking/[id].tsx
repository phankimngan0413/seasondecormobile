import React, { useState, useEffect, useCallback } from "react";
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
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { createBookingAPI, IBookingRequest } from "@/utils/bookingAPI";
import { getAddressesAPI, IAddress } from "@/utils/AddressAPI";
import { getToken } from "@/services/auth";

// Import custom date picker
import CalendarPicker from "@/components/CalendarPicker";

// Extend the global namespace to include your custom properties
declare global {
  var selectedAddressId: string | undefined;
  var addressTimestamp: string | undefined;
  var currentBookingState: {
    serviceId?: string;
    style?: string;
    price?: string;
  } | undefined;
}

export {};

const BookingScreen = () => {
  // Get service information from route params
  const params = useLocalSearchParams();
  const id = params.id as string;
  const style = params.style as string;
  
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressesRefreshKey, setAddressesRefreshKey] = useState(0); // Add a refresh key for addresses

  useFocusEffect(
    useCallback(() => {
      // Always refresh the address list when the screen is focused
      fetchAddresses();
      
      // Check if we have address data in global state (from address list)
      if (global.selectedAddressId) {
        setSelectedAddress(global.selectedAddressId);
        
        // Clear the global state to avoid confusion in future navigations
        global.selectedAddressId = undefined;
        global.addressTimestamp = undefined;
      }
      
      // Clear errors when returning to the screen
      setError(null);
      
      return () => {
        // Clean up any subscriptions or pending operations when screen loses focus
      };
    }, [])
  );
  
  // Load address list when component mounts or when refresh key changes
  useEffect(() => {
    fetchAddresses();
  }, [addressesRefreshKey]);

  // Add focus effect to detect returning from address list
  useFocusEffect(
    useCallback(() => {
      console.log("BookingScreen focused");
      
      // Check if we have address data in global state (from address list)
      if (global.selectedAddressId) {
        console.log("Screen focused: Found address in global state:", global.selectedAddressId);
        setSelectedAddress(global.selectedAddressId);
        setError(null); // Clear any errors when a new address is selected
        
        // Clear the global state to avoid confusion in future navigations
        global.selectedAddressId = undefined;
        global.addressTimestamp = undefined;
        
        // Refresh the address list to get any new addresses
        setAddressesRefreshKey(prev => prev + 1);
      }
      
      return () => {
        // Clean up any subscriptions or pending operations when screen loses focus
      };
    }, [])
  );

  // Update selected address when the parameter changes (coming back from address list)
  useEffect(() => {
    console.log("Params changed, selectedAddressId:", selectedAddressIdParam, "timestamp:", timestamp);
    if (selectedAddressIdParam) {
      setSelectedAddress(selectedAddressIdParam);
      setError(null); // Clear any errors when a new address is selected
      // Also refresh the address list
      setAddressesRefreshKey(prev => prev + 1);
    }
  }, [selectedAddressIdParam, timestamp]);

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      setAddressesLoading(true);
      const token = await getToken();
      if (!token) {
        setError("Please log in to continue");
        router.push("/login");
        return;
      }

      const fetchedAddresses = await getAddressesAPI();
      console.log("Fetched addresses:", fetchedAddresses);
      
      if (Array.isArray(fetchedAddresses) && fetchedAddresses.length > 0) {
        setAddresses(fetchedAddresses);
        
        // If we got a selectedAddressId from params or global state, use that
        if (selectedAddress) {
          // Keep existing selection
          
          // But validate it exists in the new address list
          const addressExists = fetchedAddresses.some(address => address.id === selectedAddress);
          if (!addressExists) {
            // If selected address no longer exists, select default or first
            const defaultAddress = fetchedAddresses.find(address => address.isDefault);
            if (defaultAddress) {
              setSelectedAddress(defaultAddress.id);
            } else {
              setSelectedAddress(fetchedAddresses[0].id);
            }
          }
        } 
        else if (global.selectedAddressId) {
          setSelectedAddress(global.selectedAddressId);
          // Clear global state after using
          global.selectedAddressId = undefined;
        }
        else if (selectedAddressIdParam) {
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
        // No addresses available, but we won't show an alert
        // The user will see the "Add Shipping Address" button in the UI
        setAddresses([]);
        setSelectedAddress(null);
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
    const now = new Date();
    setError(null); // Clear any errors
    
    // Set the time component of now to 00:00:00 for date-only comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If selected date is before today, use today instead and show inline error
    if (selectedDate < today) {
      setError("You cannot select a date in the past. Today's date has been selected.");
      setSurveyDate(today);
    } else {
      setSurveyDate(selectedDate);
    }
    
    setShowDatePicker(false);
  };

  // Handle booking
  const handleBooking = async () => {
    // Clear all previous errors
    setError(null);
    
    // Form validation
    if (!selectedAddress) {
      setError("Please add a shipping address before proceeding");
      // Navigate to add address screen
      router.push("/screens/address/add-address");
      return;
    }
    
    // Get current date and time
    const now = new Date();
    
    // Create a date object that combines selected date and current time
    const selectedDateTime = new Date(
      surveyDate.getFullYear(),
      surveyDate.getMonth(),
      surveyDate.getDate(),
      now.getHours(),
      now.getMinutes()
    );
  
    // Check if the date is in the past
    if (surveyDate < now) {
      setError("The selected date cannot be in the past. Please select a future date.");
      return;
    }
  
    try {
      setLoading(true);
  
      // Booking data - Convert data types to numbers
      const bookingData: IBookingRequest = {
        decorServiceId: Number(id),
        addressId: Number(selectedAddress),
        surveyDate: surveyDate.toISOString().split('T')[0] // Format YYYY-MM-DD
      };
  
      console.log("Sending booking data:", bookingData);
  
      // Call booking API
      const response = await createBookingAPI(bookingData);
  
      // Handle response
      if (response.success && response.booking) {
        // Refresh addresses to get any potential new addresses
        await fetchAddresses();
        
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
                    // Use simple navigation without complex objects
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
        // Use the exact error message from the backend
        setError(response.message || "Unable to book service");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      
      // Extract the exact error message from the error object
      let errorMessage = "Unable to book service. Please try again.";
      
      // Check if the error object contains a structured response from the backend
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // If the error is in JSON string format, try to parse it
      if (typeof errorMessage === 'string' && errorMessage.startsWith('{') && errorMessage.endsWith('}')) {
        try {
          const parsedError = JSON.parse(errorMessage);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        } catch (e) {
          // If parsing fails, keep the original message
          console.log("Error parsing error message:", e);
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectAddress = () => {
    // Reset error when selecting a new address
    setError(null);
    
    // Save current state to global variables for retrieval when returning
    global.currentBookingState = {
      serviceId: id,
      style
    };
    
    // Navigate to address list using simple path
    router.push({
      pathname: "/screens/address/address-list",
      params: { 
        fromBooking: "true", 
        currentAddressId: selectedAddress || "",
        id: id || "",
        style: style || ""
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

  // Check if error is related to address
  const isAddressError = (errorMessage: string | null): boolean => {
    if (!errorMessage) return false;
    return errorMessage.toLowerCase().includes("address");
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
    const hasAddressError = error && isAddressError(error);

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
      <>
        <TouchableOpacity 
          style={[
            styles.addressContainer, 
            { 
              backgroundColor: colors.card,
              borderColor: hasAddressError ? colors.error : colors.border,
              borderWidth: hasAddressError ? 1 : 0
            }
          ]} 
          onPress={handleSelectAddress}
        >
          <View style={styles.addressIconContainer}>
            <Ionicons 
              name="location" 
              size={24} 
              color={hasAddressError ? colors.error : colors.primary} 
            />
          </View>
          <View style={styles.addressDetails}>
            <Text style={[styles.addressName, { color: colors.text }]}>{selectedAddressObj.fullName}</Text>
            <Text style={[styles.addressPhone, { color: colors.textSecondary }]}>{selectedAddressObj.phone}</Text>
            <Text style={[styles.addressFull, { color: colors.textSecondary }]}>{fullAddress}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={hasAddressError ? colors.error : colors.textSecondary} />
        </TouchableOpacity>
        
        {/* If there's an address-specific error, add the Choose Different Address button */}
        {hasAddressError && (
          <TouchableOpacity 
            style={styles.chooseAddressButton} 
            onPress={handleSelectAddress}
          >
            <Ionicons name="swap-horizontal" size={18} color="#fff" style={{ marginRight: 5 }} />
            <Text style={styles.chooseAddressButtonText}>Choose Different Address</Text>
          </TouchableOpacity>
        )}
      </>
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

        {/* Booking Form - Only Date Picker */}
        <View style={styles.sectionTitle}>
          <Text style={[styles.sectionTitleText, { color: colors.text }]}>Booking Details</Text>
        </View>
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
        </View>
        
        {/* Display any errors */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#dc3545" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Add Address Note if no address is available */}
        {!selectedAddress && !addressesLoading && (
          <View style={[styles.noteContainer, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.noteText, { color: colors.text }]}>
              Please add a shipping address to continue with your booking
            </Text>
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
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.bookButtonText}>
                Processing...
              </Text>
            </View>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.bookButtonText}>
                {!selectedAddress ? "Add Address" : "Confirm Booking"}
              </Text>
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
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 8,
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
  // Form styles
  formContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  chooseAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#F44336',
  },
  chooseAddressButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffebee',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    flex: 1,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    fontSize: 14,
    flex: 1,
  },
});

export default BookingScreen;