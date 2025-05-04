import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { 
  getPaginatedBookingsForCustomerAPI,
  requestCancelBookingAPI,
  confirmBookingAPI,
  IBookingFilterOptions
} from '@/utils/bookingAPI';

const PRIMARY_COLOR = "#5fc1f1";

// Define a proper type for status codes to avoid 'any' type errors
type BookingStatusCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

// Define the status category type
type StatusCategory = 'initial' | 'agreement' | 'construction' | 'completed' | 'cancelled' | 'unknown';

// Status mapping utilities with proper typing
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
    9: 'AllDone',            // Đã thi công xong
    10: 'FinalPaid',         // Thanh toán thi công
    11: 'Completed',         // Dự án hoàn thành
    12: 'PendingCancel',     // Chờ provider duyệt hủy
    13: 'Canceled',          // Booking bị hủy
    14: 'Rejected'           // Booking bị từ chối
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
    case 'AllDone':
      return '#34c759'; // Green
    case 'FinalPaid':
      return '#5ac8fa'; // Light blue
    case 'Completed':
      return '#4caf50'; // Green
    case 'PendingCancel':
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
    case 'AllDone':
      return 'checkmark-outline';
    case 'FinalPaid':
      return 'cash-outline';
    case 'Completed':
      return 'checkmark-done-circle-outline';
    case 'PendingCancel':
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
  } else if (['DepositPaid', 'Preparing', 'InTransit', 'Progressing', 'AllDone'].includes(statusString)) {
    return 'Construction Stage';
  } else if (['FinalPaid', 'Completed'].includes(statusString)) {
    return 'Final Stage';
  } else if (['PendingCancel', 'Canceled', 'Rejected'].includes(statusString)) {
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

// Check if booking is in progress (status=8) to show tracking button
const hasTrackingAvailable = (statusCode: number): boolean => {
  return statusCode === 8 || statusCode === 9; // Progressing or statusCode 9
};
const doesBookingNeedFinalPayment = (statusCode: number): boolean => {
  return statusCode === 9; // AllDone status
};

// Define the booking interface with proper typing
interface IBooking {
  id?: number;
  bookingId: number;
  bookingCode: string;
  quotationCode?: string; // Added quotationCode property
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
  isQuoteExisted?: boolean; // Optional property to check if quotation exists
  isContractSigned?: boolean; // Optional property to check if contract is signed
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
}

// Define the filter option type
interface FilterOption {
  label: string;
  value: string | undefined;
}

const BookingListScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();

  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  // Group statuses for the filter tabs to create a better user experience
  const filterGroupOptions: FilterOption[] = [
    { label: 'All', value: undefined },
    { label: 'Initial', value: 'initial' },     // 0-1: Pending, Planning
    { label: 'Agreement', value: 'agreement' }, // 2-4: Quoting, Contracting, Confirm
    { label: 'Construction', value: 'construction' }, // 5-9: DepositPaid through AllDone
    { label: 'Completed', value: 'completed' }, // 10-11: FinalPaid, Completed
    { label: 'Cancelled', value: 'cancelled' }  // 12-14: PendingCancel, Canceled, Rejected
  ];

  useEffect(() => {
    fetchBookings();
  }, [currentPage, selectedCategory]); // Fetch bookings when page or category changes

  // Helper function to determine if a booking belongs to the selected category
  const bookingMatchesCategory = (booking: IBooking, category?: string): boolean => {
    if (!category) return true; // All bookings match "All" category
    
    const status = booking.status;
    
    switch(category) {
      case 'initial':
        return status <= 1;
      case 'agreement':
        return status >= 2 && status <= 4;
      case 'construction':
        return status >= 5 && status <= 9;
      case 'completed':
        return status >= 10 && status <= 11;
      case 'cancelled':
        return status >= 12;
      default:
        return true;
    }
  };

  const fetchBookings = async (refresh = false) => {
    try {
      
      if (refresh) {
        setCurrentPage(1);
        setRefreshing(true);
      } else if (!refreshing) {
        setLoading(true);
      }
      
      setError('');
      
      // Create the API options object with PascalCase parameter names
      const apiOptions: IBookingFilterOptions = {
        PageIndex: refresh ? 1 : currentPage,
        PageSize: 10,
        SortBy: "createdAt",
        Descending: true
      };

      // Let's not filter on the server side for now, we'll filter client-side instead
      // This avoids potential API parameter type issues
      
      
      const response = await getPaginatedBookingsForCustomerAPI(apiOptions);
      
      
      // Handle the nested data structure correctly
      let responseItems: IBooking[] = [];
      let totalItemCount = 0;
      
      // Extract data using the correct structure from your API
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // Direct array in data property
          responseItems = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Nested data.data structure
          responseItems = response.data.data;
        }
        
        // Check for totalCount in different possible locations
        if (response.totalCount !== undefined) {
          totalItemCount = response.totalCount;
        } else if (response.data.totalCount !== undefined) {
          totalItemCount = response.data.totalCount;
        }
      } else if (response && response.items && Array.isArray(response.items)) {
        // Alternative format with items array
        responseItems = response.items;
        totalItemCount = response.totalCount || 0;
      }
      
      
      // Log each booking item details for debugging
      responseItems.forEach((item, index) => {
        const id = item.id || item.bookingId;
        console.log(`📘 Booking ${index + 1}: ID ${id}, Code ${item.bookingCode}, Status ${item.status} (${mapStatusCodeToString(item.status)})`);
      });
      
      // Apply client-side category filtering
      const filteredItems = selectedCategory 
        ? responseItems.filter(item => bookingMatchesCategory(item, selectedCategory))
        : responseItems;
        
      console.log(`📘 After category filtering: ${filteredItems.length} items`);
      
      setBookings(filteredItems);
      
      // Calculate total pages based on totalCount
      const estimatedTotalPages = Math.max(1, Math.ceil(totalItemCount / 10));
      setTotalPages(estimatedTotalPages);
      console.log('📘 Estimated total pages:', estimatedTotalPages);
      
    } catch (err: any) {
      console.error('❌ Error fetching bookings:', err);
      if (err.response) {
        console.error('❌ API Error Response:', err.response.status, err.response.data);
      }
      setError('Failed to load bookings. Please try again.');
    } finally {
      console.log('📘 Finished fetching bookings, setting loading states to false');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = (): void => {
    fetchBookings(true);
  };

  const loadMoreBookings = (): void => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleCancelBooking = (booking: IBooking): void => {
    console.log('📘 Navigating to cancel request screen for booking:', booking.bookingCode);
    
    // Log booking details that might be useful for the cancel request screen
    console.log('📘 Booking details for cancel request:', {
      id: booking.id || booking.bookingId,
      code: booking.bookingCode,
      status: booking.status,
      statusText: mapStatusCodeToString(booking.status)
    });
    
    // Navigate to cancel request screen
    router.push({
      pathname: '/booking/cancel-request',
      params: { bookingCode: booking.bookingCode }
    });
  };
  const handleMakeFinalPayment = (booking: IBooking): void => {
    console.log('📘 Navigating to final payment screen for booking:', booking.bookingCode);
    
    // Navigate to contract detail screen with payment indicator
    router.push({
      pathname: '/booking/final-payment',
      params: { 
        contractCode: booking.bookingCode,
        bookingCode: booking.bookingCode 
      }
    });
  };
  const handleConfirmBooking = async (booking: IBooking): Promise<void> => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to confirm this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              console.log('📘 Confirming booking:', booking.bookingCode);
              setLoading(true);
              
              const result = await confirmBookingAPI(booking.bookingCode);
              console.log('📘 Confirmation result:', result);
              
              if (result.success) {
                console.log('📘 Booking confirmation successful');
                Alert.alert('Success', 'Booking confirmed successfully');
                fetchBookings(true);
              } else {
                console.error('❌ Booking confirmation failed:', result.message);
                Alert.alert('Error', result.message || 'Failed to confirm booking');
              }
            } catch (err: any) {
              console.error('❌ Error in booking confirmation:', err);
              if (err.response) {
                console.error('❌ API Error Response:', err.response.status, err.response.data);
              }
              Alert.alert('Error', 'Failed to confirm booking');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMakeDeposit = (booking: IBooking): void => {
    console.log('📘 Navigating to deposit payment screen for booking:', booking.bookingCode);
    
    // Log booking details that might be useful for the deposit screen
    console.log('📘 Booking details for deposit:', {
      id: booking.id || booking.bookingId,
      code: booking.bookingCode,
      status: booking.status,
      statusText: mapStatusCodeToString(booking.status),
      totalPrice: booking.totalPrice
    });
    
    // Navigate to deposit payment screen
    router.push({
      pathname: '/booking/deposit-payment',
      params: { contractCode: booking.bookingCode }
    });
  };

  // New handler for tracking button
  const handleViewTracking = (booking: IBooking): void => {
    console.log('📘 Navigating to tracking screen for booking:', booking.bookingCode);
    
    // Navigate to tracking view screen with booking code
    router.push({
      pathname: '/booking/tracking-view',
      params: { bookingCode: booking.bookingCode }
    });
  };

  const handleViewQuotation = (quotationCode: string): void => {
    if (!quotationCode) return;
    
    console.log('📘 Navigating to quotation details for:', quotationCode);
    
    // Navigate to quotation detail screen with the correct route
    router.push({
      pathname: '/quotation/quotation-detail/[code]',
      params: { code: quotationCode }
    });
  };

  const renderHeader = (): React.ReactElement => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
      <TouchableOpacity
        style={styles.quotationButton}
        onPress={() => router.push('/quotation/list')}
      >
        <Ionicons name="document-text-outline" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderFilterTabs = (): React.ReactElement => (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filterScrollContent}
      >
        {filterGroupOptions.map((option) => (
          <TouchableOpacity
            key={option.label}
            style={[
              styles.filterTab,
              selectedCategory === option.value && styles.activeFilterTab
            ]}
            onPress={() => setSelectedCategory(option.value)}
          >
            <Text style={[
              styles.filterTabText,
              selectedCategory === option.value && styles.activeFilterTabText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  
  const renderBookingItem = ({ item }: { item: IBooking }): React.ReactElement => {
    const statusCode = item.status;
    const statusText = mapStatusCodeToString(statusCode);
    // We need to cast the statusIcon to Ionicons name type to fix the type error
    const statusIcon = getStatusIcon(statusCode) as keyof typeof Ionicons.glyphMap;
    const statusColor = getStatusColor(statusCode);
    const statusStage = getStatusStage(statusCode);
    
    const canCancel = canBookingBeCancelled(statusCode);
    const needsConfirmation = doesBookingNeedConfirmation(statusCode);
    const needsDeposit = doesBookingNeedDeposit(statusCode);
    const hasTracking = hasTrackingAvailable(statusCode);
    const needsFinalPayment = doesBookingNeedFinalPayment(statusCode);
    // Check if booking has a quotation code
    const hasQuotation = item.quotationCode && item.quotationCode.trim() !== '';
    
    // Use either id or bookingId depending on which is available
    const bookingId = item.id || item.bookingId;
    
    return (
      <TouchableOpacity
        style={[styles.bookingCard, { backgroundColor: colors.card }]}
        // onPress={() => router.push(`/booking/booking-detail/${bookingId}`)}
      >
        <View style={styles.bookingHeader}>
          <Text style={[styles.bookingCode, { color: colors.text }]}>
            {item.bookingCode}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Ionicons name={statusIcon} size={14} color={statusColor} style={styles.statusIcon} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        {statusStage ? (
          <View style={styles.stageContainer}>
            <Text style={[styles.stageText, { color: colors.textSecondary }]}>
              {statusStage}
            </Text>
          </View>
        ) : null}

        {/* Quotation Code - Show if available */}
        {hasQuotation && (
          <View style={styles.bookingDetail}>
            <Ionicons name="document-text-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Quotation Code: {item.quotationCode}
            </Text>
          </View>
        )}

        {/* Provider info if available */}
        {item.provider ? (
          <View style={styles.bookingDetail}>
            <Ionicons name="business-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Provider: {item.provider.businessName}
            </Text>
          </View>
        ) : null}

        {/* Survey date if available */}
        {item.surveyDate ? (
          <View style={styles.bookingDetail}>
            <Ionicons name="calendar-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Survey Date: {new Date(item.surveyDate).toLocaleDateString()} {item.surveyTime || ''}
            </Text>
          </View>
        ) : null}

        {/* Address */}
        <View style={styles.bookingDetail}>
          <Ionicons name="location-outline" size={18} color={PRIMARY_COLOR} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.address}
          </Text>
        </View>

        {/* Decor style if available */}
        {item.decorService ? (
          <View style={styles.bookingDetail}>
            <Ionicons name="construct-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {item.decorService.style || "Not specified"}
            </Text>
          </View>
        ) : null}

        {/* Price if available */}
        {item.totalPrice !== undefined && item.totalPrice > 0 ? (
          <View style={styles.bookingDetail}>
            <Ionicons name="cash-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Total Price: {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(item.totalPrice)}
            </Text>
          </View>
        ) : null}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.bookingFooter}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            Booked on {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          
          <View style={styles.actionButtonsContainer}>
            {/* View Tracking button - Only show for status 8 (Progressing) */}
            {hasTracking && (
              <TouchableOpacity
                style={styles.trackingButton}
                onPress={() => handleViewTracking(item)}
              >
                <Text style={styles.trackingButtonText}>View Tracking</Text>
              </TouchableOpacity>
            )}
            
            {/* View Quotation button - Show if quotation exists */}
            {hasQuotation && (
              <TouchableOpacity
                style={styles.quotationViewButton}
                onPress={() => handleViewQuotation(item.quotationCode || '')}
              >
                <Text style={styles.quotationViewButtonText}>View Quotation</Text>
              </TouchableOpacity>
            )}
            
            {needsConfirmation && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleConfirmBooking(item)}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            )}
            
            {needsDeposit && (
              <TouchableOpacity
                style={styles.depositButton}
                onPress={() => handleMakeDeposit(item)}
              >
                <Text style={styles.depositButtonText}>Pay Deposit</Text>
              </TouchableOpacity>
            )}
             {needsFinalPayment && (
      <TouchableOpacity
        style={styles.finalPaymentButton}
        onPress={() => handleMakeFinalPayment(item)}
      >
        <Text style={styles.finalPaymentButtonText}>Final Payment</Text>
      </TouchableOpacity>
    )}
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelBooking(item)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = (): React.ReactElement => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar" size={60} color={PRIMARY_COLOR} style={{ opacity: 0.5 }} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No bookings found
      </Text>
      <TouchableOpacity
        style={styles.newBookingButton}
        onPress={() => router.push('/(tabs)/decor')}
      >
        <Text style={styles.newBookingButtonText}>Create New Booking</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = (): React.ReactElement | null => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
      </View>
    );
  };

  if (loading && !refreshing && bookings.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading bookings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={PRIMARY_COLOR} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchBookings(true)}
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
      {renderFilterTabs()}
      
      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => `${item.id || item.bookingId}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }
        onEndReached={loadMoreBookings}
        onEndReachedThreshold={0.5}
      />
      
      {/* Updated floating buttons container */}
      <View style={styles.floatingButtonsRow}>
        <TouchableOpacity
          style={[styles.floatingButton, styles.quotationFloatingButton]}
          onPress={() => router.push('/quotation/list')}
        >
          <Ionicons name="document-text" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => router.push('/(tabs)/decor')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Updated styles with correct property names
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  quotationButton: {
    padding: 8,
  },
  floatingButtonsRow: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  quotationFloatingButton: {
    backgroundColor: '#34c759',
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
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterScrollContent: {
    paddingHorizontal: 15,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  activeFilterTab: {
    backgroundColor: PRIMARY_COLOR,
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterTabText: {
    color: '#fff',
    fontWeight: '500',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 70,
  },
  bookingCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  stageContainer: {
    marginBottom: 10,
  },
  stageText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    maxWidth: '70%',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#5856d6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  depositButton: {
    backgroundColor: '#5ac8fa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  depositButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  // Added the tracking button styles
  trackingButton: {
    backgroundColor: '#4cd964',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  trackingButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  quotationViewButton: {
    backgroundColor: '#5856d6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  quotationViewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
  newBookingButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  newBookingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  footerContainer: {
    padding: 15,
    alignItems: 'center',
  },
  finalPaymentButton: {
    backgroundColor: '#34c759', // Green color for final payment
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  finalPaymentButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default BookingListScreen;