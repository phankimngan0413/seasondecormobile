import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function AddressScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Addresses</Text>
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You have no saved addresses</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => router.push("//Add-Address")}> 
        <Text style={styles.addButtonText}>+ Add address</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  addButton: { 
    backgroundColor: "#000", 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 5, 
    alignSelf: "flex-end" 
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
