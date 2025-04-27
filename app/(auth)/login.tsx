import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import InputField from "@/components/InputField";
import CustomButton from "@/components/ui/Button/Button";
import { Ionicons } from "@expo/vector-icons";
import { loginAPI } from "@/utils/authAPI";
import { setToken } from "@/services/auth";
import Logo from "@/components/Logo/Logo";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import * as Google from "expo-auth-session/providers/google"; // Google login import
import { googleLoginAPI ,resetPasswordAPI,forgotPasswordAPI} from "@/utils/authAPI"; // Import your googleLoginAPI function
import { makeRedirectUri } from 'expo-auth-session';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPassword = (password: string) => {
  // Check if password contains at least one uppercase letter, one lowercase letter, and one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber;
};

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
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Google Login State
  const [googleUserInfo, setGoogleUserInfo] = useState<{ displayName: string; idToken: string } | null>(null);

  // Google OAuth client IDs
  const googleExpoClientId = "269748534933-pfelsope967cksdg624uhahaj99apdgu.apps.googleusercontent.com";
  const googleAndroidStandaloneClientId = "269748534933-mk0kjr1k5rcutol5bb7nqdj52bbn1udm.apps.googleusercontent.com";

  const redirectUri = makeRedirectUri({
    // You can add additional configurations here if needed
  });
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleExpoClientId,
    androidClientId: googleAndroidStandaloneClientId,
    scopes: ["profile", "email"],
    redirectUri: redirectUri,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        setGoogleUserInfo({ displayName: "Google User", idToken: id_token });
        
        // Add logging to see the token
        console.log("Google ID Token received:", id_token.substring(0, 10) + "...");
        
        // Call your API with better error handling
        googleLoginAPI(id_token)
          .then(async (response) => {
            console.log("Google Login API response structure:", Object.keys(response));
            
            // Check if token exists and is valid
            if (response && response.token) {
              console.log("✅ Valid token received from API");
              try {
                await setToken(response.token);
                console.log("✅ Token successfully stored");
                router.replace("/(tabs)/profile");
              } catch (storageError) {
                console.error("🔴 Error storing token:", storageError);
                Alert.alert("Login Error", "Failed to store authentication token");
              }
            } else {
              console.error("🔴 Invalid token structure:", response);
              Alert.alert("Login Failed", "Invalid authentication response from server");
            }
          })
          .catch((error) => {
            console.error("🔴 Google login API error:", error);
            Alert.alert(
              "Google Login Failed", 
              "Unable to authenticate with the server. Please try again later."
            );
          });
      } else {
        console.error("🔴 No ID token in Google response");
        Alert.alert("Google Login Failed", "Authentication information missing");
      }
    } else if (response?.type === "error") {
      console.error("🔴 Google auth error:", response.error);
      Alert.alert("Google Login Failed", "Authentication process was interrupted");
    }
  }, [response]);
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
    if (!isValidPassword(password)) {
      setErrors((prev) => ({ ...prev, password: "Password must contain at least one uppercase letter, one lowercase letter, and one number." }));
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

  async function handleForgotPassword() {
    if (!forgotPasswordEmail) {
      Alert.alert("Email Required", "Please enter your email address");
      return;
    }
    
    if (!isValidEmail(forgotPasswordEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }
    
    setResetLoading(true);
    try {
      console.log("🔵 Attempting to send forgot password request for:", forgotPasswordEmail);
      await forgotPasswordAPI(forgotPasswordEmail);
      
      // Request was successful, proceed to verification step
      console.log("🔵 Forgot password request successful, proceeding to verification step");
      setResetStep("verify");
      
    } catch (error: any) {
      console.error("🔴 Error in handleForgotPassword:", error);
      
      // If it's a cooldown error, show message and auto-proceed to OTP screen
      if (error.cooldownError) {
        console.log("🔵 Cooldown error detected, showing message and auto-proceeding to OTP screen");
        Alert.alert(
          "Information", 
          error.message,
          [{ text: "OK", onPress: () => setResetStep("verify") }]
        );
      } else if (error.message && typeof error.message === 'string' && error.message.includes("Network Error")) {
        // Network error but still allow proceeding
        Alert.alert(
          "Connection Error",
          "Cannot connect to the server. Please check your internet connection.",
          [
            { 
              text: "OK", 
              onPress: () => {} 
            },
            {
              text: "Proceed Anyway",
              onPress: () => setResetStep("verify")
            }
          ]
        );
      } else {
        // For other errors, just show message and don't proceed
        Alert.alert(
          "Error", 
          error.message || "Failed to send password reset email"
        );
      }
    } finally {
      setResetLoading(false);
    }
  }
  
  async function handleResetPassword() {
    if (!resetOtp) {
      Alert.alert("OTP Required", "Please enter the verification code sent to your email");
      return;
    }
    
    if (!newPassword) {
      Alert.alert("Password Required", "Please enter a new password");
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert("Invalid Password", "Password must be at least 6 characters long");
      return;
    }
    
    if (!isValidPassword(newPassword)) {
      Alert.alert(
        "Invalid Password", 
        "Password must contain at least one uppercase letter, one lowercase letter, and one number."
      );
      return;
    }
    
    setResetLoading(true);
    try {
      await resetPasswordAPI(resetOtp, newPassword);
      
      Alert.alert(
        "Password Reset Successful",
        "Your password has been reset successfully. You can now login with your new password.",
        [{ text: "OK", onPress: () => {
          setShowForgotPassword(false);
          setResetStep("request");
          setResetOtp("");
          setNewPassword("");
        }}]
      );
      
    } catch (error: any) {
      // Check if error is specifically about invalid OTP
      if (error.message && error.message.includes("Invalid OTP")) {
        Alert.alert(
          "Invalid Verification Code", 
          "The verification code you entered is incorrect. Please check your email and try again."
        );
      } else {
        Alert.alert("Error", error.message || "Failed to reset password");
      }
    } finally {
      setResetLoading(false);
    }
  }

  // Render the forgot password modal/screen
  if (showForgotPassword) {
    if (resetStep === "request") {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setShowForgotPassword(false)}
          >
            <Ionicons name="arrow-back" size={30} color={colors.text} />
          </TouchableOpacity>
          
          <Logo />
          
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Enter your email address and we'll send you a verification code to reset your password.
          </Text>
          
          <InputField
            icon="mail-outline"
            placeholder="Your email"
            placeholderTextColor={colors.icon}
            value={forgotPasswordEmail}
            onChangeText={(text) => setForgotPasswordEmail(text.trim())}
            error=""
            label=""
          />
          
          <CustomButton 
            title={resetLoading ? "Sending..." : "Request Reset Code"} 
            onPress={handleForgotPassword} 
            disabled={resetLoading} 
          />
        </View>
      );
    } else {
      // OTP and new password screen
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setResetStep("request")}
          >
            <Ionicons name="arrow-back" size={30} color={colors.text} />
          </TouchableOpacity>
          
          <Logo />
          
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Enter the verification code sent to {forgotPasswordEmail} and your new password.
          </Text>
          
          <Text style={[styles.infoText, { color: colors.icon }]}>
            Please enter the 6-digit verification code sent to your email.
          </Text>
          
          <InputField
            icon="key-outline"
            placeholder="Verification Code"
            placeholderTextColor={colors.icon}
            value={resetOtp}
            onChangeText={setResetOtp}
            keyboardType="number-pad"
            error=""
            label=""
          />
          
          <InputField
            icon="lock-closed-outline"
            placeholder="New Password"
            placeholderTextColor={colors.icon}
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              // You could add real-time validation here if you want
            }}
            error=""
            rightIcon={
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={22} color={colors.icon} />
              </TouchableOpacity>
            } 
            label=""
          />
          
          <Text style={[styles.passwordRequirements, { color: colors.icon }]}>
            Password must contain at least one uppercase letter, one lowercase letter, and one number.
          </Text>
          
          <CustomButton 
            title={resetLoading ? "Resetting..." : "Reset Password"} 
            onPress={handleResetPassword} 
            disabled={resetLoading} 
          />
        </View>
      );
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
        label=""
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
          // Clear existing error when typing starts
          if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
          
          // Optional: provide real-time validation feedback
          if (text.length >= 6 && !isValidPassword(text)) {
            setErrors((prev) => ({ 
              ...prev, 
              password: "Password needs uppercase, lowercase & number" 
            }));
          }
        }}
        error={errors.password}
        rightIcon={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.icon} />
          </TouchableOpacity>
        } 
        label=""
      />

      {/* Forgot Password Link */}
      <TouchableOpacity 
        style={styles.forgotPasswordContainer}
        onPress={() => setShowForgotPassword(true)}
      >
        <Text style={[styles.forgotPasswordText, { color: "#ff6600" }]}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      {/* Login Button */}
      <CustomButton 
        title={loading ? "Logging in..." : "Continue with Email"} 
        onPress={handleLogin} 
        disabled={loading} 
      />

      <Text style={[styles.or, { color: colors.icon }]}>or</Text>

      {/* Google Login */}
      <CustomButton
        title="Continue with Google"
        onPress={() => promptAsync()} // Trigger Google login prompt
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
  infoText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    fontStyle: "italic",
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
  forgotPasswordContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 15,
    paddingRight: 10,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
  },
  passwordRequirements: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 10,
    fontStyle: "italic",
  },
});

export default LoginScreen;