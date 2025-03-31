import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Modal
} from "react-native";
import { getAccountDetails, updateAccountDetails, updateAvatar } from "@/utils/accountAPI";
import BirthdayDatePicker from "@/components/ui/DatePicker";
import InputField from "@/components/InputField";
import { launchImageLibrary } from "react-native-image-picker";
import CustomButton from "@/components/ui/Button/Button";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";
import { format, isValid, parse } from 'date-fns'; // Ensure date-fns is installed

const AccountScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  // Define proper type for userData
  interface UserData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    slug?: string;
    dateOfBirth?: string;
    gender?: boolean;
    email?: string;
    avatar?: string | null;  
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [dob, setDob] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [gender, setGender] = useState<boolean>(true); // true for Male, false for Female
  const [showGenderModal, setShowGenderModal] = useState<boolean>(false);
  const [isAgeValid, setIsAgeValid] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAccountDetails();
        
        if (!data) {
          console.error("No data returned from getAccountDetails");
          setError("Account data not available");
          setLoading(false);
          return;
        }
        
        console.log("Received account data:", data);
        
        setUserData(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setPhone(data.phone || "");
        setSlug(data.slug || "");
        
        if (data.dateOfBirth) {
          try {
            const fetchedDob = new Date(data.dateOfBirth);
            if (!isNaN(fetchedDob.getTime())) {
              setDob(fetchedDob);
              validateAge(fetchedDob);
            }
          } catch (dateError) {
            console.error("Error parsing date:", dateError);
          }
        }
        
        setAvatar(data.avatar || null);
        setGender(data.gender === undefined ? true : Boolean(data.gender));
      } catch (err) {
        console.error("Failed to fetch account data:", err);
        // We're only logging to console, not showing UI error
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  // Check if user is at least 18 years old
  const validateAge = (birthDate: Date) => {
    if (!isValid(birthDate)) return false;
    
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      // Birthday hasn't occurred yet this year
      setIsAgeValid(age - 1 >= 18);
      return age - 1 >= 18;
    } else {
      setIsAgeValid(age >= 18);
      return age >= 18;
    }
  };

  const handleDateChange = (date: Date) => {
    if (isValid(date)) {
      setDob(date);
      validateAge(date);
    }
  };

  const handleUpdate = async () => {
    // Validate age before submitting
    if (!isAgeValid) {
      Alert.alert("Age Restriction", "You must be at least 18 years old to use this service.");
      return;
    }

    // Validate required fields
    if (!firstName.trim()) {
      Alert.alert("Missing Information", "Please enter your first name.");
      return;
    }

    if (!lastName.trim()) {
      Alert.alert("Missing Information", "Please enter your last name.");
      return;
    }

    if (!slug.trim()) {
      Alert.alert("Missing Information", "Username is required.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Missing Information", "Phone number is required.");
      return;
    }

    try {
      setUpdating(true);
      
      // Format date as YYYY-MM-DD
      const formattedDate = format(dob, 'yyyy-MM-dd');
      
      // Create request data with properly formatted values
      const requestData = {
        FirstName: firstName.trim(),
        LastName: lastName.trim(),
        Slug: slug.trim(),
        DateOfBirth: formattedDate,
        Gender: gender,
        Phone: phone.trim()
      };

      console.log("Sending data to API:", requestData);

      await updateAccountDetails(requestData);
      
      // Update local user data
      setUserData({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        slug: slug.trim(),
        dateOfBirth: formattedDate,
        gender: gender,
        phone: phone.trim(),
        email: userData?.email,
        avatar: avatar || undefined  
      });
      
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      Alert.alert("Update Failed", "Could not update profile information. Please check all fields and try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarChange = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        quality: 0.8,
        includeBase64: false,
        selectionLimit: 1,
      });
      
      if (result.didCancel) {
        return;
      }
      
      if (result.errorCode) {
        throw new Error(result.errorMessage || "Image selection error");
      }
      
      if (!result.assets || result.assets.length === 0 || !result.assets[0].uri) {
        throw new Error("No image selected");
      }
      
      const selectedImageUri = result.assets[0].uri;
      setAvatar(selectedImageUri); // Update local state immediately for UI feedback
      
      // Create FormData for image upload
      const formData = new FormData();
      const imageType = result.assets[0].type || 'image/jpeg';
      const imageName = result.assets[0].fileName || 'avatar.jpg';
      
      // Fix the FormData type issue
      formData.append("file", {
        uri: selectedImageUri,
        type: imageType,
        name: imageName,
      } as any);
      
      // Show loading indicator
      setUpdating(true);
      
      // Upload the image
      await updateAvatar(formData);
      Alert.alert("Success", "Avatar updated successfully!");
    } catch (error) {
      console.error("Avatar update error:", error);
      Alert.alert("Error", "Failed to update avatar. Please try again.");
      // Revert local avatar state on error
      if (userData?.avatar) {
        setAvatar(userData.avatar);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, {color: colors.text}]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{flex: 1, backgroundColor: colors.background}}
    >
      <StatusBar barStyle={validTheme === "dark" ? "light-content" : "dark-content"} />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, {color: colors.text}]}>Edit Profile</Text>
          <View style={styles.backButton} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, {backgroundColor: colors.primary}]}>
                <Text style={styles.avatarInitial}>
                  {firstName && firstName.length > 0 ? firstName.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={[styles.editAvatarButton, {backgroundColor: colors.primary}]}
              onPress={handleAvatarChange}
              disabled={updating}
            >
              <Ionicons name="camera" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <View style={[styles.formSection, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>Personal Information</Text>
          
          <View style={styles.formRow}>
            <View style={styles.formHalf}>
              <Text style={[styles.label, {color: colors.textSecondary}]}>First Name</Text>
              <InputField
                icon="person-outline"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                label=""
              />
            </View>
            
            <View style={styles.formHalf}>
              <Text style={[styles.label, {color: colors.textSecondary}]}>Last Name</Text>
              <InputField
                icon="person-outline"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                label=""
              />
            </View>
          </View>
          
          <Text style={[styles.label, {color: colors.textSecondary}]}>Phone Number</Text>
          <InputField
            icon="call-outline"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            label=""
            keyboardType="phone-pad"
          />
          
          <Text style={[styles.label, {color: colors.textSecondary}]}>Username</Text>
          <InputField
            icon="at-outline"
            value={slug}
            onChangeText={setSlug}
            placeholder="Your unique username"
            label=""
          />
          
          <Text style={[styles.label, {color: colors.textSecondary}]}>Gender</Text>
          <TouchableOpacity 
            style={[styles.dropdownField, {backgroundColor: colors.background}]}
            onPress={() => setShowGenderModal(true)}
          >
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
            <Text style={[styles.dropdownText, {color: colors.text}]}>{gender ? "Male" : "Female"}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          {/* Gender Selection Modal */}
          <Modal
            visible={showGenderModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowGenderModal(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowGenderModal(false)}
            >
              <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
                <Text style={[styles.modalTitle, {color: colors.text}]}>Select Gender</Text>
                
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    gender === true && {backgroundColor: `${colors.primary}20`}
                  ]}
                  onPress={() => {
                    setGender(true);
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={[styles.optionText, {color: colors.text}]}>Male</Text>
                  {gender === true && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    gender === false && {backgroundColor: `${colors.primary}20`}
                  ]}
                  onPress={() => {
                    setGender(false);
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={[styles.optionText, {color: colors.text}]}>Female</Text>
                  {gender === false && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
          
          <Text style={[styles.label, {color: colors.textSecondary}]}>Date of Birth</Text>
          <BirthdayDatePicker
            selectedDate={dob instanceof Date && !isNaN(dob.getTime()) ? dob : new Date()}
            onChange={handleDateChange}
          />
          
          {!isAgeValid && (
            <Text style={styles.errorText}>You must be at least 18 years old</Text>
          )}
          
          <Text style={[styles.label, {color: colors.textSecondary, marginTop: 10}]}>Email Address</Text>
          <View style={[styles.readOnlyField, {backgroundColor: colors.background}]}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.readOnlyIcon} />
            <Text style={[styles.readOnlyText, {color: colors.text}]}>{userData && "email" in userData ? userData.email : "Not provided"}</Text>
          </View>
        </View>

        {/* Button Section */}
        <View style={styles.buttonSection}>
          <CustomButton 
            title={updating ? "Updating..." : "Save Changes"} 
            onPress={handleUpdate} 
            disabled={updating || loading || !isAgeValid}
            style={{
              backgroundColor: isAgeValid ? colors.primary : (colors.disabled || '#cccccc'),
              borderRadius: 12,
              height: 56,
            }}
            textStyle={{
              fontSize: 16,
              fontWeight: '600',
            }}
          />
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => router.back()}
            disabled={updating}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3498db',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  formSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  formHalf: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 12,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 4,
  },
  readOnlyIcon: {
    marginRight: 10,
  },
  readOnlyText: {
    fontSize: 16,
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
  invalidField: {
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
  },
  buttonSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  cancelButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888888',
  },
});

export default AccountScreen;