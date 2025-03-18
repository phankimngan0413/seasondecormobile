import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signalRService } from "@/services/SignalRService";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
import { getUserIdFromToken } from "@/services/auth";
import { useRouter } from "expo-router";
import { useSearchParams } from "expo-router/build/hooks";
import { launchImageLibrary } from 'react-native-image-picker';
import { Ionicons } from "@expo/vector-icons";
import { getChatHistoryAPI } from "@/utils/chatAPI";

export default function ChatScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const receiverId = searchParams.get("userId");

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem("user_token");
    if (!token) {
      console.error("No token found, redirecting to login...");
      router.push("/login");
    }
  };

  const fetchChatHistory = async (userId: number) => {
    try {
      const history = await getChatHistoryAPI(userId);
      if (history.length > 0) {
        setChatHistory(history);
      } else {
        setError("Please start the conversation.");
      }
    } catch (error) {
      setError("Error fetching chat history.");
    }
  };
  const handleSendMessage = async () => {
    if (message.trim() === "" && !selectedImage) {
      console.error("Message or image is required.");
      return;
    }
  
    const senderId = await getUserIdFromToken();
    const receiverId = Number(searchParams.get("userId"));
  
    console.log(`Sender ID: ${senderId}, Receiver ID: ${receiverId}`);
  
    if (senderId === receiverId) {
      console.error("You cannot send a message to yourself.");
      return;
    }
  
    try {
      let fileData = [];
  
      // If an image is selected, convert it to base64
      if (selectedImage) {
        console.log("Selected image:", selectedImage);  // Log the selected image data
  
        // Convert image to Base64
        const base64 = await fetch(selectedImage.uri)
          .then((response) => response.blob())
          .then((blob) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          }));
  
        // If base64 conversion is successful, push it to fileData
        if (base64) {
          fileData.push({
            FileName: selectedImage.fileName,
            Base64Content: base64,
            ContentType: selectedImage.type,
          });
        } else {
          console.error("Base64 conversion failed for the image.");
        }
      }
  
      // Log message and file data
      console.log("Message to send:", message);
      console.log("File data to send:", fileData);
  
      // Check that fileData or message are valid
      if (!message.trim() && fileData.length === 0) {
        console.error("No valid message or file to send.");
        return;
      }
  
      // Send the message with file data if valid
      await signalRService.sendMessage(receiverId, message, fileData);
  
      setMessage(""); // Clear the message input
      setSelectedImage(null); // Clear the selected image
      setChatHistory((prev) => [
        ...prev,
        { id: Date.now().toString(), senderId, receiverId, message, sentTime: new Date() },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorCode) {
        console.error("ImagePicker Error: ", response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  useEffect(() => {
    signalRService.onMessageReceived((newMessage: any) => {
      setChatHistory((prev) => [...prev, newMessage]);
    });
  }, []);

  useEffect(() => {
    checkLogin();
    if (receiverId) {
      fetchChatHistory(Number(receiverId));
    }
  }, [receiverId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.chatHeader}>
        <Text style={[styles.senderName, { color: colors.text }]}>
          Chatting with User {receiverId}
        </Text>
        <Text style={[styles.greeting, { color: colors.text }]}>Start the conversation below:</Text>
      </View>

      <FlatList
        data={chatHistory}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.senderId === Number(receiverId) ? styles.messageReceiver : styles.messageSender,
            ]}
          >
            <Text style={[styles.messageText, { color: colors.text }]}>{item.message}</Text>
            <Text style={[styles.messageTime, { color: colors.icon }]}>
              {new Date(item.sentTime).toLocaleTimeString()}
            </Text>
          </View>
        )}
        style={styles.chatList}
      />

      {selectedImage && (
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImage} style={[styles.iconButton]}>
          <Ionicons name="image-outline" size={24} color={colors.icon} />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.inputPlaceholder}
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity onPress={handleSendMessage} style={[styles.iconButton]}>
          <Ionicons name="paper-plane-outline" size={24} color={colors.icon} />
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
    paddingBottom: 10,
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
    backgroundColor: "#9c8181",
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
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 20,
    fontSize: 16,
  },
  iconButton: {
    padding: 10,
    borderRadius: 20,
  },
  selectedImageContainer: {
    marginVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
});
