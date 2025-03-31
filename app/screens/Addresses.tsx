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
  updateAddressAPI, 
  deleteAddressAPI,
  createAddressAPI,
  IAddress 
} from "@/utils/AddressAPI";
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
  const renderAddressItem = ({ item }: { item: IAddress }) => (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.cardBackground,
          borderColor: item.isDefault ? colors.primary : 'transparent',
          borderWidth: item.isDefault ? 2 : 0
        }
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.fullName}
        </Text>
        {item.isDefault && (
          <View style={[styles.defaultBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        )}
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="finger-print" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text, marginLeft: 10 }]}>
            ID: {item.id}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text, marginLeft: 10 }]}>
            Name: {item.fullName}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="phone-portrait" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text, marginLeft: 10 }]}>
            Phone: {item.phone}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="map" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text, marginLeft: 10 }]}>
            Type: {item.addressType === 0 ? 'Home' : 'Office'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="home" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text, marginLeft: 10 }]}>
            Default: {item.isDefault ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text, marginLeft: 10 }]}>
            Address: {item.street}, {item.ward}, {item.district}, {item.province}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="information-circle" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text, marginLeft: 10 }]}>
            Details: {item.detail}
          </Text>
        </View>
      </View>
      
      <View style={styles.addressActionContainer}>
        <TouchableOpacity 
          style={[
            styles.defaultButton, 
            { 
              backgroundColor: item.isDefault ? colors.border : colors.primary,
              opacity: item.isDefault ? 0.5 : 1,
              flex: 1
            }
          ]}
          onPress={() => {
            if (!item.isDefault) {
              handleSetDefaultAddress(item.id);
            }
          }}
          disabled={item.isDefault}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color="white" 
            style={styles.defaultButtonIcon} 
          />
          <Text style={styles.defaultButtonText}>
            {item.isDefault ? 'Default Address' : 'Set as Default'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionIconButton}
          onPress={() => handleUpdateAddress(item)}
        >
          <Ionicons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionIconButton}
          onPress={() => handleDeleteAddress(item.id)}
        >
          <Ionicons name="trash" size={20} color={colors.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render loading state
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
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={fetchAddresses}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>My Addresses</Text>
        
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            router.push("/screens/address/add-address");
          }}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Address</Text>
        </TouchableOpacity>
      </View>

      {addresses.length > 0 ? (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={renderAddressItem}
          refreshing={refreshing}
          onRefresh={fetchAddresses}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="location-outline" size={64} color={colors.text} />
          <Text style={[styles.noAddressText, { color: colors.text }]}>
            You have no addresses
          </Text>
          <TouchableOpacity 
            style={[styles.addFirstAddressButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              router.push("/screens/address/add-address");
            }}
          >
            <Text style={styles.addFirstAddressButtonText}>Add First Address</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  container: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
  },
  defaultBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    width: '48%',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 5,
  },
  defaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: '100%',
    marginTop: 10,
  },
  defaultButtonIcon: {
    marginRight: 10,
  },
  defaultButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noAddressText: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  addFirstAddressButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addFirstAddressButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
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
  addressActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  actionIconButton: {
    marginLeft: 15,
    padding: 5,
  },

});

export default AddressListScreen;