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
  StatusBar
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { 
  getAddressesAPI, 
  deleteAddressAPI,
  IAddress 
} from "@/utils/addressAPI";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter, useLocalSearchParams } from "expo-router";

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

  // Set initial selected address based on current address from checkout or booking
  useEffect(() => {
    if (currentAddressId) {
      setSelectedAddressId(currentAddressId);
    }
  }, [currentAddressId]);

  // Fetch addresses with improved error handling
  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const addressData = await getAddressesAPI();
      
      // Ensure addressData is an array
      const validAddresses = Array.isArray(addressData) ? addressData : [];
      
      setAddresses(validAddresses);

      // If we don't have a selected address yet, select the default one
      if (!selectedAddressId && validAddresses.length > 0) {
        const defaultAddress = validAddresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else {
          setSelectedAddressId(validAddresses[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError("Unable to load address list. Please try again.");
      setAddresses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAddressId]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Handle confirming address selection and returning to checkout or booking
  const handleConfirmSelection = () => {
    if ((fromCheckout || fromBooking) && selectedAddressId) {
      console.log('Confirm Selection - Selected Address ID:', selectedAddressId);
      
      // Create timestamp to ensure useEffect in previous screen is triggered
      const timestamp = Date.now().toString();
      
      // Update param and then navigate back
      if (fromBooking) {
        router.replace({
          pathname: `/cart`,
          params: {
            style: params.style,
            price: params.price,
            selectedAddressId: selectedAddressId,
            timestamp: timestamp
          }
        });
      } else if (fromCheckout) {
        router.replace({
          pathname: "/screens/checkout",
          params: {
            selectedAddressId: selectedAddressId,
            timestamp: timestamp
          }
        });
      }
    }
  };

  // Navigate to add address screen
  const handleAddAddress = () => {
    router.push("/screens/address/add-address");
  };

  // Handle selecting an address
  const handleSelectAddress = (address: IAddress) => {
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
            style={[styles.confirmButton, { backgroundColor: PRIMARY_COLOR }]}
            onPress={handleConfirmSelection}
            disabled={!selectedAddressId}
          >
            <Text style={styles.confirmButtonText}>Confirm Address Selection</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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