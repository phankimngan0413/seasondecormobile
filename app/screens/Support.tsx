import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  TextInput,
  StatusBar,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  Image,
  Platform,
  PermissionsAndroid
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { 
  createSupportTicketAPI, 
  getPaginatedSupportTicketsAPI, 
  getTicketTypesAPI,
  ISupportTicket,
  ITicketType,
  IPaginatedSupportTickets
} from "@/utils/supportAPI";
import { getPaginatedBookingsForCustomerAPI, IBookingFilterOptions, IBooking } from "@/utils/bookingAPI";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';

const { width } = Dimensions.get("window");

// ==================== CONSTANTS ====================
const CONFIG = {
  colors: {
    primary: "#5fc1f1",
    success: "#52c41a", 
    warning: "#faad14",
    error: "#ff4444",
    white: "#fff"
  },
  pagination: {
    pageSize: 10,
    defaultPage: 0
  }
};

// ==================== INTERFACES ====================
interface UploadedImage {
  id: string;
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

interface BookingOption {
  id: string;
  bookingCode: string;
  serviceName?: string;
  createdAt?: string;
  status?: number;
}

// ==================== MAIN COMPONENT ====================
const SupportScreen = () => {
  // ==================== STATE MANAGEMENT ====================
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<ITicketType[]>([]);
  const [bookingOptions, setBookingOptions] = useState<BookingOption[]>([]);
  
  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTicketType, setSelectedTicketType] = useState<ITicketType | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTicketTypeModal, setShowTicketTypeModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Image upload state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [showImageOptions, setShowImageOptions] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // ==================== HOOKS ====================
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  // ==================== UTILITY FUNCTIONS ====================
  const getStatusColor = (isSolved: boolean) => {
    return isSolved ? CONFIG.colors.success : CONFIG.colors.warning;
  };

  const getTicketTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'service delay':
        return 'time-outline';
      case 'incorrect service implementation':
        return 'construct-outline';
      case 'unprofessional behavior':
        return 'person-remove-outline';
      case 'damage or loss report':
        return 'warning-outline';
      case 'poor material quality':
        return 'alert-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short' as const,
        day: 'numeric' as const
      });
    } catch {
      return 'Unknown';
    }
  };

  const getTimeAgo = (date: string) => {
    if (!date) return '';
    const now = new Date();
    const ticketDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return ticketDate.toLocaleDateString();
  };

  // ==================== NAVIGATION ====================
  const navigateToSupportDetail = (ticket: any) => {
    const bookingCode = ticket?.bookingCode;
    const ticketId = ticket?.id;
    
    if (bookingCode) {
      router.push(`/support/detail?bookingCode=${bookingCode}&ticketId=${ticketId}`);
    } else {
      router.push(`/support/${ticketId}`);
    }
  };

  // ==================== API FUNCTIONS ====================
  const fetchTickets = async (page = 0, isRefresh = false) => {
    try {
      if (!isRefresh && page === 0) setLoading(true);
      
      const response: any = await getPaginatedSupportTicketsAPI({
        pageIndex: page,
        pageSize: CONFIG.pagination.pageSize,
        descending: true
      });
      
      let ticketsData: any[] = [];
      
      if (response?.success && response?.data?.data) {
        ticketsData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        ticketsData = response.data;
      } else if (Array.isArray(response)) {
        ticketsData = response;
      }
      
      // Sort by ID descending
      ticketsData.sort((a, b) => (b.id || 0) - (a.id || 0));
      
      if (page === 0) {
        setTickets(ticketsData);
      } else {
        setTickets(prev => [...prev, ...ticketsData]);
      }
      
      setHasMore(ticketsData.length === CONFIG.pagination.pageSize);
      setCurrentPage(page);
      
    } catch (err: any) {
      setError(err?.message || "Failed to fetch tickets");
      if (page === 0) setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTicketTypes = async () => {
    try {
      const response = await getTicketTypesAPI();
      setTicketTypes(Array.isArray(response) ? response : []);
    } catch (err) {
      console.log('Error loading ticket types:', err);
      setTicketTypes([]);
    }
  };

  const loadBookingOptions = async () => {
    try {
      const response = await getPaginatedBookingsForCustomerAPI({
        Status: 11,
        PageIndex: 1,
        PageSize: 50,
        SortBy: 'createdAt',
        Descending: true
      });
      
      let bookingsData: any[] = [];
      if (response?.data && Array.isArray(response.data)) {
        bookingsData = response.data;
      }
      
      const options = bookingsData
        .filter(booking => booking.bookingCode && booking.status === 11)
        .map(booking => ({
          id: booking.bookingId?.toString() || booking.id?.toString() || '',
          bookingCode: booking.bookingCode,
          serviceName: booking.decorService?.style || 'Decoration Service',
          createdAt: booking.createdAt,
          status: booking.status
        }));
      
      setBookingOptions(options);
    } catch (err) {
      console.log('Error loading booking options:', err);
      setBookingOptions([]);
    }
  };

  // ==================== FORM FUNCTIONS ====================
  const handleSubmitTicket = async () => {
    if (!subject.trim() || !description.trim() || !selectedTicketType) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare attachment data - convert to proper format expected by API
      const attachmentFiles = images.map(img => ({
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.fileName || `support_image_${Date.now()}.jpg`,
      }));

      // Create ticket data object
      const ticketData: any = {
        subject: subject.trim(),
        description: description.trim(),
        ticketTypeId: selectedTicketType.id,
      };

      // Add optional booking code if selected
      if (selectedBooking?.bookingCode) {
        ticketData.bookingCode = selectedBooking.bookingCode;
      }

      // Add attachments if any
      if (attachmentFiles.length > 0) {
        ticketData.attachments = attachmentFiles;
      }

      const response = await createSupportTicketAPI(ticketData);
      
      if (response?.success) {
        Alert.alert("Success", "Your support ticket has been submitted successfully", [
          {
            text: "OK",
            onPress: () => {
              setShowCreateForm(false);
              clearForm();
              onRefresh();
            }
          }
        ]);
      } else {
        Alert.alert("Error", response?.message || "Failed to submit ticket");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const clearForm = () => {
    setSubject("");
    setDescription("");
    setSelectedTicketType(null);
    setSelectedBooking(null);
    setImages([]);
  };

  // ==================== EVENT HANDLERS ====================
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets(0, true);
  }, []);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchTickets(currentPage + 1);
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    Promise.all([
      fetchTickets(),
      fetchTicketTypes(),
      loadBookingOptions()
    ]);
  }, []);

  // ==================== RENDER FUNCTIONS ====================
  const renderTicketCard = ({ item, index }: { item: any; index: number }) => {
    const ticketId = item?.id || 'unknown';
    const ticketSubject = item?.subject || 'No Subject';
    const ticketDescription = item?.description || 'No description provided';
    const isSolved = item?.isSolved || false;
    const bookingCode = item?.bookingCode || '';
    const createdAt = item?.createAt || item?.createdAt;
    const ticketType = item?.ticketType || 'Other';
    const attachmentUrls = item?.attachmentUrls || [];
    const replies = item?.replies || [];

    return (
      <TouchableOpacity 
        style={[styles.ticketCard, { backgroundColor: colors.card }]}
        onPress={() => navigateToSupportDetail(item)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.ticketHeader}>
          <Text style={[styles.ticketId, { color: colors.textSecondary }]}>
            #{ticketId}
          </Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {getTimeAgo(createdAt)}
          </Text>
        </View>

        {/* Subject */}
        <Text style={[styles.ticketSubject, { color: colors.text }]} numberOfLines={2}>
          {ticketSubject}
        </Text>

        {/* Description */}
        <Text style={[styles.ticketDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {ticketDescription}
        </Text>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.leftSection}>
            {/* Status Badge */}
            <View style={[
              styles.statusBadge,
              isSolved ? styles.statusResolved : styles.statusInProgress
            ]}>
              <View style={[
                styles.statusDot,
                { backgroundColor: isSolved ? '#4CAF50' : '#FF9800' }
              ]} />
              <Text style={[
                styles.statusText,
                { color: isSolved ? '#4CAF50' : '#FF9800' }
              ]}>
                {isSolved ? 'Resolved' : 'In Progress'}
              </Text>
            </View>

            {/* Type Icon */}
            <View style={styles.typeIcon}>
              <Ionicons 
                name={getTicketTypeIcon(ticketType)} 
                size={16} 
                color={colors.textSecondary} 
              />
            </View>
          </View>

          <View style={styles.rightSection}>
            {/* Attachment Indicator */}
            {attachmentUrls.length > 0 && (
              <View style={styles.indicator}>
                <Ionicons name="attach" size={16} color={colors.textSecondary} />
                {attachmentUrls.length > 1 && (
                  <Text style={[styles.indicatorText, { color: colors.textSecondary }]}>
                    {attachmentUrls.length}
                  </Text>
                )}
              </View>
            )}

            {/* Reply Indicator */}
            {replies.length > 0 && (
              <View style={styles.indicator}>
                <Ionicons name="chatbubble-outline" size={16} color="#0A84FF" />
                <Text style={[styles.indicatorText, { color: '#0A84FF' }]}>
                  {replies.length}
                </Text>
              </View>
            )}

            {/* Chevron */}
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={CONFIG.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Support Tickets Yet
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Need help with something? Create your first{'\n'}support ticket and we'll assist you.
      </Text>
      <TouchableOpacity 
        style={styles.createFirstButton}
        onPress={() => setShowCreateForm(true)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createFirstText}>Create Support Ticket</Text>
      </TouchableOpacity>
    </View>
  );

  // ==================== LOADING STATE ====================
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={CONFIG.colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your support tickets...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Support Center
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Get help with your concerns
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateForm(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={CONFIG.colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchTickets(0)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item, index) => item.id?.toString() || `ticket-${index}`}
          renderItem={renderTicketCard}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={tickets.length === 0 ? styles.emptyListContainer : styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[CONFIG.colors.primary]}
              tintColor={CONFIG.colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => 
            hasMore && tickets.length > 0 ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={CONFIG.colors.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* ==================== CREATE TICKET MODAL ==================== */}
      <Modal
        visible={showCreateForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateForm(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowCreateForm(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create Support Ticket
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Form */}
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Subject Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Subject <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    backgroundColor: colors.card, 
                    color: colors.text, 
                    borderColor: colors.border 
                  }
                ]}
                placeholder="Brief description of your issue"
                placeholderTextColor={colors.textSecondary}
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
              />
            </View>

            {/* Issue Type */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Issue Type <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdown, 
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => setShowTicketTypeModal(true)}
              >
                <Text style={[
                  styles.dropdownText, 
                  { color: selectedTicketType ? colors.text : colors.textSecondary }
                ]}>
                  {selectedTicketType ? selectedTicketType.type : "Select issue type"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Booking Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Related Booking
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdown, 
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => setShowBookingModal(true)}
              >
                <Text style={[
                  styles.dropdownText, 
                  { color: selectedBooking ? colors.text : colors.textSecondary }
                ]}>
                  {selectedBooking ? selectedBooking.bookingCode : "Select booking (optional)"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textAreaInput, 
                  { 
                    backgroundColor: colors.card, 
                    color: colors.text, 
                    borderColor: colors.border 
                  }
                ]}
                placeholder="Please provide detailed information about your issue..."
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {description.length}/500
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!subject.trim() || !description.trim() || !selectedTicketType || submitting) && 
                styles.submitButtonDisabled
              ]}
              onPress={handleSubmitTicket}
              disabled={!subject.trim() || !description.trim() || !selectedTicketType || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Ticket</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ==================== TICKET TYPE MODAL ==================== */}
      <Modal
        visible={showTicketTypeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTicketTypeModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTicketTypeModal(false)}
        >
          <View style={[styles.dropdownModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownModalTitle, { color: colors.text }]}>
              Select Issue Type
            </Text>
            <ScrollView style={styles.dropdownScrollView}>
              {ticketTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.dropdownItem,
                    selectedTicketType?.id === type.id && { 
                      backgroundColor: `${CONFIG.colors.primary}15` 
                    }
                  ]}
                  onPress={() => {
                    setSelectedTicketType(type);
                    setShowTicketTypeModal(false);
                  }}
                >
                  <Ionicons 
                    name={getTicketTypeIcon(type.type)} 
                    size={20} 
                    color={selectedTicketType?.id === type.id ? CONFIG.colors.primary : colors.text} 
                  />
                  <Text 
                    style={[
                      styles.dropdownItemText, 
                      { color: colors.text },
                      selectedTicketType?.id === type.id && { 
                        color: CONFIG.colors.primary, 
                        fontWeight: '600' 
                      }
                    ]}
                  >
                    {type.type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ==================== BOOKING MODAL ==================== */}
      <Modal
        visible={showBookingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBookingModal(false)}
        >
          <View style={[styles.dropdownModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownModalTitle, { color: colors.text }]}>
              Select Booking
            </Text>
            <ScrollView style={styles.dropdownScrollView}>
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  !selectedBooking && { backgroundColor: `${CONFIG.colors.primary}15` }
                ]}
                onPress={() => {
                  setSelectedBooking(null);
                  setShowBookingModal(false);
                }}
              >
                <Ionicons 
                  name="remove-circle-outline" 
                  size={20} 
                  color={!selectedBooking ? CONFIG.colors.primary : colors.text} 
                />
                <Text 
                  style={[
                    styles.dropdownItemText, 
                    { color: colors.text },
                    !selectedBooking && { 
                      color: CONFIG.colors.primary, 
                      fontWeight: '600' 
                    }
                  ]}
                >
                  No specific booking
                </Text>
              </TouchableOpacity>
              {bookingOptions.map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={[
                    styles.dropdownItem,
                    selectedBooking?.id === booking.id && { 
                      backgroundColor: `${CONFIG.colors.primary}15` 
                    }
                  ]}
                  onPress={() => {
                    setSelectedBooking(booking);
                    setShowBookingModal(false);
                  }}
                >
                  <Ionicons 
                    name="receipt-outline" 
                    size={20} 
                    color={selectedBooking?.id === booking.id ? CONFIG.colors.primary : colors.text} 
                  />
                  <View style={styles.bookingItemContent}>
                    <Text 
                      style={[
                        styles.dropdownItemText, 
                        { color: colors.text },
                        selectedBooking?.id === booking.id && { 
                          color: CONFIG.colors.primary, 
                          fontWeight: '600' 
                        }
                      ]}
                    >
                      {booking.bookingCode}
                    </Text>
                    <Text style={[styles.bookingServiceName, { color: colors.textSecondary }]}>
                      {booking.serviceName}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // ========== Header Styles ==========
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    opacity: 0.8,
  },
  createButton: {
    backgroundColor: CONFIG.colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: CONFIG.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // ========== Ticket Card Styles ==========
  ticketCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  timeText: {
    fontSize: 12,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  ticketDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  statusResolved: {
    backgroundColor: '#E8F5E9',
  },
  statusInProgress: {
    backgroundColor: '#FFF3E0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  typeIcon: {
    padding: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },

  // ========== Loading & Error Styles ==========
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: CONFIG.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // ========== List Styles ==========
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // ========== Empty State Styles ==========
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${CONFIG.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createFirstButton: {
    backgroundColor: CONFIG.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: CONFIG.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createFirstText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // ========== Modal Styles ==========
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  formContainer: {
    padding: 20,
  },

  // ========== Form Styles ==========
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: CONFIG.colors.error,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1.5,
  },
  textAreaInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1.5,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  submitButton: {
    backgroundColor: CONFIG.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: CONFIG.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },

  // ========== Dropdown Modal Styles ==========
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    maxHeight: '70%',
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  dropdownScrollView: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  dropdownItemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  bookingItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  bookingServiceName: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default SupportScreen;