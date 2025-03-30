import React, { useState, useEffect, useRef } from "react";
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
import { useRouter, useFocusEffect } from "expo-router"; // Added useFocusEffect
import { getContactsAPI } from "@/utils/contactAPI"; // API to fetch contacts
import { useTheme } from "@/constants/ThemeContext"; // Importing the theme context
import { Colors } from "@/constants/Colors"; // Import colors for themes
import { signalRService } from "@/services/SignalRService"; // Assuming SignalRService is already set up

export default function ChatScreen() {
  const [searchText, setSearchText] = useState(""); // For search filter
  const [contacts, setContacts] = useState<any[]>([]); // Store contacts data
  const [loading, setLoading] = useState(true); // Loading state
  const router = useRouter(); // Initialize the router for navigation
  const { theme } = useTheme(); // Access current theme
  const validTheme = theme as "light" | "dark"; // Ensure theme is either light or dark
  const colors = Colors[validTheme]; // Use colors based on the current theme

  const flatListRef = useRef<FlatList>(null); // Reference to FlatList for scrolling

  interface Message {
    contactId: number;
    contactName: string;
    message: string;
    avatar: string | null;
    lastMessageTime: string;
  }

  // Fetching contact data from the API
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await getContactsAPI();
      console.log("Fetched Contacts:", data);
      if (Array.isArray(data) && data.length > 0) {
        // Sort by most recent messages if possible
        const sortedData = [...data].sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });
        setContacts(sortedData); // Update state with fetched contacts
      } else {
        console.log("No contacts found or empty data");
        setContacts([]);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error); // Log any errors
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
      
      setContacts((prevContacts) => {
        // Check if contact already exists
        const existingContactIndex = prevContacts.findIndex(
          c => c.contactId === newMessage.contactId
        );

        if (existingContactIndex !== -1) {
          // Update existing contact and move to top
          const updatedContacts = [...prevContacts];
          updatedContacts[existingContactIndex] = {
            ...updatedContacts[existingContactIndex],
            message: newMessage.message,
            lastMessageTime: newMessage.lastMessageTime
          };
          
          // Remove and add to beginning
          const updatedContact = updatedContacts.splice(existingContactIndex, 1)[0];
          return [updatedContact, ...updatedContacts];
        } else {
          // Add new contact to beginning
          return [newMessage, ...prevContacts];
        }
      });

      // Scroll to top to show the new message
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
      }
    };

    signalRService.onMessageReceived(handleNewMessage);

    // Cleanup function
    return () => {
      // Remove the SignalR listener if needed
    };
  }, []);

  // Handle navigation to the chat page of a selected contact
  const handleConversationClick = (contactId: number) => {
    // Navigate to the chat page with receiverId (contactId) as query parameter
    router.push({
      pathname: `/chat/[userId]`, // Use the correct dynamic path
      params: { userId: contactId.toString() }, // Pass the contactId (receiverId) to the chat page
    });
  };

  // Navigate to providers screen
  const navigateToProviders = () => {
    router.push("/provider");
  };

  // Filter contacts based on contactName and search text
  const filteredContacts = searchText
    ? contacts.filter((contact) =>
        contact.contactName && contact.contactName.toLowerCase().includes(searchText.toLowerCase())
      )
    : contacts; // If no search text, return all contacts

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]} // Set text color based on theme
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
          ref={flatListRef} // Reference to FlatList for programmatic scrolling
          data={filteredContacts}
          keyExtractor={(item) => item.contactId.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.contactContainer, { backgroundColor: colors.card }]} // Set card color to the theme background color
              onPress={() => handleConversationClick(item.contactId)} // Navigate to chat when clicked
            >
              {/* Contact Avatar */}
              <Image
                source={item.avatar ? { uri: item.avatar } : require("@/assets/images/default-avatar.png")}
                style={styles.avatar}
              />
              <View style={styles.textContainer}>
                <Text style={[styles.contactName, { color: colors.text }]}>{item.contactName}</Text>
                <Text style={[styles.lastMessage, { color: colors.icon }]} numberOfLines={1}>
                  {item.message || "No messages yet"}
                </Text>
              </View>
              <Text style={[styles.timeText, { color: colors.icon }]}>{item.lastMessageTime || "No time"}</Text>
            </TouchableOpacity>
          )}
          style={styles.contactsList}
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
    borderRadius: 25, // Make the avatar circular
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