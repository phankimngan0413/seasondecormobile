import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import InputField from "@/components/InputField";
import CustomButton from "@/components/ui/Button/Button";
import { Ionicons } from "@expo/vector-icons";
import { loginAPI, googleLoginAPI, resetPasswordAPI, forgotPasswordAPI } from "@/utils/authAPI";
import { setToken, getToken } from "@/services/auth";
import Logo from "@/components/Logo/Logo";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from 'expo-auth-session';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPassword = (password: string) => {
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

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

  // Check token status on component mount
  useEffect(() => {
    const checkTokenStatus = async () => {
      try {
        const token = await getToken();
        console.log("🟡 Initial token check:", token ? "Token exists" : "No token");
        
        if (token) {
          console.log("🟢 Valid token found, redirecting to profile");
          router.replace("/(tabs)/profile");
        }
      } catch (error) {
        console.error("🔴 Error checking token:", error);
      }
    };
    
    checkTokenStatus();
  }, []);

  // Handle Google authentication response
  useEffect(() => {
    const handleGoogleAuth = async () => {
      console.log("🟡 Google auth response type:", response?.type);
      
      if (response?.type === "success") {
        setGoogleLoading(true);
        
        console.log("🟡 Full response params:", JSON.stringify(response.params));
        
        if (!response.params.id_token) {
          console.error("🔴 GOOGLE AUTH: No ID token in response");
          Alert.alert("Google Login Failed", "Authentication information missing");
          setGoogleLoading(false);
          return;
        }
        
        const idToken = response.params.id_token;
        setGoogleToken(idToken);
        console.log("🟢 GOOGLE AUTH: ID token received:", idToken.substring(0, 15) + "...");
        
        try {
          console.log("🟡 Calling backend with Google token...");
          const loginResponse = await googleLoginAPI(idToken);
          console.log("🟢 Google login API response:", JSON.stringify(loginResponse));
          
          if (!loginResponse || !loginResponse.token) {
            console.error("🔴 GOOGLE AUTH: Invalid or missing token in response");
            Alert.alert("Login Failed", "Server returned an invalid response");
            setGoogleLoading(false);
            return;
          }
          
          const authToken = loginResponse.token;
          console.log("🟢 GOOGLE AUTH: Backend token received:", authToken.substring(0, 15) + "...");
          
          try {
            console.log("🟡 Attempting to store token...");
            await setToken(authToken);
            
            // Verify token was stored
            const storedToken = await getToken();
            console.log("🟢 Token storage verification:", storedToken ? "Success" : "Failed");
            
            if (storedToken) {
              console.log("🟢 GOOGLE AUTH: Token successfully stored");
              router.replace("/(tabs)/profile");
            } else {
              console.error("🔴 GOOGLE AUTH: Token stored but verification failed");
              Alert.alert("Login Error", "Failed to persist authentication");
            }
          } catch (storageError) {
            console.error("🔴 GOOGLE AUTH: Error storing token:", storageError);
            Alert.alert("Login Error", "Failed to store authentication token");
          }
        } catch (apiError: any) {
          console.error("🔴 GOOGLE AUTH: API call failed:", apiError.message);
          Alert.alert("Google Login Failed", apiError.message || "Unable to authenticate with the server");
        } finally {
          setGoogleLoading(false);
        }
      } else if (response?.type === "error") {
        console.error("🔴 Google auth error:", response.error);
        Alert.alert("Google Login Failed", "Authentication process was interrupted");
      }
    };
    
    if (response) {
      handleGoogleAuth();
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
      console.log("🟡 Sending login request...");
      const { token } = await loginAPI(email, password);
      console.log("🟢 Received Token:", token.substring(0, 15) + "...");

      if (token) {
        await setToken(token);
        
        // Verify token was stored
        const storedToken = await getToken();
        console.log("🟢 Token storage verification:", storedToken ? "Success" : "Failed");
        
        if (storedToken) {
          console.log("🟢 Token successfully stored, navigating to profile");
          router.replace("/(tabs)/profile");
        } else {
          console.error("🔴 Token stored but verification failed");
          Alert.alert("Login Error", "Failed to persist authentication");
        }
      } else {
        throw new Error("Invalid login response");
      }
    } catch (error: any) {
      console.error("🔴 Login Error:", error.message);
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
      console.log("🟡 Attempting to send forgot password request for:", forgotPasswordEmail);
      await forgotPasswordAPI(forgotPasswordEmail);
      
      // Request was successful, proceed to verification step
      console.log("🟢 Forgot password request successful, proceeding to verification step");
      setResetStep("verify");
      
    } catch (error: any) {
      console.error("🔴 Error in handleForgotPassword:", error.message);
      
      // If it's a cooldown error, show message and auto-proceed to OTP screen
      if (error.cooldownError) {
        console.log("🟡 Cooldown error detected, showing message and auto-proceeding to OTP screen");
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
            { text: "OK", onPress: () => {} },
            { text: "Proceed Anyway", onPress: () => setResetStep("verify") }
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
        disabled={loading || googleLoading} 
      />

      <Text style={[styles.or, { color: colors.icon }]}>or</Text>

      {/* Google Login */}
      <CustomButton
        title={googleLoading ? "Authenticating..." : "Continue with Google"}
        onPress={() => {
          console.log("🟡 Starting Google login flow...");
          promptAsync();
        }}
        disabled={loading || googleLoading}
        icon={<Ionicons name="logo-google" size={20} color="#fff" />}
      />

      {/* For debugging - show Google token if available */}
      {googleToken && __DEV__ && (
        <Text style={[styles.debugText, { color: colors.icon }]}>
          Google Token: {googleToken.substring(0, 10)}...
        </Text>
      )}

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
  debugText: {
    fontSize: 10,
    marginTop: 5,
    opacity: 0.7,
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