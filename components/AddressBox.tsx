import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSetDefaultAddress } from "@/utils/address/AddressAPI";
import useDeleteConfirmModal from "@/hooks/useDeleteConfirmModal";
import useAddressModal from "@/hooks/useAddressModal";

// Type for props
interface AddressBoxProps {
  id: string;
  fullName: string;
  isDefault: boolean;
  province: string;
  district: string;
  ward: string;
  street: string;
  detail: string;
  phone: string;
  addressType: string;
}

const AddressBox: React.FC<AddressBoxProps> = ({
  id,
  fullName,
  isDefault,
  province,
  district,
  ward,
  street,
  detail,
  phone,
  addressType,
}) => {
  const deleteConfirmModal = useDeleteConfirmModal() as { onOpen: (id: string, fullName: string) => void };
  const addressModal = useAddressModal() as { onOpen: (address: AddressBoxProps) => void };
  const setDefaultAddress = useSetDefaultAddress(id);

  // Set default address
  const handleSetDefault = () => {
    setDefaultAddress.mutate(id, {
      onSuccess: () => {
        console.log(`Address ${id} set as default successfully!`);
      },
      onError: (error: any) => {
        return console.error("Error setting default address:", error.message);
      },
    });
  };

  // Open delete modal
  const handleDeleteClick = () => {
    deleteConfirmModal.onOpen(id, fullName);
  };

  // Open address edit modal
  const handleEditClick = () => {
    addressModal.onOpen({
      id,
      fullName,
      isDefault,
      province,
      district,
      ward,
      street,
      detail,
      phone,
      addressType,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header with name and phone */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.fullName}>{fullName}</Text>
          <Text style={styles.phone}>{phone}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditClick}>
            <Ionicons name="md-create" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, styles.iconButton]}
            onPress={handleDeleteClick}
          >
            <Ionicons name="md-trash" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Address details */}
      <View style={styles.addressDetails}>
        <Text style={styles.addressText}>{`${street}, ${ward}, ${district}, ${province}`}</Text>
        {isDefault ? (
          <Text style={styles.defaultText}>Default Address</Text>
        ) : (
          <TouchableOpacity style={styles.setDefaultButton} onPress={handleSetDefault}>
            <Text style={styles.setDefaultText}>Set as Default</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Address detail */}
      <Text style={styles.addressDetail}>{detail}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
  },
  fullName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  phone: {
    fontSize: 14,
    color: "#888",
  },
  editButton: {
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 50,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: "#FF5722",
    padding: 8,
    borderRadius: 50,
  },
  iconButton: {
    padding: 10,
    borderRadius: 50,
  },
  addressDetails: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addressText: {
    fontSize: 14,
    color: "#333",
  },
  setDefaultButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  setDefaultText: {
    color: "#fff",
    fontWeight: "bold",
  },
  defaultText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  addressDetail: {
    marginTop: 10,
    fontSize: 12,
    color: "#777",
  },
});

export default AddressBox;
