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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { 
  getPaginatedQuotationsForCustomerAPI, 
  confirmQuotationAPI
} from '@/utils/quotationsAPI';

const PRIMARY_COLOR = "#5fc1f1";
const QUOTATION_COLOR = "#34c759"; // Green color for quotation elements

// Updated quotation status codes as specified
enum QuotationStatusCode {
  Pending = 0,             // Pending quotation (unchanged)
  Confirmed = 1,           // Customer agreed to quotation (unchanged)
  PendingChanged = 2,      // Từ chối bảng báo giá (previously Denied)
  PendingCancel = 3,       // New status
  Closed = 4               // New status
}

// Updated quotation interface based on actual API response
interface IQuotation {
  id: number;
  quotationCode: string;
  provider: {
    id: number;
    businessName: string;
    avatar: string;
    isProvider: boolean;
    providerVerified: boolean;
    providerStatus: number;
    followersCount: number;
    followingsCount: number;
  };
  style: string;
  materialCost: number;
  constructionCost: number;
  depositPercentage: number;
  isQuoteExisted: boolean;
  isContractExisted: boolean;
  isSigned: boolean;
  createdAt: string;
  status: QuotationStatusCode;
  filePath: string;
  materialDetails: Array<{
    id: number;
    materialName: string;
    quantity: number;
    cost: number;
    totalCost: number;
  }>;
  constructionDetails: Array<{
    id: number;
    taskName: string;
    cost: number;
    unit: string;
    area: number;
  }>;
}

// Status mapping utilities - updated with new status codes
const mapStatusCodeToString = (statusCode: number): string => {
  const statusMap: Record<number, string> = {
    [QuotationStatusCode.Pending]: 'Pending',
    [QuotationStatusCode.Confirmed]: 'Confirmed',
    [QuotationStatusCode.PendingChanged]: 'Changes Requested',
    [QuotationStatusCode.PendingCancel]: 'Cancellation Pending',
    [QuotationStatusCode.Closed]: 'Closed'
  };
  
  return statusMap[statusCode] || 'Unknown';
};

const getStatusColor = (statusCode: number): string => {
  switch (statusCode) {
    case QuotationStatusCode.Pending:
      return '#ff9500'; // Orange
    case QuotationStatusCode.Confirmed:
      return '#4caf50'; // Green
    case QuotationStatusCode.PendingChanged:
      return '#ff3b30'; // Red
    case QuotationStatusCode.PendingCancel:
      return '#ff6b6b'; // Light Red
    case QuotationStatusCode.Closed:
      return '#8e8e93'; // Gray
    default:
      return '#8e8e93'; // Gray
  }
};

const getStatusIcon = (statusCode: number): string => {
  switch (statusCode) {
    case QuotationStatusCode.Pending:
      return 'time-outline';
    case QuotationStatusCode.Confirmed:
      return 'checkmark-circle-outline';
    case QuotationStatusCode.PendingChanged:
      return 'alert-circle-outline';
    case QuotationStatusCode.PendingCancel:
      return 'close-circle-outline';
    case QuotationStatusCode.Closed:
      return 'ellipsis-horizontal-circle-outline';
    default:
      return 'help-circle-outline';
  }
};

const canQuotationBeConfirmed = (statusCode: number): boolean => {
  return statusCode === QuotationStatusCode.Pending; // Only Pending quotations can be confirmed
};

const canViewContract = (statusCode: number): boolean => {
  return statusCode === QuotationStatusCode.Confirmed; // Show "View Contract" button for Confirmed quotations
};

const QuotationListScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();

  const [quotations, setQuotations] = useState<IQuotation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined);

  // Updated filter options with new status codes
  const statusFilterOptions = [
    { label: 'All', value: undefined },
    { label: 'Pending', value: QuotationStatusCode.Pending },
    { label: 'Confirmed', value: QuotationStatusCode.Confirmed },
    { label: 'Changes Requested', value: QuotationStatusCode.PendingChanged },
    { label: 'Cancellation Pending', value: QuotationStatusCode.PendingCancel },
    { label: 'Closed', value: QuotationStatusCode.Closed }
  ];

  useEffect(() => {
    fetchQuotations();
  }, [selectedStatus]);

  const fetchQuotations = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (!refreshing) {
        setLoading(true);
      }
      
      setError('');
      
      // Call the API without any parameters since that works based on debug logs
      const response = await getPaginatedQuotationsForCustomerAPI();
      
      if (response && response.data) {
        // Sort quotations by date (newest first)
        const sortedData = [...response.data].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        // Apply status filter if selected
        if (selectedStatus !== undefined) {
          const filteredData = sortedData.filter((item: { status: number; }) => 
            item.status === selectedStatus
          );
          setQuotations(filteredData);
        } else {
          setQuotations(sortedData);
        }
      } else {
        setQuotations([]);
      }
    } catch (err: any) {
      console.error('Error fetching quotations:', err);
      setError('Failed to load quotations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = (): void => {
    fetchQuotations(true);
  };
  const formatDateWithTextMonth = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };
  const handleConfirmQuotation = async (quotationCode: string): Promise<void> => {
    Alert.alert(
      'Confirm Quotation',
      'Are you sure you want to confirm this quotation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await confirmQuotationAPI(quotationCode);
              
              if (result && result.success) {
                Alert.alert('Success', 'Quotation confirmed successfully');
                fetchQuotations(true);
              } else {
                Alert.alert('Error', (result && result.message) || 'Failed to confirm quotation');
              }
            } catch (err: any) {
              console.error('Error confirming quotation:', err);
              Alert.alert('Error', err.message || 'Failed to confirm quotation. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderHeader = (): React.ReactElement => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>My Quotations</Text>
      <View style={styles.spacer} />
    </View>
  );

  const renderStatusTabs = (): React.ReactElement => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        data={statusFilterOptions}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedStatus === item.value && styles.activeFilterTab
            ]}
            onPress={() => setSelectedStatus(item.value)}
          >
            <Text style={[
              styles.filterTabText,
              selectedStatus === item.value && styles.activeFilterTabText
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      />
    </View>
  );

  const renderQuotationItem = ({ item }: { item: IQuotation }): React.ReactElement => {
    const statusCode = item.status;
    const statusText = mapStatusCodeToString(statusCode);
    const statusIcon = getStatusIcon(statusCode) as keyof typeof Ionicons.glyphMap;
    const statusColor = getStatusColor(statusCode);
    
    const canConfirm = canQuotationBeConfirmed(statusCode);
    const showViewContract = statusCode === QuotationStatusCode.Confirmed && item.isContractExisted === true;
    const totalPrice = (item.materialCost || 0) + (item.constructionCost || 0);
    
    return (
      <TouchableOpacity
        style={[styles.quotationCard, { backgroundColor: colors.card }]}
        onPress={() => router.push({
          pathname: "/quotation/quotation-detail/[code]",
          params: { code: item.quotationCode }
        })}
      >
        <View style={styles.quotationHeader}>
          <Text style={[styles.quotationCode, { color: colors.text }]}>
            {item.quotationCode}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Ionicons name={statusIcon} size={14} color={statusColor} style={styles.statusIcon} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>
  
        {/* Provider info */}
        <View style={styles.quotationDetail}>
          <Ionicons name="business-outline" size={18} color={QUOTATION_COLOR} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Provider: {item.provider.businessName}
          </Text>
        </View>
  
        {/* Style */}
        <View style={styles.quotationDetail}>
          <Ionicons name="color-palette-outline" size={18} color={QUOTATION_COLOR} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Style: {item.style}
          </Text>
        </View>
  
        {/* Total price */}
        <View style={styles.quotationDetail}>
          <Ionicons name="cash-outline" size={18} color={QUOTATION_COLOR} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Total Price: {new Intl.NumberFormat('vi-VN', { 
              style: 'currency', 
              currency: 'VND' 
            }).format(totalPrice)}
          </Text>
        </View>
  
        {/* Materials count */}
        <View style={styles.quotationDetail}>
          <Ionicons name="list-outline" size={18} color={QUOTATION_COLOR} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Materials: {item.materialDetails.length}
          </Text>
        </View>
  
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
  
        <View style={styles.quotationFooter}>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
  Created on {formatDateWithTextMonth(item.createdAt)}
</Text>
          <View style={styles.actionButtonsContainer}>
            {/* {canConfirm && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleConfirmQuotation(item.quotationCode)}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            )} */}
            
            {showViewContract && (
              <TouchableOpacity
                style={styles.viewContractButton}
                onPress={() => router.push({
                  pathname: "/quotation/contract/[code]",
                  params: { code: item.quotationCode }
                })}
              >
                <Text style={styles.viewContractButtonText}>View Contract</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = (): React.ReactElement => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text" size={60} color={QUOTATION_COLOR} style={{ opacity: 0.5 }} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No quotations found
      </Text>
      <TouchableOpacity
        style={styles.newQuotationButton}
        onPress={() => router.push('/screens/Bookings')}
      >
        <Text style={styles.newQuotationButtonText}>Create New Booking</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = (): React.ReactElement | null => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={QUOTATION_COLOR} />
      </View>
    );
  };

  if (loading && !refreshing && quotations.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={QUOTATION_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading quotations...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {renderHeader()}
      {renderStatusTabs()}
      
      <FlatList
        data={quotations}
        renderItem={renderQuotationItem}
        keyExtractor={(item) => `${item.id}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[QUOTATION_COLOR]}
            tintColor={QUOTATION_COLOR}
          />
        }
      />
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push('/screens/Bookings')}
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
    backgroundColor: QUOTATION_COLOR,
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
  quotationCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quotationCode: {
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
  quotationDetail: {
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
  quotationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  confirmButtonText: {
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
    backgroundColor: QUOTATION_COLOR,
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
  newQuotationButton: {
    backgroundColor: QUOTATION_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  newQuotationButtonText: {
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
    backgroundColor: QUOTATION_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  viewContractButton: {
    backgroundColor: '#2196F3', // Blue color for contract button
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewContractButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default QuotationListScreen;