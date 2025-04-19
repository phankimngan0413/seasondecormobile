import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Keyboard,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
import { verifyEmailAPI, resendVerificationCodeAPI } from "@/utils/authAPI";

type VerificationModalProps = {
  isVisible: boolean;
  onClose: () => void;
  email: string;
  onVerificationSuccess: () => void;
};

const VerificationModal = ({ isVisible, onClose, email, onVerificationSuccess }: VerificationModalProps) => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Create refs for each input
  const inputRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));
  
  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    } else {
      // Reset code when modal closes
      setCode(Array(6).fill(""));
      setError("");
    }
  }, [isVisible]);
  
  // Handle input change
  const handleChange = (text: string, index: number) => {
    // Only allow digits
    if (!/^\d*$/.test(text)) return;
    
    // Create a new array with the updated value
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    
    // Clear error message when typing
    if (error) setError("");
    
    // Auto-advance to next input if current input is filled
    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  // Handle backspace key
  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  // Verify the code
  const handleVerify = async () => {
    Keyboard.dismiss();
    
    // Check if code is complete
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      
      // Sử dụng API xác thực email với mã OTP - truyền tham số đúng tên
      await verifyEmailAPI(email, fullCode);
      
      // If verification is successful
      onVerificationSuccess();
    } catch (error: any) {
      console.log("Verification error:", error);
      
      // Hiển thị thông báo lỗi từ API hoặc thông báo chung
      const errorMessage = error.message || "Verification failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resend verification code
  const handleResend = async () => {
    try {
      setIsLoading(true);
      
      // Gửi lại mã xác thực
      await resendVerificationCodeAPI(email);
      
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
      
      // Reset mã đã nhập khi gửi lại
      setCode(Array(6).fill(""));
      setError("");
      
      // Focus vào ô đầu tiên
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    } catch (error: any) {
      console.log("Resend error:", error);
      
      const errorMessage = error.message || "Failed to resend code. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContainer,
          { backgroundColor: colors.background }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Verification Code
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.modalDescription, { color: colors.icon }]}>
            Please enter the 6-digit verification code sent to {email}
          </Text>
          
          <Text style={[styles.timeNotice, { color: colors.icon }]}>
            The code will expire after 15 minutes
          </Text>
          
          <View style={styles.codeContainer}>
            {Array(6).fill(0).map((_, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={[
                  styles.codeInput,
                  { 
                    backgroundColor: theme === "dark" ? "#222" : "#f5f5f5",
                    borderColor: theme === "dark" ? "#555" : "#ddd",
                    color: colors.text
                  }
                ]}
                value={code[index]}
                onChangeText={text => handleChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                maxLength={1}
                keyboardType="number-pad"
                selectTextOnFocus
              />
            ))}
          </View>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TouchableOpacity 
            style={[
              styles.button, 
              isLoading && styles.buttonDisabled
            ]} 
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.icon }]}>
              Didn't receive a code?
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={isLoading}>
              <Text style={[
                styles.resendLink,
                isLoading && { opacity: 0.5 }
              ]}>
                Resend
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContainer: {
    width: "100%",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold"
  },
  closeButton: {
    padding: 4
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 8
  },
  timeNotice: {
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 24
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24
  },
  codeInput: {
    width: 45,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold"
  },
  errorText: {
    color: "#ff4444",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center"
  },
  button: {
    backgroundColor: "#5fc1f1",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20
  },
  resendText: {
    fontSize: 14,
    marginRight: 5
  },
  resendLink: {
    color: "#5fc1f1",
    fontWeight: "bold",
    fontSize: 14
  }
});

export default VerificationModal;