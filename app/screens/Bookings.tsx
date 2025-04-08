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
  ScrollView // Using the ScrollView from react-native instead
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { 
  IBooking, 
  getPaginatedBookingsForCustomerAPI,
  cancelBookingAPI
} from '@/utils/bookingAPI';

const PRIMARY_COLOR = "#5fc1f1";

const BookingListScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();

  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  const statusOptions = [
    { label: 'All', value: undefined },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  useEffect(() => {
    fetchBookings();
  }, [currentPage, selectedStatus]);

  const fetchBookings = async (refresh = false) => {
    try {
      if (refresh) {
        setCurrentPage(1);
        setRefreshing(true);
      } else if (!refreshing) {
        setLoading(true);
      }
      
      setError('');
      
      const response = await getPaginatedBookingsForCustomerAPI({
        status: selectedStatus,
        pageIndex: refresh ? 1 : currentPage,
        pageSize: 10,
        sortBy: 'createdAt',
        descending: true
      });
      
      setBookings(refresh ? response.items : response.items);
      setTotalPages(response.totalPages);
      
    } catch (err: any) {
      setError('Failed to load bookings. Please try again.');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchBookings(true);
  };

  const loadMoreBookings = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await cancelBookingAPI(bookingId);
              
              if (result.success) {
                Alert.alert('Success', 'Booking cancelled successfully');
                fetchBookings(true);
              } else {
                Alert.alert('Error', result.message || 'Failed to cancel booking');
              }
            } catch (err: any) {
              Alert.alert('Error', 'Failed to cancel booking');
              console.error('Error cancelling booking:', err);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
      <View style={styles.spacer} />
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filterScrollContent}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.label}
            style={[
              styles.filterTab,
              selectedStatus === option.value && styles.activeFilterTab
            ]}
            onPress={() => setSelectedStatus(option.value)}
          >
            <Text style={[
              styles.filterTabText,
              selectedStatus === option.value && styles.activeFilterTabText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderBookingItem = ({ item }: { item: IBooking }) => {
    const isPending = item.status === 'pending';
    const isConfirmed = item.status === 'confirmed';
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    
    const statusColor = isPending 
      ? '#ff9500' 
      : isConfirmed 
        ? '#007aff' 
        : isCompleted 
          ? '#4caf50' 
          : '#ff3b30';

    return (
      <TouchableOpacity
        style={[styles.bookingCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/booking/${item.id}`)}
      >
        <View style={styles.bookingHeader}>
          <Text style={[styles.bookingCode, { color: colors.text }]}>
            {item.bookingCode}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetail}>
          <Ionicons name="calendar-outline" size={18} color={PRIMARY_COLOR} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Survey Date: {new Date(item.surveyDate).toLocaleDateString()} {item.surveyTime}
          </Text>
        </View>

        <View style={styles.bookingDetail}>
          <Ionicons name="location-outline" size={18} color={PRIMARY_COLOR} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.address}
          </Text>
        </View>

        <View style={styles.bookingDetail}>
          <Ionicons name="construct-outline" size={18} color={PRIMARY_COLOR} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.decorService?.style || "Not specified"}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.bookingFooter}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            Booked on {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          
          {isPending && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(item.id)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
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

  const renderFooter = () => {
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
        keyExtractor={(item) => item.id.toString()}
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
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push('/(tabs)/decor')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

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
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
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
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
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
});

export default BookingListScreen;