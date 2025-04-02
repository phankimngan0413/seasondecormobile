import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { 
  getAddressesAPI, 
  setDefaultAddressAPI, 
  deleteAddressAPI,
  IAddress 
} from "@/utils/addressAPI";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";

const AddressListScreen: React.FC = () => {
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  const router = useRouter();

  // Fetch addresses with improved error handling
  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const addressData = await getAddressesAPI();
      
      // Ensure addressData is an array
      const validAddresses = Array.isArray(addressData) ? addressData : [];
      
      setAddresses(validAddresses);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError("Unable to load address list. Please try again.");
      setAddresses([]); // Ensure addresses is an empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Update address
  const handleUpdateAddress = (address: IAddress) => {
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

  // Delete address
  const handleDeleteAddress = async (addressId: string) => {
    Alert.alert(
      "Confirm Deletion",
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
              setLoading(true);
              
              // Call API to delete address
              await deleteAddressAPI(addressId);
              
              // Refresh addresses
              await fetchAddresses();
              
              // Show success message
              Alert.alert("Success", "Address deleted successfully.");
            } catch (err) {
              console.error("Error deleting address:", err);
              
              // Show error message
              Alert.alert(
                "Error", 
                "Failed to delete address. Please try again.",
                [{ text: "OK" }]
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Set default address
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      setLoading(true);
      
      // Call API to set default address
      await setDefaultAddressAPI(addressId);
      
      // Immediately refresh addresses
      await fetchAddresses();
      
      // Show success message
      Alert.alert("Success", "Default address updated successfully.");
    } catch (err) {
      console.error("Error setting default address:", err);
      
      // Attempt to refresh addresses even if setting default fails
      await fetchAddresses();
      
      // Show error message
      Alert.alert(
        "Error", 
        "Failed to set default address. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Render individual address item
  const renderAddressItem = ({ item }: { item: IAddress }) => {
    return (
      <View 
        style={[ 
          styles.container, 
          { 
            backgroundColor: colors.card || '#ffffff',
            borderColor: item.isDefault ? colors.primary : colors.border,
            borderWidth: item.isDefault ? 2 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3, // Adding shadow for Android
          }
        ]}>
        <View style={styles.addressHeader}>
          <View style={styles.addressTitleContainer}>
            <Ionicons 
              name={item.addressType === 0 ? "home-outline" : "business-outline"} 
              size={22} 
              color={colors.primary} 
            />
            <Text style={[styles.addressTitle, { color: colors.text }]} numberOfLines={1}>
              {item.fullName}
            </Text>
          </View>
    
          <View style={styles.badgeContainer}>
            {item.isDefault && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Ionicons name="star" size={14} color="white" />
                <Text style={styles.badgeText}>Default</Text>
              </View>
            )}
          </View>
        </View>
    
        <View style={styles.separator} />
    
        <View style={styles.addressDetailsContainer}>
          <View style={styles.addressDetail}>
            <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.addressDetailText, { color: colors.text }]}>
              {item.fullName}
            </Text>
          </View>
    
          <View style={styles.addressDetail}>
            <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.addressDetailText, { color: colors.text }]}>
              {item.phone}
            </Text>
          </View>
    
          <View style={styles.addressDetail}>
            <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
            <Text 
              style={[styles.addressDetailText, { color: colors.text }]} 
              numberOfLines={2}
            >
              {item.street}, {item.ward}, {item.district}, {item.province}
            </Text>
          </View>
    
          <View style={styles.addressTypeContainer}>
            <View style={[styles.addressTypeTag, {
              backgroundColor: item.addressType === 0 ? 'rgba(33, 150, 243, 0.1)' : 'rgba(156, 39, 176, 0.1)'
            }]}>
              <Text style={[styles.addressTypeText, {
                color: item.addressType === 0 ? '#2196f3' : '#9c27b0'
              }]}>{item.addressType === 0 ? 'Home' : 'Office'}</Text>
            </View>
          </View>
        </View>
    
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.defaultButton, { backgroundColor: item.isDefault ? 'rgba(76, 175, 80, 0.1)' : colors.primary }] }
            onPress={() => {
              if (!item.isDefault) {
                handleSetDefaultAddress(item.id);
              }
            }}
            disabled={item.isDefault}
          >
            <Ionicons 
              name="star" 
              size={18} 
              color={item.isDefault ? '#4caf50' : 'white'} 
            />
            <Text style={[styles.buttonText, { color: item.isDefault ? '#4caf50' : 'white' }]}>
              {item.isDefault ? 'Default' : 'Set Default'}
            </Text>
          </TouchableOpacity>
    
          <View style={styles.editDeleteContainer}>
            <TouchableOpacity 
              style={[styles.iconButton, { borderColor: colors.border }]}
              onPress={() => handleUpdateAddress(item)}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
    
            <TouchableOpacity 
              style={[styles.iconButton, { borderColor: colors.border }]}
              onPress={() => handleDeleteAddress(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // If loading, show loading spinner
  if (loading) {
    return (
      <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }] }
          onPress={fetchAddresses}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Addresses</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/screens/address/add-address")}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={renderAddressItem}
        refreshing={refreshing}
        onRefresh={fetchAddresses}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: 40,
  },
  container: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    padding: 0, // Set padding to 0 to match card style
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginHorizontal: 16,
  },
  addressDetailsContainer: {
    padding: 16,
  },
  addressDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressDetailText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  addressTypeContainer: {
    marginTop: 4,
  },
  addressTypeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  addressTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
  },
  defaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  editDeleteContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    marginLeft: 8,
    borderWidth: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  retryButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 15,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  errorText:{

  }
});

export default AddressListScreen;
