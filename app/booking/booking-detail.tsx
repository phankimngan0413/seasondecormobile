import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { getPaginatedBookingsForCustomerAPI, confirmBookingAPI, requestCancelBookingAPI } from '@/utils/bookingAPI';

const PRIMARY_COLOR = "#5fc1f1";

// Define a proper type for status codes
type BookingStatusCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

// Status mapping utilities
const mapStatusCodeToString = (statusCode: number): string => {
  const statusMap: Record<number, string> = {
    0: 'Pending',            // Khi khách hàng tạo booking
    1: 'Planning',           // Provider đã xác nhận và sắp xếp khảo sát
    2: 'Quoting',            // Provider báo giá
    3: 'Contracting',        // Provider soạn hợp đồng
    4: 'Confirm',            // Khi customer đồng ý các điều khoản và chốt hợp đồng
    5: 'DepositPaid',        // Đã thanh toán đặt cọc
    6: 'Preparing',          // Chuẩn bị nguyên liệu
    7: 'InTransit',          // Nguyên liệu được chuyển đến chỗ khách hàng
    8: 'Progressing',        // Đang tiến hành thi công (theo dạng Tracking service)
    9: 'ConstructionPayment',// Thanh toán thi công
    10: 'Completed',         // Dự án hoàn thành
    11: 'PendingCancellation', // Chờ provider duyệt hủy
    12: 'Canceled',          // Booking bị hủy
    13: 'Rejected'           // Booking bị từ chối
  };
  
  return statusMap[statusCode] || 'Unknown';
};

const getStatusColor = (statusCode: number): string => {
  const statusString = mapStatusCodeToString(statusCode);
  
  switch (statusString) {
    case 'Pending':
      return '#ff9500'; // Orange
    case 'Planning':
      return '#007aff'; // Blue
    case 'Quoting':
      return '#5856d6'; // Purple
    case 'Contracting':
      return '#007aff'; // Blue
    case 'Confirm':
      return '#5856d6'; // Purple
    case 'DepositPaid':
      return '#5ac8fa'; // Light blue
    case 'Preparing':
      return '#34c759'; // Green
    case 'InTransit':
      return '#34c759'; // Green
    case 'Progressing':
      return '#34c759'; // Green
    case 'ConstructionPayment':
      return '#5ac8fa'; // Light blue
    case 'Completed':
      return '#4caf50'; // Green
    case 'PendingCancellation':
      return '#ff9500'; // Orange
    case 'Canceled':
      return '#ff3b30'; // Red
    case 'Rejected':
      return '#ff3b30'; // Red
    default:
      return '#8e8e93'; // Gray
  }
};

const getStatusIcon = (statusCode: number): string => {
  const statusString = mapStatusCodeToString(statusCode);
  
  switch (statusString) {
    case 'Pending':
      return 'time-outline';
    case 'Planning':
      return 'calendar-outline';
    case 'Quoting':
      return 'cash-outline';
    case 'Contracting':
      return 'document-text-outline';
    case 'Confirm':
      return 'checkmark-circle-outline';
    case 'DepositPaid':
      return 'wallet-outline';
    case 'Preparing':
      return 'construct-outline';
    case 'InTransit':
      return 'car-outline';
    case 'Progressing':
      return 'hammer-outline';
    case 'ConstructionPayment':
      return 'cash-outline';
    case 'Completed':
      return 'checkmark-done-circle-outline';
    case 'PendingCancellation':
      return 'hourglass-outline';
    case 'Canceled':
      return 'close-circle-outline';
    case 'Rejected':
      return 'close-circle-outline';
    default:
      return 'help-circle-outline';
  }
};

const getStatusStage = (statusCode: number): string => {
  const statusString = mapStatusCodeToString(statusCode);
  
  if (['Pending', 'Planning'].includes(statusString)) {
    return 'Initial Stage';
  } else if (['Quoting', 'Contracting', 'Confirm'].includes(statusString)) {
    return 'Agreement Stage';
  } else if (['DepositPaid', 'Preparing', 'InTransit'].includes(statusString)) {
    return 'Preparation Stage';
  } else if (['Progressing', 'ConstructionPayment'].includes(statusString)) {
    return 'Construction Stage';
  } else if (statusString === 'Completed') {
    return 'Final Stage';
  } else if (['PendingCancellation', 'Canceled', 'Rejected'].includes(statusString)) {
    return 'Cancelled';
  }
  
  return '';
};

const canBookingBeCancelled = (statusCode: number): boolean => {
  return [0, 1].includes(statusCode); // Pending, Planning
};

const doesBookingNeedConfirmation = (statusCode: number): boolean => {
  return statusCode === 3; // Contracting
};

const doesBookingNeedDeposit = (statusCode: number): boolean => {
  return statusCode === 4; // Confirm
};

// Define the booking interface
interface IBooking {
  id?: number;
  bookingId: number;
  bookingCode: string;
  decorServiceId?: number;
  userId?: number;
  addressId?: number;
  address: string;
  surveyDate?: string;
  surveyTime?: string;
  status: number;
  createdAt: string;
  updatedAt?: string;
  totalPrice?: number;
  cost?: number;
  serviceItems?: string;
  note?: string;
  expectedCompletion?: string;
  decorService?: {
    id: number;
    style: string;
    description: string;
    category?: string;
    image?: string;
    createAt?: string;
    status?: number;
    accountId?: number;
    decorCategoryId?: number;
    favoriteCount?: number;
    images?: Array<{id: number, imageURL: string}>;
    seasons?: Array<{id: number, seasonName: string}>;
  };
  provider?: {
    id: number;
    businessName: string;
    avatar?: string;
    phone?: string;
    slug?: string;
    isProvider?: boolean;
    providerVerified?: boolean;
    providerStatus?: number;
    followersCount?: number;
    followingsCount?: number;
  };
  timeSlots?: Array<{
    id: number;
    bookingId: number;
    surveyDate: string;
    startTime?: string;
    endTime?: string;
    status?: number;
  }>;
}

const BookingDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const bookingId = params.id as string;
  const decorServiceId = params.decorServiceId as string;

  const [booking, setBooking] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingId, decorServiceId]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Prepare options for API call
      const options = {
        PageIndex: 1,
        PageSize: 50,  // Get a reasonable number of bookings
        SortBy: "createdAt",
        Descending: true
      };
      
      // Call the paginated API
      const response = await getPaginatedBookingsForCustomerAPI(options);
      
      // Handle the response
      if (response) {
        // Initialize bookings array with explicit type
        let bookings: IBooking[] = [];
        
        // Extract bookings depending on API response structure
        if (Array.isArray(response.data)) {
          bookings = response.data as IBooking[];
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          bookings = response.data.data as IBooking[];
        } else if (Array.isArray(response.items)) {
          bookings = response.items as IBooking[];
        }
        
        let targetBooking: IBooking | null = null;
        
        // Find specific booking based on available identifiers
        if (bookingId) {
          targetBooking = bookings.find(booking => 
            (booking.id && booking.id === Number(bookingId)) || 
            (booking.bookingId && booking.bookingId === Number(bookingId))
          ) || null;
        } else if (decorServiceId) {
          targetBooking = bookings.find(booking => 
            booking.decorServiceId === Number(decorServiceId)
          ) || null;
        }
        
        if (targetBooking) {
          // Found the booking
          setBooking(targetBooking);
        } else {
          // No matching booking found
          setError(bookingId 
            ? `No booking found with ID: ${bookingId}` 
            : `No booking found with decorService ID: ${decorServiceId}`
          );
        }
      } else {
        setError('Failed to load bookings');
      }
    } catch (err: any) {
      console.error('Error fetching booking detail:', err);
      setError(err.message || 'An error occurred while loading booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!booking) return;
    
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to confirm this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setActionLoading(true);
              const result = await confirmBookingAPI(booking.bookingCode);
              
              if (result.success) {
                Alert.alert('Success', 'Booking confirmed successfully');
                fetchBookingDetail(); // Refresh booking details
              } else {
                Alert.alert('Error', result.message || 'Failed to confirm booking');
              }
            } catch (err: any) {
              Alert.alert('Error', 'Failed to confirm booking');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    
    // Navigate to cancel request screen
    router.push({
      pathname: '/booking/cancel-request',
      params: { bookingCode: booking.bookingCode }
    });
  };

  const handleMakeDeposit = () => {
    if (!booking) return;
    
    // Navigate to payment screen
    // router.push({
    //   pathname: '/booking/deposit',
    //   params: { bookingCode: booking.bookingCode }
    // });
    
    // For now, just show an alert
    Alert.alert('Payment', 'Payment functionality is coming soon!');
  };

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Booking Details</Text>
      <View style={styles.spacer} />
    </View>
  );

  const renderBookingStatus = () => {
    if (!booking) return null;
    
    const statusCode = booking.status;
    const statusText = mapStatusCodeToString(statusCode);
    const statusIcon = getStatusIcon(statusCode) as keyof typeof Ionicons.glyphMap;
    const statusColor = getStatusColor(statusCode);
    const statusStage = getStatusStage(statusCode);
    
    return (
      <View style={[styles.statusContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.statusCircle, { backgroundColor: statusColor }]}>
          <Ionicons name={statusIcon} size={32} color="#fff" />
        </View>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        {statusStage ? (
          <Text style={[styles.statusStage, { color: colors.textSecondary }]}>
            {statusStage}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderBookingTimeline = () => {
    if (!booking) return null;
    
    // Define the complete booking flow
    const stages = [
      { value: 0, label: 'Pending', icon: 'time-outline' },
      { value: 1, label: 'Planning', icon: 'calendar-outline' },
      { value: 2, label: 'Quoting', icon: 'cash-outline' },
      { value: 3, label: 'Contracting', icon: 'document-text-outline' },
      { value: 4, label: 'Confirm', icon: 'checkmark-circle-outline' },
      { value: 5, label: 'DepositPaid', icon: 'wallet-outline' },
      { value: 6, label: 'Preparing', icon: 'construct-outline' },
      { value: 7, label: 'InTransit', icon: 'car-outline' },
      { value: 8, label: 'Progressing', icon: 'hammer-outline' },
      { value: 9, label: 'ConstructionPayment', icon: 'cash-outline' },
      { value: 10, label: 'Completed', icon: 'checkmark-done-circle-outline' }
    ];
    
    // For cancelled bookings, add appropriate status
    if (booking.status >= 11) {
      stages.push({ value: booking.status, label: mapStatusCodeToString(booking.status), icon: getStatusIcon(booking.status) });
    }
    
    return (
      <View style={[styles.timelineContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Booking Progress</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineScrollView}>
          <View style={styles.timeline}>
            {stages.map((stage, index) => {
              const isActive = booking.status >= stage.value;
              const isCompleted = booking.status > stage.value;
              const isCurrent = booking.status === stage.value;
              
              // Skip display of cancelled stages if booking was cancelled
              if (booking.status >= 11 && stage.value > booking.status) return null;
              
              // Skip later stages if cancelled
              if (booking.status >= 11 && stage.value >= 10 && stage.value !== booking.status) return null;
              
              return (
                <View key={stage.value} style={styles.timelineItem}>
                  <View style={styles.timelineItemContent}>
                    <View 
                      style={[
                        styles.timelineCircle, 
                        { 
                          backgroundColor: isActive ? getStatusColor(stage.value) : colors.border,
                          borderColor: isActive ? getStatusColor(stage.value) : colors.border
                        }
                      ]}
                    >
                      {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
                      {isCurrent && <Ionicons name={getStatusIcon(stage.value) as any} size={14} color="#fff" />}
                    </View>
                    
                    <Text 
                      style={[
                        styles.timelineLabel, 
                        { 
                          color: isActive ? getStatusColor(stage.value) : colors.textSecondary,
                          fontWeight: isActive ? '600' : 'normal'
                        }
                      ]}
                    >
                      {stage.label}
                    </Text>
                  </View>
                  
                  {index < stages.length - 1 && (
                    <View 
                      style={[
                        styles.timelineLine, 
                        { 
                          backgroundColor: isCompleted ? getStatusColor(stage.value) : colors.border
                        }
                      ]} 
                    />
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderBookingInfo = () => {
    if (!booking) return null;
    
    return (
      <View style={[styles.infoContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Booking Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Booking Code</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{booking.bookingCode}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date Created</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {new Date(booking.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        {booking.surveyDate && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Survey Date</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(booking.surveyDate).toLocaleDateString()}
              {booking.surveyTime ? ` ${booking.surveyTime}` : ''}
            </Text>
          </View>
        )}
        
        {booking.expectedCompletion && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Expected Completion</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{booking.expectedCompletion}</Text>
          </View>
        )}
        
        {booking.totalPrice !== undefined && booking.totalPrice > 0 && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Total Price</Text>
            <Text style={[styles.infoValue, { color: PRIMARY_COLOR, fontWeight: '700' }]}>
              {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(booking.totalPrice)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderServiceInfo = () => {
    if (!booking || !booking.decorService) return null;
    
    const service = booking.decorService;
    
    return (
      <View style={[styles.serviceContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Information</Text>
        
        <View style={styles.serviceCard}>
          {service.image && (
            <Image 
              source={{ uri: service.image }} 
              style={styles.serviceImage} 
              resizeMode="cover"
            />
          )}
          
          <View style={styles.serviceContent}>
            <Text style={[styles.serviceName, { color: colors.text }]}>{service.style}</Text>
            
            {service.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{service.category}</Text>
              </View>
            )}
            
            {service.description && (
              <Text style={[styles.serviceDescription, { color: colors.textSecondary }]}>
                {service.description}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderProviderInfo = () => {
    if (!booking || !booking.provider) return null;
    
    const provider = booking.provider;
    
    return (
      <View style={[styles.providerContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Provider Information</Text>
        
        <View style={styles.providerCard}>
          <View style={styles.providerAvatar}>
            {provider.avatar ? (
              <Image source={{ uri: provider.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="business" size={32} color={PRIMARY_COLOR} />
            )}
          </View>
          
          <View style={styles.providerContent}>
            <Text style={[styles.providerName, { color: colors.text }]}>{provider.businessName}</Text>
            
            {provider.phone && (
              <View style={styles.providerDetail}>
                <Ionicons name="call-outline" size={16} color={PRIMARY_COLOR} />
                <Text style={[styles.providerDetailText, { color: colors.textSecondary }]}>{provider.phone}</Text>
              </View>
            )}
            
            {provider.providerVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={styles.verifiedText}>Verified Provider</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderAddressInfo = () => {
    if (!booking) return null;
    
    return (
      <View style={[styles.addressContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Address</Text>
        
        <View style={styles.addressContent}>
          <Ionicons name="location-outline" size={22} color={PRIMARY_COLOR} style={styles.addressIcon} />
          <Text style={[styles.addressText, { color: colors.text }]}>{booking.address}</Text>
        </View>
      </View>
    );
  };

  const renderNotes = () => {
    if (!booking || !booking.note) return null;
    
    return (
      <View style={[styles.notesContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Notes</Text>
        <Text style={[styles.notesText, { color: colors.textSecondary }]}>{booking.note}</Text>
      </View>
    );
  };

  const renderActions = () => {
    if (!booking) return null;
    
    const canCancel = canBookingBeCancelled(booking.status);
    const needsConfirmation = doesBookingNeedConfirmation(booking.status);
    const needsDeposit = doesBookingNeedDeposit(booking.status);
    
    if (!canCancel && !needsConfirmation && !needsDeposit) return null;
    
    return (
      <View style={styles.actionsContainer}>
        {needsConfirmation && (
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={handleConfirmBooking}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.actionIcon} />
                <Text style={styles.actionButtonText}>Confirm Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {needsDeposit && (
          <TouchableOpacity
            style={[styles.actionButton, styles.depositButton]}
            onPress={handleMakeDeposit}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="wallet" size={20} color="#fff" style={styles.actionIcon} />
                <Text style={styles.actionButtonText}>Pay Deposit</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {canCancel && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelBooking}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#fff" style={styles.actionIcon} />
                <Text style={styles.actionButtonText}>Cancel Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={PRIMARY_COLOR} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchBookingDetail}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {renderHeader()}
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderBookingStatus()}
        {renderBookingTimeline()}
        {renderBookingInfo()}
        {renderServiceInfo()}
        {renderProviderInfo()}
        {renderAddressInfo()}
        {renderNotes()}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      {renderActions()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80, // Space for action buttons
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Status styles
  statusContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginVertical: 16,
  },
  statusCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusStage: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  
  // Timeline styles
  timelineContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  timelineScrollView: {
    marginBottom: 8,
  },
  timelineItem: {
    alignItems: 'center',
    position: 'relative',
    width: 100,
    marginRight: 5,
  },
  timelineItemContent: {
    alignItems: 'center',
  },
  timelineCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 8,
  },
  timelineLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  timelineLine: {
    position: 'absolute',
    height: 3,
    top: 15,
    left: '50%',
    right: 0,
    zIndex: -1,
  },
  
  // Info container styles
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Service styles
  serviceContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  serviceCard: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  serviceImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  serviceContent: {
    padding: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: PRIMARY_COLOR + '20',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    fontWeight: '500',
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Provider styles
  providerContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  providerContent: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  providerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  providerDetailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  
  // Address styles
  addressContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  
  // Notes styles
  notesContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_COLOR,
  },
  
  // Action buttons
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  confirmButton: {
    backgroundColor: '#5856d6',
  },
  depositButton: {
    backgroundColor: '#5ac8fa',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
  },
  actionIcon: {
    marginRight: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Extra spacer
  bottomSpacer: {
    height: 80,
  },
});

export default BookingDetailScreen;