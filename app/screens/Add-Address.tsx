import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Checkbox } from "react-native-paper";
import { useRouter } from "expo-router";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import InputField from "@/components/InputField";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { createAddressAPI } from "@/utils/AddressAPI"; // Import createAddressAPI
import { IAddress } from "@/utils/AddressAPI"; // Import IAddress interface

// Define API response interface
interface IApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

const AddAddressScreen = () => {
  const router = useRouter();
  const { theme } = useTheme(); // Use theme from context
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme]; // Extract color palette for the current theme
  const [formData, setFormData] = useState<IAddress>({
    id: "",  // Make sure to initialize id as empty
    fullName: "",
    phone: "",
    type: 0, // Default to Home type
    isDefault: false,
    province: "",
    district: "",
    ward: "",
    street: "",
    detail: "",  // Correct name to match the API format
  });
  
  
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  // Fetch provinces on initial load
  useEffect(() => {
    axios
      .get("https://provinces.open-api.vn/api/?depth=2")
      .then((response) => {
        setProvinces(response.data);
      })
      .catch((error) => {
        console.error("Error fetching provinces:", error);
      });
  }, []);

  // Handle input change
  const handleInputChange = (field: keyof IAddress, value: string | boolean | 0 | 1) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };
  

  // Handle province change, update districts
  const handleProvinceChange = (provinceCode: string) => {
    setFormData((prevData) => ({
      ...prevData,
      province: provinceCode,
      district: "", // Reset district when province changes
    }));

    const selectedProvince = provinces.find(
      (province) => province.code === provinceCode
    );
    if (selectedProvince && selectedProvince.districts) {
      setDistricts(selectedProvince.districts);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const { fullName, phone, street, ward, province, district, detail } = formData;
    if (!fullName || !phone || !street || !ward || !province || !district || !detail) {
      Alert.alert("Error", "Please fill in all the fields.");
      return false;
    }
    return true;
  };

  const [isSubmitting, setIsSubmitting] = useState(false); // Track if the form is being submitted
  const handleSubmit = async () => {
    console.log("Button clicked");
  
    if (isSubmitting) {
      console.log("Form is already submitting, returning early...");
      return;
    }
  
    console.log("Setting isSubmitting to true...");
    setIsSubmitting(true); // Disable the button
    console.log("Form submission started...");
  
    if (!validateForm()) {
      console.log("Form validation failed. Re-enabling button.");
      setIsSubmitting(false);
      return;
    }
  
    console.log("Form data before submission:", formData);
  
    // Find the province name based on the selected province ID
    const selectedProvince = provinces.find(province => province.code === formData.province);
    const provinceName = selectedProvince ? selectedProvince.name : formData.province; // Fallback to the ID if not found
  
    // Create address object according to API format
    const newAddress = {
      id: String(formData.id),
      fullName: String(formData.fullName),
      phone: String(formData.phone),
      type: formData.type,
      isDefault: formData.isDefault,
      province: provinceName, // Use the province name instead of the ID
      district: String(formData.district),
      ward: String(formData.ward),
      street: String(formData.street),
      detail: String(formData.detail),
    };
  
    try {
      console.log("Sending request to create address:", newAddress);
      const response: IApiResponse = await createAddressAPI(newAddress);
      console.log("Response from API:", response);
  
      if (response.success) {
        console.log("Address added successfully! Navigating to address list screen.");
        Alert.alert("Address added successfully!");
        router.push("/screens/Addresses"); // Navigate to address list screen
        setFormData({
          id: "",
          fullName: "",
          phone: "",
          street: "",
          ward: "",
          province: "",
          district: "",
          detail: "",
          type: 0, // Default to "Home" type
          isDefault: false,
        });
      } else {
        console.log("Failed to add address:", response.message);
        Alert.alert("Failed to add address. Please try again.");
      }
    } catch (error) {
      console.error("Error creating address:", error);
      Alert.alert("Error", "Failed to add address. Please try again.");
    } finally {
      console.log("Resetting isSubmitting flag...");
      setIsSubmitting(false); // Always re-enable the button
    }
  };
  
  
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>New Address</Text>

        <InputField
          label="Full Name"
          value={formData.fullName}
          onChangeText={(text) => handleInputChange("fullName", text)}
          icon="person"
          error=""/>
        
        <InputField
          label="Phone Number"
          value={formData.phone}
          onChangeText={(text) => handleInputChange("phone", text)}
          keyboardType="phone-pad"
          icon="call"
          error=""/>
        
        <InputField
          label="Street"
          value={formData.street}
          onChangeText={(text) => handleInputChange("street", text)}
          icon="location"
          error=""/>

        <InputField
          label="Ward"
          value={formData.ward}
          onChangeText={(text) => handleInputChange("ward", text)}
          icon="home"
          error=""/>

        <Text style={[styles.label, { color: colors.text }]}>Select Province</Text>
        <Picker
          selectedValue={formData.province}
          onValueChange={handleProvinceChange}
          style={[styles.picker, { borderColor: colors.icon, backgroundColor: colors.inputBackground, color: colors.text }]}>
          <Picker.Item label="Select Province" value="" />
          {provinces.map((location) => (
            <Picker.Item label={location.name} value={location.code} key={location.code} />
          ))}
        </Picker>

        <Text style={[styles.label, { color: colors.text }]}>Select District</Text>
        <Picker
          selectedValue={formData.district}
          onValueChange={(itemValue) => handleInputChange("district", itemValue)}
          enabled={districts.length > 0}
          style={[styles.picker, { borderColor: colors.icon, backgroundColor: colors.inputBackground, color: colors.text }]}>
          <Picker.Item label="Select District" value="" />
          {districts.map((district) => (
            <Picker.Item label={district.name} value={district.code} key={district.code} />
          ))}
        </Picker>

        <InputField
          label="Specific Location"
          value={formData.detail}
          onChangeText={(text) => handleInputChange("detail", text)}
          keyboardType="numeric"
          icon="pin"
          error=""/>
<View style={styles.radioGroup}>
  <Text style={{ color: colors.text }}>Type</Text>
  <View style={styles.buttonContainer}>
    <TouchableOpacity onPress={() => handleInputChange("type", 0)} style={[styles.typeButton, formData.type === 0 ? styles.selectedButton : null]}>
      <Text style={[styles.buttonText, { color: colors.text }]}>Home</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => handleInputChange("type", 1)} style={[styles.typeButton, formData.type === 1 ? styles.selectedButton : null]}>
      <Text style={[styles.buttonText, { color: colors.text }]}>Office</Text>
    </TouchableOpacity>
  </View>
</View>

        <View style={styles.checkboxContainer}>
          <Checkbox status={formData.isDefault ? "checked" : "unchecked"} onPress={() => handleInputChange("isDefault", !formData.isDefault)} />
          <Text style={{ color: colors.text }}>Set as default Address</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => router.push("/screens/Addresses")} style={styles.button}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={styles.button}>
            <Text style={styles.buttonText}>Complete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 10 },
  picker: { height: 60, borderWidth: 1, borderRadius: 5, marginBottom: 15 },
  radioGroup: { flexDirection: "row", marginBottom: 20 },
  buttonContainer: { marginTop: 20, flexDirection: "row", justifyContent: "space-between" },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  typeButton: { margin: 5, backgroundColor: "#5fc1f1", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20 },
  selectedButton: { backgroundColor: "#0056b3" },
  button: { backgroundColor: "#5fc1f1", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20, marginVertical: 10 },
  buttonText: { color: "#fff", fontSize: 16, textAlign: "center" },
});

export default AddAddressScreen;
