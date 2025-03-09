import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import InputField from "@/components/InputField";
import CustomButton from "@/components/ui/Button/Button";
import { Ionicons } from "@expo/vector-icons";
import { loginAPI } from "@/utils/auth";
import { setToken } from "@/services/auth";
import Logo from "@/components/Logo/Logo";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email: string; password: string }>({ email: "", password: "" });

  async function handleLogin() {
    setErrors({ email: "", password: "" });

    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required." }));
      return;
    }
    if (!isValidEmail(email)) {
      setErrors((prev) => ({ ...prev, email: "Invalid email format." }));
      return;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required." }));
      return;
    }
    if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters long." }));
      return;
    }

    setLoading(true);
    try {
      console.log("🔵 Sending login request...");
      const { token } = await loginAPI(email, password);
      console.log("✅ Received Token:", token);

      if (token) {
        await setToken(token);
        console.log("🔵 Navigating to profile...");
        router.replace("/(tabs)/profile");
      } else {
        throw new Error("Invalid login response");
      }
    } catch (error: any) {
      console.error("🔴 Login Error:", error);
      Alert.alert("Login Failed", error.message || "Something went wrong");
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Logo />

      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => router.push("/")}>
        <Ionicons name="close-outline" size={30} color={colors.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Welcome Back!</Text>
      <Text style={[styles.subtitle, { color: colors.icon }]}>
        Login to your account and start exploring seasonal decorations.
      </Text>

      {/* Email Input */}
      <InputField
        icon="mail-outline"
        placeholder="Your email"
        placeholderTextColor={colors.icon}
        value={email}
        onChangeText={(text) => {
          setEmail(text.trim());
          setErrors((prev) => ({ ...prev, email: isValidEmail(text) ? "" : "Invalid email format." }));
        }}
        error={errors.email}
      />

      {/* Password Input */}
      <InputField
        icon="lock-closed-outline"
        placeholder="Password"
        placeholderTextColor={colors.icon}
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
        }}
        error={errors.password}
        rightIcon={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.icon} />
          </TouchableOpacity>
        }
      />

      {/* Login Button */}
      <CustomButton title={loading ? "Logging in..." : "Continue with Email"} onPress={handleLogin} disabled={loading} />

      <Text style={[styles.or, { color: colors.icon }]}>or</Text>

      {/* Google Login */}
      <CustomButton
        title="Continue with Google"
        onPress={() => console.log("Google Login")}
        icon={<Ionicons name="logo-google" size={20} color="#fff" />}
      />

      {/* Signup Link */}
      <Text style={[styles.signupText, { color: colors.icon }]}>
        Don't have an account?{" "}
        <Text style={[styles.signupLink, { color: "#ff6600" }]} onPress={() => router.push("/(auth)/signup")}>
          Sign up
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  or: {
    marginVertical: 10,
  },
  signupText: {
    marginTop: 15,
    fontSize: 14,
  },
  signupLink: {
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
});

export default LoginScreen;
