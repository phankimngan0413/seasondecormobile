import React, { useState, useEffect, useRef, useCallback } from "react";
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
  AppState,
  AppStateStatus
} from "react-native";
import { signalRService } from "@/services/SignalRService";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { launchImageLibrary } from 'react-native-image-picker';
import { Ionicons } from "@expo/vector-icons";
import { getChatHistoryAPI } from "@/utils/chatAPI";
import { getUserIdFromToken, getToken } from "@/services/auth";

// Improved Message interface
interface Message {
  id: number | string | null;  // Updated to explicitly allow null
  senderId: number;
  receiverId: number;
  message: string;
  sentTime: string;
  files?: Array<{fileUrl?: string}>;
  isRead?: boolean;
}

export default function ChatScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList<Message>>(null);
  const mainInputRef = useRef<TextInput>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Get receiverId and name from params
  const receiverId = parseInt(String(searchParams.userId || '0'), 10);
  const [receiverName, setReceiverName] = useState<string>(String(searchParams.contactName || `User ${receiverId}`));
  const [receiverEmail, setReceiverEmail] = useState<string>(String(searchParams.contactEmail || ""));
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Setup SignalR connection management
  useEffect(() => {
    let isMounted = true;
    
    // Setup SignalR connection
    const setupSignalR = async () => {
      try {
        if (isMounted) setConnectionStatus('connecting');
        const token = await getToken();
        if (!token) {
          console.error('No token available for SignalR connection');
          if (isMounted) setConnectionStatus('disconnected');
          return;
        }
        
        await signalRService.startConnection(token);
        if (isMounted) setConnectionStatus('connected');
        console.log("SignalR connection established");
      } catch (error) {
        console.error("Failed to connect to SignalR hub:", error);
        if (isMounted) setConnectionStatus('disconnected');
        // Try to reconnect after a delay
        setTimeout(setupSignalR, 5000);
      }
    };

    // Handle app state changes to reconnect when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App has come to the foreground, checking SignalR connection');
        if (!signalRService.isConnected()) {
          console.log('Reconnecting to SignalR...');
          setupSignalR();
        } else {
          console.log('SignalR connection is active');
          if (isMounted) setConnectionStatus('connected');
        }
      }
    };

    // Initial setup
    setupSignalR();
    
    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Set up periodic connection checking
    const connectionChecker = setInterval(() => {
      if (!signalRService.isConnected()) {
        console.log('Connection check failed, reconnecting...');
        setupSignalR();
      } else {
        console.log('SignalR connection is active');
        if (isMounted) setConnectionStatus('connected');
      }
    }, 30000); // Check every 30 seconds

    return () => {
      // Clean up
      isMounted = false;
      subscription.remove();
      clearInterval(connectionChecker);
      signalRService.stopConnection();
    };
  }, []);

  // Fetch user ID on component mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userId = await getUserIdFromToken();
        console.log("Current user ID:", userId);
        setCurrentUserId(userId);
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const messageReceivedHandler = (message: Message) => {
      console.log('Message received via SignalR:', message);
      
      if (!message) {
        console.warn('Invalid message received', message);
        return;
      }
  
      // Add the message to chat history if it doesn't exist
      setChatHistory(prevHistory => {
        // Check if message already exists by content and approximate time
        const isMessageExists = prevHistory.some(msg => {
          // If IDs match
          if (message.id && msg.id === message.id) return true;
          
          // Or if content and time are close (within 5 seconds)
          if (msg.message === message.message && 
              Math.abs(new Date(msg.sentTime).getTime() - new Date(message.sentTime).getTime()) < 5000) {
            return true;
          }
          
          return false;
        });
        
        if (isMessageExists) {
          console.log('Message already exists in chat history, skipping...');
          return prevHistory;
        }
        
        console.log('Adding new message to chat history');
        return [...prevHistory, message];
      });
      
      // Force scroll to end
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    };
  
    // Register message handler
    signalRService.onMessageReceived(messageReceivedHandler);
    
    // Register message sent handler to update UI
    const messageSentHandler = (sentMessage: Message) => {
      console.log('Message sent confirmation received:', sentMessage);
      
      if (!sentMessage) {
        console.warn('Invalid sent message received', sentMessage);
        return;
      }
      
      // Update chat with confirmed message (replacing temp if needed)
      setChatHistory(prevHistory => {
        // Find any temporary version of this message
        const tempIndex = prevHistory.findIndex(msg => 
          typeof msg.id === 'string' && 
          msg.id.startsWith('temp_') && 
          msg.message === sentMessage.message
        );
        
        // If we found a temporary version and have a valid ID, replace it
        if (tempIndex !== -1 && sentMessage.id) {
          console.log('Replacing temporary message with confirmed one');
          const newHistory = [...prevHistory];
          newHistory[tempIndex] = sentMessage;
          return newHistory;
        }
        
        // If we have a confirmed message with ID, check if it already exists
        if (sentMessage.id) {
          const msgExists = prevHistory.some(msg => msg.id === sentMessage.id);
          if (msgExists) {
            console.log('Message already exists in history');
            return prevHistory;
          }
        }
        
        // For messages with null ID, first check if we have a temp version
        if (sentMessage.id === null) {
          const hasTempVersion = prevHistory.some(msg => 
            typeof msg.id === 'string' && 
            msg.id.startsWith('temp_') && 
            msg.message === sentMessage.message
          );
          
          if (hasTempVersion) {
            console.log('Keeping temporary message for null ID confirmation');
            return prevHistory;
          }
        }
        
        // If we got here, add the message
        console.log('Adding confirmed message to history');
        return [...prevHistory, sentMessage];
      });
      
      // Force scroll to end
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    };
    
    signalRService.onMessageSent(messageSentHandler);
  
    // Clean up the handlers when component unmounts
    return () => {
      signalRService.offMessageReceived(messageReceivedHandler);
      signalRService.offMessageSent(messageSentHandler);
    };
  }, []);

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        await fetchChatHistory();
      } catch (error) {
        console.error("Error in initializing chat:", error);
      }
    };
  
    initializeChat();
  }, [receiverId]);

  // Scroll to latest message when chat history updates
  useEffect(() => {
    if (chatHistory.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [chatHistory]);

  const fetchChatHistory = useCallback(async () => {
    setLoading(true);
    try {
      const history = await getChatHistoryAPI(receiverId);
      console.log(`Fetched ${history?.length || 0} messages from chat history`);

      if (history && history.length > 0) {
        // Filter out any messages with undefined/null ids
        const validHistory = history.filter(msg => msg && msg.id !== undefined && msg.id !== null);
        setChatHistory(validHistory);
        setError(null);
      } else {
        setChatHistory([]);
        setError("Start a conversation with this contact!");
      }
    } catch (error) {
      console.error("Error in chat history logic:", error);
      setChatHistory([]);
      setError("Send a message to start the conversation!");
    } finally {
      setLoading(false);
    }
  }, [receiverId]);

  // Modify the handleSendMessage function to properly handle the first message
 // Fix for first message display issue

// 1. Update the handleSendMessage function to handle the first message better
const handleSendMessage = async () => {
  if (message.trim() === "" && !selectedImage) {
    console.log('No message or image to send');
    return;
  }

  setSendingMessage(true);

  try {
    // Ensure we have a user ID
    let userId = currentUserId;
    if (!userId) {
      userId = await getUserIdFromToken();
      setCurrentUserId(userId);
      console.log('Retrieved user ID:', userId);
    }
    
    // Ensure connection is active
    if (!signalRService.isConnected()) {
      setConnectionStatus('connecting');
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      await signalRService.startConnection(token);
      setConnectionStatus('connected');
    }

    // Create temp message with a prefix to identify it
    const tempMessageId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempMessageId,
      senderId: userId || 0,
      receiverId: receiverId,
      message: message.trim(),
      sentTime: new Date().toISOString(),
      files: selectedImage ? [{ fileUrl: selectedImage.uri }] : []
    };

    console.log('Preparing to send message:', tempMessage);

    let fileData = [];
    if (selectedImage && selectedImage.uri) {
      try {
        const base64Content = await getBase64FromUri(selectedImage.uri);

        fileData.push({
          FileName: selectedImage.fileName || `image_${tempMessageId}.jpg`,
          Base64Content: base64Content,
          ContentType: selectedImage.type || 'image/jpeg',
        });
      } catch (imageError) {
        console.error("Error processing image:", imageError);
      }
    }

    // For first message with empty chat, update UI and error state
    if (chatHistory.length === 0) {
      setError(null); // Clear any "Start conversation" error message
    }

    // Add message to UI immediately
    setChatHistory(prev => [...prev, tempMessage]);
    console.log('Added temporary message to chat history');
    
    // Force immediate UI update
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    // Send message via SignalR
    const messageId = await signalRService.sendMessage(
      receiverId,
      message.trim(),
      fileData,
      (progress) => {
        console.log(`Message send progress: ${progress}%`);
      }
    );
    
    console.log('Message sent successfully with ID:', messageId);

    // For first message specifically, if ID is null, force render again
    if (messageId === null && chatHistory.length === 0) {
      console.log('Special handling for first message with null ID');
      setTimeout(() => {
        // Force a re-render by creating a new reference
        setChatHistory(prev => [...prev]);
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }

    // Reset UI
    setMessage("");
    setSelectedImage(null);
  } catch (error) {
    console.error("Error sending message:", error);
    setConnectionStatus('disconnected');
  } finally {
    setSendingMessage(false);
  }
};

// Also update the messageSentHandler in the useEffect to better handle null IDs
useEffect(() => {
  const messageReceivedHandler = (message: Message) => {
    console.log('Message received via SignalR:', message);
    
    if (!message) {
      console.warn('Invalid message received', message);
      return;
    }

    // Add the message to chat history if it doesn't exist
    setChatHistory(prev => {
      // Check if message already exists to avoid duplicates
      // For messages with null or undefined ID, check content and time
      const isMessageExists = prev.some(msg => 
        (msg.id !== undefined && msg.id === message.id) || 
        (msg.message === message.message && 
         Math.abs(new Date(msg.sentTime).getTime() - new Date(message.sentTime).getTime()) < 5000)
      );
      
      if (isMessageExists) {
        console.log('Message already exists in chat history, skipping...');
        return prev;
      }
      
      console.log('Adding new message to chat history');
      return [...prev, message];
    });
  };

  // Register message handler
  signalRService.onMessageReceived(messageReceivedHandler);
  
  // Register message sent handler to update UI
  const messageSentHandler = (sentMessage: Message) => {
    console.log('Message sent confirmation received:', sentMessage);
    
    if (!sentMessage) {
      console.warn('Invalid sent message received', sentMessage);
      return;
    }
    
    // Update chat with confirmed message (replacing temp if needed)
    setChatHistory(prev => {
      // Check if this message content already exists as a temporary message
      const hasTempVersion = prev.some(msg => 
        typeof msg.id === 'string' && 
        msg.id.startsWith('temp_') && 
        msg.message === sentMessage.message
      );
      
      if (hasTempVersion) {
        // Replace temp message with confirmed one if ID exists
        if (sentMessage.id !== undefined && sentMessage.id !== null) {
          const filtered = prev.filter(msg => 
            !(typeof msg.id === 'string' && 
              msg.id.startsWith('temp_') && 
              msg.message === sentMessage.message)
          );
          return [...filtered, sentMessage];
        }
        // If server returned null ID, keep the temp message as is
        return prev;
      }
      
      // Check if message with this ID already exists
      const hasExactId = sentMessage.id !== undefined && 
                         sentMessage.id !== null && 
                         prev.some(msg => msg.id === sentMessage.id);
      
      if (hasExactId) {
        return prev;
      } else {
        return [...prev, sentMessage];
      }
    });
    
    // Force a scroll update after receiving confirmation
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  signalRService.onMessageSent(messageSentHandler);

  // Clean up the handlers when component unmounts
  return () => {
    signalRService.offMessageReceived(messageReceivedHandler);
    signalRService.offMessageSent(messageSentHandler);
  };
}, []);
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

  // Image Picker
  const pickImage = async () => {
    try {
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

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const keyExtractor = useCallback((item: Message, index: number) => {
    // Enhanced key extractor that won't fail on any input
    if (!item) return `item-${index}-${Math.random().toString(36)}`;
    if (item.id === undefined || item.id === null) return `item-${index}-${Math.random().toString(36)}`;
    try {
      return String(item.id);
    } catch (error) {
      console.error("Error in keyExtractor:", error);
      return `item-${index}-${Math.random().toString(36)}`;
    }
  }, []);
  const renderMessageItem = useCallback(({ item, index }: { item: Message, index: number }) => {
    if (!item) {
      console.warn('Null item at index', index);
      return null;
    }
    
    // Less strict check for item validity
    if (!item.senderId || !item.receiverId) {
      console.warn('Invalid message item at index', index, item);
      return null;
    }
    
    // This is the correct logic for determining if a message is from the current user
    const isFromMe = currentUserId !== null && item.senderId === currentUserId;
  
    const messageDate = item.sentTime ? new Date(item.sentTime) : new Date();
    const messageTime = messageDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  
    // Determine appropriate text color based on message type and theme
    const messageTextColor = isFromMe 
      ? "#FFFFFF" // White text for my messages (on primary color background)
      : validTheme === "dark" 
        ? "#F0F0F0" // Light text for other's messages in dark mode
        : "#000000"; // Dark text for other's messages in light mode
  
    return (
      <View style={[styles.messageContainer, isFromMe ? styles.messageReceiver : styles.messageSender]}>
        <View 
          style={[styles.messageContent, {
            backgroundColor: isFromMe ? colors.primary || '#5b92e5' : validTheme === "dark" ? '#2A2A2A' : '#f0f0f0',
            borderBottomRightRadius: isFromMe ? 4 : 16,
            borderBottomLeftRadius: isFromMe ? 16 : 4
          }]}>
          {item.message && (
            <Text style={[styles.messageText, { color: messageTextColor }]}>
              {item.message}
            </Text>
          )}
          {item.files && item.files.length > 0 && item.files[0]?.fileUrl && (
            <Image source={{ uri: item.files[0].fileUrl }} style={styles.messageImage} resizeMode="cover" />
          )}
        </View>
        <Text style={[styles.messageTime, { color: colors.textSecondary || "#999", alignSelf: isFromMe ? 'flex-end' : 'flex-start' }]}>
          {messageTime}
        </Text>
      </View>
    );
  }, [currentUserId, colors, validTheme]);

  const validChatHistory = chatHistory.filter(msg => 
    msg && msg.senderId && msg.receiverId && msg.message
  );
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.minimalHeader, { backgroundColor: colors.background }]}>
        <View style={styles.receiverInfo}>
          <Text style={[styles.receiverName, { color: colors.text }]}>
            {receiverName}
          </Text>
          {receiverEmail && (
            <Text style={[styles.receiverEmail, { color: colors.textSecondary || '#666' }]}>
              {receiverEmail}
            </Text>
          )}
          {connectionStatus !== 'connected' && (
            <View style={styles.connectionStatusContainer}>
              <Text style={[styles.connectionStatus, { 
                color: connectionStatus === 'connecting' ? '#FFA500' : '#FF3B30' 
              }]}>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : undefined}
      >
        <View style={styles.contentContainer}>
        {loading ? (
  <View style={styles.centerContent}>
    <ActivityIndicator size="large" color={colors.primary || '#5b92e5'} />
    <Text style={[styles.loadingText, { color: colors.text }]}>
      Loading messages...
    </Text>
  </View>
) : error && validChatHistory.length === 0 ? ( // Only show error if no valid messages
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
      Start a new conversation
    </Text>
  </View>
) : validChatHistory.length === 0 ? (
  <View style={styles.centerContent}>
    <Ionicons 
      name="chatbubble-ellipses-outline" 
      size={60} 
      color={colors.textSecondary || '#999'} 
    />
    <Text style={[styles.errorText, { color: colors.text }]}>
      Start a conversation with {receiverName}
    </Text>
  </View>
) : (
  <FlatList
    ref={flatListRef}
    data={validChatHistory}
    renderItem={renderMessageItem}
    keyExtractor={keyExtractor}
    extraData={validChatHistory.length + (currentUserId || 0)} // Added length to force re-render
    contentContainerStyle={[styles.chatListContent, { paddingBottom: 80 + (selectedImage ? 120 : 0) }]}
    showsVerticalScrollIndicator={false}
    onContentSizeChange={() => {
      if (validChatHistory.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: false });
      }
    }}
  />
)}
       

          {/* Input Area */}
          <View style={[styles.inputContainer, { backgroundColor: colors.card || '#fff', borderTopColor: colors.border || '#eee' }]}>
            {selectedImage && (
              <View style={[styles.selectedImageContainer, { backgroundColor: colors.card || '#fff' }]}>
                <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
                  <Ionicons name="close-circle-sharp" size={26} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputRow}>
              <TouchableOpacity onPress={pickImage} style={styles.iconButton} disabled={sendingMessage || connectionStatus !== 'connected'}>
                <Ionicons name="image" size={24} color={(sendingMessage || connectionStatus !== 'connected') ? colors.border || '#ccc' : colors.primary || '#5b92e5'} />
              </TouchableOpacity>

              <TextInput
                ref={mainInputRef}
                style={[styles.input, { backgroundColor: colors.inputBackground || '#f5f5f5', color: colors.text, borderColor: colors.border || '#eee' }]}
                placeholder={connectionStatus === 'connected' ? "Type a message..." : "Connecting..."}
                placeholderTextColor={colors.textSecondary || '#999'}
                value={message}
                onChangeText={setMessage}
                editable={!sendingMessage && connectionStatus === 'connected'}
                multiline
              />

              <TouchableOpacity 
                onPress={handleSendMessage} 
                style={[
                  styles.sendButton, 
                  { backgroundColor: colors.primary || '#5b92e5' }, 
                  (sendingMessage || connectionStatus !== 'connected') && styles.disabledButton
                ]} 
                disabled={sendingMessage || connectionStatus !== 'connected'}
              >
                {sendingMessage ? 
                  <ActivityIndicator size="small" color="#fff" /> : 
                  <Ionicons name="paper-plane" size={20} color="#fff" />
                }
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
  connectionStatusContainer: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  connectionStatus: {
    fontSize: 11,
    fontWeight: '500',
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
    alignSelf: 'flex-start', // Messages from others on the left
  },
  messageReceiver: {
    alignSelf: 'flex-end', // Your messages on the right
  },
  messageContent: {
    borderRadius: 16,
    padding: 12,
    minWidth: 80,
    maxWidth: '100%',
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