import * as signalR from "@microsoft/signalr";
import { getToken, getUserIdFromToken } from "./auth";
import { BASE_URL } from "@/config/apiConfig";
import { Platform, AppState, AppStateStatus } from 'react-native';

// Message interface for better type safety
interface Message {
  id: number | string;
  senderId: number;
  receiverId: number;
  message: string;
  sentTime: string;
  files?: Array<{fileUrl?: string}>;
  isRead?: boolean;
}

class SignalRService {
  private _connection: signalR.HubConnection | null = null;
  private callbacks: Map<string, Function[]> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isReconnecting = false;
  
  constructor() {
    // Initialize callback collections
    this.callbacks.set("messageReceived", []);
    this.callbacks.set("messageSent", []);
    
    // Listen for app state changes to manage connection
    this.setupAppStateListener();
    
    console.log("SignalR service initialized");
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('App has come to the foreground, checking SignalR connection');
      if (!this.isConnected()) {
        console.log('App is active. Reconnecting to SignalR...');
        try {
          const token = await getToken();
          if (token) {
            await this.startConnection(token);
          }
        } catch (error) {
          console.error('Failed to reconnect to SignalR:', error);
        }
      }
    } else if (nextAppState === 'background') {
      console.log('App moved to background');
    }
  }

  public isConnected(): boolean {
    return this._connection !== null && 
           this._connection.state === signalR.HubConnectionState.Connected;
  }

  // Safe getter for connection
  private get connection(): signalR.HubConnection {
    if (!this._connection) {
      throw new Error("SignalR connection not initialized");
    }
    return this._connection;
  }

  // Initialize SignalR connection
  public async startConnection(token: string): Promise<void> {
    try {
      // Prevent duplicate connections
      if (this._connection && this._connection.state === signalR.HubConnectionState.Connected) {
        console.log("Already connected to SignalR");
        return;
      }

      // Clear any existing reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      console.log("Initializing SignalR");
      
      // Make sure token is properly formatted
      const formattedToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      
      // Configure SignalR connection
     // Trong phương thức startConnection
this._connection = new signalR.HubConnectionBuilder()
.withUrl(`${BASE_URL}/chatHub`, {
  skipNegotiation: false,
  transport: signalR.HttpTransportType.WebSockets,
  accessTokenFactory: () => {
    // Thêm tiền tố "Bearer " trước token
    const formattedToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    console.log("Getting token for SignalR: ", formattedToken);
    return formattedToken;
  },
  // Thử thêm headers
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
})
.withAutomaticReconnect([0, 2000, 10000, 30000])
.configureLogging(signalR.LogLevel.Debug)
.build();
      // Handle received messages
      this._connection.on("ReceiveMessage", (message: Message) => {
        console.log("SignalR message received:", message.id);
        const callbacks = this.callbacks.get("messageReceived") || [];
        callbacks.forEach((callback) => callback(message));
      });

      // Handle message sent confirmations
      this._connection.on("MessageSent", (message: Message) => {
        console.log("SignalR message sent confirmation:", message.id);
        const callbacks = this.callbacks.get("messageSent") || [];
        callbacks.forEach((callback) => callback(message));
      });

      // Handle reconnecting
      this._connection.onreconnecting((error) => {
        console.log("SignalR reconnecting:", error);
        this.isReconnecting = true;
      });

      // Handle reconnected
      this._connection.onreconnected((connectionId) => {
        console.log("SignalR reconnected successfully with connectionId:", connectionId);
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
      });

      // Handle connection closure - only define once
      this._connection.onclose((error) => {
      
        this._connection = null;
        
        if (!this.isReconnecting && error) {
          this.scheduleReconnect(formattedToken);
        }
      });

      // Start connection with timeout
      const connectionPromise = this._connection.start();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout after 15 seconds")), 15000);
      });
      
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log("SignalR connected successfully");
      this.reconnectAttempts = 0;

    } catch (error) {
      console.error("SignalR connection error:", error);
      this._connection = null;
      this.scheduleReconnect(token);
      throw error;
    }
  }

  private scheduleReconnect(token: string) {
    // Only schedule reconnect if we haven't exceeded max attempts
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimer = setTimeout(async () => {
        try {
          await this.startConnection(token);
        } catch (error) {
          console.error("Scheduled reconnect failed:", error);
        }
      }, delay);
    } else {
      console.log("Maximum reconnect attempts reached. Will try on next app foreground.");
      this.reconnectAttempts = 0;
    }
  }

  // Stop SignalR connection
  public async stopConnection(): Promise<void> {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      if (this._connection) {
        await this._connection.stop();
        console.log("SignalR connection stopped");
        this._connection = null;
      }
    } catch (error) {
      console.error("Error stopping SignalR connection:", error);
    }
  }

  // Send a message
  public async sendMessage(
    receiverId: number, 
    message: string, 
    files: any[] = [], 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const senderId = await getUserIdFromToken();
      console.log(`Preparing to send message from ${senderId} to ${receiverId}`);

      // Check connection
      if (!this._connection || this._connection.state !== signalR.HubConnectionState.Connected) {
        console.log("Connection not established. Getting token and connecting...");
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication token not found");
        }
        await this.startConnection(token);
      }

      // Validate data
      if (senderId === receiverId) {
        throw new Error("Cannot send message to yourself");
      }

      // Prepare files
      const fileData = files.map(file => ({
        FileName: file.FileName || file.fileName || `image_${Date.now()}.jpg`,
        ContentType: file.ContentType || file.contentType || 'image/jpeg',
        Base64Content: file.Base64Content || file.base64Content || ''
      }));

      // Check message content
      const messageText = (message || '').trim();
      if (!messageText && !fileData.length) {
        throw new Error("Cannot send empty message");
      }

      // Progress notification
      onProgress && onProgress(10);
      console.log(`Sending message to ${receiverId}: ${messageText.substring(0, 30)}${messageText.length > 30 ? '...' : ''}`);

      // Send the message
      onProgress && onProgress(50);
      const messageId = await this.connection.invoke<string>(
        "SendMessage", 
        receiverId, 
        messageText, 
        fileData
      );

      // Complete
      onProgress && onProgress(100);
      console.log(`Message sent successfully with ID: ${messageId}`);
      return messageId;

    } catch (error) {
      console.error("Message sending error:", error);
      throw error;
    }
  }

  // Callback registration methods
  public onMessageReceived(callback: Function): void {
    const callbacks = this.callbacks.get("messageReceived") || [];
    if (!callbacks.includes(callback)) {
      this.callbacks.set("messageReceived", [...callbacks, callback]);
      console.log(`Message received handler registered. Total handlers: ${callbacks.length + 1}`);
    }
  }

  public offMessageReceived(callback: Function): void {
    const callbacks = this.callbacks.get("messageReceived") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("messageReceived", callbacks);
      console.log(`Message received handler removed. Remaining handlers: ${callbacks.length}`);
    }
  }

  public onMessageSent(callback: Function): void {
    const callbacks = this.callbacks.get("messageSent") || [];
    if (!callbacks.includes(callback)) {
      this.callbacks.set("messageSent", [...callbacks, callback]);
      console.log(`Message sent handler registered. Total handlers: ${callbacks.length + 1}`);
    }
  }

  public offMessageSent(callback: Function): void {
    const callbacks = this.callbacks.get("messageSent") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("messageSent", callbacks);
      console.log(`Message sent handler removed. Remaining handlers: ${callbacks.length}`);
    }
  }
 
  // Check auth status and handle logout
  public async checkAuthStatus(): Promise<boolean> {
    try {
      const token = await getToken();
      if (!token) {
        console.log("No token found, user is not authenticated");
        return false;
      }
      
      // Try to parse token to check if it's valid
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const now = Math.floor(Date.now() / 1000);
        
        // Check if token is expired
        if (payload.exp && payload.exp < now) {
          console.log("Token is expired");
          return false;
        }
        
        return true;
      } catch (e) {
        console.error("Error parsing token:", e);
        return false;
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      return false;
    }
  }
}

// Create and export singleton instance
export const signalRService = new SignalRService();