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
  StatusBar
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

// Interface for product reviews and service reviews
interface IProductReview {
  id: number;
  name: string;
  userName?: string;
  avatar: string;
  rate: number;
  comment: string;
  createAt: string;
  images: string[];
  productId: number;
  productName: string;
  productImage?: string;
}

interface IServiceReview {
  id: number;
  name: string;
  userName?: string;
  avatar: string;
  rate: number;
  comment: string;
  createAt: string;
  images: string[];
  serviceId: number;
  serviceName: string;
  serviceImage?: string;
}

const ReviewScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('products');
  
  const [productReviews, setProductReviews] = useState<IProductReview[]>([]);
  const [serviceReviews, setServiceReviews] = useState<IServiceReview[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  useEffect(() => {
    // Load reviews when component mounts or tab changes
    setError(null);
    fetchReviews();
  }, [activeTab]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📝 Fetching ${activeTab} reviews`);
      
      // Get reviews using direct API call
      const response = await getReviewByAccountDirectAPI();
      
      // Log the exact response for debugging
      console.log('EXACT API RESPONSE:', JSON.stringify(response));
      
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
      else if (response && response.success === true) {
        // If success is true but data structure is unclear
        if (response.data) {
          if (Array.isArray(response.data)) {
            reviewsArray = response.data;
          } 
          else if (response.data.data && Array.isArray(response.data.data)) {
            reviewsArray = response.data.data;
          }
        }
      }
      
      console.log(`📊 Found ${reviewsArray.length} total reviews after extraction`);
      
      // Process the reviews based on active tab
      if (activeTab === 'products') {
        // Filter for product reviews - only include items with valid productId
        const productData = reviewsArray
          .filter((item: { productId: null | undefined; }) => item.productId !== undefined && item.productId !== null)
          .map((item: { id: any; name: any; userName: any; avatar: any; rate: any; comment: any; createAt: any; images: any; productId: any; productName: any; productImage: any; }) => ({
            id: item.id,
            name: item.name || item.userName || 'Anonymous',
            userName: item.userName,
            avatar: item.avatar || '',
            rate: item.rate || 0,
            comment: item.comment || '',
            createAt: item.createAt || new Date().toISOString(),
            images: item.images || [],
            productId: Number(item.productId), 
            productName: item.productName || 'Unknown Product',
            productImage: item.productImage || ''
          })) as IProductReview[];
          
        console.log(`🛍️ Found ${productData.length} product reviews`);
        setProductReviews(productData);
      } else {
        // Filter for service reviews - only include items with valid serviceId
        const serviceData = reviewsArray
          .filter((item: { serviceId: null | undefined; }) => item.serviceId !== undefined && item.serviceId !== null)
          .map((item: { id: any; name: any; userName: any; avatar: any; rate: any; comment: any; createAt: any; images: any; serviceId: any; serviceName: any; serviceImage: any; }) => ({
            id: item.id,
            name: item.name || item.userName || 'Anonymous',
            userName: item.userName,
            avatar: item.avatar || '',
            rate: item.rate || 0,
            comment: item.comment || '',
            createAt: item.createAt || new Date().toISOString(),
            images: item.images || [],
            serviceId: Number(item.serviceId), 
            serviceName: item.serviceName || 'Unknown Service',
            serviceImage: item.serviceImage || ''
          })) as IServiceReview[];
          
        console.log(`🛎️ Found ${serviceData.length} service reviews`);
        setServiceReviews(serviceData);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load reviews';
      console.error(`❌ Error fetching reviews: ${errorMessage}`);
      setError(errorMessage);
      
      // Reset data arrays on error
      if (activeTab === 'products') {
        setProductReviews([]);
      } else {
        setServiceReviews([]);
      }
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
              if (activeTab === 'products') {
                setProductReviews(prev => prev.filter(r => r.id !== reviewId));
              } else {
                setServiceReviews(prev => prev.filter(r => r.id !== reviewId));
              }
              
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

  const handleEditReview = (review: IProductReview | IServiceReview) => {
    // Implementation for editing review
    // Uncomment and modify as needed
    // if ('productId' in review) {
    //   router.push({
    //     pathname: "/review/edit-product-review/[id]",
    //     params: { id: review.id, productId: review.productId }
    //   });
    // } else {
    //   router.push({
    //     pathname: "/review/edit-service-review/[id]",
    //     params: { id: review.id, serviceId: review.serviceId }
    //   });
    // }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    fetchReviews();
  };

  const renderProductReview = ({ item }: { item: IProductReview }) => {
    return (
      <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
        <View style={styles.reviewHeader}>
          <View style={styles.productInfo}>
            {item.productImage ? (
              <Image 
                source={{ uri: item.productImage }} 
                style={styles.productImage} 
                resizeMode="cover" 
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
              </View>
            )}
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
              {item.productName}
            </Text>
          </View>
          
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons 
                key={star}
                name={star <= item.rate ? "star" : "star-outline"} 
                size={16} 
                color="#FFD700" 
                style={styles.starIcon}
              />
            ))}
          </View>
        </View>
        
        <Text style={[styles.reviewText, { color: colors.text }]}>
          {item.comment}
        </Text>
        
        {item.images && item.images.length > 0 && (
          <View style={styles.imageGallery}>
            {item.images.map((image, index) => (
              <Image 
                key={index} 
                source={{ uri: image }} 
                style={styles.reviewImage} 
              />
            ))}
          </View>
        )}
        
        <View style={styles.reviewFooter}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {new Date(item.createAt).toLocaleDateString()}
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditReview(item)}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteReview(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderServiceReview = ({ item }: { item: IServiceReview }) => {
    return (
      <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
        <View style={styles.reviewHeader}>
          <View style={styles.productInfo}>
            {item.serviceImage ? (
              <Image 
                source={{ uri: item.serviceImage }} 
                style={styles.productImage} 
                resizeMode="cover" 
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
              </View>
            )}
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
              {item.serviceName}
            </Text>
          </View>
          
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons 
                key={star}
                name={star <= item.rate ? "star" : "star-outline"} 
                size={16} 
                color="#FFD700" 
                style={styles.starIcon}
              />
            ))}
          </View>
        </View>
        
        <Text style={[styles.reviewText, { color: colors.text }]}>
          {item.comment}
        </Text>
        
        {item.images && item.images.length > 0 && (
          <View style={styles.imageGallery}>
            {item.images.map((image, index) => (
              <Image 
                key={index} 
                source={{ uri: image }} 
                style={styles.reviewImage} 
              />
            ))}
          </View>
        )}
        
        <View style={styles.reviewFooter}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {new Date(item.createAt).toLocaleDateString()}
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditReview(item)}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteReview(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={60} color={colors.error || "#FF3B30"} />
      <Text style={[styles.errorText, { color: colors.error || "#FF3B30" }]}>
        {error}
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={onRefresh}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyProductReviews = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={60} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        You haven't reviewed any products yet
      </Text>
    </View>
  );

  const renderEmptyServiceReviews = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={60} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        You haven't reviewed any services yet
      </Text>
    </View>
  );
  
  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
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
        
        <View style={styles.headerRight} />
      </View>
      
      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'products' && [styles.activeTabButton, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('products')}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'products' ? '#FFFFFF' : colors.textSecondary }
            ]}
          >
            Product Reviews
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'services' && [styles.activeTabButton, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('services')}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'services' ? '#FFFFFF' : colors.textSecondary }
            ]}
          >
            Service Reviews
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'products' ? (
        <View style={styles.content}>
          {loading && productReviews.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading your product reviews...
              </Text>
            </View>
          ) : error ? (
            renderError()
          ) : (
            <FlatList
              data={productReviews}
              renderItem={renderProductReview}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={[
                styles.listContent,
                productReviews.length === 0 && styles.emptyListContent
              ]}
              ListEmptyComponent={renderEmptyProductReviews}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          )}
        </View>
      ) : (
        <View style={styles.content}>
          {loading && serviceReviews.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading your service reviews...
              </Text>
            </View>
          ) : error ? (
            renderError()
          ) : (
            <FlatList
              data={serviceReviews}
              renderItem={renderServiceReview}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={[
                styles.listContent,
                serviceReviews.length === 0 && styles.emptyListContent
              ]}
              ListEmptyComponent={renderEmptyServiceReviews}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          )}
        </View>
      )}
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40, // Balance the header
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 25,
    marginHorizontal: 4,
  },
  activeTabButton: {
    borderBottomWidth: 0,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyListContent: {
    flex: 1,
  },
  reviewCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginLeft: 2,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 4,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButton: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  }
});

export default ReviewScreen;