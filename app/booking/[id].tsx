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
import { getAddressesAPI, IAddress } from "@/utils/AddressAPI";
import { getToken } from "@/services/auth";
import CalendarPicker from "@/components/CalendarPicker";
import { initApiClient } from "@/config/axiosConfig";

// Get screen dimensions for responsive design
const { width } = Dimensions.get('window');
const apiClient = "http://10.0.2.2:5297";

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
    bookingData?: {
      decorServiceId: number;
      addressId: number;
      surveyDate: string;
      note?: string;
      serviceName: string;
      selectedAddressDetails?: any;
    };
  };
}

const BookingScreen = () => {
  // Get service information from route params
  const params = useLocalSearchParams();
  const id = params.id as string;
  const style = params.style as string;
  const selectedAddressIdParam = params.selectedAddressId as string | undefined;
  const timestamp = params.timestamp;
  
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  // State management
  const [error, setError] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState<string>(style || "");
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [surveyDate, setSurveyDate] = useState(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickBookingLoading, setQuickBookingLoading] = useState(false);
  const [addressesRefreshKey, setAddressesRefreshKey] = useState(0);
  const [lastAddressTimestamp, setLastAddressTimestamp] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>(id || "");
  const [note, setNote] = useState<string>("");
  
  // Set minimum date to tomorrow (next day after today)
  const minDate = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  })();

  // Format date with text month (e.g., "May 7, 2025")
  const formatDateWithTextMonth = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };
  
  // Keep track of service info on mount and when params change
  useEffect(() => {
    const globalData = globalThis as unknown as CustomGlobal;
    
    if (!globalData.currentBookingState || !globalData.currentBookingState.style) {
      globalData.currentBookingState = {
        serviceId: id,
        style: style
      };
    }
    
    if ((!style || style === '') && globalData.currentBookingState?.style) {
      setServiceName(globalData.currentBookingState.style);
    } else if (style) {
      setServiceName(style);
    }

    if (id) {
      setServiceId(id);
    }
  }, [id, style]);
  
  // Load address list when component mounts or when refresh key changes
  useEffect(() => {
    fetchAddresses();
  }, [addressesRefreshKey]);

  // Update selected address when the parameter changes
  useEffect(() => {
    if (selectedAddressIdParam) {
      setSelectedAddress(selectedAddressIdParam);
      setError(null);
      setAddressesRefreshKey(prev => prev + 1);
    }
  }, [selectedAddressIdParam, timestamp]);

  // Check for service name in global state when screen is focused
  useFocusEffect(
    useCallback(() => {
      const globalData = globalThis as unknown as CustomGlobal;
      console.log("URL Param ID:", id);
      console.log("Global State ID:", serviceId);
      
      // Prioritize URL param over global state
      if (id) {
        setServiceId(id);
        if (globalData.currentBookingState) {
          globalData.currentBookingState.serviceId = id;
        } else {
          globalData.currentBookingState = { serviceId: id };
        }
      } else if (globalData.currentBookingState?.serviceId) {
        setServiceId(globalData.currentBookingState.serviceId);
      }
    }, [id])
  );
  
  // Check for address updates when screen is focused
  useFocusEffect(
    useCallback(() => {
      const globalData = globalThis as unknown as CustomGlobal;
      
      if (globalData.addressTimestamp && globalData.addressTimestamp !== lastAddressTimestamp) {
        setLastAddressTimestamp(globalData.addressTimestamp);
        
        if (globalData.addressSelection?.id) {
          setSelectedAddress(globalData.addressSelection.id);
          setError(null);
        } else if (globalData.selectedAddressId) {
          setSelectedAddress(globalData.selectedAddressId);
          setError(null);
        }
        
        setAddressesRefreshKey(prev => prev + 1);
      }
      
      return () => {
        // Cleanup if needed
      };
    }, [lastAddressTimestamp])
  );

  // Helper function to select default address
  const selectDefaultAddress = (addressList: IAddress[]) => {
    const defaultAddress = addressList.find(address => address.isDefault);
    if (defaultAddress) {
      setSelectedAddress(defaultAddress.id);
    } else if (addressList.length > 0) {
      setSelectedAddress(addressList[0].id);
    }
  };

  // Fetch addresses with improved error handling
  const fetchAddresses = async () => {
    try {
      setAddressesLoading(true);
      setError(null); // Clear previous errors
      
      const token = await getToken();
      if (!token) {
        setError("Please log in to continue");
        router.push("/login");
        return;
      }

      const fetchedAddresses = await getAddressesAPI();
      
      if (Array.isArray(fetchedAddresses) && fetchedAddresses.length > 0) {
        setAddresses(fetchedAddresses);
        
        const globalData = globalThis as unknown as CustomGlobal;
        
        if (globalData.addressSelection?.id) {
          setSelectedAddress(globalData.addressSelection.id);
        } else if (globalData.selectedAddressId) {
          setSelectedAddress(globalData.selectedAddressId);
        } else if (selectedAddressIdParam) {
          setSelectedAddress(selectedAddressIdParam);
        } else if (selectedAddress) {
          const addressExists = fetchedAddresses.some(address => address.id === selectedAddress);
          if (!addressExists) {
            selectDefaultAddress(fetchedAddresses);
          }
        } else {
          selectDefaultAddress(fetchedAddresses);
        }
      } else if (Array.isArray(fetchedAddresses) && fetchedAddresses.length === 0) {
        setAddresses([]);
        setSelectedAddress(null);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setError("Unable to load address list. Please try again.");
    } finally {
      setAddressesLoading(false);
    }
  };

  // Handle date change with improved validation (must be at least tomorrow)
  const onDateChange = (selectedDate: Date) => {
    const now = new Date();
    setError(null);
    
    // Calculate tomorrow's date
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    if (selectedDate < tomorrow) {
      setError("Survey date must be at least one day from today. Tomorrow's date has been selected.");
      setSurveyDate(tomorrow);
    } else {
      const normalizedDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        0, 0, 0, 0
      );
      setSurveyDate(normalizedDate);
    }
    
    setShowDatePicker(false);
  };

  // Save service info when navigating to address screen
  const handleSelectAddress = () => {
    setError(null);
    
    const globalData = globalThis as unknown as CustomGlobal;
    globalData.currentBookingState = {
      serviceId: serviceId || id,
      style: serviceName
    };
    
    globalData.selectedAddressId = undefined;
    globalData.addressSelection = undefined;
    
    router.push({
      pathname: "/screens/address/address-list",
      params: { 
        fromBooking: "true", 
        currentAddressId: selectedAddress || "",
        id: id || "",
        style: serviceName || "",
        timestamp: Date.now().toString()
      }
    });
  };

  // Format date for API with proper timezone handling
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Validate basic booking requirements
  const validateBookingData = () => {
    // Validate service ID
    const currentServiceId = id || serviceId || 
      (globalThis as unknown as CustomGlobal).currentBookingState?.serviceId;
    
    if (!currentServiceId) {
      setError("Invalid service ID. Please try selecting the service again.");
      return null;
    }
    
    // Validate address
    if (!selectedAddress) {
      setError("Please add a shipping address before proceeding");
      router.push("/screens/address/add-address");
      return null;
    }
    
    // Validate survey date (must be at least tomorrow)
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    if (surveyDate < tomorrow) {
      setError("Survey date must be at least one day from today. Please select a future date.");
      return null;
    }

    return {
      decorServiceId: Number(currentServiceId),
      addressId: Number(selectedAddress),
      surveyDate: formatDateForAPI(surveyDate),
      note: note.trim() || undefined,
      serviceName: serviceName,
      selectedAddressDetails: getSelectedAddressObject()
    };
  };

  // Navigation to survey form with detailed questionnaire
  const handleProceedToSurvey = () => {
    setError(null);
    
    const bookingData = validateBookingData();
    if (!bookingData) return;
    
    // Save to global state
    const globalData = globalThis as unknown as CustomGlobal;
    globalData.currentBookingState = {
      ...globalData.currentBookingState,
      bookingData: bookingData
    };
    
    // Navigate to Survey Form
    router.push({
      pathname: "/booking/survey-form",
      params: {
        decorServiceId: bookingData.decorServiceId.toString(),
        addressId: bookingData.addressId.toString(),
        surveyDate: bookingData.surveyDate,
        serviceName: serviceName,
        note: note || ""
      }
    });
  };

  // Quick booking without detailed survey - direct API call
  const handleQuickBooking = async () => {
    setError(null);
    setQuickBookingLoading(true);
    
    try {
      const bookingData = validateBookingData();
      if (!bookingData) {
        setQuickBookingLoading(false);
        return;
      }

      // Alternative: Try using createBookingAPI with minimal object
      try {
        const { createBookingAPI } = await import("@/utils/bookingAPI");
        
        // Create object with only user inputs and empty arrays/strings for rest
        const minimalRequest = {
          decorServiceId: bookingData.decorServiceId,
          addressId: bookingData.addressId,
          surveyDate: bookingData.surveyDate,
          note: bookingData.note || '',
          images: [],
          // Try with empty/null values that might not trigger validation
          decorationStyleId: null,
          roomSize: null,
          scopeOfWorkId: null,
          themeColorIds: [],
          spaceStyle: '',
          style: '',
          themeColor: '',
          primaryUser: '',
          estimatedBudget: null
        } as any;

        console.log('🔄 Trying createBookingAPI with minimal request');
        const apiResponse = await createBookingAPI(minimalRequest);
        
        if (apiResponse && apiResponse.success) {
          console.log('✅ Success with createBookingAPI');
          
          Alert.alert(
            "🎉 Booking Successful!", 
            `Your booking has been confirmed!\n\n• Service: ${serviceName}\n• Date: ${formatDateWithTextMonth(surveyDate)}\n• Quick booking completed\n\nOur team will contact you within 24 hours to confirm details.`,
            [
              {
                text: "View My Bookings",
                onPress: () => router.replace('/screens/Bookings')
              }
            ]
          );
          return; // Exit successfully
        }
      } catch (apiError) {
        console.log('❌ createBookingAPI failed, trying direct fetch...');
      }

      // Fallback to direct fetch if createBookingAPI fails
      // Use direct API call instead of createBookingAPI to avoid validation
      const token = await getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Use fixed API URL - adjust as needed

      // Create FormData - try different approach for problematic fields
      const formData = new FormData();
      formData.append('DecorServiceId', bookingData.decorServiceId.toString());
      formData.append('AddressId', bookingData.addressId.toString());
      formData.append('SurveyDate', bookingData.surveyDate);
      formData.append('Note', bookingData.note || '');
      
      // Fields that can be empty
      formData.append('EstimatedBudget', '');
      formData.append('SpaceStyle', '');
      formData.append('PrimaryUser', '');
      formData.append('Style', '');
      formData.append('ThemeColor', '');
      formData.append('RoomSize', '');
      formData.append('DecorationStyleId', '');
      
      // Try minimal values for fields that don't accept empty strings
      formData.append('ScopeOfWorkId', '1'); // Minimal scope
      formData.append('ThemeColorIds', '1'); // Minimal color ID
      
      console.log('🚀 Quick booking FormData with minimal required values');
      console.log('🌐 API URL:', `${apiClient}/api/Booking/create`);
      console.log('🔑 Token available:', !!token);
      
      // Direct API call to match curl exactly
      const response = await fetch(`${apiClient}/api/Booking/create`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`,
          // No Content-Type - let browser set multipart/form-data
        },
        body: formData
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('📄 Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('📥 API Response:', result);

      if (response.ok) {
        console.log('🎉 Quick booking successful!');
        
        Alert.alert(
          "🎉 Booking Successful!", 
          `Your booking has been confirmed!\n\n• Service: ${serviceName}\n• Date: ${formatDateWithTextMonth(surveyDate)}\n• Quick booking completed\n\nOur team will contact you within 24 hours to confirm details.`,
          [
            {
              text: "View My Bookings",
              onPress: () => router.replace('/screens/Bookings')
            }
          ]
        );
      } else {
        const errorMessage = result?.title || result?.errors || "Booking failed. Please try again.";
        console.error("❌ Quick booking API error:", result);
        
        Alert.alert(
          "Booking Failed",
          typeof errorMessage === 'string' ? errorMessage : "Booking failed. Please try again.",
          [
            { text: "Retry", onPress: () => handleQuickBooking() },
            { text: "Try Detailed Survey", onPress: () => handleProceedToSurvey() },
            { text: "Cancel", style: "cancel" }
          ]
        );
      }

    } catch (error: any) {
      console.error("❌ Quick booking error:", error);
      
      let errorMessage = "Unable to complete quick booking. Please try again.";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      
      Alert.alert(
        "Booking Error",
        "Unable to complete quick booking. Would you like to try the detailed survey instead?",
        [
          { text: "Retry Quick Booking", onPress: () => handleQuickBooking() },
          { text: "Try Detailed Survey", onPress: () => handleProceedToSurvey() },
          { text: "Cancel", style: "cancel" }
        ]
      );
    } finally {
      setQuickBookingLoading(false);
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
            {__DEV__ && (
              <Text style={[styles.addressDebug, { color: colors.textSecondary }]}>ID: {selectedAddressObj.id}</Text>
            )}
          </View>
          <View style={styles.iconWrapper}>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={hasAddressError ? colors.error : colors.textSecondary} 
            />
          </View>
        </TouchableOpacity>
        
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

          {/* Booking Form */}
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
                    {formatDateWithTextMonth(surveyDate)}
                  </Text>
                  <Ionicons 
                    name="chevron-down" 
                    size={20} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>

                <CalendarPicker
                  selectedDate={surveyDate}
                  onSelectDate={onDateChange}
                  isVisible={showDatePicker}
                  onClose={() => setShowDatePicker(false)}
                  minDate={minDate}
                />
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
                    maxLength={500}
                  />
                </View>
                {note.length > 400 && (
                  <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                    {note.length}/500 characters
                  </Text>
                )}
              </View>
            </View>
          </View>
          
          {/* Display any errors */}
          {error && (
            <View style={[styles.errorContainer, { 
              borderLeftColor: colors.error,
              backgroundColor: `${colors.error}10`
            }]}>
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

          {/* Booking Options Info */}
          {/* <View style={[styles.infoContainer, { backgroundColor: `${colors.primary}08`, borderColor: colors.primary }]}>
            <Ionicons name="information-circle" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: colors.primary }]}>Choose Your Booking Option</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                • <Text style={{ fontWeight: '600' }}>Quick Booking:</Text> Book immediately with basic info {'\n'}
                • <Text style={{ fontWeight: '600' }}>Detailed Survey:</Text> Fill preferences & upload photos for better service
              </Text>
            </View>
          </View> */}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Quick Booking Button */}
            {/* <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.quickBookingButton,
                { 
                  backgroundColor: !selectedAddress ? colors.textSecondary : '#28a745',
                  opacity: (!selectedAddress || quickBookingLoading) ? 0.7 : 1,
                  elevation: !selectedAddress ? 0 : 4,
                }
              ]}
              onPress={handleQuickBooking}
              disabled={!selectedAddress || quickBookingLoading}
            >
              {quickBookingLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="flash" size={20} color="#fff" />
              )}
              <Text style={styles.actionButtonText}>
                {quickBookingLoading ? "Processing..." : (!selectedAddress ? "Add Address First" : "Quick Booking")}
              </Text>
              {!quickBookingLoading && selectedAddress && (
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              )}
            </TouchableOpacity> */}

            {/* Survey Form Button */}
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.surveyButton,
                { 
                  backgroundColor: !selectedAddress ? colors.textSecondary : colors.primary,
                  opacity: (!selectedAddress || loading) ? 0.7 : 1,
                  elevation: !selectedAddress ? 0 : 4,
                }
              ]}
              onPress={handleProceedToSurvey}
              disabled={!selectedAddress || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="document-text" size={20} color="#fff" />
              )}
              <Text style={styles.actionButtonText}>
                {loading ? "Processing..." : (!selectedAddress ? "Add Address First" : "Detailed Survey")}
              </Text>
              {!loading && selectedAddress && (
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
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
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    lineHeight: 20,
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginHorizontal: 4,
  },
  quickBookingButton: {
    // Green color for quick action
  },
  surveyButton: {
    // Primary color for detailed option
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    flex: 1,
    textAlign: 'center',
  },
});

export default BookingScreen;