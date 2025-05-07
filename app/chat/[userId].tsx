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
  AppStateStatus,
  Linking,
  Alert,
  ClipboardStatic,
  GestureResponderEvent
} from "react-native";
import { signalRService } from "@/services/SignalRService";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getChatHistoryAPI } from "@/utils/chatAPI";
import { getUserIdFromToken, getToken } from "@/services/auth";

// Import Clipboard with correct type
const Clipboard: ClipboardStatic = require('react-native').Clipboard;

// Define interfaces for better type checking
interface FileObject {
  fileUrl?: string;
  file_url?: string;
  url?: string;
  uri?: string;
  path?: string;
  file?: {
    [key: string]: any;  // This allows accessing properties with bracket notation
    fileUrl?: string;
    file_url?: string;
    url?: string;
    uri?: string;
    path?: string;
  };
  fileName?: string;
  contentType?: string;
  mimeType?: string;
  name?: string;
  [key: string]: any;  // This allows accessing properties with bracket notation
}

// Improved Message interface with proper types
interface Message {
  id: number | string | null;
  senderId: number;
  receiverId: number;
  message: string;
  sentTime: string;
  files?: Array<FileObject>;
  isRead?: boolean;
}

// Type for file info
interface FileInfo {
  url: string | null;
  fileType: string;
  fileName: string;
}

// Check if URL is a PDF
const isPdfUrl = (url: string | null): boolean => {
  if (!url) return false;
  
  // Check file extension
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.endsWith('.pdf')) return true;
  
  // Check for PDF in path
  if (lowercaseUrl.includes('/pdf/')) return true;
  
  // Check for common PDF hosting patterns
  if (lowercaseUrl.includes('cloudinary') && lowercaseUrl.includes('.pdf')) return true;
  
  return false;
};

// Extract file name from URL
const getFileNameFromUrl = (url: string | null): string => {
  if (!url) return 'document.pdf';
  
  try {
    // Split by slashes and get last part
    const parts = url.split('/');
    let fileName = parts[parts.length - 1];
    
    // Remove query parameters if any
    if (fileName.includes('?')) {
      fileName = fileName.split('?')[0];
    }
    
    // Try to decode URL encoding
    try {
      fileName = decodeURIComponent(fileName);
    } catch (e) {
      // Ignore decoding errors
    }
    
    return fileName || 'document.pdf';
  } catch (e) {
    return 'document.pdf';
  }
};

// Utility function to extract file URL from various possible formats
const getFileUrl = (fileObject: FileObject | string | null): string | null => {
  if (!fileObject) return null;
  
  // Check if the object itself is a string (might be directly the URL)
  if (typeof fileObject === 'string') {
    return fileObject;
  }
  
  // Check for various common URL property names
  const possibleUrlProps: Array<keyof FileObject> = ['fileUrl', 'file_url', 'url', 'uri', 'path'];
  
  for (const prop of possibleUrlProps) {
    if (fileObject[prop] && typeof fileObject[prop] === 'string') {
      return fileObject[prop] as string;
    }
  }
  
  // If the object has a nested 'file' property, try that too
  if (fileObject.file && typeof fileObject.file === 'object') {
    for (const prop of possibleUrlProps) {
      if (fileObject.file[prop] && typeof fileObject.file[prop] === 'string') {
        return fileObject.file[prop] as string;
      }
    }
  }
  
  return null;
};

// Function to handle PDF opening/downloading
const handleOpenPdf = (pdfUrl: string | null): void => {
  if (!pdfUrl) {
    Alert.alert("Error", "Invalid PDF URL");
    return;
  }
  
  Linking.canOpenURL(pdfUrl)
    .then(supported => {
      if (supported) {
        return Linking.openURL(pdfUrl);
      } else {
        Alert.alert(
          "Cannot Open URL",
          "Your device doesn't support opening this URL directly. Would you like to copy it to your clipboard?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Copy URL", onPress: () => Clipboard.setString(pdfUrl) }
          ]
        );
      }
    })
    .catch(error => {
      console.error("Error opening PDF URL:", error);
      Alert.alert("Error", "Could not open the PDF file");
    });
};

export default function ChatScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const flatListRef = useRef<FlatList<Message>>(null);
  const mainInputRef = useRef<TextInput>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Get receiverId and name from params
  const receiverId = parseInt(String(searchParams.userId || '0'), 10);
  const [receiverName, setReceiverName] = useState<string>(String(searchParams.contactName || `User ${receiverId}`));
  const [receiverEmail, setReceiverEmail] = useState<string>(String(searchParams.contactEmail || ""));
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Debug function to check message structure
  const debugMessageStructure = (message: Message | null): void => {
    try {
      if (!message) return;
      
      console.log('Message ID:', message.id);
      console.log('Message has files?', !!message.files);
      
      if (message.files) {
        console.log('Files is array?', Array.isArray(message.files));
        console.log('Files length:', message.files.length);
        
        if (message.files.length > 0) {
          console.log('First file:', JSON.stringify(message.files[0]));
        }
      }
    } catch (error) {
      console.error('Error debugging message:', error);
    }
  };

  // Setup SignalR connection management
  useEffect(() => {
    let isMounted = true;
    
    // Setup SignalR connection
    const setupSignalR = async (): Promise<void> => {
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
    const handleAppStateChange = (nextAppState: AppStateStatus): void => {
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
    const fetchUserId = async (): Promise<void> => {
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
    const messageReceivedHandler = (message: Message): void => {
      console.log('Message received via SignalR:', message);
      
      if (!message) {
        console.warn('Invalid message received', message);
        return;
      }
      
      // Debug message structure if it has files
      if (message.files && message.files.length > 0) {
        console.log('Received message with files:');
        debugMessageStructure(message);
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
    const messageSentHandler = (sentMessage: Message): void => {
      console.log('Message sent confirmation received:', sentMessage);
      
      if (!sentMessage) {
        console.warn('Invalid sent message received', sentMessage);
        return;
      }
      
      // Debug message structure if it has files
      if (sentMessage.files && sentMessage.files.length > 0) {
        console.log('Sent message with files:');
        debugMessageStructure(sentMessage);
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
    const initializeChat = async (): Promise<void> => {
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

  const fetchChatHistory = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const history = await getChatHistoryAPI(receiverId);
      console.log(`Fetched ${history?.length || 0} messages from chat history`);

      if (history && history.length > 0) {
        // Debug the structure of messages with files
        const messagesWithFiles = history.filter(msg => msg.files && msg.files.length > 0);
        console.log(`Found ${messagesWithFiles.length} messages with files`);
        
        if (messagesWithFiles.length > 0) {
          console.log('First message with files:');
          debugMessageStructure(messagesWithFiles[0]);
        }

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

  const getBase64FromUri = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64Content = base64data.split(',')[1] || '';
          resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Failed to convert image to base64", error);
      throw error;
    }
  };

  // Handle sending messages with improved image handling
  const handleSendMessage = async (): Promise<void> => {
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
      const tempMessage: Message = {
        id: tempMessageId,
        senderId: userId || 0,
        receiverId: receiverId,
        message: message.trim(),
        sentTime: new Date().toISOString(),
        files: selectedImage ? [{ fileUrl: selectedImage.uri }] : []
      };

      console.log('Preparing to send message:', tempMessage);

      let fileData: Array<{
        FileName: string;
        Base64Content: string;
        ContentType: string;
      }> = [];
      
      if (selectedImage && selectedImage.uri) {
        try {
          const base64Content = await getBase64FromUri(selectedImage.uri);

          fileData.push({
            FileName: selectedImage.fileName || `image_${tempMessageId}.jpg`,
            Base64Content: base64Content,
            ContentType: selectedImage.type || 'image/jpeg',
          });
          
          console.log('Image prepared for sending:', selectedImage.fileName || `image_${tempMessageId}.jpg`);
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

  // Image Picker
  const pickImage = async (): Promise<void> => {
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

  const handleRemoveImage = (): void => {
    setSelectedImage(null);
  };

  const keyExtractor = useCallback((item: Message, index: number): string => {
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

  // Enhanced renderMessageItem with PDF support
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
  
    // Process file (image or PDF)
    let fileContent = null;
    if (item.files && Array.isArray(item.files) && item.files.length > 0) {
      const fileUrl = getFileUrl(item.files[0]);
      
      if (fileUrl) {
        // Check if it's a PDF
        if (isPdfUrl(fileUrl)) {
          const fileName = getFileNameFromUrl(fileUrl);
          
          fileContent = (
            <TouchableOpacity 
              style={styles.pdfContainer}
              onPress={() => handleOpenPdf(fileUrl)}
            >
              <View style={styles.pdfContent}>
                <MaterialCommunityIcons name="file-pdf-box" size={28} color="#D93025" />
                <View style={styles.pdfTextContainer}>
                  <Text style={styles.pdfFileName} numberOfLines={1} ellipsizeMode="middle">
                    {fileName}
                  </Text>
                  <Text style={styles.pdfSubtext}>
                    PDF • Tap to download
                  </Text>
                </View>
                <Ionicons name="download-outline" size={20} color="#505050" />
              </View>
            </TouchableOpacity>
          );
        } else {
          // Regular image handling
          fileContent = (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: fileUrl }} 
                style={styles.messageImage} 
                resizeMode="cover"
                onError={(error) => {
                  console.error(`Image load error for message ${item.id}:`, error.nativeEvent.error || 'Unknown error');
                  console.log('Failed URL:', fileUrl);
                }}
              />
            </View>
          );
        }
      }
    }
  
    return (
      <View style={[styles.messageContainer, isFromMe ? styles.messageReceiver : styles.messageSender]}>
        <View 
          style={[styles.messageContent, {
            backgroundColor: isFromMe ? colors.primary || '#5b92e5' : validTheme === "dark" ? '#2A2A2A' : '#f0f0f0',
            borderBottomRightRadius: isFromMe ? 4 : 16,
            borderBottomLeftRadius: isFromMe ? 16 : 4
          }]}>
          {item.message && item.message.trim() !== '' && (
            <Text style={[styles.messageText, { color: messageTextColor }]}>
              {item.message}
            </Text>
          )}
          
          {fileContent}
        </View>
        <Text style={[styles.messageTime, { color: colors.textSecondary || "#999", alignSelf: isFromMe ? 'flex-end' : 'flex-start' }]}>
          {messageTime}
        </Text>
      </View>
    );
  }, [currentUserId, colors, validTheme]);

  const validChatHistory = chatHistory.filter(msg => 
    msg && msg.senderId && msg.receiverId 
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
          ) : error && validChatHistory.length === 0 ? (
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
  // PDF specific styles
  pdfContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pdfContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  pdfTextContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  pdfFileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  pdfSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginVertical: 6,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  disabledButton: {
    opacity: 0.6,
  },
});