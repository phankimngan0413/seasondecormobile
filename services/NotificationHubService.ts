// Import statements for NotificationService.ts
import * as signalR from "@microsoft/signalr";
import { BASE_URL } from "@/config/apiConfig";
import { getFormattedToken } from "./auth";
import { Platform } from 'react-native';

export interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  notifiedAt?: string;
  isRead: boolean;
  url?: string;
  type: 'CONTRACT' | 'BOOKING' | 'QUOTATION' | 'GENERAL' | 'ORDER' | 'SYSTEM';
}

class NotificationService {
  private _connection: signalR.HubConnection | null = null;
  private callbacks: Map<string, Function[]> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor() {
    this.callbacks.set("notificationReceived", []);
    this.callbacks.set("notificationRead", []);
    this.callbacks.set("notificationsUpdated", []);
    
    console.log("NotificationService initialized");
  }

  public isConnected(): boolean {
    return this._connection !== null && 
           this._connection.state === signalR.HubConnectionState.Connected;
  }

  public async startConnection(userId: string): Promise<void> {
    try {
      // Don't reconnect if already connected
      if (this._connection && this._connection.state === signalR.HubConnectionState.Connected) {
        console.log("Already connected to NotificationHub");
        return;
      }
      
      // Cleanup any existing connection
      if (this._connection) {
        await this.stopConnection();
      }

      // Clear any existing reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Get the auth token
      const token = await getFormattedToken();
      if (!token) {
        throw new Error("No authentication token available for NotificationHub");
      }

      console.log("Connecting to NotificationHub at:", `${BASE_URL}/notificationHub`);
      
      // Create a new SignalR connection
      this._connection = new signalR.HubConnectionBuilder()
        .withUrl(`${BASE_URL}/notificationHub`, {
          skipNegotiation: Platform.OS === 'web', // Only skip on web
          transport: signalR.HttpTransportType.WebSockets,
          accessTokenFactory: () => token,
          headers: {
            'Authorization': token
          }
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000]) // Reconnect every 0s, 2s, 10s, 30s
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this._connection.onreconnecting((error) => {
        console.log("NotificationHub reconnecting:", error);
      });

      this._connection.onreconnected((connectionId) => {
        console.log("NotificationHub reconnected with ID:", connectionId);
        this.reconnectAttempts = 0;
      });

      this._connection.onclose((error) => {
        console.log("NotificationHub connection closed:", error);
        this._connection = null;
        
        // Attempt to reconnect if there was an error
        if (error) {
          this.scheduleReconnect(userId);
        }
      });

      // Set up notification handlers
      this._connection.on("ReceiveNotification", (notification) => {
        console.log("Notification received:", notification);
        const callbacks = this.callbacks.get("notificationReceived") || [];
        callbacks.forEach((callback) => callback(notification));
      });

      this._connection.on("NotificationMarkedAsRead", (notificationId) => {
        console.log("Notification marked as read:", notificationId);
        const callbacks = this.callbacks.get("notificationRead") || [];
        callbacks.forEach((callback) => callback(notificationId));
      });

      this._connection.on("AllNotificationsMarkedAsRead", () => {
        console.log("All notifications marked as read");
        const callbacks = this.callbacks.get("notificationsUpdated") || [];
        callbacks.forEach((callback) => callback());
      });

      // Start the connection
      try {
        await this._connection.start();
        console.log("NotificationHub connected successfully");
        this.reconnectAttempts = 0;
      } catch (startError) {
        console.error("Error starting NotificationHub connection:", startError);
        this._connection = null;
        throw startError;
      }
    } catch (error) {
      console.error("NotificationHub connection error:", error);
      this._connection = null;
      throw error;
    }
  }

  private scheduleReconnect(userId: string) {
    // Only attempt to reconnect if we haven't reached the maximum number of attempts
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimer = setTimeout(async () => {
        try {
          await this.startConnection(userId);
        } catch (error) {
          console.error("Scheduled reconnect failed:", error);
        }
      }, delay);
    } else {
      console.log("Maximum reconnect attempts reached");
      this.reconnectAttempts = 0;
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this._connection) {
      try {
        await this._connection.stop();
        console.log("NotificationHub disconnected");
      } catch (error) {
        console.error("Error disconnecting from NotificationHub:", error);
      }
      this._connection = null;
    }
  }

  // Mark notification as read
  public async markAsRead(notificationId: string): Promise<boolean> {
    try {
      if (!this._connection || this._connection.state !== signalR.HubConnectionState.Connected) {
        throw new Error("NotificationHub connection not established");
      }

      // Convert string ID to number if needed (depending on your API)
      const numericId = parseInt(notificationId, 10);
      if (isNaN(numericId)) {
        console.error("Invalid notification ID:", notificationId);
        return false;
      }

      await this._connection.invoke("MarkAsRead", numericId);
      console.log(`Notification ${notificationId} marked as read`);
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  // Mark all notifications as read
  public async markAllAsRead(): Promise<boolean> {
    try {
      if (!this._connection || this._connection.state !== signalR.HubConnectionState.Connected) {
        throw new Error("NotificationHub connection not established");
      }

      await this._connection.invoke("MarkAllAsRead");
      console.log("All notifications marked as read");
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  // Callback registration
  public onNotificationReceived(callback: (notification: Notification) => void): void {
    const callbacks = this.callbacks.get("notificationReceived") || [];
    if (!callbacks.includes(callback)) {
      this.callbacks.set("notificationReceived", [...callbacks, callback]);
    }
  }

  public offNotificationReceived(callback: (notification: Notification) => void): void {
    const callbacks = this.callbacks.get("notificationReceived") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("notificationReceived", callbacks);
    }
  }

  public onNotificationRead(callback: (notificationId: string) => void): void {
    const callbacks = this.callbacks.get("notificationRead") || [];
    if (!callbacks.includes(callback)) {
      this.callbacks.set("notificationRead", [...callbacks, callback]);
    }
  }

  public offNotificationRead(callback: (notificationId: string) => void): void {
    const callbacks = this.callbacks.get("notificationRead") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("notificationRead", callbacks);
    }
  }

  public onNotificationsUpdated(callback: () => void): void {
    const callbacks = this.callbacks.get("notificationsUpdated") || [];
    if (!callbacks.includes(callback)) {
      this.callbacks.set("notificationsUpdated", [...callbacks, callback]);
    }
  }

  public offNotificationsUpdated(callback: () => void): void {
    const callbacks = this.callbacks.get("notificationsUpdated") || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.callbacks.set("notificationsUpdated", callbacks);
    }
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();