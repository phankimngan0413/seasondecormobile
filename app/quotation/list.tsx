// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
//   SafeAreaView,
//   StatusBar,
//   RefreshControl,
//   Alert
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { useTheme } from '@/constants/ThemeContext';
// import { Colors } from '@/constants/Colors';
// import { 
//   getPaginatedQuotationsAPI, 
//   acceptQuotationAPI, 
//   rejectQuotationAPI 
// } from '@/utils/quotationAPI';

// const PRIMARY_COLOR = "#5fc1f1";
// const QUOTATION_COLOR = "#34c759"; // Green color for quotation elements

// // Define quotation status codes
// type QuotationStatusCode = 0 | 1 | 2 | 3 | 4;

// // Define the quotation interface
// interface IQuotation {
//   id: number;
//   quotationCode: string;
//   customerId: number;
//   status: QuotationStatusCode;
//   totalPrice: number;
//   notes?: string;
//   createdAt: string;
//   updatedAt?: string;
//   products?: Array<{
//     productId: number;
//     quantity: number;
//     price: number;
//     productName?: string;
//   }>;
// }

// // Status mapping utilities
// const mapStatusCodeToString = (statusCode: number): string => {
//   const statusMap: Record<number, string> = {
//     0: 'Pending',      // When customer creates quotation request
//     1: 'Processing',   // When provider is working on quotation
//     2: 'Completed',    // When provider has sent quotation to customer
//     3: 'Accepted',     // When customer accepts the quotation
//     4: 'Rejected'      // When customer rejects the quotation
//   };
  
//   return statusMap[statusCode] || 'Unknown';
// };

// const getStatusColor = (statusCode: number): string => {
//   switch (statusCode) {
//     case 0: // Pending
//       return '#ff9500'; // Orange
//     case 1: // Processing
//       return '#007aff'; // Blue
//     case 2: // Completed
//       return '#34c759'; // Green
//     case 3: // Accepted
//       return '#4caf50'; // Green
//     case 4: // Rejected
//       return '#ff3b30'; // Red
//     default:
//       return '#8e8e93'; // Gray
//   }
// };

// const getStatusIcon = (statusCode: number): string => {
//   switch (statusCode) {
//     case 0: // Pending
//       return 'time-outline';
//     case 1: // Processing
//       return 'hourglass-outline';
//     case 2: // Completed
//       return 'document-text-outline';
//     case 3: // Accepted
//       return 'checkmark-circle-outline';
//     case 4: // Rejected
//       return 'close-circle-outline';
//     default:
//       return 'help-circle-outline';
//   }
// };

// const canQuotationBeAccepted = (statusCode: number): boolean => {
//   return statusCode === 2; // Only Completed quotations can be accepted
// };

// const canQuotationBeRejected = (statusCode: number): boolean => {
//   return statusCode === 2; // Only Completed quotations can be rejected
// };

// const QuotationListScreen: React.FC = () => {
//   const { theme } = useTheme();
//   const colors = Colors[theme as "light" | "dark"];
//   const router = useRouter();

//   const [quotations, setQuotations] = useState<IQuotation[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [refreshing, setRefreshing] = useState<boolean>(false);
//   const [error, setError] = useState<string>('');
//   const [currentPage, setCurrentPage] = useState<number>(0);
//   const [pageSize, setPageSize] = useState<number>(10);
//   const [totalPages, setTotalPages] = useState<number>(1);
//   const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined);

//   // Filter options for status tabs
//   const statusFilterOptions = [
//     { label: 'All', value: undefined },
//     { label: 'Pending', value: 0 },
//     { label: 'Processing', value: 1 },
//     { label: 'Completed', value: 2 },
//     { label: 'Accepted', value: 3 },
//     { label: 'Rejected', value: 4 }
//   ];

//   useEffect(() => {
//     fetchQuotations();
//   }, [currentPage, selectedStatus]);

//   const fetchQuotations = async (refresh = false) => {
//     try {
//       console.log('📘 fetchQuotations called, refresh:', refresh);
      
//       if (refresh) {
//         setCurrentPage(0);
//         setRefreshing(true);
//       } else if (!refreshing) {
//         setLoading(true);
//       }
      
//       setError('');
      
//       const response = await getPaginatedQuotationsAPI(
//         undefined, // quotationCode
//         selectedStatus, // status filter
//         refresh ? 0 : currentPage,
//         pageSize
//       );
      
//       console.log('📘 API Response:', response);
      
//       if (response && response.data) {
//         setQuotations(response.data);
        
//         // Calculate total pages based on totalCount if available
//         if (response.totalCount) {
//           const calculatedTotalPages = Math.ceil(response.totalCount / pageSize);
//           setTotalPages(calculatedTotalPages);
//         }
//       } else {
//         setQuotations([]);
//       }
      
//     } catch (err: any) {
//       console.error('❌ Error fetching quotations:', err);
//       setError('Failed to load quotations. Please try again.');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const handleRefresh = (): void => {
//     fetchQuotations(true);
//   };

//   const loadMoreQuotations = (): void => {
//     if (currentPage < totalPages - 1 && !loading) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   const handleAcceptQuotation = async (quotationId: number): Promise<void> => {
//     Alert.alert(
//       'Accept Quotation',
//       'Are you sure you want to accept this quotation?',
//       [
//         { text: 'No', style: 'cancel' },
//         {
//           text: 'Yes',
//           onPress: async () => {
//             try {
//               setLoading(true);
//               const result = await acceptQuotationAPI(quotationId);
              
//               if (result.success) {
//                 Alert.alert('Success', 'Quotation accepted successfully');
//                 fetchQuotations(true);
//               } else {
//                 Alert.alert('Error', result.message || 'Failed to accept quotation');
//               }
//             } catch (err: any) {
//               console.error('❌ Error accepting quotation:', err);
//               Alert.alert('Error', 'Failed to accept quotation. Please try again.');
//             } finally {
//               setLoading(false);
//             }
//           }
//         }
//       ]
//     );
//   };

//   const handleRejectQuotation = async (quotationId: number): Promise<void> => {
//     Alert.alert(
//       'Reject Quotation',
//       'Are you sure you want to reject this quotation?',
//       [
//         { text: 'No', style: 'cancel' },
//         {
//           text: 'Yes',
//           onPress: async () => {
//             try {
//               setLoading(true);
//               const result = await rejectQuotationAPI(quotationId);
              
//               if (result.success) {
//                 Alert.alert('Success', 'Quotation rejected successfully');
//                 fetchQuotations(true);
//               } else {
//                 Alert.alert('Error', result.message || 'Failed to reject quotation');
//               }
//             } catch (err: any) {
//               console.error('❌ Error rejecting quotation:', err);
//               Alert.alert('Error', 'Failed to reject quotation. Please try again.');
//             } finally {
//               setLoading(false);
//             }
//           }
//         }
//       ]
//     );
//   };

//   const renderHeader = (): React.ReactElement => (
//     <View style={[styles.header, { borderBottomColor: colors.border }]}>
//       <TouchableOpacity
//         style={styles.backButton}
//         onPress={() => router.back()}
//       >
//         <Ionicons name="arrow-back" size={24} color={colors.text} />
//       </TouchableOpacity>
//       <Text style={[styles.headerTitle, { color: colors.text }]}>My Quotations</Text>
//       <View style={styles.spacer} />
//     </View>
//   );

//   const renderStatusTabs = (): React.ReactElement => (
//     <View style={styles.filterContainer}>
//       <FlatList
//         horizontal
//         data={statusFilterOptions}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={[
//               styles.filterTab,
//               selectedStatus === item.value && styles.activeFilterTab
//             ]}
//             onPress={() => setSelectedStatus(item.value)}
//           >
//             <Text style={[
//               styles.filterTabText,
//               selectedStatus === item.value && styles.activeFilterTabText
//             ]}>
//               {item.label}
//             </Text>
//           </TouchableOpacity>
//         )}
//         keyExtractor={(item) => item.label}
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={styles.filterScrollContent}
//       />
//     </View>
//   );

//   const renderQuotationItem = ({ item }: { item: IQuotation }): React.ReactElement => {
//     const statusCode = item.status;
//     const statusText = mapStatusCodeToString(statusCode);
//     const statusIcon = getStatusIcon(statusCode) as keyof typeof Ionicons.glyphMap;
//     const statusColor = getStatusColor(statusCode);
    
//     const canAccept = canQuotationBeAccepted(statusCode);
//     const canReject = canQuotationBeRejected(statusCode);
    
//     return (
//       <TouchableOpacity
//         style={[styles.quotationCard, { backgroundColor: colors.card }]}
//         // onPress={() => router.push(`/quotation/${item.id}`)}
//       >
//         <View style={styles.quotationHeader}>
//           <Text style={[styles.quotationCode, { color: colors.text }]}>
//             {item.quotationCode}
//           </Text>
//           <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
//             <Ionicons name={statusIcon} size={14} color={statusColor} style={styles.statusIcon} />
//             <Text style={[styles.statusText, { color: statusColor }]}>
//               {statusText}
//             </Text>
//           </View>
//         </View>

//         {/* Total price */}
//         <View style={styles.quotationDetail}>
//           <Ionicons name="cash-outline" size={18} color={QUOTATION_COLOR} />
//           <Text style={[styles.detailText, { color: colors.textSecondary }]}>
//             Total Price: {new Intl.NumberFormat('vi-VN', { 
//               style: 'currency', 
//               currency: 'VND' 
//             }).format(item.totalPrice)}
//           </Text>
//         </View>

//         {/* Product count if available */}
//         {item.products && (
//           <View style={styles.quotationDetail}>
//             <Ionicons name="cube-outline" size={18} color={QUOTATION_COLOR} />
//             <Text style={[styles.detailText, { color: colors.textSecondary }]}>
//               Products: {item.products.length}
//             </Text>
//           </View>
//         )}

//         {/* Notes if available */}
//         {item.notes && (
//           <View style={styles.quotationDetail}>
//             <Ionicons name="create-outline" size={18} color={QUOTATION_COLOR} />
//             <Text style={[styles.detailText, { color: colors.textSecondary }]}>
//               {item.notes.length > 50 ? `${item.notes.substring(0, 50)}...` : item.notes}
//             </Text>
//           </View>
//         )}

//         <View style={[styles.divider, { backgroundColor: colors.border }]} />

//         <View style={styles.quotationFooter}>
//           <Text style={[styles.dateText, { color: colors.textSecondary }]}>
//             Created on {new Date(item.createdAt).toLocaleDateString()}
//           </Text>
          
//           {(canAccept || canReject) && (
//             <View style={styles.actionButtonsContainer}>
//               {canAccept && (
//                 <TouchableOpacity
//                   style={styles.acceptButton}
//                   onPress={() => handleAcceptQuotation(item.id)}
//                 >
//                   <Text style={styles.acceptButtonText}>Accept</Text>
//                 </TouchableOpacity>
//               )}
              
//               {canReject && (
//                 <TouchableOpacity
//                   style={styles.rejectButton}
//                   onPress={() => handleRejectQuotation(item.id)}
//                 >
//                   <Text style={styles.rejectButtonText}>Reject</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           )}
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   const renderEmpty = (): React.ReactElement => (
//     <View style={styles.emptyContainer}>
//       <Ionicons name="document-text" size={60} color={QUOTATION_COLOR} style={{ opacity: 0.5 }} />
//       <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
//         No quotations found
//       </Text>
//       <TouchableOpacity
//         style={styles.newQuotationButton}
//         onPress={() => router.push('/decor')}
//       >
//         <Text style={styles.newQuotationButtonText}>Request New Quotation</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderFooter = (): React.ReactElement | null => {
//     if (!loading || refreshing) return null;
    
//     return (
//       <View style={styles.footerContainer}>
//         <ActivityIndicator size="small" color={QUOTATION_COLOR} />
//       </View>
//     );
//   };

//   if (loading && !refreshing && quotations.length === 0) {
//     return (
//       <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
//         <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
//         {renderHeader()}
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={QUOTATION_COLOR} />
//           <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
//             Loading quotations...
//           </Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
//       <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
//       {renderHeader()}
//       {renderStatusTabs()}
      
//       <FlatList
//         data={quotations}
//         renderItem={renderQuotationItem}
//         keyExtractor={(item) => `${item.id}`}
//         contentContainerStyle={styles.listContainer}
//         ListEmptyComponent={renderEmpty}
//         ListFooterComponent={renderFooter}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             colors={[QUOTATION_COLOR]}
//             tintColor={QUOTATION_COLOR}
//           />
//         }
//         onEndReached={loadMoreQuotations}
//         onEndReachedThreshold={0.5}
//       />
      
//       <TouchableOpacity
//         style={styles.floatingButton}
//         onPress={() => router.push('/decordecor')}
//       >
//         <Ionicons name="add" size={24} color="#FFFFFF" />
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: StatusBar.currentHeight || 0,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 15,
//     borderBottomWidth: 1,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     flex: 1,
//     textAlign: 'center',
//   },
//   spacer: {
//     width: 40,
//   },
//   filterContainer: {
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   filterScrollContent: {
//     paddingHorizontal: 15,
//   },
//   filterTab: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     marginRight: 10,
//     backgroundColor: '#f0f0f0',
//   },
//   activeFilterTab: {
//     backgroundColor: QUOTATION_COLOR,
//   },
//   filterTabText: {
//     fontSize: 14,
//     color: '#666',
//   },
//   activeFilterTabText: {
//     color: '#fff',
//     fontWeight: '500',
//   },
//   listContainer: {
//     padding: 15,
//     paddingBottom: 70,
//   },
//   quotationCard: {
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   quotationHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   quotationCode: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   statusBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 12,
//   },
//   statusIcon: {
//     marginRight: 4,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   quotationDetail: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   detailText: {
//     marginLeft: 8,
//     fontSize: 14,
//     flex: 1,
//   },
//   divider: {
//     height: 1,
//     marginVertical: 10,
//   },
//   quotationFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   dateText: {
//     fontSize: 12,
//   },
//   actionButtonsContainer: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   acceptButton: {
//     backgroundColor: '#4caf50',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//   },
//   acceptButtonText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   rejectButton: {
//     backgroundColor: '#ff3b30',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//   },
//   rejectButtonText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   errorText: {
//     marginTop: 10,
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   retryButton: {
//     backgroundColor: QUOTATION_COLOR,
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 30,
//   },
//   emptyText: {
//     fontSize: 16,
//     marginVertical: 10,
//     textAlign: 'center',
//   },
//   newQuotationButton: {
//     backgroundColor: QUOTATION_COLOR,
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     marginTop: 10,
//   },
//   newQuotationButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   footerContainer: {
//     padding: 15,
//     alignItems: 'center',
//   },
//   floatingButton: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: QUOTATION_COLOR,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//   },
// });

// export default QuotationListScreen;