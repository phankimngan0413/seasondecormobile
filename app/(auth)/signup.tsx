import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { useTheme } from "@/constants/ThemeContext";
import * as yup from "yup";
import { useRouter } from "expo-router";
import { registerCustomerAPI } from "@/utils/authAPI";
import { Ionicons } from "@expo/vector-icons";
import CalendarPicker from "@/components/CalendarPicker"; // Import the CalendarPicker component
import { Colors } from "@/constants/Colors";
import InputField from "@/components/InputField"; // Import the enhanced InputField

// Define the form data type
type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
};

// Form validation schema
const schema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
  phone: yup
    .string()
    .matches(/^\d{10}$/, "Invalid phone number")
    .required("Phone is required"),
  dateOfBirth: yup.string().required("Date of birth is required"),
  gender: yup.string().required("Gender is required"),
});

const SignUpScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(new Date("2000-01-01"));
  const [gender, setGender] = useState("Male");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Generate a slug from first and last name
  const generateSlug = (firstName: string, lastName: string): string => {
    const normalizedName = `${firstName}${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return `${normalizedName}${Math.floor(Math.random() * 1000)}`;
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Validate form
  const validateForm = () => {
    try {
      const data = {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        phone,
        dateOfBirth: formatDate(dateOfBirth),
        gender
      };
      
      schema.validateSync(data, { abortEarly: false });
      setErrors({});
      return data;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: {[key: string]: string} = {};
        error.inner.forEach(err => {
          if (err.path) {
            newErrors[err.path] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return null;
    }
  };

  // Handle date change
  const handleDateChange = (date: Date) => {
    setDateOfBirth(date);
  };

  // Handle registration
  const handleSubmit = async () => {
    const validData = validateForm();
    if (!validData) return;
    
    try {
      setIsLoading(true);
      
      // Generate slug from name
      const slug = generateSlug(validData.firstName, validData.lastName);
      
      // Use the new API
      await registerCustomerAPI(
        validData.email,
        validData.password,
        validData.firstName,
        validData.lastName,
        slug,
        validData.dateOfBirth,
        validData.gender === "Male"
      );
      
      // Show success message
      Alert.alert(
        "Registration Successful",
        "Your account has been created successfully. Please check your email for verification.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (error: any) {
      const errorMessage = error.message || "Registration failed. Please try again.";
      Alert.alert("Registration Failed", errorMessage);
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            
            
            <Text style={[styles.title, { color: colors.text }]}>
              Create Your Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Start exploring seasonal decorations for your home.
            </Text>

            {/* First Name */}
            <InputField
              label="First Name"
              icon="person-outline"
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
              autoCapitalize="words"
            />
            
            {/* Last Name */}
            <InputField
              label="Last Name"
              icon="person-outline"
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
              autoCapitalize="words"
            />
            
            {/* Email */}
            <InputField
              label="Email"
              icon="mail-outline"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => setEmail(text.trim())}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            {/* Password */}
            <InputField
              label="Password"
              icon="lock-closed-outline"
              placeholder="Create password "
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={theme === "dark" ? "#bbb" : "#888"} />
                </TouchableOpacity>
              }
            />
            
            {/* Confirm Password */}
            <InputField
              label="Confirm Password"
              icon="lock-closed-outline"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color={theme === "dark" ? "#bbb" : "#888"} />
                </TouchableOpacity>
              }
            />
            
            {/* Phone */}
            <InputField
              label="Phone Number"
              icon="call-outline"
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              keyboardType="phone-pad"
            />
            
            {/* Date of Birth Selector */}
            <View style={styles.datePickerContainer}>
              <Text style={[styles.label, { color: theme === "dark" ? "#fff" : "#333" }]}>Date of Birth</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={[
                  styles.datePickerButtonContent,
                  { 
                    backgroundColor: theme === "dark" ? "#222" : "#ffffff", 
                    borderColor: errors.dateOfBirth ? "#ff4444" : theme === "dark" ? "#555" : "#ddd",
                    borderWidth: 1.5,
                  }
                ]}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={errors.dateOfBirth ? "#ff4444" : theme === "dark" ? "#bbb" : "#ccc"} 
                    style={styles.dateIcon} 
                  />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {formatDate(dateOfBirth)}
                  </Text>
                  <Ionicons 
                    name="chevron-down-outline" 
                    size={20} 
                    color={errors.dateOfBirth ? "#ff4444" : theme === "dark" ? "#bbb" : "#ccc"} 
                  />
                </View>
              </TouchableOpacity>
              {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
            </View>

            {/* Gender Dropdown */}
            <View style={styles.genderContainer}>
              <Text style={[styles.label, { color: theme === "dark" ? "#fff" : "#333" }]}>Gender</Text>
              <TouchableOpacity 
                style={styles.genderButton}
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
              >
                <View style={[
                  styles.genderButtonContent,
                  { 
                    backgroundColor: theme === "dark" ? "#222" : "#ffffff", 
                    borderColor: errors.gender ? "#ff4444" : theme === "dark" ? "#555" : "#ddd",
                    borderWidth: 1.5
                  }
                ]}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={errors.gender ? "#ff4444" : theme === "dark" ? "#bbb" : "#ccc"} 
                    style={styles.genderIcon} 
                  />
                  <Text style={[styles.genderText, { color: colors.text }]}>
                    {gender}
                  </Text>
                  <Ionicons 
                    name={(showGenderDropdown ? "chevron-up-outline" : "chevron-down-outline")} 
                    size={20} 
                    color={errors.gender ? "#ff4444" : theme === "dark" ? "#bbb" : "#ccc"}
                  />
                </View>
              </TouchableOpacity>
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
              
              {showGenderDropdown && (
                <View style={[styles.dropdownMenu, { 
                  backgroundColor: theme === "dark" ? "#222" : "#ffffff",
                  borderColor: theme === "dark" ? "#555" : "#ddd",
                  borderWidth: 1
                }]}>
                  <TouchableOpacity 
                    style={[
                      styles.dropdownItem,
                      gender === "Male" && { backgroundColor: validTheme === "dark" ? "#444" : "#e0e0e0" }
                    ]}
                    onPress={() => {
                      setGender("Male");
                      setShowGenderDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.dropdownItem,
                      gender === "Female" && { backgroundColor: validTheme === "dark" ? "#444" : "#e0e0e0" }
                    ]}
                    onPress={() => {
                      setGender("Female");
                      setShowGenderDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>Female</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[
                styles.button, 
                isLoading && styles.buttonDisabled
              ]} 
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Creating Account..." : "Register"}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginLinkContainer}>
              <Text style={[styles.loginText, { color: colors.icon }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Calendar Picker Modal */}
          <CalendarPicker
            selectedDate={dateOfBirth}
            onSelectDate={handleDateChange}
            isVisible={showDatePicker}
            onClose={() => setShowDatePicker(false)}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  scrollContainer: { 
    flexGrow: 1, 
    padding: 20,
    paddingTop: 40
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 40,
    zIndex: 10,
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginTop: 30,
    alignSelf: 'center',
    marginBottom: 8
  },
  subtitle: { 
    fontSize: 14, 
    textAlign: "center", 
    marginBottom: 30,
    alignSelf: 'center'
  },
  datePickerContainer: {
    width: '100%',
    marginBottom: 15
  },
  datePickerButton: {
    width: '100%'
  },
  datePickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  dateIcon: {
    marginRight: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: "SpaceMono"
  },
  genderContainer: {
    width: '100%',
    marginBottom: 15,
    position: 'relative'
  },
  genderButton: {
    width: '100%'
  },
  genderButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  genderIcon: {
    marginRight: 10,
  },
  genderText: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: "SpaceMono"
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  errorText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff4444",
  },
  dropdownMenu: {
    width: '100%',
    borderRadius: 8,
    marginTop: -8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  dropdownItemText: {
    fontSize: 16
  },
  button: {
    backgroundColor: '#5fc1f1',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30
  },
  loginText: {
    fontSize: 14,
    marginRight: 5
  },
  loginLink: {
    color: "#5fc1f1",
    fontWeight: "bold",
    fontSize: 14
  }
});

export default SignUpScreen;