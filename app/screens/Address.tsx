import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useGetAllAddress, useDeleteAddress } from '@/utils/address/AddressAPI'; // Import hooks
import { Ionicons } from '@expo/vector-icons';
import { LogBox } from "react-native"; // Import LogBox to suppress warnings

// Ignore specific warnings
LogBox.ignoreLogs(["Warning: Each child in a list should have a unique 'key' prop."]);

const AddressListScreen = () => {
  const { data: addresses, isLoading } = useGetAllAddress();
  const { mutate: deleteAddress } = useDeleteAddress();

  const handleDelete = (addressId: string) => {
    deleteAddress(addressId);
  };

  const renderItem = ({ item }: { item: { id: string; address: string; location: string } }) => (
    <View style={styles.addressCard}>
      <Text style={styles.addressText}>{item.address}</Text>
      <Text style={styles.addressLocation}>{item.location}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Addresses</Text>
      <FlatList
        data={addresses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addressCard: {
    backgroundColor: '#f1f1f1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addressLocation: {
    fontSize: 12,
    color: '#888',
  },
  deleteButton: {
    backgroundColor: '#FF5733',
    padding: 8,
    borderRadius: 50,
  },
});

export default AddressListScreen;
