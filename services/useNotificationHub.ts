import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService, Notification } from './NotificationHubService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing current user ID in AsyncStorage
const USER_ID_STORAGE_KEY = 'current_user_id';

interface UseNotificationProps {
  userId?: string;
  onNotificationReceived?: (notification: Notification) => void;
  onNotificationRead?: (notificationId: string) => void;
  onNotificationsUpdated?: () => void;
}

interface UseNotificationReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  connect: (userId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  fetchNotifications: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useNotification({
  userId,
  onNotificationReceived,
  onNotificationRead,
  onNotificationsUpdated
}: UseNotificationProps = {}): UseNotificationReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const savedUserIdRef = useRef<string | null>(null);
  
  // Load the saved user ID from AsyncStorage
  useEffect(() => {
    const loadSavedUserId = async () => {
      try {
        const savedUserId = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
        if (savedUserId) {
          savedUserIdRef.current = savedUserId;
        }
      } catch (error) {
        console.error('Error loading saved user ID:', error);
      }
    };
    
    loadSavedUserId();
  }, []);
  
  // Connect to NotificationHub
  const connect = useCallback(async (userIdToConnect: string) => {
    try {
      if (!userIdToConnect) {
        throw new Error('User ID is required to connect to NotificationHub');
      }
      
      // Save the user ID to AsyncStorage
      await AsyncStorage.setItem(USER_ID_STORAGE_KEY, userIdToConnect);
      savedUserIdRef.current = userIdToConnect;
      
      // Connect to NotificationHub
      await notificationService.startConnection(userIdToConnect);
      setIsConnected(true);
      
      // Fetch initial notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Error connecting to NotificationHub:', error);
      setError('Không thể kết nối đến dịch vụ thông báo');
    }
  }, []);
  
  // Disconnect from NotificationHub
  const disconnect = useCallback(async () => {
    try {
      await notificationService.stopConnection();
      setIsConnected(false);
    } catch (error) {
      console.error('Error disconnecting from NotificationHub:', error);
    }
  }, []);
  
  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Implementation depends on your API
      // This is just a placeholder - replace with your actual API call
      const response = await fetch(`${BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': await getFormattedToken() || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data || []);
        // Calculate unread count
        const unreadCount = (data.data || []).filter((notif: Notification) => !notif.isRead).length;
        setUnreadCount(unreadCount);
      } else {
        throw new Error(data.message || 'Không thể tải thông báo');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Đã xảy ra lỗi khi tải thông báo');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const success = await notificationService.markAsRead(notificationId);
      
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const success = await notificationService.markAllAsRead();
      
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        
        // Update unread count
        setUnreadCount(0);
      }
      
      return success;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, []);
  
  // Handle AppState changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // If app is coming from background to active
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Check connection and reconnect if needed
        if (!notificationService.isConnected()) {
          // Try to reconnect with saved user ID
          const userIdToUse = userId || savedUserIdRef.current;
          
          if (userIdToUse) {
            try {
              await connect(userIdToUse);
            } catch (error) {
              console.error('Failed to reconnect to NotificationHub:', error);
            }
          }
        }
        
        // Refresh notifications
        fetchNotifications().catch(error => {
          console.error('Failed to refresh notifications:', error);
        });
      }
      
      appStateRef.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, [connect, fetchNotifications, userId]);
  
  // Set up notification handlers
  useEffect(() => {
    // Handle incoming notifications
    const handleNotificationReceived = (notification: Notification) => {
      console.log('New notification received:', notification);
      
      // Add to local state
      setNotifications(prev => [notification, ...prev]);
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Call user's callback if provided
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    };
    
    // Handle notification marked as read
    const handleNotificationRead = (notificationId: string) => {
      console.log('Notification marked as read:', notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      
      // Update unread count (if the notification is in our current list)
      const notificationExists = notifications.some(n => n.id === notificationId && !n.isRead);
      if (notificationExists) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Call user's callback if provided
      if (onNotificationRead) {
        onNotificationRead(notificationId);
      }
    };
    
    // Handle all notifications marked as read
    const handleNotificationsUpdated = () => {
      console.log('All notifications marked as read');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
      
      // Call user's callback if provided
      if (onNotificationsUpdated) {
        onNotificationsUpdated();
      }
    };
    
    // Register handlers
    notificationService.onNotificationReceived(handleNotificationReceived);
    notificationService.onNotificationRead(handleNotificationRead);
    notificationService.onNotificationsUpdated(handleNotificationsUpdated);
    
    // Connect to NotificationHub if userId is provided
    if (userId) {
      connect(userId).catch(error => {
        console.error('Failed to connect to NotificationHub:', error);
      });
    }
    
    // Cleanup
    return () => {
      notificationService.offNotificationReceived(handleNotificationReceived);
      notificationService.offNotificationRead(handleNotificationRead);
      notificationService.offNotificationsUpdated(handleNotificationsUpdated);
      
      // Don't disconnect here as other components might still be using the connection
    };
  }, [connect, userId, onNotificationReceived, onNotificationRead, onNotificationsUpdated, notifications]);
  
  // Check connection status periodically
// Cập nhật trạng thái kết nối
useEffect(() => {
  const checkConnection = () => {
    const connected = notificationService.isConnected();
    setIsConnected(connected === true);  };
  
  // Kiểm tra kết nối ban đầu
  checkConnection();
  
  // Kiểm tra kết nối mỗi 5 giây
  const interval = setInterval(checkConnection, 5000);
  
  return () => {
    clearInterval(interval);
  };
}, []);
  
  return {
    notifications,
    unreadCount,
    isConnected,
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    loading,
    error
  };
}

// Import needed for fetchNotifications
// Add these at the top of the file
import { BASE_URL } from '@/config/apiConfig';
import { getFormattedToken } from './auth';