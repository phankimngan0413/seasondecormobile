import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { requestTerminationOtpAPI, terminateContractAPI } from '@/utils/contractAPI';

interface ContractCancellationProps {
  contractCode: string;
  contractTotalAmount?: number;
  userWalletBalance?: number;
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CancelDetails {
  userWalletBalance: number;
  contractTotalAmount: number;
  cancellationCompensation: number;
  canCancel: boolean;
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
}

const ContractCancellation: React.FC<ContractCancellationProps> = ({
  contractCode,
  contractTotalAmount = 0,
  userWalletBalance = 0,
  isVisible,
  onClose,
  onSuccess
}) => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  const [step, setStep] = useState<'details' | 'otp' | 'processing'>('details');
  const [otp, setOtp] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [resendAvailable, setResendAvailable] = useState<boolean>(true);
  const [cancelDetails, setCancelDetails] = useState<CancelDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  
  // Calculate cancellation compensation (50% of contract total)
  const cancellationCompensation = (cancelDetails?.cancellationCompensation || contractTotalAmount * 0.5);
  const walletBalance = cancelDetails?.userWalletBalance || userWalletBalance;
  const totalAmount = cancelDetails?.contractTotalAmount || contractTotalAmount;
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isVisible) {
      setStep('details');
      setOtp('');
      setConfirmText('');
      setLoading(false);
      setCountdown(0);
      setResendAvailable(true);
      
    }
  }, [isVisible]);


  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setResendAvailable(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);
  
  const handleRequestOtp = async () => {
    setLoading(true);
    
    try {
      const result = await requestTerminationOtpAPI(contractCode);
      
      if (result && result.success !== false) {
        setStep('otp');
        setCountdown(60); // 60 second countdown
        setResendAvailable(false);
        Alert.alert(
          'OTP Sent', 
          'We\'ve sent a verification code to your email. Please check your inbox.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to request OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (!resendAvailable) return;
    
    setLoading(true);
    
    try {
      const result = await requestTerminationOtpAPI(contractCode);
      
      if (result && result.success !== false) {
        setCountdown(60);
        setResendAvailable(false);
        Alert.alert('OTP Resent', 'A new verification code has been sent to your email.');
      } else {
        Alert.alert('Error', result?.message || 'Failed to resend OTP.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTerminateContract = async () => {
    if (otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP code');
      return;
    }
    
    setStep('processing');
    setLoading(true);
    
    try {
      const result = await terminateContractAPI(contractCode, otp);
      
      if (result && result.success !== false) {
        Alert.alert(
          'Contract Cancelled Successfully',
          `Your contract has been cancelled. The cancellation compensation of ${new Intl.NumberFormat('vi-VN', { 
            style: 'decimal', 
            maximumFractionDigits: 0 
          }).format(cancellationCompensation)} đ has been deducted from your wallet.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess();
                onClose();
              }
            }
          ]
        );
      } else {
        setStep('otp');
        Alert.alert('Error', result?.message || 'Failed to cancel contract. Please check your OTP and try again.');
      }
    } catch (error: any) {
      setStep('otp');
      Alert.alert('Error', error.message || 'Failed to cancel contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderDetailsStep = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <View style={styles.modalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#dc3545' }]}>
            <Ionicons name="document-text" size={28} color="#fff" />
          </View>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Contract Cancellation Details</Text>
        </View>
        
        {loadingDetails ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#dc3545" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading cancellation details...
            </Text>
          </View>
        ) : (
          <View style={[styles.detailsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Your Wallet Balance</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Intl.NumberFormat('vi-VN', { 
                  style: 'decimal', 
                  maximumFractionDigits: 0 
                }).format(walletBalance)} đ
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Contract Total Amount</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Intl.NumberFormat('vi-VN', { 
                  style: 'decimal', 
                  maximumFractionDigits: 0 
                }).format(totalAmount)} đ
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: '#dc3545' }]}>Cancellation Compensation (50%)</Text>
              <Text style={[styles.detailValue, { color: '#dc3545', fontWeight: 'bold' }]}>
                {new Intl.NumberFormat('vi-VN', { 
                  style: 'decimal', 
                  maximumFractionDigits: 0 
                }).format(cancellationCompensation)} đ
              </Text>
            </View>
          </View>
        )}
        
        <View style={[styles.warningContainer, { backgroundColor: '#fff3cd', borderColor: '#ffc107' }]}>
          <Ionicons name="warning" size={20} color="#856404" />
          <Text style={[styles.compensationWarning, { color: '#856404' }]}>
            By proceeding with the cancellation, you agree to pay the compensation amount of {new Intl.NumberFormat('vi-VN', { 
              style: 'decimal', 
              maximumFractionDigits: 0 
            }).format(cancellationCompensation)} đ as per the contract terms.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
  
  const renderOtpStep = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <View style={styles.modalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#0d6efd' }]}>
            <Ionicons name="mail" size={28} color="#fff" />
          </View>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Verification Code</Text>
        </View>
        
        <Text style={[styles.otpDescription, { color: colors.textSecondary }]}>
          We've sent a verification code to your email. Please enter the code to confirm contract cancellation.
        </Text>
        
        <View style={styles.otpContainer}>
          <TextInput
            style={[styles.otpInput, { 
              borderColor: colors.border, 
              backgroundColor: colors.background,
              color: colors.text 
            }]}
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter OTP"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={6}
            textAlign="center"
          />
        </View>
        
        <View style={styles.resendContainer}>
          <TouchableOpacity 
            style={[styles.resendButton, { opacity: resendAvailable ? 1 : 0.5 }]}
            onPress={handleResendOtp}
            disabled={!resendAvailable || loading}
          >
            <Text style={[styles.resendText, { color: '#007AFF' }]}>
              {resendAvailable ? 'Resend OTP' : `Resend in ${countdown}s`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
  
  const renderProcessingStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.modalHeader}>
        <ActivityIndicator size="large" color="#dc3545" />
        <Text style={[styles.modalTitle, { color: colors.text }]}>Processing Cancellation</Text>
      </View>
      
      <Text style={[styles.processingText, { color: colors.textSecondary }]}>
        Please wait while we process your contract cancellation...
      </Text>
    </View>
  );
  
  const renderModalButtons = () => {
    if (step === 'processing') return null;
    
    return (
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
          onPress={onClose}
          disabled={loading}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>
            Go Back
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.modalButton, 
            styles.confirmButton, 
            { 
              backgroundColor: step === 'otp' ? '#0d6efd' : '#dc3545',
              opacity: loading || loadingDetails ? 0.7 : 1
            }
          ]}
          onPress={step === 'details' ? handleRequestOtp : handleTerminateContract}
          disabled={loading || loadingDetails}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons 
                name={step === 'details' ? 'mail' : 'checkmark'} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.confirmButtonText}>
                {step === 'details' ? 'Continue' : 'VERIFY & PROCEED'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {step === 'details' && renderDetailsStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'processing' && renderProcessingStep()}
          
          {renderModalButtons()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 0,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  scrollContainer: {
    maxHeight: 450,
  },
  stepContainer: {
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  detailsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 16,
    flex: 1,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  warningContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    lineHeight: 20,
  },
  walletBalanceContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  insufficientFunds: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  addFundsButton: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  addFundsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 5,
  },
  otpDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  otpInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    width: 160,
    letterSpacing: 8,
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendButton: {
    padding: 12,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '500',
  },
  processingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  compensationWarning: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ContractCancellation;