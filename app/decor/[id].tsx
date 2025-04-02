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

interface IDecor {
  id: number;
  style: string;
  basePrice: number;
  description: string;
  province: string;
  createAt: string;
  accountId: number;
  decorCategoryId: number;
  favoriteCount: number;
  images: string[]; // Array of string URLs
  seasons: string[] | Array<{id: number, name: string}>; // Handle both formats
  provider?: IProvider;
  categoryName?: string;
}

const DecorDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [decorDetail, setDecorDetail] = useState<IDecor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  useEffect(() => {
    if (id) {
      fetchDecorDetails(id as string); 
    }
  }, [id]);

  const fetchDecorDetails = async (id: string) => {
    try {
      // Use type assertion to handle different data formats
      const data = await getDecorServiceByIdAPI(Number(id)) as unknown as IDecor;
      console.log("Decor detail data fetched successfully");
      setDecorDetail(data);
    } catch (err: any) {
      console.error("Error fetching decor details:", err);
      setError("Failed to load decor details.");
    } finally {
      setLoading(false);
    }
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

  // Helper function to get season name from either string or object
  const getSeasonName = (season: any): string => {
    if (typeof season === 'string') return season;
    if (season && typeof season === 'object' && 'name' in season) return season.name;
    if (season && typeof season === 'object' && 'seasonName' in season) return season.seasonName;
    return 'Unknown Season';
  };

  if (loading) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          btnStyle={[styles.actionButton, { backgroundColor: colors.primary }]} 
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
          btnStyle={[styles.actionButton, { backgroundColor: colors.primary }]} 
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ backgroundColor: colors.background }}>
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
                source={{ uri: decorDetail.images[currentIndex] }}
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
                      { backgroundColor: index === currentIndex ? colors.primary : '#FFFFFF' }
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

        {/* Basic Info Card - Touchable */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={handleBooking}
          style={[styles.card, styles.cardTouchable, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.title, { color: colors.text }]}>{decorDetail.style}</Text>
          
          <View style={styles.priceRow}>
            <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
            <Text style={[styles.priceText, { color: colors.primary }]}>
              {decorDetail.basePrice?.toLocaleString()} ₫
            </Text>
          </View>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.text }]}>
              {decorDetail.province || "Location not specified"}
            </Text>
          </View>
          
          <View style={styles.categoryRow}>
            <Ionicons name="layers-outline" size={18} color={colors.primary} />
            <Text style={[styles.categoryText, { color: colors.text }]}>
              {decorDetail.categoryName || "Category not specified"}
            </Text>
          </View>
          
          {/* Booking call-to-action in the info card */}
          <View style={styles.bookNowRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={[styles.bookNowText, { color: colors.primary }]}>
              Tap to book this service
            </Text>
          </View>
        </TouchableOpacity>

        {/* Description Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} /> Description
            </Text>
            <TouchableOpacity onPress={toggleDescription}>
              <Text style={[styles.readMoreText, { color: colors.primary }]}>
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

        {/* Seasons Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} /> Available Seasons
          </Text>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          {decorDetail.seasons && decorDetail.seasons.length > 0 ? (
            <View style={styles.seasonsContainer}>
              {decorDetail.seasons.map((season, index) => (
                <View
                  key={index} 
                  style={[styles.seasonTag, { backgroundColor: `${colors.primary}20` }]}
                >
                  <Text style={[styles.seasonText, { color: colors.primary }]}>
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
              <Ionicons name="person-outline" size={20} color={colors.primary} /> Provider
            </Text>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.providerHeader}>
              <View style={[styles.providerAvatar, { backgroundColor: colors.primary }]}>
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
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.verifiedIcon} />
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
              btnStyle={[styles.secondaryButton, { borderColor: colors.primary }]}
              labelStyle={{ color: colors.primary }}
            />
          </View>
        )}

        {/* Main Booking Button */}
        <View style={styles.bookingContainer}>
          <CustomButton
            title="Book This Service"
            onPress={handleBooking}
            btnStyle={[styles.bookingButton, { backgroundColor: colors.primary }]}
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    marginLeft: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
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

export default DecorDetailScreen;