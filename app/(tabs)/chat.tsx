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
  isImage?: boolean;
  unreadCount?: number;
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
  files?: Array<{fileId?: number, fileName?: string, fileUrl?: string}>;
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

  // Helper function to check if a message has files
  const hasFiles = (message: any): boolean => {
    return message && message.files && Array.isArray(message.files) && message.files.length > 0;
  };

  // Helper function to determine if a message is an image
  const isImageMessage = (message: any): boolean => {
    const isEmpty = !message.message || message.message.trim() === '';
    return Boolean(
      message.isImage || 
      (isEmpty && hasFiles(message)) ||
      (isEmpty && message.lastMessageTime && message.lastMessageTime.trim() !== '')
    );
  };

  // Helper function to sort contacts (unread first, then by time)
  const sortContacts = (contactsToSort: Contact[]): Contact[] => {
    return [...contactsToSort].sort((a, b) => {
      // First priority: Unread messages on top
      const aUnread = a.unreadCount || 0;
      const bUnread = b.unreadCount || 0;
      
      if (aUnread > 0 && bUnread === 0) return -1;
      if (aUnread === 0 && bUnread > 0) return 1;
      
      // Second priority: If both have unread messages, sort by count
      if (aUnread > 0 && bUnread > 0) {
        return bUnread - aUnread; // Higher count first
      }
      
      // Last priority: Sort by message time
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
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
          // Process image flag
          const isImage = isImageMessage(contact);
          
          return {
            ...contact,
            isImage,
            // Ensure contactId is valid
            contactId: contact.contactId || 0,
            // Initialize unread count from API data or default to 0
            unreadCount: contact.unreadCount || 0
          };
        });
        
        // Filter out contacts with invalid IDs
        const validContacts = processedData.filter(contact => 
          contact.contactId !== undefined && contact.contactId !== null
        );
        
        // Sort contacts (unread first, then by time)
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
      console.log("New message received via SignalR:", newMessage);
      
      // Validate incoming message
      if (!newMessage || !newMessage.contactId) {
        console.warn("Received invalid message:", newMessage);
        return;
      }
      
      // Check if message is an image
      const isImage = isImageMessage(newMessage);
      
      // Check if the message is unread (affects sorting)
      const isUnread = newMessage.isRead === false;
      
      setContacts((prevContacts) => {
        // Check if contact already exists
        const existingContactIndex = prevContacts.findIndex(
          c => c.contactId === newMessage.contactId
        );

        if (existingContactIndex !== -1) {
          // Update existing contact
          const updatedContacts = [...prevContacts];
          const existingContact = updatedContacts[existingContactIndex];
          
          const updatedContact: Contact = {
            ...existingContact,
            message: newMessage.message || '',
            lastMessageTime: newMessage.lastMessageTime || newMessage.sentTime || new Date().toISOString(),
            isImage,
            // Increment unread count for new unread messages
            unreadCount: isUnread 
              ? (existingContact.unreadCount || 0) + 1 
              : existingContact.unreadCount || 0
          };
          
          // Remove the contact from its current position
          updatedContacts.splice(existingContactIndex, 1);
          
          // Add the updated contact back to the array
          const newContacts = [updatedContact, ...updatedContacts];
          
          // Re-sort to ensure unread messages are at the top
          return sortContacts(newContacts);
        } else {
          // Add new contact to contacts list
          const newContact: Contact = {
            contactId: newMessage.contactId,
            contactName: newMessage.contactName || `Contact ${newMessage.contactId}`,
            message: newMessage.message || '',
            lastMessageTime: newMessage.lastMessageTime || newMessage.sentTime || new Date().toISOString(),
            avatar: newMessage.avatar || null,
            email: newMessage.email || '',
            isImage,
            // Set initial unread count for new contact
            unreadCount: isUnread ? 1 : 0
          };
          
          // Add the new contact and sort
          return sortContacts([newContact, ...prevContacts]);
        }
      });

      // Scroll to top to show the new message
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
      }
    };

    // Register message handler with SignalR
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
    
    // Reset unread count when navigating to the conversation
    setContacts(prevContacts => {
      return prevContacts.map(c => {
        if (c.contactId === contact.contactId) {
          return { ...c, unreadCount: 0 };
        }
        return c;
      });
    });
    
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

  // Safe render function with validation and unread indicators
  const renderContactItem = useCallback(({ item, index }: { item: Contact, index: number }) => {
    if (!item) {
      console.warn("Null contact item at index", index);
      return null;
    }
    
    if (item.contactId === undefined || item.contactId === null) {
      console.warn("Invalid contact ID at index", index, item);
      return null;
    }
    
    // Check if this contact has unread messages
    const hasUnread = item.unreadCount && item.unreadCount > 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.contactContainer, 
          { backgroundColor: colors.card },
          // Highlight background for unread messages
          hasUnread ? styles.unreadContainer : null
        ]}
        onPress={() => handleConversationClick(item)}
      >
        {/* Contact Avatar with Unread Badge */}
        <View style={styles.avatarContainer}>
          <Image
            source={item.avatar ? { uri: item.avatar } : require("@/assets/images/default-avatar.png")}
            style={styles.avatar}
          />
          {/* Show unread badge with count if there are unread messages */}
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        {/* Message Content */}
        <View style={styles.textContainer}>
          <Text style={[
            styles.contactName, 
            { color: colors.text },
            // Make text bold for unread messages
            hasUnread ? styles.unreadText : null
          ]}>
            {item.contactName || `Contact ${item.contactId}`}
          </Text>
          <Text style={[
            styles.lastMessage, 
            { color: colors.icon },
            hasUnread ? styles.unreadText : null
          ]} numberOfLines={1}>
            {item.isImage ? "Sent a photo" : (item.message || "No messages yet")}
          </Text>
        </View>
        
        {/* Timestamp */}
        <Text style={[
          styles.timeText, 
          { color: colors.icon },
          hasUnread ? styles.unreadText : null
        ]}>
          {item.lastMessageTime || "No time"}
        </Text>
      </TouchableOpacity>
    );
  }, [colors, handleConversationClick]);

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
  unreadContainer: {
    backgroundColor: 'rgba(95, 193, 241, 0.1)', // Light blue highlight for unread
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30', // Red badge for unread
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'white',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
  },
  unreadText: {
    fontWeight: "bold",
    color: "#000000", // Darker color for unread messages
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