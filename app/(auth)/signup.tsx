import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useTheme } from "@/constants/ThemeContext"; // ✅ Import theme
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "expo-router";
import apiClient from "@/utils/axiosConfig";
import InputField from "@/components/InputField";
import CustomButton from "@/components/ui/Button/Button";
import BirthdayDatePicker from "@/components/ui/DatePicker";
import DropdownSelect from "@/components/ui/DropdownSelect";
import { Ionicons } from "@expo/vector-icons";

// ✅ Kiểu dữ liệu
type GenderType = "Male" | "Female";

// ✅ Kiểm tra dữ liệu nhập vào
const schema = yup.object().shape({
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
  dob: yup.date().nullable().required("Date of birth is required"),
  gender: yup.mixed<GenderType>().oneOf(["Male", "Female"]).required("Gender is required"),
});

const SignUpScreen = () => {
  const { theme } = useTheme(); // ✅ Lấy theme từ context
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      dob: new Date(),
      gender: "Male" as GenderType,
    },
  });

  // ✅ Xử lý đăng ký
  const onSubmit = async (data: any) => {
    const userData = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dob.toISOString(),
      gender: data.gender === "Male",
      phone: data.phone,
    };

    try {
      setIsLoading(true);
      const res = await apiClient.post("/api/register", userData);
      setIsLoading(false);

      if (res.data?.success) {
        Alert.alert("Success", "Registration successful! Please verify your email.");
        router.replace("/(auth)/login"); // ✅ Chuyển về login sau khi đăng ký
      } else {
        Alert.alert("Error", "Registration failed. Please try again.");
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", "Network error, please try again.");
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === "dark" ? "#151718" : "#ffffff" }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* 🔹 Nút đóng */}
       
        <Text style={[styles.title, { color: theme === "dark" ? "#ffffff" : "#000000" }]}>
          Create Your Account
        </Text>
        <Text style={[styles.subtitle, { color: theme === "dark" ? "#bbbbbb" : "#555" }]}>
          Start exploring seasonal decorations for your home.
        </Text>

        {/* 🔹 Giữ nguyên vị trí các InputField như ban đầu */}
        <InputField
          icon="person-outline"
          placeholder="First Name"
          value={watch("firstName")}
          onChangeText={(text) => setValue("firstName", text)}
          error={errors.firstName?.message}
        />
        <InputField
          icon="person-outline"
          placeholder="Last Name"
          value={watch("lastName")}
          onChangeText={(text) => setValue("lastName", text)}
          error={errors.lastName?.message}
        />
        <InputField
          icon="mail-outline"
          placeholder="Email"
          value={watch("email")}
          onChangeText={(text) => setValue("email", text)}
          error={errors.email?.message}
        />
        <InputField
          icon="lock-closed-outline"
          placeholder="Password"
          secureTextEntry
          value={watch("password")}
          onChangeText={(text) => setValue("password", text)}
          error={errors.password?.message}
        />
        <InputField
          icon="lock-closed-outline"
          placeholder="Confirm Password"
          secureTextEntry
          value={watch("confirmPassword")}
          onChangeText={(text) => setValue("confirmPassword", text)}
          error={errors.confirmPassword?.message}
        />
        <InputField
          icon="call-outline"
          placeholder="Phone Number"
          value={watch("phone")}
          onChangeText={(text) => setValue("phone", text)}
          error={errors.phone?.message}
        />

<DropdownSelect
  label="Gender"
  gender={watch("gender") || "Male"}
  onChange={(value) => setValue("gender", value as GenderType)}
  textStyle={{ color: theme === "dark" ? "#ffffff" : "#000000" }} // ✅ Chỉnh màu chữ theo theme
/>

<BirthdayDatePicker
  label="Date of Birth"
  selectedDate={watch("dob")}
  onChange={(date) => setValue("dob", date)}
  textStyle={{ color: theme === "dark" ? "#ffffff" : "#000000" }} // ✅ Chỉnh màu chữ theo theme
/>


        {/* 🔹 Nút Đăng ký */}
        <CustomButton title={isLoading ? "Loading..." : "Register"} onPress={handleSubmit(onSubmit)} disabled={isLoading} />

        {/* 🔹 Đã có tài khoản? Đăng nhập ngay */}
        <Text style={[styles.signupText, { color: theme === "dark" ? "#bbbbbb" : "#777" }]}>
          Already have an account?{" "}
          <Text style={styles.signupLink} onPress={() => router.push("/(auth)/login")}>
            Login
          </Text>
        </Text>
      </ScrollView>
    </View>
  );
};

// ✅ Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 20, alignItems: "center" },
  closeButton: { position: "absolute", top: 40, right: 20, zIndex: 1 },
  title: { fontSize: 28, fontWeight: "bold", marginTop: 20 },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  signupText: { marginTop: 15, fontSize: 14 },
  signupLink: { color: "#5fc1f1", fontWeight: "bold" },
});

export default SignUpScreen;
