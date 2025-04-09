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
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AxiosError } from "axios";
// API Utilities
import {
  getProviderDetailAPI,
  getProductsByProviderAPI,
} from "@/utils/providerAPI";
import { getDecorServiceByProviderAPI } from "@/utils/decorserviceAPI";
// Import follow APIs
import {
  followUserAPI,
  unfollowUserAPI,
} from "@/utils/followAPI";

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
import { initApiClient } from "@/config/axiosConfig";
import { addContactAPI } from "@/utils/contactAPI";

// Constants
const PRIMARY_COLOR = "#5fc1f1";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
        if (typeof img === "string") return img;
        return img?.imageURL || "https://via.placeholder.com/150";
      })
    : ["https://via.placeholder.com/150"],
  // Handle seasons with seasonName property
  seasons:
    Array.isArray(item.seasons) && item.seasons.length > 0
      ? item.seasons.map((s: any) => {
          if (typeof s === "string") return s;
          return s.seasonName || "No Season";
        })
      : ["No Season"],
});


const useForceUpdate = () => {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  return update;
};

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
  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Theme and color handling
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  const forceUpdate = useForceUpdate();
  
  // Helper function to get image URL safely
  const getImageUrl = (imageItem: any): string => {
    if (!imageItem) return "https://via.placeholder.com/300";
    if (typeof imageItem === 'string') return imageItem;
    if (imageItem.imageURL) return imageItem.imageURL;
    return "https://via.placeholder.com/300";
  };

  // Helper function to extract season name safely
  const getSeasonName = (season: any): string => {
    if (typeof season === 'string') return season;
    if (season && typeof season === 'object' && 'seasonName' in season) return season.seasonName;
    return 'Unknown Season';
  };
  
  // Helper function to format decor data for the DecorCard component
  const formatDecorForCard = (item: any): any => {
    return {
      ...item,
      // Ensure seasons is properly formatted
      seasons: Array.isArray(item.seasons)
        ? item.seasons.map((season: any) => {
            if (typeof season === "string") {
              return { id: 0, seasonName: season };
            } else if (season && season.seasonName) {
              return { id: season.id || 0, seasonName: season.seasonName };
            }
            return { id: 0, seasonName: "Unknown Season" };
          })
        : [],
      // Make sure images is properly formatted
      images: Array.isArray(item.images)
        ? item.images.map((img: any) => {
            if (typeof img === "string") return img;
            return img?.imageURL || "https://via.placeholder.com/150";
          })
        : ["https://via.placeholder.com/150"],
    };
  };
  
  // Navigate to messaging
  // Enhanced navigateToChat with contact addition
  const navigateToChat = async () => {
    if (!provider?.id) return;
    
    try {
      // Try to add contact - whether it succeeds or says "already exists" doesn't matter
      const response = await addContactAPI(provider.id);
      
      // Log the result for debugging but don't show to user
      console.log("Contact API response:", response);
    } catch (error) {
      // Just log any errors, don't show to user
      console.log("Contact addition error:", error);
    } finally {
      // In all cases, navigate to chat
      router.push({
        pathname: "/chat",
        params: {
          receiverId: provider.id.toString(),
          receiverName: provider.businessName || "Provider",
        },
      });
    }
  };
  
  // Enhanced checkFollowStatus without modifying provider object
  const checkFollowStatus = useCallback(async () => {
    if (!provider?.id) {
      console.log("Cannot check follow status: Provider ID is missing");
      return;
    }

    try {
      console.log(`Checking follow status for provider ID: ${provider.id}`);
      
      // Get followings list directly - more reliable
      const apiClient = await initApiClient();
      const response = await apiClient.get("/api/follow/followings");
      
      let following = false;
      
      // Check for various possible response formats
      if (response?.data?.data && Array.isArray(response.data.data)) {
        // API returns {data: {data: []}} format
        following = response.data.data.some(
          (user: any) => user.accountId === provider.id || user.id === provider.id
        );
      } else if (response?.data && Array.isArray(response.data)) {
        // API returns {data: []} format
        following = response.data.some(
          (user: any) => user.accountId === provider.id || user.id === provider.id
        );
      }
      
      console.log(`Determined follow status: ${following}`);
      
      // Update following state if it's different
      if (isFollowing !== following) {
        setIsFollowing(following);
        // Force a re-render if needed
        forceUpdate();
      }
    } catch (error) {
      console.log("Error checking follow status:", error);
      // Keep existing state
    }
  }, [provider?.id, isFollowing, forceUpdate]);

  // Run checkFollowStatus only when provider changes
  useEffect(() => {
    if (provider?.id) {
      checkFollowStatus();
    }
  }, [provider?.id, checkFollowStatus]);
  
  // Final fixed handleFollowToggle without alreadyNotFollowing reference
  const handleFollowToggle = async () => {
    if (!provider?.id) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Try to unfollow - this will succeed even if relationship doesn't exist
        await unfollowUserAPI(provider.id);
        
        // Update UI state regardless of response details
        setIsFollowing(false);
        forceUpdate();
        
        // Update the follower count in the UI
        if (provider.followersCount && provider.followersCount > 0) {
          setProvider({
            ...provider,
            followersCount: provider.followersCount - 1
          });
        }
      } else {
        try {
          // Try to follow
          const response = await followUserAPI(provider.id);
          
          // Success - update UI
          setIsFollowing(true);
          forceUpdate();
          
          // Update follower count only if not already following
          if (!response?.alreadyFollowing) {
            setProvider({
              ...provider,
              followersCount: (provider.followersCount || 0) + 1
            });
          }
        } catch (error: any) {
          // Only special case is "already following"
          if (error.message && error.message.includes("already following")) {
            setIsFollowing(true);
            forceUpdate();
          } else {
            throw error; // Rethrow other errors
          }
        }
      }
    } catch (error: any) {
      // Only show alert for errors we couldn't handle
      Alert.alert(
        "Action Failed",
        error.message || "Failed to update follow status. Please try again."
      );
    } finally {
      setFollowLoading(false);
    }
  };
  
  const fetchProviderDetail = useCallback(async () => {
    // Validate slug
    if (!slug || typeof slug !== "string") {
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
        err instanceof Error ? err.message : "Failed to fetch provider details"
      );
    } finally {
      // Always set loading to false
      setLoading(false);
    }
  }, [slug]);

  // Check follow status after provider is loaded
  useEffect(() => {
    if (provider?.id) {
      checkFollowStatus();
    }
  }, [provider, checkFollowStatus]);

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
        <TouchableOpacity
          onPress={fetchProviderDetail}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Main render with ScrollView for simpler layout
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Provider Card */}
        {provider && (
          <View style={[styles.providerCard, { backgroundColor: colors.card }]}>
            <View style={styles.providerHeader}>
              <Image
                source={
                  provider.avatar
                    ? { uri: provider.avatar }
                    : require("@/assets/images/default-avatar.png")
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
                
                {/* Follower/following counts */}
                <View style={styles.followStatsContainer}>
                  <View style={styles.followStat}>
                    <Text style={[styles.followCount, { color: colors.text }]}>
                      {provider.followersCount || 0}
                    </Text>
                    <Text style={[styles.followLabel, { color: colors.textSecondary }]}>
                      Followers
                    </Text>
                  </View>
                  <View style={styles.followStatDivider} />
                  <View style={styles.followStat}>
                    <Text style={[styles.followCount, { color: colors.text }]}>
                      {provider.followingsCount || 0}
                    </Text>
                    <Text style={[styles.followLabel, { color: colors.textSecondary }]}>
                      Following
                    </Text>
                  </View>
                </View>
              </View>
              {/* Follow and Message Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isFollowing ? styles.unfollowButton : {}, // Style change for unfollow
                    followLoading ? styles.disabledButton : {},
                  ]}
                  onPress={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name={isFollowing ? "person-remove" : "person-add"}
                        size={18}
                        color="#fff"
                        style={styles.actionButtonIcon}
                      />
                      <Text style={styles.actionButtonText}>
                        {isFollowing ? "Unfollow" : "Follow"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.messageButton]}
                  onPress={navigateToChat}
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={18}
                    color="#fff"
                    style={styles.actionButtonIcon}
                  />
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bioContainer}>
              <Text style={[styles.bioText, { color: colors.text }]}>
                {provider.bio}
              </Text>
            </View>

            <View
              style={[
                styles.contactInfoContainer,
                { borderTopColor: colors.border },
              ]}
            >
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={20} color={PRIMARY_COLOR} />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {provider.phone || "No phone number"}
                </Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={PRIMARY_COLOR}
                />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {provider.address || "No address available"}
                </Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={PRIMARY_COLOR}
                />
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
              <Ionicons name="brush-outline" size={20} color={PRIMARY_COLOR} />{" "}
              Decor Services
            </Text>
          </View>

          {decorLoading ? (
            <View style={styles.loadingItemContainer}>
              <ActivityIndicator size="small" color={PRIMARY_COLOR} />
              <Text
                style={[
                  styles.loadingItemText,
                  { color: colors.textSecondary },
                ]}
              >
                Loading services...
              </Text>
            </View>
          ) : decorServices.length > 0 ? (
            <View style={styles.decorServicesContainer}>
              <FlatList
                data={decorServices}
                keyExtractor={(item) =>
                  item.id?.toString() || Math.random().toString()
                }
                renderItem={({ item }) => {
                  // Extract province or sublocation for location display
                  const location = item.province || item.sublocation || 'Unknown Province';
                  
                  return (
                    <TouchableOpacity
                      style={styles.decorCardWrapper}
                      onPress={() =>
                        router.push({
                          pathname: "/decor/[id]",
                          params: { id: item.id.toString() },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <View style={[styles.decorCard, { backgroundColor: colors.card }]}>
                        {/* Card Image */}
                        <View style={styles.cardImageContainer}>
                          <Image
                            source={{ 
                              uri: Array.isArray(item.images) && item.images.length > 0
                                ? getImageUrl(item.images[0])
                                : "https://via.placeholder.com/300"
                            }}
                            style={styles.cardImage}
                            resizeMode="cover"
                          />
                        </View>
                        
                        {/* Card Content */}
                        <View style={styles.cardContent}>
                          <Text 
                            style={[styles.cardTitle, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {item.style || 'Unnamed Style'}
                          </Text>
                          
                          <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={13} color="#888" />
                            <Text 
                              style={[styles.locationText, { color: '#888' }]}
                              numberOfLines={1}
                            >
                              {location}
                            </Text>
                          </View>
                          
                          <View style={styles.seasonTags}>
                            {Array.isArray(item.seasons) && item.seasons.slice(0, 2).map((season, index) => {
                              const seasonName = getSeasonName(season);
                              return (
                                <View 
                                  key={index} 
                                  style={styles.seasonTag}
                                >
                                  <Text style={styles.seasonTagText}>
                                    {seasonName}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalDecorList}
                initialNumToRender={3} // Render more items initially
              />
            </View>
          ) : (
            <View
              style={[styles.emptyContainer, { borderColor: colors.border }]}
            >
              <Ionicons name="brush" size={40} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Decor Services Available
              </Text>
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
              <Ionicons name="gift-outline" size={20} color={PRIMARY_COLOR} />{" "}
              Products
            </Text>
          </View>

          {productLoading ? (
            <View style={styles.loadingItemContainer}>
              <ActivityIndicator size="small" color={PRIMARY_COLOR} />
              <Text
                style={[
                  styles.loadingItemText,
                  { color: colors.textSecondary },
                ]}
              >
                Loading products...
              </Text>
            </View>
          ) : products.length > 0 ? (
            <View style={styles.productsGrid}>
              {products.map((item) => (
                <TouchableOpacity
                  key={item.id.toString()}
                  style={styles.productCardWrapper}
                  onPress={() =>
                    router.push({
                      pathname: "/product/product-detail/[id]",
                      params: { id: item.id.toString() },
                    })
                  }
                >
                  <ProductCard product={item} onAddToCart={() => {}} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View
              style={[styles.emptyContainer, { borderColor: colors.border }]}
            >
              <Ionicons name="basket" size={40} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Products Available
              </Text>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  // Provider Card
  providerCard: {
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerHeader: {
    padding: 16,
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  providerTitleContainer: {
    alignItems: "center",
  },
  businessName: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  verifiedText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#34C759",
  },
  // Follow Stats
  followStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  followStat: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  followCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  followLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  followStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#eee',
  },
  // Action Buttons (Follow & Message)
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    width: "100%",
  },
  followButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    minWidth: 110,
  },
  unfollowButton: {
    backgroundColor: "#FF5252", // Red color for unfollow state
  },
  followingButton: {
    backgroundColor: "#4CAF50", // Green for following state
  },
  messageButton: {
    backgroundColor: "#FF9500", // Orange for message button
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  disabledButton: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  actionButtonIcon: {
    marginRight: 6,
  },
  bioContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  contactInfoContainer: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "bold",
  },
  horizontalDecorList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  productCardWrapper: {
    width: "50%",
    paddingHorizontal: 4,
    marginBottom: 12,
  },

  // Empty States
  emptyContainer: {
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  loadingItemContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingItemText: {
    marginTop: 8,
    fontSize: 14,
  },

  // Error
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 40,
    color: "#FF4D4F",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  decorServicesContainer: {
    marginBottom: 16,
  },
  
  // Updated DecorCard styles to match DecorListScreen
  decorCardWrapper: {
    width: SCREEN_WIDTH * 0.46, // Make cards smaller to fit more on screen
    maxWidth: 180,
    marginRight: 8,
  },
  decorCard: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: 'white',
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120, // Make image height smaller
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 10,
    backgroundColor: '#f5f5f5', // Light gray background to match screenshot
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  seasonTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  seasonTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#E6F7FF',
  },
  seasonTagText: {
    fontSize: 10,
    fontWeight: '500',
    color: PRIMARY_COLOR,
  },
  // Legacy styles kept for backward compatibility
  priceTag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  priceText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
})
export default ProviderDetailScreen;