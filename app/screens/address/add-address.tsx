import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  FlatList
} from "react-native";
import { Checkbox } from "react-native-paper";
import { useRouter } from "expo-router";
import axios from "axios";
import InputField from "@/components/InputField";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { createAddressAPI } from "@/utils/AddressAPI";
import { IAddress } from "@/utils/AddressAPI";
import { Ionicons } from "@expo/vector-icons";

// Location interface
interface Location {
  code: string;
  name: string;
  districts?: Location[];
}

const AddAddressScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  const [formData, setFormData] = useState<IAddress>({
    id: "",
    fullName: "",
    phone: "",
    addressType: 0, // Default to Home type
    isDefault: false,
    province: "",
    district: "",
    ward: "",
    street: "",
    detail: "",
  });
  
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Modal states
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  // Selected names (for display)
  const [selectedProvinceName, setSelectedProvinceName] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");

  // Fetch provinces on initial load
  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://provinces.open-api.vn/api/?depth=2");
      setProvinces(response.data);
    } catch (error) {
      console.error("Error fetching provinces:", error);
      Alert.alert("Error", "Failed to load province data. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (field: keyof IAddress, value: string | boolean | 0 | 1) => {
    // Clear error for this field when user inputs something
    setErrors({
      ...errors,
      [field]: ""
    });
    
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  // Handle province change, update districts
  const handleProvinceChange = (provinceCode: string, provinceName: string) => {
    setFormData((prevData) => ({
      ...prevData,
      province: provinceName, // Store name directly instead of code
      district: "", // Reset district when province changes
    }));

    setSelectedProvinceName(provinceName);
    setSelectedDistrictName(""); // Reset district name

    setErrors({
      ...errors,
      province: "",
      district: ""
    });

    const selectedProvince = provinces.find(
      (province) => province.code === provinceCode
    );
    if (selectedProvince && selectedProvince.districts) {
      setDistricts(selectedProvince.districts);
    }
  };

  // Handle district selection
  const handleDistrictChange = (districtCode: string, districtName: string) => {
    setFormData((prevData) => ({
      ...prevData,
      district: districtName, // Store name directly instead of code
    }));
    
    setSelectedDistrictName(districtName);
    
    setErrors({
      ...errors,
      district: ""
    });
  };

  // Form validation
  const validateForm = (): boolean => {
    const { fullName, phone, street, ward, province, district, detail } = formData;
    let newErrors: {[key: string]: string} = {};
    let isValid = true;

    if (!fullName) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    }

    if (!phone) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
      isValid = false;
    }

    if (!street) {
      newErrors.street = "Street is required";
      isValid = false;
    }

    if (!ward) {
      newErrors.ward = "Ward is required";
      isValid = false;
    }

    if (!province) {
      newErrors.province = "Please select a province";
      isValid = false;
    }

    if (!district) {
      newErrors.district = "Please select a district";
      isValid = false;
    }

    if (!detail) {
      newErrors.detail = "Specific location is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };
  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }
  
    setIsSubmitting(true);
  
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }
  
    // Create address object according to API format
    const newAddress = {
      id: String(formData.id),
      fullName: String(formData.fullName),
      phone: String(formData.phone),
      type: formData.addressType,
      isDefault: formData.isDefault,
      province: formData.province,
      district: formData.district,
      ward: String(formData.ward),
      street: String(formData.street),
      detail: String(formData.detail),
    };
  
    try {
      const response = await createAddressAPI(newAddress);
      
      console.log("Complete API response object:", JSON.stringify(response));
      
      // Type guard to check if response is address object by checking for typical address properties
      const isAddressResponse = (obj: any): obj is IAddress => {
        return obj && typeof obj === 'object' && 'phone' in obj && 'fullName' in obj;
      };
      
      // First check if response is a direct address object
      if (isAddressResponse(response)) {
        Alert.alert(
          "Success", 
          "Address added successfully!",
          [{ text: "OK", onPress: () => router.push("/screens/Addresses") }]
        );
      } 
      // Otherwise check if it's a standard API response with success flag
      else if (response && 'success' in response && response.success === true) {
        Alert.alert(
          "Success", 
          "Address added successfully!",
          [{ text: "OK", onPress: () => router.push("/screens/Addresses") }]
        );
      } 
      // Handle error case
      else {
        const msg = (response && 'message' in response) ? response.message : "Failed to add address. Please try again.";
        Alert.alert("Failed", msg);
      }
    } catch (error) {
      console.error("Error creating address:", error);
      Alert.alert("Error", "Failed to add address. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const renderProvinceModal = () => (
    <Modal
      visible={showProvinceModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowProvinceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Province</Text>
            <TouchableOpacity onPress={() => setShowProvinceModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={provinces}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  formData.province === item.name && { backgroundColor: `${colors.primary}20` }
                ]}
                onPress={() => {
                  handleProvinceChange(item.code, item.name);
                  setShowProvinceModal(false);
                }}
              >
                <Text style={{ color: colors.text }}>{item.name}</Text>
                {formData.province === item.name && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // District selector modal
  const renderDistrictModal = () => (
    <Modal
      visible={showDistrictModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDistrictModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select District</Text>
            <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {districts.length > 0 ? (
            <FlatList
              data={districts}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.district === item.name && { backgroundColor: `${colors.primary}20` }
                  ]}
                  onPress={() => {
                    handleDistrictChange(item.code, item.name);
                    setShowDistrictModal(false);
                  }}
                >
                  <Text style={{ color: colors.text }}>{item.name}</Text>
                  {formData.district === item.name && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyContent}>
              <Text style={{ color: colors.textSecondary }}>Please select a province first</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, {color: colors.text}]}>Loading location data...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={validTheme === "dark" ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
       
        <Text style={[styles.title, { color: colors.text }]}>Add New Address</Text>
        <View style={styles.backButton} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>Contact Information</Text>
          
          <InputField
            label="Full Name"
            value={formData.fullName}
            onChangeText={(text) => handleInputChange("fullName", text)}
            icon="person-outline"
            error={errors.fullName || ""}
            placeholder="Enter your full name"
          />
          
          <InputField
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text) => handleInputChange("phone", text)}
            keyboardType="phone-pad"
            icon="call-outline"
            error={errors.phone || ""}
            placeholder="Enter your phone number"
          />
        </View>
        
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>Address Details</Text>
          
          {/* Province Selector */}
          <View style={styles.dropdownContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Province</Text>
            <TouchableOpacity 
              style={[
                styles.dropdownField, 
                { backgroundColor: colors.inputBackground },
                errors.province ? styles.inputError : null
              ]}
              onPress={() => setShowProvinceModal(true)}
            >
              <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
              <Text 
                style={[
                  styles.dropdownText, 
                  { color: selectedProvinceName ? colors.text : colors.textSecondary }
                ]}
              >
                {selectedProvinceName || "Select Province"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {errors.province ? (
              <Text style={styles.errorText}>{errors.province}</Text>
            ) : null}
          </View>
          
          {/* District Selector */}
          <View style={styles.dropdownContainer}>
            <Text style={[styles.label, { color: colors.text }]}>District</Text>
            <TouchableOpacity 
              style={[
                styles.dropdownField, 
                { backgroundColor: colors.inputBackground },
                errors.district ? styles.inputError : null
              ]}
              onPress={() => {
                if (formData.province) {
                  setShowDistrictModal(true);
                } else {
                  Alert.alert("Error", "Please select a province first");
                }
              }}
            >
              <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
              <Text 
                style={[
                  styles.dropdownText, 
                  { color: selectedDistrictName ? colors.text : colors.textSecondary }
                ]}
              >
                {selectedDistrictName || "Select District"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {errors.district ? (
              <Text style={styles.errorText}>{errors.district}</Text>
            ) : null}
          </View>
          
          <InputField
            label="Ward"
            value={formData.ward}
            onChangeText={(text) => handleInputChange("ward", text)}
            icon="location-outline"
            error={errors.ward || ""}
            placeholder="Enter ward name"
          />
          
          <InputField
            label="Street Address"
            value={formData.street}
            onChangeText={(text) => handleInputChange("street", text)}
            icon="map-outline"
            error={errors.street || ""}
            placeholder="Enter street address"
          />
          
          <InputField
            label="Additional Details"
            value={formData.detail}
            onChangeText={(text) => handleInputChange("detail", text)}
            icon="information-circle-outline"
            error={errors.detail || ""}
            placeholder="Apartment number, floor, landmark, etc."
          />
        </View>
        
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>Address Type</Text>
          
          <View style={styles.addressTypeContainer}>
            <TouchableOpacity 
              onPress={() => handleInputChange("addressType", 0)} 
              style={[
                styles.typeButton, 
                { backgroundColor: colors.card },
                formData.addressType === 0 && { backgroundColor: colors.primary }
              ]}
            >
              <Ionicons 
                name="home-outline" 
                size={24} 
                color={formData.addressType === 0 ? '#fff' : colors.text} 
              />
              <Text style={[
                styles.typeButtonText, 
                { color: formData.addressType === 0 ? '#fff' : colors.text }
              ]}>
                Home
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => handleInputChange("addressType", 1)} 
              style={[
                styles.typeButton, 
                { backgroundColor: colors.card },
                formData.addressType === 1 && { backgroundColor: colors.primary }
              ]}
            >
              <Ionicons 
                name="business-outline" 
                size={24} 
                color={formData.addressType === 1 ? '#fff' : colors.text} 
              />
              <Text style={[
                styles.typeButtonText, 
                { color: formData.addressType === 1 ? '#fff' : colors.text }
              ]}>
                Office
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.checkboxContainer}>
            <Checkbox 
              status={formData.isDefault ? "checked" : "unchecked"} 
              onPress={() => handleInputChange("isDefault", !formData.isDefault)}
              color={colors.primary}
            />
            <Text style={[styles.checkboxText, { color: colors.text }]}>
              Set as default address
            </Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.cancelButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Address</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {renderProvinceModal()}
      {renderDistrictModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContainer: { 
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  formSection: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  label: { 
    fontSize: 14, 
    fontWeight: "500", 
    marginBottom: 8,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 4,
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  checkboxContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 20,
  },
  checkboxText: {
    fontSize: 16,
    marginLeft: 8,
  },
  buttonContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelButton: {
    width: '48%',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    width: '48%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  emptyContent: {
    padding: 20,
    alignItems: 'center',
  },
});

export default AddAddressScreen;