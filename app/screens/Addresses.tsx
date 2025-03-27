import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { getAddressesAPI } from "@/utils/AddressAPI";  // API to fetch addresses
import { IAddress } from "@/utils/AddressAPI";  // Define the IAddress interface
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";  // Add useRouter for navigation

const AddressListScreen = () => {
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const { theme } = useTheme(); // Get the current theme
  const validTheme = theme as "light" | "dark"; // Ensure theme is either light or dark
  const colors = Colors[validTheme]; // Use colors based on the theme

  const router = useRouter();  // Hook for navigation

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const addressData = await getAddressesAPI();
        setAddresses(addressData);
      } catch (err) {
        setError("Failed to fetch addresses.");
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  // Render the address item
  const renderAddressItem = ({ item }: { item: IAddress }) => (
    <View style={[styles.addressCard, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.addressText, { color: colors.text }]}>Street: {item.street}</Text>
      <Text style={[styles.addressText, { color: colors.text }]}>District: {item.district}</Text>
      <Text style={[styles.addressText, { color: colors.text }]}>Province: {item.province}</Text>
      <Text style={[styles.addressText, { color: colors.text }]}>Specific Location: {item.detail}</Text>
      <Text style={[styles.addressText, { color: colors.text }]}>{item.isDefault ? "Default Address" : "Not Default"}</Text>
      <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.primary }]}>
        <Text style={styles.buttonText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.secondary }]}>
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color={colors.primary} />;
  }

  if (error) {
    return <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Addresses</Text>

      {/* Add Address Button */}
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/screens/add-address")}  // Navigate to add address screen
      >
        <Text style={styles.buttonText}>Add Address</Text>
      </TouchableOpacity>

      {addresses.length > 0 ? (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}  // Use item.id for the key
          renderItem={renderAddressItem}
        />
      ) : (
        <Text style={[styles.noAddressText, { color: colors.text }]}>No addresses available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  addressCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  addressText: {
    fontSize: 16,
    marginBottom: 5,
  },
  editButton: {
    backgroundColor: "#3498db",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  addButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  noAddressText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
});

export default AddressListScreen;
