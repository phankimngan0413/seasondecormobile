import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { 
  INotification, 
  getAllNotificationsAPI,
  getUnreadNotificationsAPI
} from '@/utils/notificationsAPI';
import { notificationService } from '@/services/NotificationHubService';

// Interface for the notification context
interface NotificationContextType {
  // State
  notifications: INotification[];
  unreadNotifications: INotification[];
  isConnected: boolean;
  loading: boolean;
  
  // Actions
  connect: (userId: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  fetchAllNotifications: () => Promise<void>;
  fetchUnreadNotifications: () => Promise<void>;
}

// Default context value
const defaultContextValue: NotificationContextType = {
  notifications: [],
  unreadNotifications: [],
  isConnected: false,
  loading: false,
  
  connect: async () => false,
  disconnect: async () => {},
  fetchAllNotifications: async () => {},
  fetchUnreadNotifications: async () => {}
};

// Create context
const NotificationContext = createContext<NotificationContextType>(defaultContextValue);

// Constants
const USER_ID_KEY = 'userId';
const CONNECTION_THROTTLE_MS = 5000;

// Props for provider component
interface NotificationProviderProps {
  children: ReactNode;
}

// Provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // State for notifications
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<INotification[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Connection tracking
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState<number>(0);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  
  // Refs
  const appState = React.useRef(AppState.currentState);
  const notificationsRef = React.useRef<INotification[]>([]);
  
  // Update ref when state changes
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Helper function to get user ID
  const getUserId = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(USER_ID_KEY);
    } catch (error) {
      console.error("Error getting user ID:", error);
      return null;
    }
  };

  // Fetch all notifications from API
  const fetchAllNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📨 Fetching all notifications from API");
      const result = await getAllNotificationsAPI();
      
      console.log(`📨 Received ${result.length} notifications`);
      setNotifications(result || []);
    } catch (error) {
      console.error("❌ Error fetching all notifications:", error);
      setError("Failed to fetch notifications. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread notifications from API
  const fetchUnreadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📨 Fetching unread notifications from API");
      const result = await getUnreadNotificationsAPI();
      
      console.log(`📨 Received ${result.length} unread notifications`);
      setUnreadNotifications(result || []);
    } catch (error) {
      console.error("❌ Error fetching unread notifications:", error);
      setError("Failed to fetch unread notifications. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect to notification service
  const connect = useCallback(async (userId: string): Promise<boolean> => {
    try {
      // Throttle connection attempts (max once every 5 seconds)
      const now = Date.now();
      if (now - lastConnectionAttempt < CONNECTION_THROTTLE_MS) {
        console.log(`Connection throttled. Last attempt: ${new Date(lastConnectionAttempt).toLocaleTimeString()}`);
        return false;
      }
      
      setLastConnectionAttempt(now);
      setConnectionAttempts(prev => prev + 1);
      setReconnecting(true);

      console.log(`Attempting to connect to notification hub, attempt #${connectionAttempts + 1}`);
      
      // Only attempt connection if not already connected
      if (!notificationService.isConnected()) {
        await notificationService.startConnection(userId);
        setIsConnected(true);
        setConnectionAttempts(0);
        console.log("🟢 Connected to notification service");
        
        // Force refresh notifications after successful connection
        await fetchAllNotifications();
        await fetchUnreadNotifications();
        
        setReconnecting(false);
        return true;
      } else {
        console.log("Already connected to notification service");
        setReconnecting(false);
        return true;
      }
    } catch (error) {
      console.error("⚠️ Failed to connect to notification hub:", error);
      setIsConnected(false);
      setReconnecting(false);
      
      // After multiple failed attempts, we'll still fetch notifications via API
      if (connectionAttempts >= 2) {
        await fetchAllNotifications();
        await fetchUnreadNotifications();
      }
      
      return false;
    }
  }, [lastConnectionAttempt, connectionAttempts, fetchAllNotifications, fetchUnreadNotifications]);

  // Disconnect from notification service
  const disconnect = useCallback(async () => {
    try {
      await notificationService.stopConnection();
      setIsConnected(false);
      console.log("🟣 Disconnected from notification service");
    } catch (error) {
      console.error("Error disconnecting from notification service:", error);
    }
  }, []);

  // Set up event handlers for notification service
  useEffect(() => {
    // Handler for new notifications
    const handleNewNotification = async (notification: any) => {
      // Ensure notification conforms to INotification structure
      const typedNotification: INotification = {
        id: notification.id,
        title: notification.title,
        content: notification.content,
        url: notification.url,
        notifiedAt: notification.notifiedAt,
        isRead: notification.isRead,
        type: notification.type
      };
      
      console.log("🔔 New notification received:", typedNotification.title);
      
      try {
        // Add to local state if not already present
        setNotifications(prev => {
          const exists = prev.some(n => n.id === typedNotification.id);
          if (!exists) {
            return [typedNotification, ...prev];
          }
          return prev;
        });
        
        // Update unread notifications if notification is unread
        if (!typedNotification.isRead) {
          setUnreadNotifications(prev => {
            const exists = prev.some(n => n.id === typedNotification.id);
            if (!exists) {
              return [typedNotification, ...prev];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Error handling new notification:", error);
      }
    };
    
    // Register event handlers
    notificationService.onNotificationReceived(handleNewNotification);
    
    // Clean up event handlers on unmount
    return () => {
      notificationService.offNotificationReceived(handleNewNotification);
    };
  }, []);

  // Handle app state changes (background to foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        console.log('📱 App has come to the foreground');
        
        // Reconnect if needed
        if (!isConnected && !reconnecting) {
          const userId = await getUserId();
          if (userId) {
            await connect(userId);
          }
        }
        
        // Always refresh data when app comes to foreground
        await fetchAllNotifications();
        await fetchUnreadNotifications();
      }
      
      appState.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [isConnected, reconnecting, connect, fetchAllNotifications, fetchUnreadNotifications]);

  // Initialize data on component mount
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        if (!isMounted) return;
        
        // First, try to connect to notification service
        const userId = await getUserId();
        if (userId) {
          await connect(userId);
        }
        
        // Fetch initial notifications even if connection fails
        await fetchAllNotifications();
        await fetchUnreadNotifications();
      } catch (error) {
        console.error("Error initializing notification context:", error);
        
        // Still try to fetch notifications via API even if SignalR fails
        if (isMounted) {
          await fetchAllNotifications();
          await fetchUnreadNotifications();
        }
      }
    };
    
    initialize();
    
    // Clean up on unmount
    return () => {
      isMounted = false;
    };
  }, [connect, fetchAllNotifications, fetchUnreadNotifications]);

  // Periodically check connection status
  useEffect(() => {
    const checkConnectionInterval = setInterval(() => {
      const connectionStatus = notificationService.isConnected();
      if (connectionStatus !== isConnected) {
        setIsConnected(connectionStatus);
      }
    }, 5000);
    
    return () => {
      clearInterval(checkConnectionInterval);
    };
  }, [isConnected]);

  // Context value
  const contextValue: NotificationContextType = {
    notifications,
    unreadNotifications,
    isConnected,
    loading,
    
    connect,
    disconnect,
    fetchAllNotifications,
    fetchUnreadNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

// Re-export types
export type { INotification } from '@/utils/notificationsAPI';