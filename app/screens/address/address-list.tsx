import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { 
  getAddressesAPI, 
  deleteAddressAPI,
  IAddress 
} from "@/utils/AddressAPI";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";

// Define types for route parameters
type RouteParams = {
  fromCheckout?: string;
  fromBooking?: string;
  currentAddressId?: string;
  id?: string;
  style?: string;
  price?: string;
  timestamp?: string;
};

const AddressListScreen: React.FC = () => {
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);

  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  const PRIMARY_COLOR = "#0096B5";

  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  
  // Check if we're coming from checkout or booking
  const fromCheckout = params.fromCheckout === "true";
  const fromBooking = params.fromBooking === "true";
  const currentAddressId = params.currentAddressId;

  // Fetch addresses with improved error handling
  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const addressData = await getAddressesAPI();
      
      // Ensure addressData is an array
      const validAddresses = Array.isArray(addressData) ? addressData : [];
      
      setAddresses(validAddresses);

      // If currentAddressId is provided from params, use it
      if (currentAddressId) {
        // Check if the currentAddressId exists in the fetched addresses
        const addressExists = validAddresses.some(addr => addr.id === currentAddressId);
        if (addressExists) {
          setSelectedAddressId(currentAddressId);
        } else {
          // If currentAddressId doesn't exist, fall back to default address
          selectDefaultAddress(validAddresses);
        }
      } else {
        // If no currentAddressId, select default address
        selectDefaultAddress(validAddresses);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError("Unable to load address list. Please try again.");
      setAddresses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentAddressId]);

  // Helper function to select default address
  const selectDefaultAddress = (addressList: IAddress[]) => {
    if (addressList.length > 0) {
      const defaultAddress = addressList.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else {
        setSelectedAddressId(addressList[0].id);
      }
    } else {
      setSelectedAddressId(undefined);
    }
  };

  // Initial fetch on component mount and when navigation params change
  useEffect(() => {
    console.log('Component mounted or params changed');
    console.log('Current params - fromCheckout:', fromCheckout, 'fromBooking:', fromBooking);
    console.log('Current address ID from params:', currentAddressId);
    
    // Safely access global state with proper TypeScript typing
    const globalData = globalThis as unknown as CustomGlobal;
    
    // Clear any stale global state on mount
    if (globalData.temporaryAddressReset !== true) {
      console.log('Resetting global address state');
      globalData.temporaryAddressReset = true;
      // Don't actually clear here - we'll update it properly later
    }
    
    fetchAddresses();
  }, [fetchAddresses, currentAddressId, fromCheckout, fromBooking]);

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
    temporaryAddressReset?: boolean;
  }
  
  // Refresh addresses whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused - fetching addresses and checking currentAddressId:', currentAddressId);
      fetchAddresses();
      
      // Safely access global state with proper TypeScript typing
      const globalData = globalThis as unknown as CustomGlobal;
      
      // Explicitly check for any existing selection in global state
      if (globalData.addressSelection && globalData.addressSelection.id) {
        console.log('Found existing address selection in global state:', globalData.addressSelection.id);
        setSelectedAddressId(globalData.addressSelection.id);
      }
      
      return () => {
        // Cleanup if needed
        console.log('Screen unfocused');
      };
    }, [fetchAddresses, currentAddressId])
  );

  // Handle confirming address selection and returning to checkout or booking
  const handleConfirmSelection = () => {
    if ((fromCheckout || fromBooking) && selectedAddressId) {
      console.log('Confirm Selection - Selected Address ID:', selectedAddressId);
      
      // Find the selected address object from the addresses array
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
      
      if (!selectedAddress) {
        Alert.alert("Error", "Selected address not found. Please try again.");
        return;
      }
      
      console.log('Selected Address Details:', selectedAddress);
      
      // Generate a unique timestamp to force update
      const timestamp = Date.now().toString();
      
      // Function to confirm and navigate back
      const confirmAndNavigateBack = () => {
        try {
          // Fix TypeScript 'any' type errors for global variables
          // Use a type assertion to tell TypeScript about our global variables
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
            temporaryAddressReset?: boolean;
          }
          
          // Cast globalThis to our custom interface
          const globalData = globalThis as unknown as CustomGlobal;
          
          // Use more direct approach to store selected address
          if (!globalData.addressSelection) {
            globalData.addressSelection = {
              id: selectedAddress.id,
              details: selectedAddress,
              timestamp: timestamp,
              fullName: selectedAddress.fullName,
              phone: selectedAddress.phone,
              formattedAddress: formatAddress(selectedAddress)
            };
          } else {
            globalData.addressSelection.id = selectedAddress.id;
            globalData.addressSelection.details = selectedAddress;
            globalData.addressSelection.timestamp = timestamp;
            globalData.addressSelection.fullName = selectedAddress.fullName;
            globalData.addressSelection.phone = selectedAddress.phone;
            globalData.addressSelection.formattedAddress = formatAddress(selectedAddress);
          }
          
          // For backward compatibility
          globalData.selectedAddressId = selectedAddress.id;
          globalData.selectedAddressDetails = selectedAddress;
          globalData.addressTimestamp = timestamp;
          
          console.log('Address selection stored with timestamp:', timestamp);
          
          // Force immediate navigation back to ensure state is fresh
          if (fromBooking) {
            router.replace('/booking/[]');
          } else if (fromCheckout) {
            router.replace('/screens/checkout');
          } else {
            router.back();
          }
        } catch (error) {
          console.error("Selection error:", error);
          Alert.alert(
            "Selection Error",
            "Unable to save selected address. Please try again.",
            [{ text: "OK" }]
          );
        }
      };
      
      // The address showing in the popup should match what was selected
      Alert.alert(
        "Address Selected",
        `${selectedAddress.fullName}, ${formatAddress(selectedAddress)}`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Confirm",
            style: "default",
            onPress: confirmAndNavigateBack
          }
        ]
      );
    } else {
      Alert.alert("Error", "Please select an address first.");
    }
  };

  // Navigate to add address screen
  const handleAddAddress = () => {
    router.push("/screens/address/add-address");
  };

  // Handle selecting an address
  const handleSelectAddress = (address: IAddress) => {
    console.log('Address selected:', address.id);
    setSelectedAddressId(address.id);
  };

  // Handle editing an address
  const handleEditAddress = (address: IAddress) => {
    router.push({
      pathname: "/screens/address/edit-address",
      params: { 
        id: address.id,
        addressId: address.id,
        fullName: address.fullName,
        phone: address.phone,
        addressType: address.addressType.toString(),
        street: address.street,
        ward: address.ward,
        district: address.district,
        province: address.province,
        detail: address.detail
      }
    });
  };

  // Handle deleting an address
  const handleDeleteAddress = (address: IAddress) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddressAPI(address.id);
              
              // If the deleted address is the currently selected one, reset selection
              if (selectedAddressId === address.id) {
                setSelectedAddressId(undefined);
              }
              
              // Refresh the address list
              await fetchAddresses();
              Alert.alert("Success", "Address deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete address");
            }
          }
        }
      ]
    );
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

  // Render individual address item
  const renderAddressItem = ({ item }: { item: IAddress }) => {
    const isSelected = selectedAddressId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.addressItem,
          isSelected && styles.selectedAddressItem,
          { borderColor: isSelected ? PRIMARY_COLOR : '#e0e0e0' }
        ]}
        onPress={() => handleSelectAddress(item)}
      >
        <View style={styles.addressHeader}>
          <Ionicons 
            name="business-outline" 
            size={24} 
            color={PRIMARY_COLOR} 
          />
          <Text style={styles.addressTitle}>{item.fullName}</Text>
        </View>
        
        <View style={styles.addressContent}>
          <View style={styles.addressRow}>
            <Ionicons name="person-outline" size={18} color="#888" />
            <Text style={styles.addressText}>{item.fullName}</Text>
          </View>
          
          <View style={styles.addressRow}>
            <Ionicons name="call-outline" size={18} color="#888" />
            <Text style={styles.addressText}>{item.phone}</Text>
          </View>
          
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={18} color="#888" />
            <Text style={styles.addressText} numberOfLines={2}>
              {formatAddress(item)}
            </Text>
          </View>
          
          <View style={styles.tagContainer}>
            <View style={[styles.addressTypeTag, { backgroundColor: '#F0F6FF' }]}>
              <Text style={styles.addressTypeText}>
                {item.addressType === 0 ? 'Home' : 'Office'}
              </Text>
            </View>
            
            {isSelected && (
              <View style={[styles.selectedTag, { backgroundColor: PRIMARY_COLOR }]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={styles.selectedTagText}>Selected</Text>
              </View>
            )}
            
            {item.isDefault && (
              <View style={styles.defaultTag}>
                <Ionicons name="star" size={14} color="#4CAF50" />
                <Text style={styles.defaultTagText}>Default</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditAddress(item)}
          >
            <Ionicons name="create-outline" size={20} color={PRIMARY_COLOR} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteAddress(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>
    
    <Text style={styles.headerTitle}>Select Delivery Address</Text>
    
    <TouchableOpacity 
      style={[styles.addButton, { backgroundColor: PRIMARY_COLOR }]}
      onPress={handleAddAddress}
    >
      <Ionicons name="add" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
  );

  // Render loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render main content
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      
      {renderHeader()}
      
      {addresses.length > 0 ? (
        <FlatList
          data={addresses}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.addressList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={fetchAddresses}
          extraData={selectedAddressId} // Re-render when selectedAddressId changes
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Addresses Found</Text>
          <Text style={styles.emptyMessage}>
            You haven't added any addresses yet. Add a new address to continue.
          </Text>
          <TouchableOpacity 
            style={[styles.addAddressButton, { backgroundColor: PRIMARY_COLOR }]}
            onPress={handleAddAddress}
          >
            <Text style={styles.addAddressButtonText}>Add New Address</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {(fromCheckout || fromBooking) && addresses.length > 0 && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.confirmButton, 
              { 
                backgroundColor: selectedAddressId ? PRIMARY_COLOR : '#cccccc' 
              }
            ]}
            onPress={handleConfirmSelection}
            disabled={!selectedAddressId}
            testID="confirm-address-button"
          >
            <Text style={styles.confirmButtonText}>
              {selectedAddressId ? 'Confirm Address Selection' : 'Please Select an Address'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 + 16 : 50, // Better platform handling
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressList: {
    padding: 16,
    paddingBottom: 100, // Add space for the bottom button
  },
  addressItem: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'white',
  },
  selectedAddressItem: {
    borderWidth: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  addressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  addressContent: {
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#555',
    flex: 1,
  },
  tagContainer: {
    flexDirection: 'row',
    marginTop: 5,
    flexWrap: 'wrap',
  },
  addressTypeTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 5,
  },
  addressTypeText: {
    fontSize: 12,
    color: '#0066CC',
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 5,
  },
  selectedTagText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
  },
  defaultTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    marginBottom: 5,
  },
  defaultTagText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  addAddressButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addAddressButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  }
});

export default AddressListScreen;