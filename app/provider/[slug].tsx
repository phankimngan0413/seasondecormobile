import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  SafeAreaView,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";

// API Utilities
import { getProviderDetailAPI, getProductsByProviderAPI } from "@/utils/providerAPI";
import { getDecorServiceByProviderAPI } from "@/utils/decorserviceAPI";

// Components
import ProductCard from "@/app/product/ProductCard";
import DecorCard from "@/components/DecorCard";

// Types
import { IProvider } from "@/utils/providerAPI"; 
import { IProduct } from "@/utils/productAPI"; 
import { IDecor } from "@/utils/decorserviceAPI";

// Theming
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

// Constants
const PRIMARY_COLOR = "#5fc1f1";
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper function to process decor service data
// Helper function to process decor service data
const processDecorService = (item: any): IDecor => ({
  id: item.id || Math.random(),
  style: item.style || "Unknown Style",
  basePrice: item.basePrice || 0,
  description: item.description || "No description",
  province: item.province || "Unknown Province",
  createAt: item.createAt || new Date().toISOString(),
  accountId: item.accountId || 0,
  decorCategoryId: item.decorCategoryId || 0,
  favoriteCount: item.favoriteCount || 0,
  // Handle images with imageURL property
  images: Array.isArray(item.images) 
    ? item.images.map((img: any) => {
        if (typeof img === 'string') return img;
        return img?.imageURL || "https://via.placeholder.com/150";
      })
    : ["https://via.placeholder.com/150"],
  // Handle seasons with seasonName property
  seasons: Array.isArray(item.seasons) && item.seasons.length > 0
    ? item.seasons.map((s: any) => {
        if (typeof s === 'string') return s;
        return s.seasonName || "No Season";
      })
    : ["No Season"]
});
const ProviderDetailScreen: React.FC = () => {
  // Hooks
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  // State
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [decorServices, setDecorServices] = useState<IDecor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [decorLoading, setDecorLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);

  // Theme and color handling
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  // Fetch provider details
  const fetchProviderDetail = useCallback(async () => {
    // Validate slug
    if (!slug || typeof slug !== 'string') {
      console.error("Invalid slug:", slug);
      setError("No provider information available");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching provider details for slug:", slug);
      setLoading(true);
      setDecorLoading(true);
      setProductLoading(true);
      
      // Fetch provider data first
      try {
        const providerData = await getProviderDetailAPI(slug);
        if (providerData) {
          setProvider(providerData);
        } else {
          console.error("No provider data received");
          setError("Could not load provider details");
        }
      } catch (providerErr) {
        console.error("Error fetching provider:", providerErr);
        setError("Could not load provider details");
        setLoading(false);
        return;
      }

      // Fetch products
      try {
        const productData = await getProductsByProviderAPI(slug);
        setProducts(productData || []);
      } catch (productErr) {
        console.log("No products available for this provider");
        setProducts([]);
      } finally {
        setProductLoading(false);
      }

      // Fetch decor services
      try {
        const decorData = await getDecorServiceByProviderAPI(slug);
        
        // Process and set decor services
        const processedServices = Array.isArray(decorData)
          ? decorData.map(processDecorService)
          : decorData
            ? [processDecorService(decorData)]
            : [];
        
        setDecorServices(processedServices);
      } catch (decorErr) {
        console.log("No decor services available for this provider");
        setDecorServices([]);
      } finally {
        setDecorLoading(false);
      }

    } catch (err) {
      console.error("Comprehensive Fetch Error:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to fetch provider details"
      );
    } finally {
      // Always set loading to false
      setLoading(false);
    }
  }, [slug]);

  // Trigger fetch on component mount or slug change
  useEffect(() => {
    fetchProviderDetail();
  }, [fetchProviderDetail]);

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading provider details...</Text>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF4D4F" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchProviderDetail} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Main render with ScrollView for simpler layout
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Provider Card */}
        {provider && (
          <View style={[styles.providerCard, { backgroundColor: colors.card }]}>
            <View style={styles.providerHeader}>
              <Image 
                source={
                  provider.avatar 
                    ? { uri: provider.avatar } 
                    : require('@/assets/images/default-avatar.png')
                } 
                style={styles.avatar} 
              />
              <View style={styles.providerTitleContainer}>
                <Text style={[styles.businessName, { color: colors.text }]}>
                  {provider.businessName}
                </Text>
                {provider.providerVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={styles.verifiedText}>Verified Provider</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.bioContainer}>
              <Text style={[styles.bioText, { color: colors.text }]}>{provider.bio}</Text>
            </View>

            <View style={[styles.contactInfoContainer, { borderTopColor: colors.border }]}>
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={20} color={PRIMARY_COLOR} />
                <Text style={[styles.contactText, { color: colors.text }]}>{provider.phone || "No phone number"}</Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="location-outline" size={20} color={PRIMARY_COLOR} />
                <Text style={[styles.contactText, { color: colors.text }]}>{provider.address || "No address available"}</Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="calendar-outline" size={20} color={PRIMARY_COLOR} />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  Joined: {provider.joinedDate || "Unknown"}
                </Text>
              </View>
            </View>
          </View>
        )}
{/* Decor Services Section */}
<View style={styles.sectionContainer}>
  <View style={styles.sectionHeaderContainer}>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>
      <Ionicons name="brush-outline" size={20} color={PRIMARY_COLOR} /> Decor Services
    </Text>
  </View>

  {decorLoading ? (
    <View style={styles.loadingItemContainer}>
      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
      <Text style={[styles.loadingItemText, { color: colors.textSecondary }]}>Loading services...</Text>
    </View>
  ) : decorServices.length > 0 ? (
    <View style={styles.decorServicesContainer}>
      <FlatList
        data={decorServices}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.decorCard, { backgroundColor: colors.card }]}
            onPress={() => router.push({
              pathname: "/decor/[id]",
              params: { id: item.id.toString() },
            })}
            activeOpacity={0.7}
          >
            {/* Service Image Container */}
            <View style={styles.imageContainer}>
            <Image 
  source={{ 
    uri: Array.isArray(item.images) && item.images.length > 0
      ? (typeof item.images[0] === 'string' 
          ? item.images[0] 
          : (item.images[0] as any).imageURL || "https://via.placeholder.com/300")
      : "https://via.placeholder.com/300"
  }}
  style={styles.fullImage}
  resizeMode="cover"
/>
            </View>
            
            {/* Price Tag */}
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>${item.basePrice.toLocaleString()}</Text>
            </View>
            
            {/* Service Info */}
            <View style={styles.decorCardInfo}>
              <Text 
                style={[styles.decorCardTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.style}
              </Text>
              
              <View style={styles.decorCardLocation}>
                <Ionicons name="location-outline" size={14} color={PRIMARY_COLOR} />
                <Text 
                  style={[styles.decorCardLocationText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.province}
                </Text>
              </View>
              
              <View style={[styles.decorCardSeasons, { borderTopColor: colors.border }]}>
                {item.seasons.slice(0, 2).map((season, index) => (
                  <View key={index} style={[styles.seasonTag, { backgroundColor: `${PRIMARY_COLOR}20` }]}>
                    <Text style={[styles.seasonTagText, { color: PRIMARY_COLOR }]}>
                      {typeof season === 'string' ? season : season.seasonName || 'Season'}
                    </Text>
                  </View>
                ))}
                {item.seasons.length > 2 && (
                  <Text style={[styles.moreSeasons, { color: colors.textSecondary }]}>
                    +{item.seasons.length - 2} more
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalDecorList}
      />
    </View>
  ) : (
    <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
      <Ionicons name="brush" size={40} color={colors.border} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Decor Services Available</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        This provider hasn't added any decor services yet.
      </Text>
    </View>
  )}
</View>
        {/* Products Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="gift-outline" size={20} color={PRIMARY_COLOR} /> Products
            </Text>
          </View>

          {productLoading ? (
            <View style={styles.loadingItemContainer}>
              <ActivityIndicator size="small" color={PRIMARY_COLOR} />
              <Text style={[styles.loadingItemText, { color: colors.textSecondary }]}>Loading products...</Text>
            </View>
          ) : products.length > 0 ? (
            <View style={styles.productsGrid}>
              {products.map((item) => (
                <TouchableOpacity 
                  key={item.id.toString()}
                  style={styles.productCardWrapper}
                  onPress={() => router.push({
                    pathname: "/product/product-detail/[id]",
                    params: { id: item.id.toString() },
                  })}
                >
                  <ProductCard 
                    product={item} 
                    onAddToCart={() => {}} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
              <Ionicons name="basket" size={40} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Products Available</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                This provider hasn't added any products yet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  // Provider Card
  providerCard: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerHeader: {
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  providerTitleContainer: {
    alignItems: 'center',
  },
  businessName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#34C759',
  },
  bioContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  contactInfoContainer: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  contactText: {
    fontSize: 14,
    marginLeft: 10,
  },
  
  // Sections
  sectionContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  horizontalDecorList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  horizontalDecorCardWrapper: {
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 300,
    marginRight: 8,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  productCardWrapper: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  
  // Empty States
  emptyContainer: {
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingItemContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingItemText: {
    marginTop: 8,
    fontSize: 14,
  },
  
  // Error
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 40,
    color: '#FF4D4F',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  decorServicesContainer: {
    marginBottom: 16,
  },
// Update the decorCard and decorCardImage styles
// Add these new styles
imageContainer: {
  width: '100%',
  height: 160,
  backgroundColor: '#f0f0f0',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
},
fullImage: {
  width: '100%',
  height: '100%',
},

// Update your existing decorCard style
decorCard: {
  width: SCREEN_WIDTH * 0.75,
  maxWidth: 280,
  height: 250, // Increased to accommodate the taller image
  borderRadius: 12,
  marginRight: 12,
  overflow: 'hidden',
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},

// You can remove the decorCardImage style since we're replacing it with imageContainer and fullImage
decorCardImage: {
  width: '100%', // Full width
  height: 150, // Increased height
  alignSelf: 'center', // Center the image
},
  priceTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  priceText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  decorCardInfo: {
    padding: 12,
    flex: 1,
  },
  decorCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  decorCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decorCardLocationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  decorCardSeasons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
  },
  seasonTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
  },
  seasonTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreSeasons: {
    fontSize: 10,
    marginLeft: 2,
  },
});

export default ProviderDetailScreen;