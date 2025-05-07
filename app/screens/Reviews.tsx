import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  RefreshControl,
  Alert,
  StatusBar,
  Dimensions,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { 
  getReviewByAccountDirectAPI, 
  deleteReviewAPI,
  IReview
} from '@/utils/reviewAPI';

const { width } = Dimensions.get('window');

// Modified interfaces to match your API response format
interface IReviewItem {
  id: number;
  name: string;
  userName?: string;
  avatar: string;
  rate: number;
  comment: string;
  createAt: string;
  images: string[];
  productId?: number;
  productName?: string;
  productImage?: string;
  serviceId?: number;
  serviceName?: string;
  serviceImage?: string;
}

const ReviewScreen = () => {
  const router = useRouter();
  const [reviews, setReviews] = useState<IReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  // Animation values
  const scrollY = new Animated.Value(0);
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.8, 0.6],
    extrapolate: 'clamp',
  });
  
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    // Load reviews when component mounts
    setError(null);
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get reviews using direct API call
      const response = await getReviewByAccountDirectAPI();
      
      // Initialize reviewsArray
      let reviewsArray = [];
      
      // Try to extract reviews from response in various possible formats
      if (Array.isArray(response)) {
        reviewsArray = response;
      } 
      else if (response && Array.isArray(response.data)) {
        reviewsArray = response.data;
      }
      else if (response && response.data && Array.isArray(response.data.data)) {
        reviewsArray = response.data.data;
      }
      
      // Map the reviews to add default properties if missing
      const mappedReviews = reviewsArray.map((item: any) => ({
        id: item.id,
        name: item.name || 'Anonymous',
        userName: item.userName || item.name,
        avatar: item.avatar || '',
        rate: item.rate || 0,
        comment: item.comment || '',
        createAt: item.createAt || new Date().toISOString(),
        images: item.images || [],
        // Add default product/service properties if not present
        productId: item.productId,
        productName: item.productName || 'General Review',
        productImage: item.productImage,
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        serviceImage: item.serviceImage
      }));
      
      setReviews(mappedReviews);
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load reviews';
      console.error(`❌ Error fetching reviews: ${errorMessage}`);
      setError(errorMessage);
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReviewAPI(reviewId);
              
              // Update the lists after successful deletion
              setReviews(prev => prev.filter(r => r.id !== reviewId));
              
              Alert.alert("Success", "Review deleted successfully");
            } catch (error) {
              console.error('Error deleting review:', error);
              Alert.alert("Error", "Failed to delete review. Please try again.");
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    fetchReviews();
  };
  
  const toggleExpandReview = (id: number) => {
    setExpandedReview(expandedReview === id ? null : id);
  };

  const renderReviewItem = ({ item, index }: { item: IReviewItem, index: number }) => {
    const isExpanded = expandedReview === item.id;
    const isFirst = index === 0;
    const isLast = index === reviews.length - 1;
    
    // Calculate date difference
    const reviewDate = new Date(item.createAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - reviewDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let timeText = '';
    if (diffDays === 0) {
      timeText = 'Today';
    } else if (diffDays === 1) {
      timeText = 'Yesterday';
    } else if (diffDays < 7) {
      timeText = `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      timeText = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      timeText = reviewDate.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => toggleExpandReview(item.id)}
        style={[
          styles.reviewCard, 
          { 
            backgroundColor: colors.card,
            marginTop: isFirst ? 8 : 16,
            marginBottom: isLast ? 24 : 0,
          }
        ]}
      >
        <View style={styles.reviewHeaderRow}>
          <View style={styles.userInfoContainer}>
            {item.avatar ? (
              <Image 
                source={{ uri: item.avatar }} 
                style={styles.userAvatar} 
                resizeMode="cover" 
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitial}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            <View style={styles.userTextInfo}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {timeText}
              </Text>
            </View>
          </View>
          
          <View style={styles.ratingDisplay}>
            <Text style={[styles.ratingText, { color: colors.text }]}>{item.rate}.0</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons 
                  key={star}
                  name={star <= item.rate ? "star" : "star-outline"} 
                  size={14} 
                  color="#FFD700" 
                  style={{ marginHorizontal: 1 }}
                />
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <Text 
            style={[
              styles.reviewComment, 
              { 
                color: colors.text,
                height: isExpanded ? undefined : undefined
              }
            ]}
            numberOfLines={isExpanded ? undefined : 3}
          >
            {item.comment}
          </Text>
          
          {item.images && item.images.length > 0 && (
            <View style={styles.imagesContainer}>
              {item.images.slice(0, isExpanded ? item.images.length : 1).map((image, imgIndex) => (
                <Image 
                  key={imgIndex} 
                  source={{ uri: image }} 
                  style={[
                    styles.reviewImage,
                    isExpanded ? styles.expandedImage : styles.collapsedImage,
                    { borderColor: colors.border }
                  ]} 
                  resizeMode="cover"
                />
              ))}
              
              {!isExpanded && item.images.length > 1 && (
                <View style={styles.moreImagesOverlay}>
                  <Text style={styles.moreImagesText}>+{item.images.length - 1}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.reviewActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
            onPress={(e) => {
              e.stopPropagation();
              toggleExpandReview(item.id);
            }}
          >
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={colors.primary} 
            />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              {isExpanded ? "Show Less" : "Show More"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FF3B3010' }]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteReview(item.id);
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons 
        name="alert-circle-outline" 
        size={60} 
        color={colors.error || "#FF3B30"} 
      />
      <Text style={[styles.errorText, { color: colors.error || "#FF3B30" }]}>
        {error}
      </Text>
      <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
        We couldn't load your reviews at this time.
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={onRefresh}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyReviews = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyImageContainer}>
        <Ionicons 
          name="star-outline" 
          size={80} 
          color={colors.primary + '40'} 
        />
        <Ionicons 
          name="chatbubble-outline" 
          size={60} 
          color={colors.primary + '60'} 
          style={styles.overlappingIcon}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Reviews Yet
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        When you review products or services, they'll appear here.
      </Text>
    </View>
  );
  
  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            backgroundColor: colors.card, 
            borderBottomColor: colors.border,
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslate }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          My Reviews
        </Text>
        
        <View style={styles.headerRight}>
          <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
      </Animated.View>
      
      {/* Content */}
      <View style={styles.content}>
        {loading && reviews.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading your reviews...
            </Text>
          </View>
        ) : error ? (
          renderError()
        ) : (
          <Animated.FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
              styles.listContent,
              reviews.length === 0 && styles.emptyListContent
            ]}
            ListEmptyComponent={renderEmptyReviews}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  reviewCount: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  reviewCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
  },
  ratingDisplay: {
    alignItems: 'center',
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingStars: {
    flexDirection: 'row',
  },
  contentContainer: {
    marginBottom: 12,
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
  },
  reviewImage: {
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  collapsedImage: {
    width: 120,
    height: 120,
  },
  expandedImage: {
    width: (width - 48) / 2,
    height: (width - 48) / 2,
  },
  moreImagesOverlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyImageContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  overlappingIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 280,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  }
});

export default ReviewScreen;