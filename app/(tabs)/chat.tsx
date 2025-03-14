import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getChatListAPI } from "@/utils/chatAPI"; // Assuming you have this API utility function

export default function ChatScreen() {
  const [searchText, setSearchText] = useState(""); // For search filter
  const [conversations, setConversations] = useState<any[]>([]); // Store the conversations data

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getChatListAPI();
        console.log("Fetched Conversations:", data); // Check what the API returns
        // Make sure the response is an array and is valid
        if (Array.isArray(data) && data.length > 0) {
          setConversations(data); // Update state with fetched conversations
        } else {
          console.error("Received invalid data", data);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error); // Catch and log any errors
      }
    };

    fetchConversations();
  }, []);

  // Filter conversations based on search text
  const filteredConversations = conversations.filter((conversation) =>
    conversation.senderName.toLowerCase().includes(searchText.toLowerCase()) ||
    conversation.receiverName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.conversationContainer}>
            <Image source={{ uri: "https://placekitten.com/100/100" }} style={styles.avatar} />
            <View style={styles.textContainer}>
              <Text style={styles.conversationName}>
                {item.senderName} to {item.receiverName}
              </Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.message}
              </Text>
            </View>
            {item.isRead === false && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>New</Text>
              </View>
            )}
            <Text style={styles.timeText}>{new Date(item.sentTime).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        style={styles.conversationsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  searchContainer: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginTop: 10,
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 5,
  },
  conversationsList: {
    flex: 1,
  },
  conversationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
  },
  unreadBadge: {
    backgroundColor: "#e74c3c",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  timeText: {
    fontSize: 12,
    color: "#999",
  },
});
