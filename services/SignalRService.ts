import * as signalR from "@microsoft/signalr";
import { getToken, getUserIdFromToken } from "./auth";
import { BASE_URL } from "@/config/apiConfig";

class SignalRService {
  public connection: signalR.HubConnection | null = null;
  private callbacks: Map<string, Function[]> = new Map();
  private connectionStateCallbacks: Function[] = [];
  private lastPingTime: number = Date.now();

  // Initialize SignalR connection
  public async startConnection(token: string): Promise<void> {
    // Prevent connecting if already connected
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      console.log("Already connected to SignalR");
      return;
    }

    try {
      // Configure SignalR connection
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${BASE_URL}/chatHub`, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000]) // Exponential backoff
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Setup connection state change handlers
      this.connection.onreconnecting((error) => {
        console.log("SignalR reconnecting:", error);
        this.notifyConnectionStateChange("Reconnecting");
      });

      this.connection.onreconnected((connectionId) => {
        console.log("SignalR reconnected with ID:", connectionId);
        this.notifyConnectionStateChange("Connected");
        this.lastPingTime = Date.now();
      });

      // Handle message receipt
      this.connection.on("ReceiveMessage", (message) => {
        console.log("Message received:", message);
        const callbacks = this.callbacks.get("messageReceived") || [];
        callbacks.forEach((callback) => callback(message));
        this.lastPingTime = Date.now();
      });

      // Handle message sent confirmation
      this.connection.on("MessageSent", (message) => {
        console.log("Message sent confirmation:", message);
        const callbacks = this.callbacks.get("messageSent") || [];
        callbacks.forEach((callback) => callback(message));
        this.lastPingTime = Date.now();
      });

      // Handle typing indicators
      this.connection.on("UserTyping", (data) => {
        console.log("Typing indicator received:", data);
        const callbacks = this.callbacks.get("typingIndicator") || [];
        callbacks.forEach((callback) => callback(data));
        this.lastPingTime = Date.now();
      });

      // Handle user presence updates
      this.connection.on("UserPresenceChanged", (data) => {
        console.log("User presence update:", data);
        const callbacks = this.callbacks.get("userPresence") || [];
        callbacks.forEach((callback) => callback(data));
        this.lastPingTime = Date.now();
      });

      // Handle messages read notifications
      this.connection.on("MessagesRead", (data) => {
        console.log("Messages read notification:", data);
        const callbacks = this.callbacks.get("messagesRead") || [];
        callbacks.forEach((callback) => callback(data));
        this.lastPingTime = Date.now();
      });

      // Handle connection close
      this.connection.onclose((error) => {
        console.log("SignalR connection closed:", error);
        this.notifyConnectionStateChange("Disconnected");
        this.connection = null;
      });

      // Start connection
      await this.connection.start();
      console.log("SignalR connected successfully.");
      this.notifyConnectionStateChange("Connected");
      this.lastPingTime = Date.now();
    } catch (error) {
      console.error("Error starting SignalR connection:", error);
      this.connection = null;
      this.notifyConnectionStateChange("Error");
      throw error;
    }
  }

  // Stop SignalR connection
  public async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log("SignalR connection stopped.");
        this.connection = null;
        this.notifyConnectionStateChange("Disconnected");
      } catch (error) {
        console.error("Error stopping SignalR connection:", error);
      }
    }
  }

  // Join a specific chat room
  public async joinChat(receiverId: number): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error("SignalR not connected");
    }

    try {
      await this.connection.invoke("JoinChat", receiverId);
      console.log(`Joined chat room for user ${receiverId}`);
    } catch (error) {
      console.error("Error joining chat room:", error);
      throw error;
    }
  }

  // Leave a specific chat room
  public async leaveChat(receiverId: number): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return; // Silently fail if not connected
    }

    try {
      await this.connection.invoke("LeaveChat", receiverId);
      console.log(`Left chat room for user ${receiverId}`);
    } catch (error) {
      console.error("Error leaving chat room:", error);
    }
  }

  // Send typing indicator
  public async sendTypingIndicator(receiverId: number, isTyping: boolean): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return; // Silently fail if not connected
    }

    try {
      await this.connection.invoke("SendTypingIndicator", receiverId, isTyping);
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  }

  // Request user presence information
  public async requestUserPresence(userId: number): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return; // Silently fail if not connected
    }

    try {
      await this.connection.invoke("GetUserPresence", userId);
    } catch (error) {
      console.error("Error requesting user presence:", error);
    }
  }

  // Mark messages as read
  public async markMessagesAsRead(senderId: number): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error("SignalR not connected");
    }

    try {
      await this.connection.invoke("MarkMessagesAsRead", senderId);
      console.log(`Marked messages from user ${senderId} as read`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  }

  // Send a message with improved file handling and progress reporting
  public async sendMessage(
    receiverId: number,
    message: string,
    files: any[] = [],
    onProgress?: (progress: number) => void
  ): Promise<string> {
    console.log("Attempting to send message...");
  
    const senderId = await getUserIdFromToken();
    console.log(`Sending message to SignalR: Sender ID = ${senderId}, Receiver ID = ${receiverId}`);
  
    if (senderId === receiverId) {
      throw new Error("You cannot send a message to yourself.");
    }
  
    // Check SignalR connection
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      try {
        const token = await getToken();
        if (token) {
          await this.startConnection(token);
          console.log("SignalR connected successfully.");
        } else {
          throw new Error("Failed to retrieve token.");
        }
      } catch (error) {
        console.error("Error reconnecting to SignalR:", error);
        throw error;
      }
    }
  
    // Format file data to match backend expectations
    const fileData = files.map((file) => {
      return {
        FileName: file.FileName || file.fileName || file.name || `image_${Date.now()}.jpg`,
        ContentType: file.ContentType || file.contentType || file.type || 'image/jpeg',
        Base64Content: file.Base64Content || file.base64Content || file.base64 || ''
      };
    });
    
    // Always send a non-null message string
    const messageText = message || "";
    console.log("Message content:", messageText);
  
    try {
      // Report initial progress
      if (onProgress) {
        onProgress(10);
      }
      
      let messageId;
      
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        // If we have large files, report incremental progress
        if (fileData.length > 0 && onProgress) {
          onProgress(30); // Starting file upload
        }
        
        messageId = await this.connection.invoke("SendMessage", receiverId, messageText, fileData);
        console.log("Message sent successfully with ID:", messageId);
        
        this.lastPingTime = Date.now();
      } else {
        throw new Error("SignalR connection is not established.");
      }
  
      if (onProgress) {
        onProgress(100);
      }
      
      return messageId;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  // Connection health check via ping
  public async ping(): Promise<boolean> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return false;
    }

    try {
      await this.connection.invoke("Ping");
      this.lastPingTime = Date.now();
      return true;
    } catch (error) {
      console.error("Ping failed:", error);
      return false;
    }
  }

  // Get last activity timestamp
  public getLastActivityTime(): number {
    return this.lastPingTime;
  }

  // Register for connection state changes
  public onConnectionStateChange(callback: Function): void {
    this.connectionStateCallbacks.push(callback);
  }

  // Unregister from connection state changes
  public offConnectionStateChange(callback: Function): void {
    const index = this.connectionStateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.connectionStateCallbacks.splice(index, 1);
    }
  }

  // Notify all connection state listeners
  private notifyConnectionStateChange(state: string): void {
    this.connectionStateCallbacks.forEach(callback => callback(state));
  }

  // Register for message received events
  public onMessageReceived(callback: Function): void {
    const callbacks = this.callbacks.get("messageReceived") || [];
    this.callbacks.set("messageReceived", [...callbacks, callback]);
  }

  // Unregister from message received events
  public offMessageReceived(callback: Function): void {
    const callbacks = this.callbacks.get("messageReceived") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("messageReceived", callbacks);
    }
  }
  
  // Register for message sent events
  public onMessageSent(callback: Function): void {
    const callbacks = this.callbacks.get("messageSent") || [];
    this.callbacks.set("messageSent", [...callbacks, callback]);
  }
  
  // Unregister from message sent events
  public offMessageSent(callback: Function): void {
    const callbacks = this.callbacks.get("messageSent") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("messageSent", callbacks);
    }
  }
  
  // Register for messages read events
  public onMessagesRead(callback: Function): void {
    const callbacks = this.callbacks.get("messagesRead") || [];
    this.callbacks.set("messagesRead", [...callbacks, callback]);
  }

  // Unregister from messages read events
  public offMessagesRead(callback: Function): void {
    const callbacks = this.callbacks.get("messagesRead") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("messagesRead", callbacks);
    }
  }

  // Register for typing indicator events
  public onTypingIndicator(callback: Function): void {
    const callbacks = this.callbacks.get("typingIndicator") || [];
    this.callbacks.set("typingIndicator", [...callbacks, callback]);
  }

  // Unregister from typing indicator events
  public offTypingIndicator(callback: Function): void {
    const callbacks = this.callbacks.get("typingIndicator") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("typingIndicator", callbacks);
    }
  }

  // Register for user presence events
  public onUserPresence(callback: Function): void {
    const callbacks = this.callbacks.get("userPresence") || [];
    this.callbacks.set("userPresence", [...callbacks, callback]);
  }

  // Unregister from user presence events
  public offUserPresence(callback: Function): void {
    const callbacks = this.callbacks.get("userPresence") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("userPresence", callbacks);
    }
  }

  // Listen for contact updates
  public onContactsUpdated(callback: (contacts: any[]) => void): void {
    const callbacks = this.callbacks.get("contactsUpdated") || [];
    this.callbacks.set("contactsUpdated", [...callbacks, callback]);
  }

  // Unregister from contact updates
  public offContactsUpdated(callback: Function): void {
    const callbacks = this.callbacks.get("contactsUpdated") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("contactsUpdated", callbacks);
    }
  }
}

export const signalRService = new SignalRService();