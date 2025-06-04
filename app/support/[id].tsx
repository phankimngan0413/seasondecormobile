import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
  Dimensions
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { getPaginatedSupportTicketsAPI, ISupportTicket } from "@/utils/supportAPI";

const { width } = Dimensions.get("window");

interface SupportTicketDetail extends ISupportTicket {
  id: string;
  subject: string;
  description: string;
  bookingCode?: string;
  ticketType: string | null;
  isSolved: boolean;
  createAt: string;
  attachmentUrls?: string[];
  replies?: Array<{
    id: number;
    accountName: string;
    description: string;
    createAt: string;
    attachmentUrls?: string[];
  }>;
}

const SupportDetailScreen = () => {
  const [tickets, setTickets] = useState<SupportTicketDetail[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingCode = params.bookingCode as string;
  const ticketId = params.ticketId as string;
  
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  useEffect(() => {
    if (bookingCode) {
      fetchTicketsByBookingCode();
    } else {
      setError("No booking code provided");
      setLoading(false);
    }
  }, [bookingCode]);

  useEffect(() => {
    if (tickets.length > 0) {
      if (ticketId) {
        const foundTicket = tickets.find(t => t.id === ticketId);
        setSelectedTicket(foundTicket || tickets[0]);
      } else {
        setSelectedTicket(tickets[0]);
      }
    }
  }, [tickets, ticketId]);

  const fetchTicketsByBookingCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getPaginatedSupportTicketsAPI({
        bookingCode: bookingCode,
        pageIndex: 0,
        pageSize: 50,
        sortBy: 'createAt',
        descending: true
      });
      
      if (result.data && result.data.length > 0) {
        // Type assertion với proper mapping
        const mappedTickets = result.data.map((ticket: any) => ({
          id: ticket.id?.toString() || '',
          subject: ticket.subject || '',
          description: ticket.description || '',
          bookingCode: ticket.bookingCode,
          ticketType: ticket.ticketType,
          isSolved: ticket.isSolved || false,
          createAt: ticket.createAt || ticket.createdAt || '',
          attachmentUrls: ticket.attachmentUrls || [],
          replies: ticket.replies || []
        })) as SupportTicketDetail[];
        
        setTickets(mappedTickets);
      } else {
        setError("No support tickets found for this booking");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isSolved: boolean) => {
    return isSolved ? '#52c41a' : '#faad14';
  };

  const getStatusText = (isSolved: boolean) => {
    return isSolved ? 'Resolved' : 'In Progress';
  };

  const getTicketTypeIcon = (type: string | null) => {
    if (!type) return 'help-circle-outline';
    
    switch (type.toLowerCase()) {
      case 'service delay':
        return 'time-outline';
      case 'incorrect service implementation':
        return 'alert-circle-outline';
      case 'unprofessional behavior':
        return 'person-remove-outline';
      case 'damage or loss report':
        return 'warning-outline';
      case 'poor material quality':
        return 'construct-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const openAttachment = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open attachment');
    });
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleCreateNewTicket = () => {
    router.push(`/support/create?bookingCode=${bookingCode}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
        
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Support Tickets</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5fc1f1" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading support tickets...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || tickets.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
        
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Support Tickets</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="chatbubble-outline" size={64} color="#9ca3af" />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error || "No support tickets found"}
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            Booking: {bookingCode}
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateNewTicket}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Support Ticket</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
      
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Support Tickets</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {bookingCode} • {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tickets List */}
        <View style={[styles.ticketsListContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>All Tickets</Text>
          <View style={styles.ticketsList}>
            {tickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={[
                  styles.ticketListItem,
                  { 
                    backgroundColor: selectedTicket?.id === ticket.id ? '#5fc1f115' : 'transparent',
                    borderColor: selectedTicket?.id === ticket.id ? '#5fc1f1' : colors.border
                  }
                ]}
                onPress={() => setSelectedTicket(ticket)}
                activeOpacity={0.7}
              >
                <View style={styles.ticketListHeader}>
                  <Text style={[styles.ticketListSubject, { color: colors.text }]} numberOfLines={1}>
                    {ticket.subject}
                  </Text>
                  <View style={[
                    styles.ticketListStatus, 
                    { backgroundColor: getStatusColor(ticket.isSolved) }
                  ]} />
                </View>
                <Text style={[styles.ticketListDate, { color: colors.textSecondary }]}>
                  #{ticket.id} • {formatDate(ticket.createAt)}
                </Text>
                <Text style={[styles.ticketListDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {ticket.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Ticket Detail */}
        {selectedTicket && (
          <>
            {/* Status Banner */}
            <View style={[
              styles.statusBanner, 
              { 
                backgroundColor: colors.card,
                borderLeftColor: getStatusColor(selectedTicket.isSolved)
              }
            ]}>
              <View style={styles.statusContent}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedTicket.isSolved) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(selectedTicket.isSolved) }]}>
                  {getStatusText(selectedTicket.isSolved)}
                </Text>
              </View>
              <Text style={[styles.statusDate, { color: colors.textSecondary }]}>
                Created {formatDate(selectedTicket.createAt)}
              </Text>
            </View>

            {/* Main Content */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.subject, { color: colors.text }]}>
                {selectedTicket.subject}
              </Text>

              {selectedTicket.ticketType && (
                <View style={styles.typeTag}>
                  <Ionicons 
                    name={getTicketTypeIcon(selectedTicket.ticketType)} 
                    size={14} 
                    color="#5fc1f1" 
                  />
                  <Text style={styles.typeText}>
                    {selectedTicket.ticketType}
                  </Text>
                </View>
              )}

              <View style={styles.descriptionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                <Text style={[styles.description, { color: colors.text }]}>
                  {selectedTicket.description}
                </Text>
              </View>

              {/* Attachments */}
              {selectedTicket.attachmentUrls && selectedTicket.attachmentUrls.length > 0 && (
                <View style={styles.attachmentsContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Attachments</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {selectedTicket.attachmentUrls.length}
                      </Text>
                    </View>
                  </View>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.attachmentsList}
                  >
                    {selectedTicket.attachmentUrls.map((url, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.attachmentItem}
                        onPress={() => openAttachment(url)}
                        activeOpacity={0.8}
                      >
                        <Image 
                          source={{ uri: url }}
                          style={styles.attachmentImage}
                          resizeMode="cover"
                        />
                        <View style={styles.attachmentOverlay}>
                          <Ionicons name="eye-outline" size={20} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Replies Section */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Conversation
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {selectedTicket.replies?.length || 0}
                  </Text>
                </View>
              </View>
              
              {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                <View style={styles.repliesContainer}>
                  {selectedTicket.replies.map((reply, index) => (
                    <View key={reply.id} style={[
                      styles.replyItem,
                      index < selectedTicket.replies!.length - 1 && { borderBottomColor: colors.border }
                    ]}>
                      <View style={styles.replyHeader}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {reply.accountName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.replyMeta}>
                          <Text style={[styles.replyAuthor, { color: colors.text }]}>
                            {reply.accountName}
                          </Text>
                          <Text style={[styles.replyDate, { color: colors.textSecondary }]}>
                            {formatDate(reply.createAt)}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.replyContent, { color: colors.text }]}>
                        {reply.description}
                      </Text>

                      {reply.attachmentUrls && reply.attachmentUrls.length > 0 && (
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.replyAttachments}
                        >
                          {reply.attachmentUrls.map((url, attachIndex) => (
                            <TouchableOpacity
                              key={attachIndex}
                              style={styles.replyAttachmentItem}
                              onPress={() => openAttachment(url)}
                              activeOpacity={0.8}
                            >
                              <Image 
                                source={{ uri: url }}
                                style={styles.replyAttachmentImage}
                                resizeMode="cover"
                              />
                              <View style={styles.replyAttachmentOverlay}>
                                <Ionicons name="eye-outline" size={16} color="#fff" />
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noRepliesContainer}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="chatbubble-outline" size={32} color="#9ca3af" />
                  </View>
                  <Text style={[styles.noRepliesText, { color: colors.textSecondary }]}>
                    No replies yet
                  </Text>
                  <Text style={[styles.noRepliesSubtext, { color: colors.textSecondary }]}>
                    Our support team will respond soon
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#5fc1f115',
    borderRadius: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  ticketsListContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketsList: {
    gap: 8,
  },
  ticketListItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#f9fafb',
  },
  ticketListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ticketListSubject: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  ticketListStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ticketListDate: {
    fontSize: 11,
    marginBottom: 4,
  },
  ticketListDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: '500',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5fc1f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  statusBanner: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDate: {
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subject: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    marginBottom: 16,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5fc1f115',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    color: '#5fc1f1',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  attachmentsContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  attachmentsList: {
    paddingRight: 16,
  },
  attachmentItem: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  attachmentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repliesContainer: {
    gap: 24,
  },
  replyItem: {
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5fc1f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  replyMeta: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyDate: {
    fontSize: 12,
  },
  replyContent: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  replyAttachments: {
    marginTop: 12,
  },
  replyAttachmentItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    position: 'relative',
  },
  replyAttachmentImage: {
    width: '100%',
    height: '100%',
  },
  replyAttachmentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noRepliesContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noRepliesText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  noRepliesSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SupportDetailScreen;