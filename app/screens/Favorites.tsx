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
import { getUserIdFromToken } from '@/services/auth';
import { 
  getFavoriteProductListAPI, 
  removeFavoriteProductAPI,
  getFavoriteServiceListAPI,
  removeFavoriteServiceAPI
} from '@/utils/favoriteAPI';
import { IProduct } from '@/utils/productAPI';

const PRIMARY_COLOR = "#5fc1f1";

// Interface cho dữ liệu từ API
interface FavoriteProductItem {
  id: number;
  productDetail: IProduct;
}

// Updated to match the actual API response format
interface FavoriteServiceItem {
  favoriteId: number;
  decorServiceDetails: {
    id: number;
    style: string;
    description: string;
    sublocation: string;
    createAt: string;
    accountId: number;
    decorCategoryId: number;
    startDate: string;
    status: number;
    favoriteCount: number;
    images: {
      id: number;
      imageURL: string;
    }[];
    seasons: {
      id: number;
      seasonName: string;
    }[];
    basePrice?: number;
    rate?: number;
    totalRating?: number;
  };
}

const FavoriteScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('products');
  
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProductItem[]>([]);
  const [favoriteServices, setFavoriteServices] = useState<FavoriteServiceItem[]>([]);
  
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];

  useEffect(() => {
    fetchFavorites();
  }, [activeTab]);

  const fetchFavorites = async () => {
    try {
      const userId = await getUserIdFromToken();
      if (!userId) {
        Alert.alert("Error", "Please log in to view your favorites");
        return;
      }
      
      if (activeTab === 'products' || refreshing) {
        fetchFavoriteProducts();
      }
      
      if (activeTab === 'services' || refreshing) {
        fetchFavoriteServices();
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchFavoriteProducts = async () => {
    try {
      setLoadingProducts(true);
      const data = await getFavoriteProductListAPI();
      console.log("Fetched favorite products:", data);
      
      if (data && Array.isArray(data)) {
        // Filter out any invalid items
        const validItems = data.filter(item => 
          item && typeof item === 'object' && item.id && item.productDetail
        );
        setFavoriteProducts(validItems);
      } else {
        console.warn("Received invalid data format for favorite products:", data);
        setFavoriteProducts([]);
      }
    } catch (error) {
      console.error('Error fetching favorite products:', error);
      setFavoriteProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchFavoriteServices = async () => {
    try {
      setLoadingServices(true);
      const data = await getFavoriteServiceListAPI();
      console.log("Fetched favorite services:", data);
      
      if (data && Array.isArray(data)) {
        // Map the data to our expected format if needed
        // Current API response seems to be array of { decorServiceDetails, favoriteId }
        const formattedItems = data.map(item => {
          // Handle both possible API response formats
          if (item.decorServiceDetails) {
            return item; // Already in expected format
          } else if (item.favoriteId && item.decorService) {
            // Transform old format to new format if needed
            return {
              favoriteId: item.favoriteId,
              decorServiceDetails: item.decorService
            };
          }
          return null;
        }).filter(Boolean); // Filter out any null items
        
        setFavoriteServices(formattedItems);
      } else {
        console.warn("Received invalid data format for favorite services:", data);
        setFavoriteServices([]);
      }
    } catch (error) {
      console.error('Error fetching favorite services:', error);
      setFavoriteServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleRemoveFavoriteProduct = async (favoriteId: number) => {
    if (favoriteId === undefined || favoriteId === null) {
      Alert.alert("Error", "Invalid product item");
      return;
    }
    
    try {
      await removeFavoriteProductAPI(favoriteId);
      // Update the list after removal
      setFavoriteProducts(prev => prev.filter(p => p.id !== favoriteId));
      Alert.alert("Success", "Product removed from favorites");
    } catch (error) {
      console.error('Error removing product from favorites:', error);
      Alert.alert("Error", "Failed to remove product from favorites");
    }
  };

  const handleRemoveFavoriteService = async (favoriteId: number) => {
    if (favoriteId === undefined || favoriteId === null) {
      Alert.alert("Error", "Invalid service item");
      return;
    }
    
    try {
      await removeFavoriteServiceAPI(favoriteId);
      // Update the list after removal
      setFavoriteServices(prev => prev.filter(s => s.favoriteId !== favoriteId));
      Alert.alert("Success", "Service removed from favorites");
    } catch (error) {
      console.error('Error removing service from favorites:', error);
      Alert.alert("Error", "Failed to remove service from favorites");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  const renderProductItem = ({ item }: { item: FavoriteProductItem }) => {
    // Safety check
    if (!item || !item.productDetail) {
      return null;
    }
    
    // Lấy thông tin chi tiết sản phẩm
    const product = item.productDetail;
    
    return (
      <View
        style={[styles.itemCard, { backgroundColor: colors.card }]}
      >
        <TouchableOpacity
          style={styles.itemTouchable}
          onPress={() => router.push({
            pathname: "/product/product-detail/[id]",
            params: { id: product.id }
          })}
        >
          <View style={styles.itemImageContainer}>
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <Image
                source={{ uri: product.imageUrls[0] }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.noImagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="image-outline" size={30} color={colors.textSecondary} />
              </View>
            )}
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveFavoriteProduct(item.id);
              }}
            >
              <Ionicons name="heart" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.itemInfo}>
            <Text 
              style={[styles.itemName, { color: colors.text }]} 
              numberOfLines={1}
            >
              {product.productName || "Unnamed Product"}
            </Text>
            
            <Text style={[styles.itemPrice, { color: PRIMARY_COLOR }]}>
              {product.productPrice ? product.productPrice.toLocaleString() : 0} đ
            </Text>
            
            <View style={styles.itemRating}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                {product.rate || 0} ({product.totalRate || 0})
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderServiceItem = ({ item }: { item: FavoriteServiceItem }) => {
    // Safety check
    if (!item || !item.decorServiceDetails) {
      return null;
    }
    
    // Lấy thông tin chi tiết dịch vụ
    const service = item.decorServiceDetails;
    
    return (
      <View
        style={[styles.itemCard, { backgroundColor: colors.card }]}
      >
        <TouchableOpacity
          style={styles.itemTouchable}
          onPress={() => router.push({
            pathname: "/decor/[id]",
            params: { id: service.id }
          })}
        >
          <View style={styles.itemImageContainer}>
            {service.images && service.images.length > 0 ? (
              <Image
                source={{ uri: service.images[0]?.imageURL || '' }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.noImagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="image-outline" size={30} color={colors.textSecondary} />
              </View>
            )}
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveFavoriteService(item.favoriteId);
              }}
            >
              <Ionicons name="heart" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.itemInfo}>
            <Text 
              style={[styles.itemName, { color: colors.text }]} 
              numberOfLines={1}
            >
              {service.style || "Decor Service"}
            </Text>
            
            {service.seasons && service.seasons.length > 0 && (
              <View style={styles.seasonsContainer}>
                {service.seasons.map((season, index) => (
                  <Text 
                    key={season.id} 
                    style={[styles.seasonTag, { color: colors.textSecondary }]}
                  >
                    {season.seasonName}{index < service.seasons.length - 1 ? ', ' : ''}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyProducts = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={60} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No favorite products yet
      </Text>
    </View>
  );

  const renderEmptyServices = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={60} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No favorite services yet
      </Text>
    </View>
  );
  
  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
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
          Favorites
        </Text>
        
        <View style={styles.headerRight} />
      </View>
      
      {/* Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            { backgroundColor: activeTab === 'products' ? PRIMARY_COLOR : colors.card },
          ]}
          onPress={() => setActiveTab('products')}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'products' ? '#FFFFFF' : colors.textSecondary }
            ]}
          >
            Products
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            { backgroundColor: activeTab === 'services' ? PRIMARY_COLOR : colors.card },
          ]}
          onPress={() => setActiveTab('services')}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'services' ? '#FFFFFF' : colors.textSecondary }
            ]}
          >
            Decor Services
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'products' ? (
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {loadingProducts && favoriteProducts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading favorite products...
              </Text>
            </View>
          ) : (
            <FlatList
              data={favoriteProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => (item && item.id ? item.id.toString() : Math.random().toString())}
              contentContainerStyle={styles.listContent}
              numColumns={2}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[PRIMARY_COLOR]}
                  tintColor={PRIMARY_COLOR}
                />
              }
              ListEmptyComponent={renderEmptyProducts}
            />
          )}
        </View>
      ) : (
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {loadingServices && favoriteServices.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading favorite services...
              </Text>
            </View>
          ) : (
            <FlatList
              data={favoriteServices}
              renderItem={renderServiceItem}
              keyExtractor={(item) => (item && item.favoriteId ? item.favoriteId.toString() : Math.random().toString())}
              contentContainerStyle={styles.listContent}
              numColumns={2}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[PRIMARY_COLOR]}
                  tintColor={PRIMARY_COLOR}
                />
              }
              ListEmptyComponent={renderEmptyServices}
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
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40, // Balance the header
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 25,
    marginHorizontal: 4,
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
  },
  itemCard: {
    flex: 1,
    margin: 6,
    borderRadius: 10,
    overflow: 'hidden',
    maxWidth: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemTouchable: {
    width: '100%',
  },
  itemImageContainer: {
    position: 'relative',
    height: 140,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 6,
    zIndex: 1,
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  seasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  seasonTag: {
    fontSize: 12,
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
  }
});

export default FavoriteScreen;