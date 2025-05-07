import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { processCommitDepositAPI } from '@/utils/bookingAPI';
import { getWalletBalanceAPI } from '@/utils/walletAPI';

// Main colors
const COLORS = {
  PRIMARY: "#5fc1f1", // Use your app's primary color
  SUCCESS: "#34c759",
  DANGER: "#ff3b30",
  WARNING: "#ff9500",
  SECONDARY: "#6c757d"
} as const;

// Fixed deposit amount
const DEPOSIT_AMOUNT = 500000; // 500,000 VND

// Interface for wallet response
interface WalletResponse {
  success?: boolean;
  message?: string;
  balance: number;
  walletId?: number;
}

const InitialDepositScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as keyof typeof Colors];
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingCode: string }>();
  const bookingCode = params.bookingCode;
  
  // States
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  useEffect(() => {
    fetchWalletBalance();
  }, []);
  
  const fetchWalletBalance = async (): Promise<void> => {
    if (!bookingCode) {
      setLoading(false);
      setError('Booking code not found');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Get wallet balance
      const walletResponse: WalletResponse = await getWalletBalanceAPI();
      setWalletBalance(walletResponse.balance || 0);
      
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Error fetching wallet balance:', err);
      setLoading(false);
      setError(err.message || 'Could not load wallet balance');
    }
  };
  
  const handlePayment = async (): Promise<void> => {
    try {
      // Check if we have sufficient balance
      if (walletBalance < DEPOSIT_AMOUNT) {
        Alert.alert(
          'Insufficient Balance',
          'You don\'t have enough funds in your wallet. Would you like to add funds?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Add Funds',
              onPress: handleAddFunds
            }
          ]
        );
        return;
      }
      
      // Start processing
      setIsProcessing(true);
      setError('');
      
      console.log(`📘 Processing deposit for booking: ${bookingCode}`);
      
      // Process payment
      const result = await processCommitDepositAPI(bookingCode);
      
      console.log(`📘 Deposit API response:`, result);
      
      // Check for success based on the success property or check for success message
      if (
        result.success === true || 
        (result.message && 
          (result.message.toLowerCase().includes('success') || 
           result.message.toLowerCase().includes('paid successfully'))
        )
      ) {
        console.log(`📘 Deposit processed successfully`);
        
        // Show success message
        Alert.alert(
          'Payment Successful',
          'Your deposit has been successfully processed.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to bookings list
                router.replace('/booking/list');
              }
            }
          ]
        );
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (err: any) {
      console.error('❌ Payment processing error:', err);
      setError(err.message || 'An error occurred while processing payment');
      
      // Show error alert
      Alert.alert(
        'Payment Failed',
        err.message || 'An error occurred while processing your payment. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };
  const handleBack = (): void => router.back();
  
  const handleAddFunds = (): void => {
    router.push('/screens/payment/add-funds');
  };
  
  // Format currency in VND
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Initial Deposit
        </Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading wallet balance...
            </Text>
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={[styles.titleText, { color: colors.text }]}>
              Initial Booking Deposit
            </Text>
            
            <Text style={[styles.messageText, { color: colors.textSecondary }]}>
              To secure your booking, a deposit of {formatCurrency(DEPOSIT_AMOUNT)} is required.
            </Text>
            
            {error ? (
              <View style={[
                styles.errorContainer, 
                { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: COLORS.DANGER }
              ]}>
                <Ionicons name="alert-circle" size={20} color={COLORS.DANGER} />
                <Text style={[styles.errorText, { color: colors.text }]}>
                  {error}
                </Text>
                <TouchableOpacity 
                  style={[styles.retryButton, { backgroundColor: COLORS.PRIMARY }]}
                  onPress={fetchWalletBalance}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            
            {/* Wallet Balance Section */}
            <View style={[
              styles.walletContainer,
              { 
                backgroundColor: walletBalance >= DEPOSIT_AMOUNT ? 
                  'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                borderColor: walletBalance >= DEPOSIT_AMOUNT ? 
                  COLORS.SUCCESS : COLORS.WARNING
              }
            ]}>
              <View style={styles.walletHeader}>
                <Ionicons 
                  name="wallet-outline" 
                  size={24} 
                  color={walletBalance >= DEPOSIT_AMOUNT ? COLORS.SUCCESS : COLORS.WARNING} 
                />
                <Text style={[styles.walletTitle, { color: colors.text }]}>
                  Your Wallet
                </Text>
              </View>
              
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                  Available Balance:
                </Text>
                <Text style={[
                  styles.balanceValue, 
                  { 
                    color: walletBalance >= DEPOSIT_AMOUNT ? 
                      COLORS.SUCCESS : COLORS.DANGER 
                  }
                ]}>
                  {formatCurrency(walletBalance)}
                </Text>
              </View>
              
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                  Required Deposit:
                </Text>
                <Text style={[styles.balanceValue, { color: colors.text }]}>
                  {formatCurrency(DEPOSIT_AMOUNT)}
                </Text>
              </View>
              
              {walletBalance < DEPOSIT_AMOUNT && (
                <TouchableOpacity
                  style={[styles.addFundsButton, { backgroundColor: COLORS.PRIMARY }]}
                  onPress={handleAddFunds}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.addFundsText}>Add Funds</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Booking Info */}
            <View style={[
              styles.infoContainer, 
              { backgroundColor: colors.card, borderColor: colors.border }
            ]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Booking Information
              </Text>
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Booking Code:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {bookingCode}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Deposit Amount:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text, fontWeight: '700' }]}>
                  {formatCurrency(DEPOSIT_AMOUNT)}
                </Text>
              </View>
            </View>
            
            {/* Benefits of initial deposit */}
            <View style={[
              styles.noteContainer, 
              { backgroundColor: 'rgba(52, 199, 89, 0.1)', borderColor: COLORS.SUCCESS }
            ]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.SUCCESS} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Paying an initial deposit will prioritize your booking and secure your slot.
              </Text>
            </View>
            
            {/* Action Buttons */}
            <TouchableOpacity
              style={[
                styles.payButton,
                { backgroundColor: isProcessing ? COLORS.SECONDARY : COLORS.PRIMARY },
                walletBalance < DEPOSIT_AMOUNT && styles.disabledButton
              ]}
              onPress={handlePayment}
              disabled={isProcessing || walletBalance < DEPOSIT_AMOUNT}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.payButtonText}>Pay Deposit</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: colors.border }
              ]}
              onPress={handleBack}
              disabled={isProcessing}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:50
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  walletContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
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
    fontSize: 18,
    fontWeight: '700',
  },
  addFundsButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
  },
  addFundsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 5,
  },
  infoContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  noteContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  errorContainer: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  payButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexDirection: 'row',
  },
  disabledButton: {
    backgroundColor: COLORS.SECONDARY,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  }
});

export default InitialDepositScreen;