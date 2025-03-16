import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router"; // Importing useRouter for navigation
import { getContactsAPI } from "@/utils/contactAPI"; // API to fetch contacts
import { useTheme } from "@/constants/ThemeContext"; // Importing the theme context
import { Colors } from "@/constants/Colors"; // Import colors for themes

export default function ChatScreen() {
  const [searchText, setSearchText] = useState(""); // For search filter
  const [contacts, setContacts] = useState<any[]>([]); // Store contacts data
  const router = useRouter(); // Initialize the router for navigation

  // Access current theme
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark"; // Ensure theme is either light or dark
  const colors = Colors[validTheme]; // Use colors based on the current theme

  // Fetching contact data from the API
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const data = await getContactsAPI();
        console.log("Fetched Contacts:", data);
        if (Array.isArray(data) && data.length > 0) {
          setContacts(data); // Update state with fetched contacts
        } else {
          console.error("Received invalid data", data);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error); // Log any errors
      }
    };

    fetchContacts();
  }, []);

  // Handle navigation to the chat page of a selected contact
  const handleConversationClick = (contactId: number) => {
    // Navigate to the chat page with receiverId (contactId) as query parameter
    router.push({
      pathname: `/chat/[userId]`, // Use the correct dynamic path
      params: { userId: contactId.toString() }, // Pass the contactId (receiverId) to the chat page
    });
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

      {/* Contacts List */}
      <FlatList
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
    color: "#666",
  },
  timeText: {
    fontSize: 12,
    color: "#999",
    paddingLeft: 10,
    alignSelf: "flex-end",
  },
});
