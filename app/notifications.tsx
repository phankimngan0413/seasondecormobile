import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { initApiClient } from "@/config/axiosConfig";
import { notificationService, Notification } from "@/services/NotificationHubService";
import { getToken } from '@/services/auth';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const isFocused = useIsFocused(); // Hook to detect when screen is focused

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>(
    notificationService.isConnected() ? 'connected' : 'disconnected'
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [lastTabChangeTime, setLastTabChangeTime] = useState<number>(Date.now());
  
  // Reference to store last active state
  const wasActiveRef = useRef<boolean>(true);

  // Define callback functions first to avoid "used before declaration" errors
  
  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isFocused) return; // Don't fetch if screen is not focused
    
    setLoading(prevLoading => !refreshing && prevLoading);
    setError(null);

    try {
      // Verify authentication
      const token = await getToken();
      
      if (!token) {
        console.warn("⚠️ User not logged in when fetching notifications. Redirecting.");
        router.replace('/(auth)/login');
        setLoading(false);
        return;
      }

      // Determine API endpoint based on filter type
      const url = filterType === 'all'
        ? `/api/Notification/getAllNotifications`
        : `/api/Notification/getUnreadNotification`;  // Use the original endpoint name

      console.log(`🔍 Fetching ${filterType} notifications from:`, url);

      const apiClient = await initApiClient();
      const response = await apiClient.get(url);

      console.log("📡 API response status:", response.status);

      if (response.data && (response.data.success === true || response.data.Success === true) && Array.isArray(response.data.data || response.data.Data)) {
        // Handle both camelCase and PascalCase response formats
        const data = response.data.data || response.data.Data;
        console.log(`✅ Successfully retrieved ${data.length} ${filterType} notifications`);
        setNotifications(data);
      } else if (Array.isArray(response.data)) {
        // Handle case where API returns array directly
        console.log(`✅ Successfully retrieved ${response.data.length} ${filterType} notifications (direct array)`);
        setNotifications(response.data);
      } else {
        console.error("❌ Unexpected API response format or empty data:", response.data);
        setError(`Unable to load ${filterType} notifications. Please try again later.`);
        setNotifications([]); // Clear old data on error
      }
    } catch (error: any) {
      console.error(`❌ Error fetching ${filterType} notifications:`, error);
      
      // Check for specific errors
      if (error.response && error.response.status === 401) {
        console.warn("🔐 Authentication error when fetching notifications. Redirecting.");
        router.replace('/(auth)/login');
      } else if (error.response && error.response.status === 404 && filterType === 'unread') {
        // Handle 404 for unread notifications - show a user-friendly message
        console.warn("⚠️ Unread notifications endpoint not found. Showing empty state.");
        setNotifications([]);
        setError("You have no unread notifications.");
      } else {
        setError("Connection error or error loading notification data.");
        setNotifications([]); // Clear old data
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, router, isFocused, refreshing]);

  // Format time helper function
  const formatTime = useCallback((dateString?: string) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const now = new Date();

      if (isNaN(date.getTime())) return '';

      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
         return diffInSeconds <= 1 ? 'just now' : `${diffInSeconds} seconds ago`;
      } else if (diffInSeconds < 3600) {
         const minutes = Math.floor(diffInSeconds / 60);
         return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
      }
      else if (diffInSeconds < 86400) {
        const diffInHours = Math.floor(diffInSeconds / 3600);
        return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
      } else {
        const diffInDays = Math.floor(diffInSeconds / 86400);
        return diffInDays === 1 ? 'yesterday' : `${diffInDays} days ago`;
      }
    } catch (error) {
      console.error("Error formatting time:", error);
      return '';
    }
  }, []);

  // Handler for new notifications received via SignalR
  const handleNewNotification = useCallback((notification: Notification) => {
    console.log("📱 New notification received:", notification.title);
    
    // Add new notification to the list (at the beginning)
    setNotifications(prevNotifications => {
      // Check if notification already exists
      const exists = prevNotifications.some(n => n.id === notification.id);
      if (exists) return prevNotifications;
      
      // Add the new notification at the beginning
      return [notification, ...prevNotifications];
    });
  }, []);

  // Handler for notification read events
  const handleNotificationRead = useCallback((notificationId: string) => {
    console.log("✅ Notification marked as read:", notificationId);
    
    // Update local state to reflect read status
    setNotifications(prevNotifications => 
      prevNotifications.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  }, []);

  // Handler for when all notifications are updated
  const handleNotificationsUpdated = useCallback(() => {
    console.log("🔄 All notifications have been updated");
    
    // Refresh notifications from API
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle notification press
  const handleNotificationPress = useCallback((notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      // Call notification service to mark as read
      notificationService.markAsRead(notification.id)
        .then(success => {
          if (!success) {
            console.warn(`⚠️ Could not mark notification ${notification.id} as read`);
          }
        })
        .catch(error => {
          console.error(`❌ Error marking notification ${notification.id} as read:`, error);
        });
        
      // Immediately update UI
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notification.id ? { ...notif, isRead: true } : notif
        )
      );
    }

    // Handle navigation based on URL
    if (notification.url) {
      const urlPath = notification.url.startsWith('/') ? notification.url : `/${notification.url}`;

      if (urlPath.startsWith('http')) {
        // External link
        Alert.alert(notification.title, `Link: ${notification.url}`);
        // You could use Linking.openURL(notification.url) here
      } else {
        // Internal link
        const pathStr = urlPath.split('?')[0];
        console.log("🔗 Internal navigation to:", urlPath);

        // Route handling
        if (pathStr === '/cart') {
          router.push('/cart');
        }
        else if (pathStr === '/notifications') {
          // Already on notifications page, do nothing or scroll to top
        }
        else if (pathStr.startsWith('/product/product-detail/')) {
          const id = pathStr.split('/').pop() || '';
          if (id) router.push(`/product/product-detail/${id}`);
        }
        else if (pathStr.startsWith('/quotation/list')) {
          router.push('/quotation/list');
        }
        else if (pathStr.startsWith('/quotation/contract/')) {
          const code = pathStr.split('/').pop() || '';
          if (code) router.push(`/quotation/contract/${code}`);
        }
        // Add other routes as needed
        else if (pathStr.startsWith('/screens/') || pathStr.startsWith('/booking/request')) {
          router.push(urlPath as any);
        }
        else {
          // Undefined route - just show content
          Alert.alert(notification.title, notification.content.replace(/<[^>]*>?/gm, ''));
        }
      }
    } else {
      // No URL - just show notification content
      Alert.alert(notification.title, notification.content.replace(/<[^>]*>?/gm, ''));
    }
  }, [router]);

  // Get notification icon based on type
  const getNotificationIcon = useCallback((type: string | undefined) => {
    switch (type) {
      case 'CONTRACT':
        return <Ionicons name="document-text-outline" size={24} color="#5fc1f1" />;
      case 'ORDER':
        return <Ionicons name="cart-outline" size={24} color="#FF6B6B" />;
      case 'QUOTATION':
        return <Ionicons name="calculator-outline" size={24} color="#6BCB77" />;
      case 'BOOKING':
        return <Ionicons name="calendar-outline" size={24} color="#FFD93D" />;
      case 'SYSTEM':
        return <Ionicons name="settings-outline" size={24} color="#B983FF" />;
      default:
        return <Ionicons name="notifications-outline" size={24} color="#4D96FF" />;
    }
  }, []);

  // Handle reconnection attempt
  const handleReconnect = useCallback(async () => {
    if (!userId) {
      try {
        // Replace this with your actual method to get the user ID
        const uid = "user-id"; // Placeholder - implement your actual user ID retrieval
        if (!uid) {
          console.warn("⚠️ Cannot reconnect: No user ID");
          return;
        }
        setUserId(uid);
      } catch (error) {
        console.error("❌ Error getting user ID:", error);
        return;
      }
    }
    
    setConnectionStatus('connecting');
    try {
      await notificationService.startConnection(userId!);
      setConnectionStatus('connected');
      console.log("✅ Successfully reconnected to NotificationHub");
      
      // Refresh notifications after reconnect
      fetchNotifications();
    } catch (error) {
      console.error("❌ Error reconnecting to NotificationHub:", error);
      setConnectionStatus('disconnected');
    }
  }, [userId, fetchNotifications]);

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (notifications.length === 0) return;
    
    try {
      const success = await notificationService.markAllAsRead();
      if (success) {
        // Update all notifications as read
        setNotifications(prevNotifications =>
          prevNotifications.map(notif => ({ ...notif, isRead: true }))
        );
        console.log("✅ All notifications marked as read");
      } else {
        console.warn("⚠️ Could not mark all notifications as read");
      }
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
    }
  }, [notifications]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
  }, [fetchNotifications]);

  // Initialize notification service and check auth status
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Check authentication
        const token = await getToken();
        if (!token) {
          console.warn("⚠️ User not logged in. Redirecting to login page.");
          router.replace('/(auth)/login');
          return;
        }

        // Get user information from token or other source
        try {
          // Placeholder for getting user ID - replace with actual implementation
          const uid = "user-id"; // Replace this with your actual user ID retrieval method
          setUserId(uid);
          
          // Initialize SignalR connection if not connected
          if (!notificationService.isConnected()) {
            setConnectionStatus('connecting');
            try {
              await notificationService.startConnection(uid);
              setConnectionStatus('connected');
              console.log("✅ NotificationHub connection successful");
            } catch (error) {
              console.error("❌ Error connecting to NotificationHub:", error);
              setConnectionStatus('disconnected');
              setError("Unable to connect to notification service. Please try again later.");
            }
          } else {
            setConnectionStatus('connected');
          }
        } catch (error) {
          console.warn("⚠️ Could not get user ID:", error);
          setError("Unable to identify current user");
        }

        // Fetch initial notifications
        fetchNotifications();
      } catch (error) {
        console.error("❌ Initialization error:", error);
        setError("App initialization error. Please try again later.");
        setLoading(false);
      }
    };

    initializeServices();

    // No cleanup needed here - will be handled in other effects
    return () => {};
  }, [router, fetchNotifications]);

  // Detect application coming to foreground (tab switching)
  useEffect(() => {
    // This will handle app state changes (background/foreground)
    const handleAppStateChange = () => {
      // If app becomes active and was previously inactive, refresh
      if (isFocused) {
        const wasActive = wasActiveRef.current;
        wasActiveRef.current = true;

        // Only refresh if coming from background or it's been at least 1 minute since last refresh
        const now = Date.now();
        const timeSinceLastRefresh = now - lastTabChangeTime;
        const shouldRefresh = !wasActive || timeSinceLastRefresh > 60000; // 1 minute threshold
        
        if (shouldRefresh) {
          console.log("📱 App came to foreground or tab switched - refreshing notifications");
          setLastTabChangeTime(now);
          fetchNotifications();
        }
      } else {
        // Mark as inactive when navigating away
        wasActiveRef.current = false;
      }
    };

    // Initial check
    handleAppStateChange();

    // Return cleanup function
    return () => {};
  }, [isFocused, fetchNotifications, lastTabChangeTime]);

  // Refresh notifications when the screen is focused
  useEffect(() => {
    if (isFocused) {
      console.log("📱 Screen focused - refreshing notifications");
      fetchNotifications();
    }
  }, [isFocused, fetchNotifications]);

  // Register for real-time notifications
  useEffect(() => {
    if (connectionStatus === 'connected') {
      // Register event handlers for real-time updates
      notificationService.onNotificationReceived(handleNewNotification);
      notificationService.onNotificationRead(handleNotificationRead);
      notificationService.onNotificationsUpdated(handleNotificationsUpdated);
    }

    return () => {
      // Clean up listeners when component unmounts or connectionStatus changes
      notificationService.offNotificationReceived(handleNewNotification);
      notificationService.offNotificationRead(handleNotificationRead);
      notificationService.offNotificationsUpdated(handleNotificationsUpdated);
    };
  }, [connectionStatus, handleNewNotification, handleNotificationRead, handleNotificationsUpdated]);

  // Effects to refresh when filterType changes
  useEffect(() => {
    if (!loading && !refreshing) {
      fetchNotifications();
    }
  }, [filterType, fetchNotifications, loading, refreshing]);

  // Filter toggle component
  const FilterToggle = () => (
    <View style={[styles.filterContainer, {
      backgroundColor: theme === 'dark' ? '#252525' : '#f0f0f0',
      borderColor: theme === 'dark' ? '#353535' : '#ddd'
    }]}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterType === 'all' && {
            backgroundColor: theme === 'dark' ? '#454545' : '#5fc1f1'
          }
        ]}
        onPress={() => setFilterType('all')}
      >
        <Text style={[
          styles.filterText,
          { color: filterType === 'all'
            ? (theme === 'dark' ? '#fff' : '#fff')
            : (theme === 'dark' ? '#bbb' : '#666')
          }
        ]}>
          All
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterType === 'unread' && {
            backgroundColor: theme === 'dark' ? '#454545' : '#5fc1f1'
          }
        ]}
        onPress={() => setFilterType('unread')}
      >
        <Text style={[
          styles.filterText,
          { color: filterType === 'unread'
            ? (theme === 'dark' ? '#fff' : '#fff')
            : (theme === 'dark' ? '#bbb' : '#666')
          }
        ]}>
          Unread
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Connection status indicator
  const ConnectionStatus = () => (
    <View style={styles.connectionStatusContainer}>
      <View style={[
        styles.connectionIndicator,
        { backgroundColor: 
          connectionStatus === 'connected' ? '#4CAF50' : 
          connectionStatus === 'connecting' ? '#FFC107' : '#F44336'
        }
      ]} />
      <Text style={[
        styles.connectionText,
        { color: theme === 'dark' ? '#ccc' : '#666' }
      ]}>
        {connectionStatus === 'connected' ? 'Connected' : 
         connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
      </Text>
      
      {connectionStatus === 'disconnected' && (
        <TouchableOpacity 
          style={styles.reconnectButton}
          onPress={handleReconnect}
        >
          <Text style={styles.reconnectText}>Reconnect</Text>
        </TouchableOpacity>
      )}
      
      {/* Mark all as read button */}
      {connectionStatus === 'connected' && notifications.some(n => !n.isRead) && (
        <TouchableOpacity 
          style={styles.markAllReadButton}
          onPress={handleMarkAllAsRead}
        >
          <Text style={styles.markAllReadText}>Mark all as read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // FlatList item renderer
  const renderItem = useCallback(({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: item.isRead
          ? (theme === 'dark' ? '#252525' : '#fff')
          : (theme === 'dark' ? '#353535' : '#f0f9ff')
        }
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[
        styles.iconContainer,
        { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
      ]}>
        {getNotificationIcon(item.type)}
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.content, { color: theme === 'dark' ? '#ccc' : '#555' }]}
          numberOfLines={2}
        >
          {/* Remove HTML tags */}
          {item.content ? item.content.replace(/<[^>]*>?/gm, '') : ''}
        </Text>
        <Text style={[styles.time, { color: theme === 'dark' ? '#999' : '#888' }]}>
          {formatTime(item.notifiedAt || item.createdAt)}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  ), [theme, handleNotificationPress, getNotificationIcon, formatTime]);

  // Empty state component
  const EmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-off-outline"
        size={64}
        color={theme === 'dark' ? '#555' : '#ccc'}
      />
      <Text style={[styles.emptyText, { color: theme === 'dark' ? '#fff' : '#555' }]}>
        {error || (filterType === 'all' ? "No notifications" : "No unread notifications")}
      </Text>
      {!error && filterType === 'unread' && (
        <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#aaa' : '#777' }]}>
          All your notifications have been read
        </Text>
      )}
      {connectionStatus !== 'connected' && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={handleReconnect}
        >
          <Text style={styles.retryButtonText}>Try reconnecting</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [theme, error, filterType, connectionStatus, handleReconnect]);

  // Main render
  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#151718' : '#f8f9fa' }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#151718' : '#ffffff'}
      />

      {/* Fixed Header */}
      <View style={[styles.header, { backgroundColor: theme === 'dark' ? '#151718' : '#ffffff' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme === 'dark' ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          Notifications
        </Text>
        {/* Right space for balance */}
        <View style={styles.headerRightSpace} />
      </View>

      {/* Connection status indicator */}
      <ConnectionStatus />

      {/* Filter toggle */}
      <FilterToggle />

      {/* Conditional rendering based on loading, error, or data */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5fc1f1" />
        </View>
      ) : notifications.length === 0 ? (
        // Show EmptyState if no notifications and not loading
        <EmptyState />
      ) : (
        // Show notification list
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#5fc1f1']}
              tintColor={theme === 'dark' ? '#fff' : '#5fc1f1'}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    // Elevation for Android
    elevation: 2,
    zIndex: 10,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    width: 40,
    alignItems: 'flex-start',
  },
  headerRightSpace: {
    width: 40,
  },
  connectionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
  },
  reconnectButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: '#5fc1f1',
    borderRadius: 4,
  },
  reconnectText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  markAllReadButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: '#6BCB77',
    borderRadius: 4,
  },
  markAllReadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 14,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#5fc1f1',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative',
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  content: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5fc1f1',
  },
});