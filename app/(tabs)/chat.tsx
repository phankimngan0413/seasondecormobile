import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Image,
  ActivityIndicator
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { getContactsAPI } from "@/utils/contactAPI";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { signalRService } from "@/services/SignalRService";

// Define proper interface for consistency
interface Contact {
  contactId: number;
  contactName: string;
  message?: string;
  avatar?: string | null;
  lastMessageTime?: string;
  email?: string;
  isImage?: boolean; // Explicitly defined as boolean
  sortPriority?: number; // Added for custom sorting
}

interface Message {
  id?: number | string;
  contactId: number;
  contactName: string;
  message?: string;
  avatar?: string | null;
  lastMessageTime?: string;
  email?: string;
  isImage?: boolean;
  senderId?: number;
  receiverId?: number;
  sentTime?: string;
  files?: Array<{fileUrl?: string}>;
  isRead?: boolean;
}

export default function ChatListScreen() {
  const [searchText, setSearchText] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  const flatListRef = useRef<FlatList>(null);

  // Helper function to parse date strings safely
  const parseDate = (dateStr: string | undefined) => {
    if (!dateStr) return 0;
    
    try {
      // Try regular date parsing
      const timestamp = new Date(dateStr).getTime();
      
      // Check if the timestamp is valid
      if (!isNaN(timestamp)) {
        return timestamp;
      }
      
      // Custom format like "07/04/25"
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/').map(part => parseInt(part, 10));
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year > 2000 ? year : 2000 + year, month - 1, day).getTime();
        }
      }
      
      return 0;
    } catch (error) {
      console.error("Error parsing date:", error, dateStr);
      return 0;
    }
  };

  // Enhanced custom sort function for contacts
  const sortContacts = (contacts: Contact[]) => {
    return [...contacts].sort((a, b) => {
      // First priority: empty messages or "Contacts retrieved successfully" go to the top
      const aIsEmpty = !a.message || a.message.trim() === '' || a.message === "Contacts retrieved successfully";
      const bIsEmpty = !b.message || b.message.trim() === '' || b.message === "Contacts retrieved successfully";
      
      if (aIsEmpty && !bIsEmpty) return -1;
      if (!aIsEmpty && bIsEmpty) return 1;
      
      // Second priority: sort by last message time
      const aTime = parseDate(a.lastMessageTime);
      const bTime = parseDate(b.lastMessageTime);
      
      if (aTime && bTime) {
        return bTime - aTime; // More recent messages first
      }
      
      // If times are equal or invalid, use sort priority
      const aPriority = a.sortPriority || 0;
      const bPriority = b.sortPriority || 0;
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // Last resort: sort by name
      return (a.contactName || '').localeCompare(b.contactName || '');
    });
  };

  // Fetching contact data from the API
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await getContactsAPI();
      console.log("Fetched Contacts:", data);
      if (Array.isArray(data) && data.length > 0) {
        // Process data to mark messages as images or text
        const processedData = data.map(contact => {
          // Consider it an image message if message is empty but timestamp exists
          const isImage = Boolean(
            (!contact.message || contact.message.trim() === '') && 
            contact.lastMessageTime && contact.lastMessageTime.trim() !== ''
          );
          
          // Assign sort priority: empty messages or "Contacts retrieved successfully" get highest priority
          const sortPriority = (!contact.message || 
                              contact.message.trim() === '' || 
                              contact.message === "Contacts retrieved successfully") ? 10 : 0;
                         
          return {
            ...contact,
            isImage,
            sortPriority,
            // Ensure contactId is valid
            contactId: contact.contactId || 0
          };
        });
        
        // Filter out contacts with invalid IDs
        const validContacts = processedData.filter(contact => 
          contact.contactId !== undefined && contact.contactId !== null
        );
        
        // Sort data with our custom sorter
        const sortedData = sortContacts(validContacts);
        setContacts(sortedData);
      } else {
        console.log("No contacts found or empty data");
        setContacts([]);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("Chat screen focused - reloading data");
      fetchContacts();
      
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  // Initial setup and SignalR listener
  useEffect(() => {
    // Listen for new messages via SignalR
    const handleNewMessage = (newMessage: Message) => {
      console.log("New message received:", newMessage);
      
      // Validate incoming message
      if (!newMessage || !newMessage.contactId) {
        console.warn("Received invalid message:", newMessage);
        return;
      }
      
      // Check if message is an image
      const isImage = Boolean(
        (!newMessage.message || newMessage.message.trim() === '') && 
        (newMessage.lastMessageTime || newMessage.sentTime)
      );
      
      // Calculate sort priority
      const sortPriority = (!newMessage.message || 
                           newMessage.message.trim() === '' || 
                           newMessage.message === "Contacts retrieved successfully") ? 10 : 0;
      
      setContacts((prevContacts) => {
        // Check if contact already exists
        const existingContactIndex = prevContacts.findIndex(
          c => c.contactId === newMessage.contactId
        );

        let updatedContacts;
        
        if (existingContactIndex !== -1) {
          // Update existing contact with new data
          updatedContacts = [...prevContacts];
          updatedContacts[existingContactIndex] = {
            ...updatedContacts[existingContactIndex],
            message: newMessage.message || '',
            lastMessageTime: newMessage.lastMessageTime || newMessage.sentTime || new Date().toISOString(),
            isImage,
            sortPriority
          };
        } else {
          // Add new contact with all required data
          updatedContacts = [
            ...prevContacts,
            {
              contactId: newMessage.contactId,
              contactName: newMessage.contactName || `Contact ${newMessage.contactId}`,
              message: newMessage.message || '',
              lastMessageTime: newMessage.lastMessageTime || newMessage.sentTime || new Date().toISOString(),
              avatar: newMessage.avatar || null,
              email: newMessage.email || '',
              isImage,
              sortPriority
            }
          ];
        }
        
        // Re-sort the contacts with our custom sorter
        return sortContacts(updatedContacts);
      });

      // Scroll to top to show the new message
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
      }
    };

    signalRService.onMessageReceived(handleNewMessage);

    // Cleanup function
    return () => {
      signalRService.offMessageReceived(handleNewMessage);
    };
  }, []);

  // Handle navigation to the chat page of a selected contact
  const handleConversationClick = useCallback((contact: Contact) => {
    if (!contact || contact.contactId === undefined || contact.contactId === null) {
      console.warn("Attempted to navigate to invalid contact:", contact);
      return;
    }
    
    // Navigate to the chat page with contact information
    router.push({
      pathname: `/chat/[userId]`,
      params: { 
        userId: String(contact.contactId),
        contactName: contact.contactName || `Contact ${contact.contactId}`,
        contactEmail: contact.email || ''
      }
    });
  }, [router]);

  // Navigate to providers screen
  const navigateToProviders = useCallback(() => {
    router.push("/provider");
  }, [router]);

  // Filter contacts based on contactName and search text
  const filteredContacts = useMemo(() => {
    if (!searchText) return contacts;
    
    return contacts.filter((contact) =>
      contact.contactName && 
      contact.contactName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [contacts, searchText]);

  // Enhanced key extractor that won't fail
  const keyExtractor = useCallback((item: Contact, index: number) => {
    if (!item) return `contact-${index}-${Date.now()}`;
    if (item.contactId === undefined || item.contactId === null) return `contact-${index}-${Date.now()}`;
    try {
      return String(item.contactId);
    } catch (error) {
      console.error("Error in keyExtractor:", error);
      return `contact-${index}-${Date.now()}`;
    }
  }, []);

  // Format the time display
  const formatTimeDisplay = useCallback((timeString?: string) => {
    if (!timeString) return "No time";
    
    // If already in DD/MM/YY format, return as is
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(timeString)) {
      return timeString;
    }
    
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
      
      const now = new Date();
      const isToday = date.getDate() === now.getDate() && 
                     date.getMonth() === now.getMonth() && 
                     date.getFullYear() === now.getFullYear();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
      }
    } catch (error) {
      return timeString;
    }
  }, []);

  // Safe render function with validation
  const renderContactItem = useCallback(({ item, index }: { item: Contact, index: number }) => {
    if (!item) {
      console.warn("Null contact item at index", index);
      return null;
    }
    
    if (item.contactId === undefined || item.contactId === null) {
      console.warn("Invalid contact ID at index", index, item);
      return null;
    }
    
    // Determine message display text
    let messageDisplay = "No messages yet";
    if (item.isImage) {
      messageDisplay = "Sent a photo";
    } else if (item.message === "Contacts retrieved successfully") {
      messageDisplay = "New contact"; // Replace API message with user-friendly text
    } else if (item.message) {
      messageDisplay = item.message;
    }
    
    return (
      <TouchableOpacity
        style={[styles.contactContainer, { backgroundColor: colors.card }]}
        onPress={() => handleConversationClick(item)}
      >
        {/* Contact Avatar */}
        <Image
          source={item.avatar ? { uri: item.avatar } : require("@/assets/images/default-avatar.png")}
          style={styles.avatar}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.contactName, { color: colors.text }]}>
            {item.contactName || `Contact ${item.contactId}`}
          </Text>
          <Text style={[styles.lastMessage, { color: colors.icon }]} numberOfLines={1}>
            {messageDisplay}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: colors.icon }]}>
          {formatTimeDisplay(item.lastMessageTime)}
        </Text>
      </TouchableOpacity>
    );
  }, [colors, handleConversationClick, formatTimeDisplay]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Search by Receiver Name"
          placeholderTextColor={colors.inputPlaceholder}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#5fc1f1" />
          <Text style={[styles.messageText, { color: colors.text }]}>Loading conversations...</Text>
        </View>
      ) : filteredContacts.length === 0 && searchText !== "" ? (
        <View style={styles.centerContent}>
          <Text style={[styles.messageText, { color: colors.text }]}>No contacts found</Text>
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={[styles.messageText, { color: colors.text }]}>
            You don't have any conversations yet
          </Text>
          <Text style={[styles.subMessageText, { color: colors.textSecondary || "#999" }]}>
            Start a conversation by finding a provider
          </Text>
          <TouchableOpacity 
            style={[styles.providerButton, { backgroundColor: "#5fc1f1" }]}
            onPress={navigateToProviders}
          >
            <Text style={styles.providerButtonText}>Browse Providers</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredContacts}
          keyExtractor={keyExtractor}
          renderItem={renderContactItem}
          style={styles.contactsList}
          // Handle empty data gracefully
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Text style={[styles.messageText, { color: colors.text }]}>No conversations found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  searchContainer: {
    marginBottom: 15,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  contactsList: {
    flex: 1,
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    justifyContent: "space-between",
    marginBottom: 10,
    borderRadius: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 3,
  },
  timeText: {
    fontSize: 12,
    paddingLeft: 10,
    alignSelf: "flex-end",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messageText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  subMessageText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  providerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 10,
  },
  providerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  }
});