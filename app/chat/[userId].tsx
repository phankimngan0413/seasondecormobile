import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Keyboard,
  Dimensions,
  StatusBar
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signalRService } from "@/services/SignalRService";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
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
  const { theme, toggleTheme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: screenHeight } = Dimensions.get("window");
  const statusBarHeight = StatusBar.currentHeight || 0;
  const mainInputRef = useRef<TextInput>(null);

  // Get receiverId and name from params
  const receiverId = searchParams.get("userId");
  const [receiverName, setReceiverName] = useState<string>(searchParams.get("contactName") || `User ${receiverId}`);
  const [receiverEmail, setReceiverEmail] = useState<string>(searchParams.get("contactEmail") || "");

  // Keyboard listeners with height tracking
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        // Lưu chiều cao bàn phím
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Image to Base64 conversion
  const getBase64FromUri = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data.split(',')[1] || '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Failed to convert image to base64", error);
      throw error;
    }
  };

  // Fetch Chat History
  const fetchChatHistory = async (userId: number) => {
    setLoading(true);
    try {
      const history = await getChatHistoryAPI(userId);
      
      if (history && history.length > 0) {
        setChatHistory(history);
        setError(null);
        // Scroll to bottom after loading
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } else {
        setChatHistory([]);
        // Thông báo thân thiện khi không có tin nhắn
        setError("Start a conversation with this contact!");
      }
    } catch (error) {
      console.error("Error in chat history logic:", error);
      setChatHistory([]);
      // Thông báo thân thiện khi gặp lỗi
      setError("Send a message to start the conversation!");
    } finally {
      setLoading(false);
    }
  };

  // Send Message Handler
  const handleSendMessage = async () => {
    if (message.trim() === "" && !selectedImage) {
      return;
    }

    setSendingMessage(true);
    
    try {
      // Prepare file data if image is selected
      let fileData: any[] = [];
      if (selectedImage && selectedImage.uri) {
        try {
          const base64Content = await getBase64FromUri(selectedImage.uri);
          
          fileData.push({
            FileName: selectedImage.fileName || `image_${Date.now()}.jpg`,
            Base64Content: base64Content,
            ContentType: selectedImage.type || 'image/jpeg',
          });
        } catch (imageError) {
          console.error("Error processing image:", imageError);
        }
      }

      // Create a temporary message to show immediately
      const tempMessage = {
        id: Date.now().toString(),
        senderId: 0, // Assume 0 is not the receiverId to mark as current user
        receiverId: Number(receiverId),
        message: message.trim(),
        sentTime: new Date().toISOString(),
        files: selectedImage ? [{
          fileUrl: selectedImage.uri,
          fileName: selectedImage.fileName || `image_${Date.now()}.jpg`,
        }] : []
      };
      
      // Add temporary message to chat history
      setChatHistory(prev => [...prev, tempMessage]);
      
      // Clear input and selected image before sending
      setMessage("");
      setSelectedImage(null);
      
      // Scroll to bottom immediately after adding message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);

      // Send message via SignalR
      await signalRService.sendMessage(
        Number(receiverId),
        tempMessage.message,
        fileData,
        (progress: number) => {
          console.log(`Message send progress: ${progress}%`);
        }
      );

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Image Picker
  const pickImage = async () => {
    try {
      // Blur input focus to fix keyboard issues
      if (mainInputRef.current) {
        mainInputRef.current.blur();
      }
      
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        maxHeight: 1200,
        maxWidth: 1200,
        quality: 0.8,
      });
      
      if (result.didCancel) {
        console.log("User cancelled image picker");
      } else if (result.errorCode) {
        console.error("ImagePicker Error: ", result.errorMessage);
      } else if (result.assets && result.assets.length > 0) {
        console.log("Image selected successfully");
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  // Handle Remove Selected Image
  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  // Scroll to bottom after receiving new message or when chat history changes
  useEffect(() => {
    // Auto scroll to bottom when chat history changes or loading completes
    if (chatHistory.length > 0 && !loading && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory, loading]);
  
  // Force scroll to bottom when new messages are added
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatHistory.length > 0 && flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [chatHistory.length]);

  // Listen for "MessageSent" confirmations from SignalR
  useEffect(() => {
    // Setup message sent confirmation handler
    const handleMessageSent = (message: any) => {
      console.log("Message sent confirmation received:", message);
      
      // Replace temporary message with the actual message from server
      setChatHistory(prev => {
        // Find any temp message that might match this one and replace it
        const updatedHistory = prev.filter(msg => 
          // Keep all messages that are not temporary or don't match the sent message
          !(msg.id.toString().includes(Date.now().toString().substring(0, 5)) && 
            msg.message === message.message)
        );
        
        // Add the confirmed message
        return [...updatedHistory, message];
      });
    };
    
    // Đăng ký với service (nếu service có hỗ trợ phương thức này)
    if (typeof signalRService.onMessageSent === 'function') {
      signalRService.onMessageSent(handleMessageSent);
      
      // Cleanup
      return () => {
        if (typeof signalRService.offMessageSent === 'function') {
          signalRService.offMessageSent(handleMessageSent);
        }
      };
    }
  }, []);

  // Initial Setup
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const token = await AsyncStorage.getItem("user_token");
        if (!token) {
          router.push("/login");
          return;
        }
        
        if (receiverId) {
          await fetchChatHistory(Number(receiverId));
        }
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    initializeChat();
    
    // Setup message listener for new messages using the actual SignalR service implementation
    const handleMessageReceived = (message: any) => {
      // Check if the message is from the current chat
      if (message && (message.senderId === Number(receiverId) || message.receiverId === Number(receiverId))) {
        // Update chat history with the new message
        setChatHistory(prev => [...prev, message]);
        
        // Scroll to bottom after receiving a message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };
    
    // Register the message received handler
    signalRService.onMessageReceived(handleMessageReceived);
    
    // Cleanup when component unmounts
    return () => {
      // Remove message handler
      signalRService.offMessageReceived(handleMessageReceived);
    };
  }, [receiverId]);

  // Render Message Item
  const renderMessageItem = ({ item }: { item: any }) => {
    const isCurrentUser = item.senderId !== Number(receiverId);
    
    // Định dạng thời gian ngắn gọn hơn
    const messageDate = new Date(item.sentTime);
    
    // Format thời gian theo định dạng HH:MM
    const messageTime = messageDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.messageSender : styles.messageReceiver
      ]}>
        {/* Message Content */}
        <View 
          style={[
            styles.messageContent,
            {
              backgroundColor: isCurrentUser ? colors.primary || '#5b92e5' : '#f0f0f0',
              borderBottomRightRadius: isCurrentUser ? 4 : 16,
              borderBottomLeftRadius: isCurrentUser ? 16 : 4
            }
          ]}
        >
          {/* Text Message */}
          {item.message && (
            <Text 
              style={[
                styles.messageText, 
                { color: isCurrentUser ? "#FFFFFF" : colors.text || "#000000" }
              ]}
            >
              {item.message}
            </Text>
          )}

          {/* Image Message */}
          {item.files && item.files.length > 0 && (
            <Image
              source={{ uri: item.files[0].fileUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
        </View>
        
        {/* Message Time - Nằm bên ngoài tin nhắn */}
        <Text 
          style={[
            styles.messageTime,
            { 
              color: colors.textSecondary || "#999",
              alignSelf: isCurrentUser ? 'flex-end' : 'flex-start'
            }
          ]}
        >
          {messageTime}
        </Text>
      </View>
    );
  };

  // Hiệu chỉnh khoảng cách bottom cho content dựa vào thiết bị là Android hay iOS
  const getBottomPadding = () => {
    if (Platform.OS === 'android') {
      return keyboardVisible ? 0 : 0; // Không cần padding dưới trên Android khi dùng adjustResize
    } else {
      return keyboardVisible ? keyboardHeight - 120 : 0;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header hiển thị tên người nhận và email */}
      <View style={[styles.minimalHeader, { backgroundColor: colors.background }]}>
        <View style={styles.receiverInfo}>
          <Text style={[styles.receiverName, { color: colors.text }]}>
            {receiverName}
          </Text>
          {receiverEmail ? (
            <Text style={[styles.receiverEmail, { color: colors.textSecondary || '#666' }]}>
              {receiverEmail}
            </Text>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : undefined}
        // Android sẽ tự động điều chỉnh với windowSoftInputMode="adjustResize"
      >
        <View style={[
          styles.contentContainer,
          { paddingBottom: getBottomPadding() }
        ]}>
          {/* Chat Messages */}
          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.primary || '#5b92e5'} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading messages...
              </Text>
            </View>
          ) : error && chatHistory.length === 0 ? (
            <View style={styles.centerContent}>
              <Ionicons 
                name="chatbubble-ellipses-outline" 
                size={60} 
                color={colors.textSecondary || '#999'} 
              />
              <Text style={[styles.errorText, { color: colors.text }]}>
                {error}
              </Text>
              <Text style={[styles.subMessageText, { color: colors.textSecondary || '#666' }]}>
                Send a message to {receiverName}!
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={chatHistory}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={[
                styles.chatListContent,
                // Thêm padding để đảm bảo không bị che khuất bởi input
                { paddingBottom: 80 + (selectedImage ? 120 : 0) }
              ]}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                if (chatHistory.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }
              }}
            />
          )}

          {/* Input Area - Fixed position at bottom */}
          <View 
            style={[
              styles.inputContainer, 
              { 
                backgroundColor: colors.card || '#fff',
                borderTopColor: colors.border || '#eee',
              }
            ]}
          >
            {/* Selected Image Preview - Above input */}
            {selectedImage && (
              <View style={[styles.selectedImageContainer, { backgroundColor: colors.card || '#fff' }]}>
                <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={handleRemoveImage}
                >
                  <Ionicons name="close-circle-sharp" size={26} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.inputRow}>
              <TouchableOpacity 
                onPress={pickImage} 
                style={styles.iconButton} 
                disabled={sendingMessage}
              >
                <Ionicons 
                  name="image" 
                  size={24} 
                  color={sendingMessage ? colors.border || '#ccc' : colors.primary || '#5b92e5'} 
                />
              </TouchableOpacity>

              <TextInput
                ref={mainInputRef}
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.inputBackground || '#f5f5f5', 
                    color: colors.text,
                    borderColor: colors.border || '#eee'
                  }
                ]}
                placeholder="Type a message..."
                placeholderTextColor={colors.textSecondary || '#999'}
                value={message}
                onChangeText={setMessage}
                editable={!sendingMessage}
                multiline
              />

              <TouchableOpacity 
                onPress={handleSendMessage} 
                style={[
                  styles.sendButton,
                  { backgroundColor: colors.primary || '#5b92e5' },
                  sendingMessage && styles.disabledButton
                ]}
                disabled={sendingMessage}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="paper-plane" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  receiverInfo: {
    alignItems: 'center',
  },
  receiverName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  receiverEmail: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  subMessageText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  chatListContent: {
    padding: 16,
    paddingBottom: 80, // Ensure enough space at bottom for input
  },
  messageContainer: {
    marginBottom: 8,
    maxWidth: '80%',
  },
  messageSender: {
    alignSelf: 'flex-end',
  },
  messageReceiver: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    borderRadius: 16,
    padding: 12,
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
    color: '#999',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginVertical: 6,
  },
  inputContainer: {
    padding: 0, 
    borderTopWidth: 1,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  selectedImageContainer: {
    padding: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedImage: {
    width: 100,
    height: 70,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    width: '100%',
  },
  iconButton: {
    padding: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 24,
    fontSize: 16,
    marginHorizontal: 10,
    borderWidth: 1,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
});