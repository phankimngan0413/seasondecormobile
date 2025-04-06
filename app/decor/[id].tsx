import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getDecorServiceByIdAPI } from "@/utils/decorserviceAPI";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import CustomButton from "@/components/ui/Button/Button";

const { width } = Dimensions.get("window");

// Define proper interfaces based on actual API response
interface IProvider {
  businessName: string;
  followersCount: number;
  followingsCount: number;
  id: number;
  isProvider: boolean;
  joinedDate: string;
  providerVerified: boolean;
  bio?: string;
  address?: string;
  phone?: string;
  avatar?: string;
  slug?: string;
}

interface ISeason {
  id?: number;
  name?: string;
  seasonName?: string;
}

interface IImage {
  id?: number;
  url?: string;
  imageUrl?: string;
  imageURL?: string;
}

interface IDecor {
  id: number;
  style: string;
  basePrice?: number;
  description: string;
  province?: string;
  createAt: string;
  accountId: number;
  decorCategoryId: number;
  favoriteCount: number;
  images: IImage[] | string[]; // Handle both formats
  seasons: ISeason[] | string[]; // Handle both formats
  provider?: IProvider;
  categoryName?: string;
  startDate?: string;
  status?: number;
  sublocation?: string;
}

// Explicitly define the API response structure
interface ApiResponse {
  data: IDecor;
  success: boolean;
  message: string;
  errors: any[];
}

const DecorDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [decorDetail, setDecorDetail] = useState<IDecor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullSublocation, setShowFullSublocation] = useState(false);
  
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  const PRIMARY_COLOR = colors.primary || "#5fc1f1";

  useEffect(() => {
    if (id) {
      fetchDecorDetails(id as string); 
    }
  }, [id]);

  // Create a more specific wrapper for the API call
  const fetchDecorServiceById = async (decorId: number) => {
    // This wrapper ensures the return type matches what we need
    const response = await getDecorServiceByIdAPI(decorId);
    return {
      data: response,
      success: true,
      message: "",
      errors: []
    };
  };

  const fetchDecorDetails = async (id: string) => {
    try {
      setLoading(true);
      setError("");
      
      // Use our wrapper function instead of the direct API call
      const apiResult = await fetchDecorServiceById(Number(id));
      
      if (apiResult && apiResult.data) {
        console.log("Decor detail data fetched successfully");
        setDecorDetail(apiResult.data);
      } else {
        setError("Invalid response format from server.");
      }
    } catch (err: any) {
      console.error("Error fetching decor details:", err);
      setError(err.message || "Failed to load decor details.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get image URL from either string or object
  const getImageUrl = (image: any, index: number): string => {
    if (typeof image === 'string') return image;
    if (image && typeof image === 'object' && 'url' in image) return image.url;
    if (image && typeof image === 'object' && 'imageUrl' in image) return image.imageUrl;
    if (image && typeof image === 'object' && 'imageURL' in image) return image.imageURL;
    return `https://picsum.photos/500/300?random=${index}`;
  };

  // Helper function to get season name from either string or object
  const getSeasonName = (season: any): string => {
    if (typeof season === 'string') return season;
    if (season && typeof season === 'object' && 'name' in season) return season.name;
    if (season && typeof season === 'object' && 'seasonName' in season) return season.seasonName;
    return 'Unknown Season';
  };

  const handlePrev = (e: any) => {
    e.stopPropagation(); // Prevent triggering parent's onPress
    if (!decorDetail?.images?.length) return;
    
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(decorDetail.images.length - 1);
    }
  };

  const handleNext = (e: any) => {
    e.stopPropagation(); // Prevent triggering parent's onPress
    if (!decorDetail?.images?.length) return;
    
    if (currentIndex < decorDetail.images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleBooking = () => {
    if (decorDetail) {
      try {
        console.log("Booking decor service:", decorDetail.id);
        
        // Sử dụng chuỗi đường dẫn đơn giản thay vì object params
        const serviceId = String(decorDetail.id);
        const style = encodeURIComponent(decorDetail.style || "");
        const price = encodeURIComponent(String(decorDetail.basePrice || 0));
        
        // Navigate with query parameters
        router.push(`/booking/${serviceId}?style=${style}&price=${price}`);
      } catch (err) {
        console.error("Navigation error:", err);
        Alert.alert("Error", "Unable to navigate to booking page. Please try again.");
      }
    } else {
      Alert.alert("Error", "Service details are not available.");
    }
  };

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const toggleSublocation = () => {
    setShowFullSublocation(!showFullSublocation);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (err) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.error || "#FF5252"} />
        <Text style={[styles.errorText, { color: colors.error || "#FF5252" }]}>{error}</Text>
        <CustomButton 
          title="Go Back" 
          onPress={() => router.back()} 
          btnStyle={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} 
        />
      </View>
    );
  }

  if (!decorDetail) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="search-outline" size={60} color={colors.text} />
        <Text style={[styles.errorText, { color: colors.text }]}>No details available for this decor service.</Text>
        <CustomButton 
          title="Go Back" 
          onPress={() => router.back()}
          btnStyle={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} 
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ backgroundColor: colors.background }}>
        {/* Header with back button
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Decor Details</Text>
          <View style={styles.spacer} />
        </View> */}

        {/* Image Gallery - Touchable */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={handleBooking}
          style={styles.imageContainer}
        >
          {decorDetail.images && decorDetail.images.length > 0 ? (
            <>
              <TouchableOpacity 
                onPress={handlePrev} 
                style={[styles.arrowButton, styles.leftArrow]}
              >
                <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
              </TouchableOpacity>

              <Image
                source={{ uri: getImageUrl(decorDetail.images[currentIndex], currentIndex) }}
                style={styles.image}
                resizeMode="cover"
                onError={() => console.warn(`Failed to load image: ${decorDetail.images[currentIndex]}`)}
              />

              <TouchableOpacity 
                onPress={handleNext} 
                style={[styles.arrowButton, styles.rightArrow]}
              >
                <Ionicons name="chevron-forward" size={30} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Image carousel indicator dots */}
              <View style={styles.paginationContainer}>
                {decorDetail.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      { backgroundColor: index === currentIndex ? PRIMARY_COLOR : '#FFFFFF' }
                    ]}
                  />
                ))}
              </View>
              
              {/* Booking hint overlay */}
              <View style={styles.bookingHintOverlay}>
                <Text style={styles.bookingHintText}>Tap to book</Text>
              </View>
            </>
          ) : (
            <View style={[styles.noImageContainer, { backgroundColor: colors.border }]}>
              <Ionicons name="image-outline" size={80} color={colors.text} />
              <Text style={[styles.noImageText, { color: colors.text }]}>No images available</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: decorDetail.status === 0 ? '#4CAF50' : '#FFC107' }]}>
            <Text style={styles.statusText}>{decorDetail.status === 0 ? 'Active' : 'Pending'}</Text>
          </View>
        </View>

        {/* Basic Info Card - Touchable */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={handleBooking}
          style={[styles.card, styles.cardTouchable, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.title, { color: colors.text }]}>{decorDetail.style}</Text>
          
          {/* <View style={styles.priceRow}>
            <Ionicons name="pricetag-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.priceText, { color: PRIMARY_COLOR }]}>
              {decorDetail.basePrice?.toLocaleString()} ₫
            </Text>
          </View> */}
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Start Date: {formatDate(decorDetail.startDate || "")}
            </Text>
          </View>
          
          {/* <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {decorDetail.province || "Location not specified"}
            </Text>
          </View> */}
          
          <View style={styles.infoRow}>
            <Ionicons name="layers-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {decorDetail.categoryName || "Category not specified"}
            </Text>
          </View>
          
          {/* Booking call-to-action in the info card */}
          <View style={styles.bookNowRow}>
            <Ionicons name="calendar-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.bookNowText, { color: PRIMARY_COLOR }]}>
              Tap to book this service
            </Text>
          </View>
        </TouchableOpacity>

        {/* Description Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="information-circle-outline" size={20} color={PRIMARY_COLOR} /> Description
            </Text>
            <TouchableOpacity onPress={toggleDescription}>
              <Text style={[styles.readMoreText, { color: PRIMARY_COLOR }]}>
                {showFullDescription ? "Read Less" : "Read More"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <Text 
            style={[styles.description, { color: colors.text }]}
            numberOfLines={showFullDescription ? undefined : 4}
          >
            {decorDetail.description}
          </Text>
        </View>

        {/* Sublocation Details Card */}
        {decorDetail.sublocation && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="home-outline" size={20} color={PRIMARY_COLOR} /> Sublocation
              </Text>
              <TouchableOpacity onPress={toggleSublocation}>
                <Text style={[styles.readMoreText, { color: PRIMARY_COLOR }]}>
                  {showFullSublocation ? "Read Less" : "Read More"}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <Text 
              style={[styles.description, { color: colors.text }]}
              numberOfLines={showFullSublocation ? undefined : 4}
            >
              {decorDetail.sublocation}
            </Text>
          </View>
        )}

        {/* Seasons Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="calendar-outline" size={20} color={PRIMARY_COLOR} /> Available Seasons
          </Text>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          {decorDetail.seasons && decorDetail.seasons.length > 0 ? (
            <View style={styles.seasonsContainer}>
              {decorDetail.seasons.map((season, index) => (
                <View
                  key={index} 
                  style={[styles.seasonTag, { backgroundColor: `${PRIMARY_COLOR}20` }]}
                >
                  <Text style={[styles.seasonText, { color: PRIMARY_COLOR }]}>
                    {getSeasonName(season)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noDataText, { color: colors.textSecondary || colors.text }]}>
              No seasons available
            </Text>
          )}
        </View>

        {/* Provider Card */}
        {decorDetail.provider && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="person-outline" size={20} color={PRIMARY_COLOR} /> Provider
            </Text>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.providerHeader}>
              <View style={[styles.providerAvatar, { backgroundColor: PRIMARY_COLOR }]}>
                {decorDetail.provider.avatar ? (
                  <Image 
                    source={{ uri: decorDetail.provider.avatar }} 
                    style={styles.avatarImage}
                    onError={() => console.warn("Failed to load provider avatar")}
                  />
                ) : (
                  <Text style={styles.providerInitial}>
                    {decorDetail.provider.businessName?.charAt(0) || "?"}
                  </Text>
                )}
              </View>
              
              <View style={styles.providerInfo}>
                <View style={styles.providerNameRow}>
                  <Text style={[styles.providerName, { color: colors.text }]}>
                    {decorDetail.provider.businessName}
                  </Text>
                  {decorDetail.provider.providerVerified && (
                    <Ionicons name="checkmark-circle" size={16} color={PRIMARY_COLOR} style={styles.verifiedIcon} />
                  )}
                </View>
                
                <Text style={[styles.providerJoined, { color: colors.textSecondary || colors.text }]}>
                  Joined: {decorDetail.provider.joinedDate && decorDetail.provider.joinedDate !== "01/01/0001"
                    ? decorDetail.provider.joinedDate
                    : "Recently"}
                </Text>
                
                {decorDetail.provider.bio && (
                  <Text 
                    style={[styles.providerBio, { color: colors.text }]}
                    numberOfLines={3}
                  >
                    {decorDetail.provider.bio}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={[styles.providerStats, { borderColor: colors.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {decorDetail.provider.followersCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary || colors.text }]}>Followers</Text>
              </View>
              
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {decorDetail.provider.followingsCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary || colors.text }]}>Following</Text>
              </View>
            </View>
            
            <CustomButton
              title="View Provider Profile"
              onPress={() => decorDetail.provider?.slug 
                ? router.push(`/provider/${decorDetail.provider.slug}`)
                : console.log("Provider slug not available")
              }
              btnStyle={[styles.secondaryButton, { borderColor: PRIMARY_COLOR }]}
              labelStyle={{ color: PRIMARY_COLOR }}
            />
          </View>
        )}

        {/* Main Booking Button */}
        <View style={styles.bookingContainer}>
          <CustomButton
            title="Book This Service"
            onPress={handleBooking}
            btnStyle={[styles.bookingButton, { backgroundColor: PRIMARY_COLOR }]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  actionButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1 
  },
  backButton: { padding: 8 },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    flex: 1, 
    textAlign: 'center' 
  },
  spacer: { width: 40 },

  // Status badge
  statusContainer: {
    position: 'absolute',
    top: 70,
    right: 16,
    zIndex: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Image Gallery
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 350,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 12,
    fontSize: 16,
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftArrow: {
    left: 10,
  },
  rightArrow: {
    right: 10,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  bookingHintOverlay: {
    position: 'absolute',
    bottom: 45,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookingHintText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },

  // Cards
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTouchable: {
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    marginLeft: 8,
  },
  bookNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  bookNowText: {
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },

  // Seasons
  seasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  seasonTag: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  seasonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },

  // Provider
  providerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  providerInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  providerInfo: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  providerJoined: {
    fontSize: 14,
    marginBottom: 8,
  },
  providerBio: {
    fontSize: 14,
    lineHeight: 20,
  },
  providerStats: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    elevation: 0,
    shadowColor: 'transparent',
  },

  // Booking
  bookingContainer: {
    padding: 16,
    marginBottom: 30,
  },
  bookingButton: {
    paddingVertical: 16,
    borderRadius: 12,
  }
});

export default DecorDetailScreen