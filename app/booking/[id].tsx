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
  ActivityIndicator,
  TextInput,
  Dimensions
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

// Get screen dimensions for responsive design
const { width } = Dimensions.get('window');

// Define custom global interface for TypeScript
interface CustomGlobal {
  addressSelection?: {
    id: string;
    details: IAddress;
    timestamp: string;
    fullName: string;
    phone: string;
    formattedAddress: string;
  };
  selectedAddressId?: string;
  selectedAddressDetails?: IAddress;
  addressTimestamp?: string;
  currentBookingState?: {
    serviceId?: string;
    style?: string;
    price?: string;
  };
}

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
  
  // State to store the style name (for header)
  const [serviceName, setServiceName] = useState<string>(style || "");
  
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
  const [lastAddressTimestamp, setLastAddressTimestamp] = useState<string>("");
  // Add state to store service ID
  const [serviceId, setServiceId] = useState<string>(id || "");
  const [isFavorite, setIsFavorite] = useState(false);
const [favoriteLoading, setFavoriteLoading] = useState(false);
  // New state variables for the additional fields
  const [note, setNote] = useState<string>("");
  const [expectedCompletion, setExpectedCompletion] = useState<string>("");
  
  // Keep track of service info on mount and when params change
  useEffect(() => {
    // Keep track of service information in global state
    const globalData = globalThis as unknown as CustomGlobal;
    
    // Preserve service information if not already set in global state
    if (!globalData.currentBookingState || !globalData.currentBookingState.style) {
      globalData.currentBookingState = {
        serviceId: id,
        style: style
      };
    }
    
    // If we don't have style from params but have it in global state, use it
    if ((!style || style === '') && globalData.currentBookingState && globalData.currentBookingState.style) {
      // This will update UI to show the correct service name in the header
      console.log("Using style from global state:", globalData.currentBookingState.style);
      setServiceName(globalData.currentBookingState.style);
    } else if (style) {
      setServiceName(style);
    }

    // Make sure serviceId is set
    if (id) {
      setServiceId(id);
    }
  }, [id, style]);
  
  // Load address list when component mounts or when refresh key changes
  useEffect(() => {
    fetchAddresses();
  }, [addressesRefreshKey]);

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

  // Check for service name in global state when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Get global data
      const globalData = globalThis as unknown as CustomGlobal;
      
      // Check if we have service info in global state
      if (globalData.currentBookingState && globalData.currentBookingState.serviceId) {
        console.log("Found service ID in global state:", globalData.currentBookingState.serviceId);
        // Update service ID from global state
        const serviceId = globalData.currentBookingState.serviceId;
        // Save to local variable to use when calling API
        setServiceId(serviceId);
      }
    }, [])
  );
  
  // Check for address updates when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("BookingScreen focused - checking for address updates");
      
      // Safely access global state with proper typing
      const globalData = globalThis as unknown as CustomGlobal;
      
      console.log("Global state:", 
        "addressSelection:", globalData.addressSelection?.id,
        "selectedAddressId:", globalData.selectedAddressId,
        "timestamp:", globalData.addressTimestamp);
      
      // Check if there's a new address selection (using new approach first)
      if (globalData.addressTimestamp && globalData.addressTimestamp !== lastAddressTimestamp) {
        console.log("Detected new address selection with timestamp:", globalData.addressTimestamp);
        
        // Update timestamp to prevent duplicate processing
        setLastAddressTimestamp(globalData.addressTimestamp);
        
        // Handle the updated address
        if (globalData.addressSelection && globalData.addressSelection.id) {
          console.log("Using addressSelection.id from global state:", globalData.addressSelection.id);
          setSelectedAddress(globalData.addressSelection.id);
          setError(null); // Clear any errors when a new address is selected
        } 
        else if (globalData.selectedAddressId) {
          console.log("Using selectedAddressId from global state:", globalData.selectedAddressId);
          setSelectedAddress(globalData.selectedAddressId);
          setError(null); // Clear any errors when a new address is selected
        }
        
        // Refresh the address list to get any new addresses
        setAddressesRefreshKey(prev => prev + 1);
      }
      
      return () => {
        // Clean up if needed
      };
    }, [lastAddressTimestamp])
  );

  // Helper function to select default address
  const selectDefaultAddress = (addressList: IAddress[]) => {
    console.log("Selecting default address");
    const defaultAddress = addressList.find(address => address.isDefault);
    if (defaultAddress) {
      console.log("Setting default address:", defaultAddress.id);
      setSelectedAddress(defaultAddress.id);
    } else if (addressList.length > 0) {
      // If no default, select the first one
      console.log("Setting first address:", addressList[0].id);
      setSelectedAddress(addressList[0].id);
    }
  };

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
        
        // Determine which address to select
        const globalData = globalThis as unknown as CustomGlobal;
        
        if (globalData.addressSelection && globalData.addressSelection.id) {
          console.log("Using addressSelection.id from global:", globalData.addressSelection.id);
          setSelectedAddress(globalData.addressSelection.id);
        }
        else if (globalData.selectedAddressId) {
          console.log("Using selectedAddressId from global:", globalData.selectedAddressId);
          setSelectedAddress(globalData.selectedAddressId);
        }
        else if (selectedAddressIdParam) {
          console.log("Using selectedAddressId from params:", selectedAddressIdParam);
          setSelectedAddress(selectedAddressIdParam);
        }
        else if (selectedAddress) {
          // Check if current selection still exists in the new address list
          const addressExists = fetchedAddresses.some(address => address.id === selectedAddress);
          if (addressExists) {
            console.log("Keeping current selection:", selectedAddress);
          } else {
            // If selected address no longer exists, select default or first
            selectDefaultAddress(fetchedAddresses);
          }
        }
        else {
          // No selection yet, select default or first
          selectDefaultAddress(fetchedAddresses);
        }
      } else if (Array.isArray(fetchedAddresses) && fetchedAddresses.length === 0) {
        // No addresses available
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

  // Save service info when navigating to address screen
  const handleSelectAddress = () => {
    // Reset error when selecting a new address
    setError(null);
    
    // Save current state to global variables for retrieval when returning
    const globalData = globalThis as unknown as CustomGlobal;
    globalData.currentBookingState = {
      serviceId: serviceId || id,
      style: serviceName // Use serviceName instead of style
    };
    
    // Clear any old address selection to prevent confusion
    globalData.selectedAddressId = undefined;
    globalData.addressSelection = undefined;
    
    // Navigate to address list using simple path
    router.push({
      pathname: "/screens/address/address-list",
      params: { 
        fromBooking: "true", 
        currentAddressId: selectedAddress || "",
        id: id || "",
        style: serviceName || "", // Use serviceName
        // Add a timestamp to ensure params change triggers useEffect
        timestamp: Date.now().toString()
      }
    });
  };

  // Handle booking
  const handleBooking = async () => {
    // Clear all previous errors
    setError(null);
    
    // Get the current service ID from state or global state
    const currentServiceId = serviceId || 
      (globalThis as unknown as CustomGlobal).currentBookingState?.serviceId || 
      id;
    
    console.log("Using service ID for booking:", currentServiceId);
    
    // Validate service ID
    if (!currentServiceId) {
      console.error("Invalid service ID: service ID is missing");
      setError("Invalid service ID. Please try selecting the service again.");
      return;
    }
    
    // Convert to number and check if it's valid
    const numericServiceId = Number(currentServiceId);
    if (isNaN(numericServiceId)) {
      console.error("Invalid service ID:", currentServiceId);
      setError("Invalid service ID. Please try selecting the service again.");
      return;
    }
    
    // Validate address
    if (!selectedAddress) {
      setError("Please add a shipping address before proceeding");
      // Navigate to add address screen
      router.push("/screens/address/add-address");
      return;
    }
    
    // Get current date for validation
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
  
      // Prepare booking data - make sure all fields are properly set
      const bookingData: IBookingRequest = {
        decorServiceId: numericServiceId,
        addressId: Number(selectedAddress),
        surveyDate: surveyDate.toISOString().split('T')[0],
        note: note.trim() !== "" ? note : undefined,
        expectedCompletion: expectedCompletion.trim() !== "" ? expectedCompletion : undefined
      };
      
      console.log("Sending booking data:", bookingData);
  
      // Call booking API
      const response = await createBookingAPI(bookingData);
      console.log("Full response:", JSON.stringify(response));
      console.log("response.success:", response.success);
      console.log("response.data:", response.data);
      console.log("typeof response:", typeof response);
      // Handle response
      if (response.success && response.data) {
        // Refresh addresses to get any potential new addresses
        await fetchAddresses();
        
        Alert.alert(
          "✅ Booking Successful",
          `Booking Details:
          
        - ID: ${response.data.id}
        - Code: ${response.data.bookingCode || 'N/A'}
        ${response.data.decorService ? `• Service: ${response.data.decorService.style}` : ''}
        ${response.data.timeSlots && response.data.timeSlots.length > 0 ? 
          `• Date: ${new Date(response.data.timeSlots[0].surveyDate).toLocaleDateString()}` : ''}
        
        Thank you for your booking!`,
          [
            {
              text: "Return to Home",
              onPress: () => router.push("/"),
              style: "default"
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

  // Render address section with enhanced design
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
          <View style={[styles.addressIconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="location" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.noAddressText, { color: colors.text }]}>Add Shipping Address</Text>
          <View style={styles.iconWrapper}>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </View>
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
              borderColor: hasAddressError ? colors.error : 'transparent',
              borderWidth: hasAddressError ? 2 : 0,
              elevation: hasAddressError ? 0 : 2,
            }
          ]} 
          onPress={handleSelectAddress}
          testID="selected-address-container"
        >
          <View style={[styles.addressIconContainer, { backgroundColor: `${colors.primary}15` }]}>
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
            
            {/* Display the address ID in small font for debugging */}
            <Text style={[styles.addressDebug, { color: colors.textSecondary }]}>ID: {selectedAddressObj.id}</Text>
          </View>
          <View style={styles.iconWrapper}>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={hasAddressError ? colors.error : colors.textSecondary} 
            />
          </View>
        </TouchableOpacity>
        
        {/* If there's an address-specific error, add the Choose Different Address button */}
        {hasAddressError && (
          <TouchableOpacity 
            style={[styles.chooseAddressButton, { backgroundColor: colors.error }]} 
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
        <View style={[styles.header, { 
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
          shadowColor: colors.text,
        }]}>
          {/* <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backButton, { backgroundColor: `${colors.primary}10` }]}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity> */}
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Book Service
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>
              {serviceName}
            </Text>
          </View>
          <View style={styles.spacer} />
        </View>

        {/* Main content wrapper */}
        <View style={styles.contentWrapper}>
          {/* Address Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitleText, { color: colors.text }]}>
                Shipping Address
              </Text>
            </View>
            {renderAddressSection()}
          </View>

          {/* Booking Form - With improved UI */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitleText, { color: colors.text }]}>
                Booking Details
              </Text>
            </View>
            
            <View style={[styles.formContainer, { 
              backgroundColor: colors.card,
              shadowColor: colors.text,
            }]}>
              {/* Survey Date */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} /> 
                  {" "}Survey Date
                </Text>
                <TouchableOpacity 
                  style={[styles.dateInput, { 
                    borderColor: colors.border,
                    backgroundColor: `${colors.primary}10`,
                  }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons 
                    name="calendar" 
                    size={20} 
                    color={colors.primary} 
                    style={styles.inputIcon}
                  />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {surveyDate.toLocaleDateString()}
                  </Text>
                  <Ionicons 
                    name="chevron-down" 
                    size={20} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>

                {/* Custom Calendar Picker */}
                <CalendarPicker
                  selectedDate={surveyDate}
                  onSelectDate={onDateChange}
                  isVisible={showDatePicker}
                  onClose={() => setShowDatePicker(false)}
                />
              </View>
              
              {/* Expected Completion */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  <Ionicons name="time-outline" size={18} color={colors.primary} /> 
                  {" "}Expected Completion
                </Text>
                <View style={[styles.textInputWrapper, { 
                  borderColor: colors.border,
                  backgroundColor: `${colors.primary}10`,
                }]}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={colors.primary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { 
                      color: colors.text,
                    }]}
                    placeholder="When do you expect this to be completed?"
                    placeholderTextColor={colors.textSecondary}
                    value={expectedCompletion}
                    onChangeText={setExpectedCompletion}
                  />
                </View>
              </View>
              
              {/* Notes */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  <Ionicons name="document-text-outline" size={18} color={colors.primary} /> 
                  {" "}Additional Notes
                </Text>
                <View style={[styles.textAreaWrapper, { 
                  borderColor: colors.border,
                  backgroundColor: `${colors.primary}10`,
                }]}>
                  <Ionicons 
                    name="create-outline" 
                    size={20} 
                    color={colors.primary} 
                    style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 12 }]}
                  />
                  <TextInput
                    style={[styles.textAreaInput, { 
                      color: colors.text,
                    }]}
                    placeholder="Add any specific requirements or notes"
                    placeholderTextColor={colors.textSecondary}
                    value={note}
                    onChangeText={setNote}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          </View>
          
          {/* Display any errors */}
          {error && (
            <View style={[styles.errorContainer, { borderLeftColor: colors.error }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} style={styles.errorIcon} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
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
                backgroundColor: loading || !selectedAddress ? colors.textSecondary : colors.primary,
                opacity: loading || !selectedAddress ? 0.7 : 1,
                elevation: loading || !selectedAddress ? 0 : 4,
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
        </View>
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
  // Enhanced header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  spacer: {
    width: 40,
  },
  contentWrapper: {
    padding: 16,
  },
  // Section styling
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Enhanced address container
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addressIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    marginBottom: 4,
  },
  addressFull: {
    fontSize: 14,
  },
  addressDebug: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.5,
  },
  noAddressText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
  },
  iconWrapper: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Form styles
  formContainer: {
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 0,
    padding: 12,
    height: 50,
  },
  dateText: {
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  // Enhanced text input styles
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0,
    padding: 4,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    height: 46,
  },
  textAreaWrapper: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 0,
    padding: 8,
    paddingHorizontal: 12,
  },
  textAreaInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputIcon: {
    marginRight: 8,
  },
  
  // Enhanced button styles
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  chooseAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    marginBottom: 16,
    padding: 10,
    borderRadius: 8,
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
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Enhanced status messages
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffebee',
    marginBottom: 16,
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  errorIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 14,
    borderRadius: 8,
  },
  noteText: {
    fontSize: 14,
    flex: 1,
  },
});
export default BookingScreen;