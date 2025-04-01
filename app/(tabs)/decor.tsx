import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  Dimensions,
  TextInput,
  StatusBar,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { getDecorServicesAPI, IDecor } from "@/utils/decorserviceAPI";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");
const PRIMARY_COLOR = "#5fc1f1";

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

// Helper function to format currency in VND
const formatCurrency = (price: number | undefined): string => {
  if (price === undefined || price === null) return '0 ₫';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const DecorListScreen = () => {
  const [decorServices, setDecorServices] = useState<IDecor[]>([]);
  const [filteredServices, setFilteredServices] = useState<IDecor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  // Seasons with icons
  const seasons = [
    { name: "Spring", icon: "leaf-outline" },
    { name: "Summer", icon: "sunny-outline" },
    { name: "Autumn", icon: "umbrella-outline" },
    { name: "Winter", icon: "snow-outline" }
  ];

  useEffect(() => {
    fetchDecorServices();
  }, []);

  // Apply filters whenever selectedSeason or searchQuery changes
  useEffect(() => {
    filterServices();
  }, [selectedSeason, searchQuery, decorServices]);

  const fetchDecorServices = async () => {
    try {
      setLoading(true);
      const data = await getDecorServicesAPI();
      if (Array.isArray(data)) {
        setDecorServices(data);
        setFilteredServices(data);
      } else {
        setError("Invalid data format received.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch decor services.");
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let results = [...decorServices];
    
    // Filter by season if selected
    if (selectedSeason) {
      results = results.filter((decor) =>
        Array.isArray(decor.seasons) &&
        decor.seasons.some(season => 
          getSeasonName(season).toLowerCase() === selectedSeason.toLowerCase()
        )
      );
    }
    
    // Filter by search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(decor => 
        decor.style?.toLowerCase().includes(query) || 
        decor.description?.toLowerCase().includes(query) ||
        decor.sublocation?.toLowerCase().includes(query) ||
        decor.province?.toLowerCase().includes(query)
      );
    }
    
    setFilteredServices(results);
  };

  const renderDecorCard = ({ item }: { item: IDecor }) => {
    // Extract province or sublocation
    const location = item.province || item.sublocation || 'Unknown Location';
    
    return (
      <TouchableOpacity 
        style={[styles.decorCard, { backgroundColor: colors.card }]}
        onPress={() => router.push({
          pathname: "/decor/[id]",
          params: { id: item.id.toString() },
        })}
        activeOpacity={0.7}
      >
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
          
          {/* Price Badge - Fixed to use dummy price since we don't have real price in API */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{formatCurrency(2500000)}</Text>
          </View>
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
            <Ionicons name="location-outline" size={14} color={PRIMARY_COLOR} />
            <Text 
              style={[styles.locationText, { color: colors.textSecondary || '#666' }]}
              numberOfLines={1}
            >
              {location}
            </Text>
          </View>
          
          <View style={styles.seasonTags}>
            {Array.isArray(item.seasons) && item.seasons.slice(0, 2).map((season, index) => (
              <View 
                key={index} 
                style={[styles.seasonTag, { backgroundColor: `${PRIMARY_COLOR}20` }]}
              >
                <Text style={[styles.seasonTagText, { color: PRIMARY_COLOR }]}>
                  {getSeasonName(season)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search" size={64} color={colors.border} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No decor services found
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary || '#666' }]}>
        {selectedSeason 
          ? `No decor services available for ${selectedSeason} season` 
          : "No decor services match your search criteria"}
      </Text>
      <TouchableOpacity 
        style={[styles.resetButton, { backgroundColor: PRIMARY_COLOR }]}
        onPress={() => {
          setSelectedSeason(null);
          setSearchQuery("");
        }}
      >
        <Text style={styles.resetButtonText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          <Ionicons name="brush-outline" size={24} color={PRIMARY_COLOR} /> Decor Services
        </Text>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary || '#666'} />
        <TextInput
          placeholder="Search services..."
          placeholderTextColor={colors.textSecondary || '#666'}
          style={[styles.searchInput, { color: colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary || '#666'} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Season Tabs */}
      <View style={styles.seasonTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seasonTabs}
        >
          <TouchableOpacity
            style={[
              styles.seasonTab,
              selectedSeason === null && styles.selectedSeasonTab
            ]}
            onPress={() => setSelectedSeason(null)}
          >
            <Ionicons 
              name="apps-outline" 
              size={18} 
              color={selectedSeason === null ? '#fff' : '#555'} 
            />
            <Text style={[
              styles.seasonTabText,
              selectedSeason === null && styles.selectedSeasonTabText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {seasons.map((season) => (
            <TouchableOpacity
              key={season.name}
              style={[
                styles.seasonTab,
                selectedSeason === season.name && styles.selectedSeasonTab
              ]}
              onPress={() => setSelectedSeason(
                selectedSeason === season.name ? null : season.name
              )}
            >
              <Ionicons 
                name={season.icon as any} 
                size={18} 
                color={selectedSeason === season.name ? '#fff' : '#555'} 
              />
              <Text style={[
                styles.seasonTabText,
                selectedSeason === season.name && styles.selectedSeasonTabText
              ]}>
                {season.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary || '#666' }]}>
            Loading decor services...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF4D4F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: PRIMARY_COLOR }]}
            onPress={fetchDecorServices}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDecorCard}
          ListEmptyComponent={EmptyState}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 4,
  },
  seasonTabsContainer: {
    marginBottom: 16,
  },
  seasonTabs: {
    paddingHorizontal: 12,
  },
  seasonTab: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  selectedSeasonTab: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  seasonTabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginLeft: 4,
  },
  selectedSeasonTabText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FF4D4F',
    marginVertical: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    padding: 8,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginHorizontal: 8,
  },
  decorCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardContent: {
    padding: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  seasonTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DecorListScreen;