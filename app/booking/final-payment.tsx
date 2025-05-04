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
import { getFinalPaymentAPI, makeDirectFinalPaymentAPI } from '@/utils/paymentAPI';
import { getWalletBalanceAPI } from '@/utils/walletAPI';

// Main colors
const COLORS = {
  PRIMARY: "#34c759", // Changed to green for final payment
  SUCCESS: "#34c759",
  DANGER: "#ff3b30",
  WARNING: "#ff9500",
  SECONDARY: "#6c757d"
} as const;

// Interfaces for type safety
interface FinalPaymentInfo {
  quotationCode: string;
  bookingCode: string;
  finalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerAddress: string;
  providerName: string;
  providerEmail: string;
  providerPhone: string;
  providerAddress: string;
}

// Define types based on actual API response
interface FinalPaymentResponse {
  success?: boolean;
  message?: string;
  paymentUrl?: string;
  bookingCode?: string;
  customerAddress?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string | null;
  finalAmount?: number;
  providerAddress?: string;
  providerEmail?: string;
  providerName?: string;
  providerPhone?: string;
  quotationCode?: string;
  data?: any | null;
}

interface WalletResponse {
  success?: boolean;
  message?: string;
  balance: number;
  walletId?: number;
}

interface HeaderProps {
  title: string;
  onBack: () => void;
  colors: {
    card: string;
    border: string;
    text: string;
  };
}

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  colors: {
    text: string;
    textSecondary?: string;
  };
}

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
  icon?: string;
  disabled?: boolean;
  style?: object;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 20,
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
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    width: '100%',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  noteContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 24,
    borderWidth: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  walletBalanceContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    width: '100%',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  insufficientFunds: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  addFundsButton: {
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  addFundsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 5,
  },
  contractDetailsButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  processingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  paymentPaidContainer: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: COLORS.SUCCESS,
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  paymentPaidText: {
    color: COLORS.SUCCESS,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600'
  }
});

const Header: React.FC<HeaderProps> = ({ title, onBack, colors }) => (
  <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
    <TouchableOpacity
      style={styles.backButton}
      onPress={onBack}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>
    
    <Text style={[styles.headerTitle, { color: colors.text }]}>
      {title}
    </Text>
    
    <View style={styles.headerRight} />
  </View>
);

// Display inline errors instead of redirecting
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry, colors }) => (
  <View style={[
    styles.errorContainer, 
    { 
      backgroundColor: 'rgba(255, 59, 48, 0.1)', 
      borderColor: COLORS.DANGER 
    }
  ]}>
    <Ionicons name="alert-circle" size={20} color={COLORS.DANGER} />
    <Text style={[styles.errorText, { color: colors.text }]}>
      {message}
    </Text>
    {onRetry && (
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: COLORS.PRIMARY }]}
        onPress={onRetry}
      >
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Action button component
const ActionButton: React.FC<ActionButtonProps> = ({ 
  label, 
  onPress, 
  backgroundColor, 
  textColor,
  icon,
  disabled = false,
  style
}) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      { backgroundColor: disabled ? COLORS.SECONDARY : backgroundColor },
      style
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    {icon && (
      <Ionicons name={icon as any} size={20} color={textColor} style={{ marginRight: 8 }} />
    )}
    <Text style={[styles.buttonText, { color: textColor }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Wallet balance component with add funds option
const WalletBalance: React.FC<{
  balance: number;
  finalAmount: number;
  colors: any;
  onAddFunds: () => void;
}> = ({ balance, finalAmount, colors, onAddFunds }) => {
  const hasInsufficientFunds = balance < finalAmount;
  const neededAmount = finalAmount - balance;
  
  return (
    <View style={[
      styles.walletBalanceContainer,
      {
        backgroundColor: hasInsufficientFunds ? 'rgba(255, 149, 0, 0.1)' : 'rgba(52, 199, 89, 0.1)',
        borderColor: hasInsufficientFunds ? COLORS.WARNING : COLORS.SUCCESS
      }
    ]}>
      <View style={styles.infoSection}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          Wallet Balance
        </Text>
        
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
            Your wallet balance:
          </Text>
          <Text style={[
            styles.balanceValue, 
            { 
              color: hasInsufficientFunds ? COLORS.DANGER : COLORS.SUCCESS 
            }
          ]}>
            {formatCurrency(balance)}
          </Text>
        </View>
        
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
            Final amount:
          </Text>
          <Text style={[styles.balanceValue, { color: colors.text }]}>
            {formatCurrency(finalAmount)}
          </Text>
        </View>
        
        {hasInsufficientFunds && (
          <>
            <View style={[
              styles.insufficientFunds,
              {
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                borderColor: COLORS.DANGER
              }
            ]}>
              <Ionicons name="warning-outline" size={18} color={COLORS.DANGER} />
              <Text style={[styles.warningText, { color: COLORS.DANGER }]}>
                Insufficient funds. You need additional {formatCurrency(neededAmount)} to pay.
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.addFundsButton, { backgroundColor: COLORS.PRIMARY }]}
              onPress={onAddFunds}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.addFundsText}>Add Funds</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
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

// Processing overlay component
const ProcessingOverlay: React.FC<{
  visible: boolean;
  message: string;
  colors: any;
}> = ({ visible, message, colors }) => {
  if (!visible) return null;
  
  return (
    <View style={styles.processingContainer}>
      <View style={[styles.processingContent, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={[styles.processingText, { color: colors.text }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const FinalPaymentScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as keyof typeof Colors];
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingCode: string }>();
  const bookingCode = params.bookingCode;
  
  // States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('Processing payment...');
  const [isFinalPaid, setIsFinalPaid] = useState<boolean>(false);
  const [paymentInfo, setPaymentInfo] = useState<FinalPaymentInfo & { walletBalance?: number }>({
    quotationCode: "",
    bookingCode: "",
    finalAmount: 0,
    customerName: "",
    customerEmail: "",
    customerPhone: null,
    customerAddress: "",
    providerName: "",
    providerEmail: "",
    providerPhone: "",
    providerAddress: "",
    walletBalance: 0
  });
  
  // Fetch payment data and wallet balance
  useEffect(() => {
    fetchPaymentData();
  }, []);
  
  // Fetch payment data and wallet balance
  const fetchPaymentData = async (): Promise<void> => {
    if (!bookingCode) {
      setLoading(false);
      setError('Booking code not found');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Initialize empty payment info
      let paymentData: FinalPaymentInfo & { walletBalance?: number } = {
        quotationCode: "",
        bookingCode: bookingCode,
        finalAmount: 0,
        customerName: "",
        customerEmail: "",
        customerPhone: null,
        customerAddress: "",
        providerName: "",
        providerEmail: "",
        providerPhone: "",
        providerAddress: "",
        walletBalance: 0
      };
      
      // Log the booking code we're working with
      
      // Get wallet balance from API
      try {
        const walletResponse: WalletResponse = await getWalletBalanceAPI();
        paymentData.walletBalance = walletResponse.balance || 0;
      } catch (err) {
        console.error('Error getting wallet balance:', err);
        throw new Error('Failed to fetch wallet balance');
      }
      
      // Get payment information from API
      try {
        const paymentResponse = await getFinalPaymentAPI(bookingCode);
        
        // Check if response was successful
        if (paymentResponse.success) {
          // The API response format is flat - not using nested data property
          paymentData = {
            ...paymentData,
            quotationCode: paymentResponse.quotationCode || paymentData.quotationCode,
            bookingCode: paymentResponse.bookingCode || paymentData.bookingCode,
            finalAmount: paymentResponse.finalPaymentAmount || paymentData.finalAmount,            customerName: paymentResponse.customerName || paymentData.customerName,
            customerEmail: paymentResponse.customerEmail || paymentData.customerEmail,
            customerPhone: paymentResponse.customerPhone !== undefined ? 
              paymentResponse.customerPhone : paymentData.customerPhone,
            customerAddress: paymentResponse.customerAddress || paymentData.customerAddress,
            providerName: paymentResponse.providerName || paymentData.providerName,
            providerEmail: paymentResponse.providerEmail || paymentData.providerEmail,
            providerPhone: paymentResponse.providerPhone || paymentData.providerPhone,
            providerAddress: paymentResponse.providerAddress || paymentData.providerAddress,
          };
          
          // Check if final payment is already made from the response
          if (paymentResponse.isFinalPaid) {
            setIsFinalPaid(true);
          }
        } else {
          console.error('Payment API returned unsuccessful response:', paymentResponse.message);
          throw new Error(paymentResponse.message || 'Failed to get payment details');
        }
      } catch (err: any) {
        console.error('Error calling payment API:', err);
        throw err;
      }
      
      setPaymentInfo(paymentData);
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Error fetching payment data:', err);
      setLoading(false);
      setError(err.message || 'An error occurred while loading payment information');
    }
  };
  
  const handlePayment = async (): Promise<void> => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Processing payment...');
      setError('');
      
      // Check if final amount is valid
      if (paymentInfo.finalAmount <= 0) {
        setError('Invalid payment amount. Please contact support.');
        setIsProcessing(false);
        return;
      }
      
      // Check if balance is sufficient
      if ((paymentInfo.walletBalance || 0) < paymentInfo.finalAmount) {
        // Redirect to add funds page instead of showing alert
        handleAddFunds();
        setIsProcessing(false);
        return;
      }
      
      // Call payment processing API here
      try {
        console.log('📘 Processing final payment for booking:', bookingCode);
        
        // Make the actual payment API call
        const paymentResult = await makeDirectFinalPaymentAPI(
          bookingCode,
          paymentInfo.finalAmount
        );
        
        if (paymentResult.success) {
          // Update payment status
          setIsFinalPaid(true);
          
          // Show success message
          setProcessingMessage('Payment successful! Redirecting...');
          
          // Wait a moment before redirecting
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // On success, redirect to bookings list
          router.replace('/screens/Bookings');
        } else {
          throw new Error(paymentResult.message || 'Payment failed');
        }
      } catch (err: any) {
        console.error('Payment API error:', err);
        throw new Error(err.message || 'Payment processing failed. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Payment processing error:', err);
      setError(err.message || 'An error occurred while processing payment');
      setIsProcessing(false);
    }
  };
  
  // Handlers
  const handleBack = (): void => router.back();
  
  // Navigate to add funds page
  const handleAddFunds = (): void => {
    router.push('/screens/payment/add-funds');
  };
  
  // View contract details
  const handleViewContract = (): void => {
    // router.push({
    //   pathname: '/screens/contracts/details',
    //   params: { contractCode: bookingCode }
    // });
  };
  
  // Render functions
  const renderLoading = (): React.ReactNode => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        Loading payment information...
      </Text>
    </View>
  );
  
  const renderError = (): React.ReactNode => (
    <View style={styles.centerContainer}>
      <ErrorMessage 
        message={error} 
        onRetry={fetchPaymentData}
        colors={colors}
      />
      
      <ActionButton 
        label="Go Back" 
        onPress={handleBack}
        backgroundColor={COLORS.SECONDARY}
        textColor="#FFFFFF"
        icon="arrow-back"
      />
    </View>
  );
  
  const renderPaymentDetails = (): React.ReactNode => (
    <View style={styles.centerContainer}>
      <Text style={[styles.titleText, { color: colors.text }]}>
        Final Payment
      </Text>
      
      {error && (
        <ErrorMessage 
          message={error} 
          colors={colors}
        />
      )}
      
      {/* Wallet balance information */}
      <WalletBalance 
        balance={paymentInfo.walletBalance || 0}
        finalAmount={paymentInfo.finalAmount}
        colors={colors}
        onAddFunds={handleAddFunds}
      />
      
      {/* Booking information */}
      <View style={[
        styles.infoContainer, 
        { 
          backgroundColor: colors.card, 
          borderColor: colors.border 
        }
      ]}>
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Booking Information
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Booking Code:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {paymentInfo.bookingCode}
            </Text>
          </View>
          
          {paymentInfo.quotationCode && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Quotation Code:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {paymentInfo.quotationCode}
              </Text>
            </View>
          )}
          
          {paymentInfo.finalAmount > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Final Amount:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text, fontWeight: '700' }]}>
                {formatCurrency(paymentInfo.finalAmount)}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.contractDetailsButton, 
              { 
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: COLORS.PRIMARY
              }
            ]}
            onPress={handleViewContract}
          >
            <Ionicons name="document-text-outline" size={18} color={COLORS.PRIMARY} />
            <Text style={[styles.contractDetailsText, { color: COLORS.PRIMARY }]}>
              View Contract Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Customer information - only show if we have it */}
      {(paymentInfo.customerName || paymentInfo.customerEmail || paymentInfo.customerPhone || paymentInfo.customerAddress) && (
        <View style={[
          styles.infoContainer, 
          { 
            backgroundColor: colors.card, 
            borderColor: colors.border 
          }
        ]}>
          <View style={styles.infoSection}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Customer Information
            </Text>
            
            {paymentInfo.customerName && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Name:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {paymentInfo.customerName}
                </Text>
              </View>
            )}
            
            {paymentInfo.customerEmail && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Email:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {paymentInfo.customerEmail}
                </Text>
              </View>
            )}
            
            {paymentInfo.customerPhone && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Phone:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {paymentInfo.customerPhone}
                </Text>
              </View>
            )}
            
            {paymentInfo.customerAddress && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Address:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {paymentInfo.customerAddress}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
      
      {/* Provider information - only show if we have it */}
      {(paymentInfo.providerName || paymentInfo.providerEmail || paymentInfo.providerPhone || paymentInfo.providerAddress) && (
        <View style={[
          styles.infoContainer, 
          { 
            backgroundColor: colors.card, 
            borderColor: colors.border 
          }
        ]}>
          <View style={styles.infoSection}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Provider Information
            </Text>
            
            {paymentInfo.providerName && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Provider Name:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {paymentInfo.providerName}
                </Text>
              </View>
            )}
            
            {paymentInfo.providerEmail && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Email:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {paymentInfo.providerEmail}
                </Text>
              </View>
            )}
            
            {paymentInfo.providerPhone && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Phone:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {paymentInfo.providerPhone}
                </Text>
              </View>
            )}
            
            {paymentInfo.providerAddress && paymentInfo.providerAddress !== "string" && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Address:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {paymentInfo.providerAddress}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
      
      <View style={[
        styles.noteContainer, 
        { 
          backgroundColor: 'rgba(52, 199, 89, 0.1)', 
          borderColor: COLORS.SUCCESS 
        }
      ]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.SUCCESS} />
        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
          Making the final payment will complete your booking and mark the project as completed.
        </Text>
      </View>
      
     {/* Conditional rendering based on payment status */}
     {isFinalPaid ? (
        <View style={styles.paymentPaidContainer}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.SUCCESS} />
          <Text style={styles.paymentPaidText}>
            Your final payment has been made
          </Text>
        </View>
      ) : (
        <ActionButton 
          label={isProcessing ? "Processing..." : "Pay Now"}
          onPress={handlePayment}
          backgroundColor={COLORS.PRIMARY}
          textColor="#FFFFFF"
          icon={isProcessing ? "hourglass" : "card-outline"}
          disabled={isProcessing}
        />
      )}
      
      <ActionButton 
        label="Go Back" 
        onPress={handleBack}
        backgroundColor="transparent"
        textColor={colors.text}
        style={{ borderWidth: 1, borderColor: colors.border, marginTop: -10 }}
      />
    </View>
  );
  
  // Main render
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <Header title="Final Payment" onBack={handleBack} colors={colors} />
      
      <ScrollView style={styles.content}>
        {loading ? renderLoading() : 
          error && error.length > 0 ? renderError() :
          renderPaymentDetails()}
      </ScrollView>
      
      {/* Processing overlay */}
      <ProcessingOverlay 
        visible={isProcessing}
        message={processingMessage}
        colors={colors}
      />
    </SafeAreaView>
  );
};

export default FinalPaymentScreen;