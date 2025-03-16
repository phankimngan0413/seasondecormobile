import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from "react-native";
import { SearchParams } from "expo-router"; 
import { getChatHistoryAPI } from "@/utils/chatAPI"; 
import { useTheme } from "@/constants/ThemeContext"; 
import { Colors } from "@/constants/Colors"; 
import { useSearchParams } from "expo-router/build/hooks";

export default function ChatScreen() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [senderName, setSenderName] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Access current theme
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark"; 
  const colors = Colors[validTheme]; 

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (userId) {
        try {
          console.log(`🔍 Fetching chat history for userId: ${userId}`);
          const history = await getChatHistoryAPI(Number(userId));
          console.log("🟢 Chat History:", history);

          if (history.length === 0) {
            setError("Please start the conversation.");
          } else {
            setChatHistory(history);
            setSenderName(history[0].senderName as unknown as string);
          }
        } catch (error) {
          console.error("🔴 Error fetching chat history:", error);
          setError("Welcome to the chat! Feel free to start the conversation.");
        }
      }
    };

    if (userId) {
      fetchChatHistory();
    }
  }, [userId]);

  const handleSendMessage = () => {
    if (message.trim() === "") return;
    const newMessage = {
      id: Date.now(), 
      message,
      senderId: 1,
      receiverId: 2,
      sentTime: new Date(),
    };
    setChatHistory(prev => [...prev, newMessage]);
    setMessage("");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.chatHeader}>
        {senderName && <Text style={[styles.senderName, { color: colors.text }]}>Chatting with {senderName}</Text>}
        <Text style={[styles.greeting, { color: colors.text }]}>
          Welcome to the chat! Feel free to start the conversation.
        </Text>
      </View>

      <FlatList
        data={chatHistory}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.senderId === 1 ? styles.messageSender : styles.messageReceiver,
            ]}
          >
            <Text style={[styles.messageText, { color: colors.text }]}>{item.message}</Text>
            <Text style={[styles.messageTime, { color: colors.text }]}>
              {new Date(item.sentTime).toLocaleTimeString()}
            </Text>
          </View>
        )}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.inputPlaceholder}
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity onPress={handleSendMessage} style={[styles.sendButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  chatHeader: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    alignItems: "center",
  },
  senderName: {
    fontSize: 20,
    marginBottom: 5,
    fontWeight: "bold",
  },
  greeting: {
    fontSize: 16,
    textAlign: "center",
  },
  chatList: {
    flex: 1,
    marginBottom: 20,
  },
  chatContent: {
    paddingBottom: 20,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: "80%",
  },
  messageSender: {
    backgroundColor: "#007bff",
    alignSelf: "flex-end",
  },
  messageReceiver: {
    backgroundColor: "#8a5555",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
