import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getTrackingByBookingCodeAPI, ITrackingItem } from '@/utils/trackingAPI';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';

// Constants
const PRIMARY_COLOR = '#5fc1f1';

// Generic type for ParamListBase which is required for Route
interface ParamListBase {
  [key: string]: any;
}

// Type for search params that extends ParamListBase for compatibility with Route
interface TrackingParams extends ParamListBase {
  bookingCode?: string;
}

const TrackingScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();
  const params = useLocalSearchParams<TrackingParams>();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<ITrackingItem[] | null>(null);

  // Fetch tracking data when the component mounts or booking code changes
  useEffect(() => {
    if (params.bookingCode) {
      fetchTrackingData(params.bookingCode);
    }
  }, [params.bookingCode]);

  const fetchTrackingData = async (trackingCode: string) => {
    if (!trackingCode.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await getTrackingByBookingCodeAPI(trackingCode);
      
      if (response.success && response.trackingItems.length > 0) {
        // Sort by createdAt date, newest first
        const sortedItems = [...response.trackingItems].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        console.log(`Found ${sortedItems.length} tracking items`);
        setTrackingData(sortedItems);
      } else {
        setError(response.message || 'No tracking information found for this booking code.');
      }
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError('Failed to fetch tracking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (params.bookingCode) {
      fetchTrackingData(params.bookingCode);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string): { date: string, time: string } => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).replace(/\s/g, ' ')
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      
      {/* Safe area padding for status bar */}
      <SafeAreaView style={{ backgroundColor: colors.background }}>
        {/* Custom Header */}
        <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tracking Details</Text>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading tracking information...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#e74c3c" />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: PRIMARY_COLOR }]} 
            onPress={handleSubmit}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : trackingData && trackingData.length > 0 ? (
        <ScrollView style={styles.contentContainer}>
          {/* Booking Info */}
          <View style={[styles.bookingInfoCard, { 
            backgroundColor: colors.card,
            shadowColor: theme === 'dark' ? '#000' : '#000',
          }]}>
            <View style={styles.bookingCodeRow}>
              <MaterialCommunityIcons name="qrcode" size={20} color={PRIMARY_COLOR} />
              <Text style={[styles.bookingCode, { color: colors.text }]}>
                {trackingData[0].bookingCode}
              </Text>
            </View>
            <View style={styles.updatedRow}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.updatedText, { color: colors.textSecondary }]}>
                Updated: {formatDate(trackingData[0].createdAt)}
              </Text>
            </View>
          </View>
          
          {/* Tracking Timeline */}
          <View style={styles.timelineHeader}>
            <MaterialCommunityIcons name="timeline-text" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.timelineTitle, { color: colors.text }]}>
              Tracking Timeline
            </Text>
          </View>
          
          {/* Map through all tracking items in the timeline */}
          {trackingData.map((item, index) => {
            const { date, time } = formatShortDate(item.createdAt);
            return (
              <View key={item.id} style={styles.timelineItem}>
                {/* Left side - date column */}
                <View style={styles.dateColumn}>
                  <Text style={[styles.dateDay, { color: colors.text }]}>{date}</Text>
                  <Text style={[styles.dateTime, { color: colors.textSecondary }]}>{time}</Text>
                </View>
                
                {/* Right side - content */}
                <View style={styles.contentColumn}>
                  <View style={[styles.taskCard, { 
                    backgroundColor: colors.card,
                    shadowColor: theme === 'dark' ? '#000' : '#000',
                  }]}>
                    {/* Task header */}
                    <View style={[styles.taskHeader, { 
                      backgroundColor: theme === 'dark' ? '#546e7a' : '#7f8c8d'
                    }]}>
                      <Text style={styles.taskText}>{item.task}</Text>
                    </View>
                    
                    {/* Task content */}
                    <View style={styles.taskContent}>
                      {item.note && (
                        <View style={styles.noteSection}>
                          <Text style={[styles.noteLabel, { color: colors.text }]}>Notes:</Text>
                          <Text style={[styles.noteText, { color: colors.text }]}>{item.note}</Text>
                        </View>
                      )}
                      
                      {/* Images */}
                      {item.images && item.images.length > 0 && (
                        <View style={styles.imagesContainer}>
                          {item.images.map((image) => (
                            <View key={image.id} style={styles.imageWrapper}>
                              <Image
                                source={{ uri: image.imageUrl }}
                                style={styles.trackingImage}
                                resizeMode="cover"
                              />
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          
          <View style={{ height: 30 }} />
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={50} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Enter a booking code to view tracking information
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 46, // Balance the back button
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  bookingInfoCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingCode: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updatedText: {
    fontSize: 13,
    marginLeft: 5,
    fontStyle: 'italic',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 5, 
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  dateColumn: {
    width: 75,
    paddingTop: 8,
  },
  dateDay: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateTime: {
    fontSize: 12,
    marginTop: 2,
  },
  contentColumn: {
    flex: 1,
  },
  taskCard: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  taskText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  taskContent: {
    padding: 12,
  },
  noteSection: {
    marginBottom: 8,
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
  },
  imagesContainer: {
    marginTop: 8,
  },
  imageWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  trackingImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 15,
    textAlign: 'center',
  },
});

export default TrackingScreen;