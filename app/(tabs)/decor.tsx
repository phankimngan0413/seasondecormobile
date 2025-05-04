import React, { useEffect, useState, useCallback } from "react";
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
  ScrollView,
  RefreshControl
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { getDecorServicesAPI, IDecor } from "@/utils/decorserviceAPI";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import debounce from 'lodash/debounce';

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputText, setSearchInputText] = useState("");
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

  // Initial load
  useEffect(() => {
    fetchDecorServices();
  }, []);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Only refresh if the screen has been out of focus for a while
      // or if we haven't loaded data yet
      const shouldRefresh = decorServices.length === 0;
      
      if (shouldRefresh) {
        fetchDecorServices();
      } else {
      }
      
      return () => {
        // Cleanup if needed
      };
    }, [decorServices.length])
  );

  // Apply filters whenever selectedSeason or searchQuery changes
  useEffect(() => {
    filterServices();
  }, [selectedSeason, searchQuery, decorServices]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text);
    }, 300),
    []
  );

  // Handle search input change with debounce
  const handleSearchChange = (text: string) => {
    setSearchInputText(text);
    debouncedSearch(text);
  };

  // Clear search
  const clearSearch = () => {
    setSearchInputText("");
    setSearchQuery("");
  };

  const fetchDecorServices = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);
      
      // Add a small delay to make the refresh animation more visible
      if (refreshing) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const data = await getDecorServicesAPI();
      
      if (Array.isArray(data)) {
        setDecorServices(data);
        setFilteredServices(data);
      } else {
        console.error('❌ Invalid data format:', data);
        setError("Invalid data format received.");
      }
    } catch (err: any) {
      console.error('❌ Error fetching decor services:', err);
      setError(err.message || "Failed to fetch decor services.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handler for pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reset filters on refresh to show all results
    // setSelectedSeason(null);
    // clearSearch();
    fetchDecorServices();
  }, []);

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
    
    console.log(`Filtered to ${results.length} services`);
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
        testID={`decor-card-${item.id}`}
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
          ? `No decor services available for ${selectedSeason} season${searchQuery ? ' matching your search' : ''}` 
          : "No decor services match your search criteria"}
      </Text>
      <View style={styles.emptyActionButtons}>
        <TouchableOpacity 
          style={[styles.resetButton, { backgroundColor: PRIMARY_COLOR }]}
          onPress={() => {
            setSelectedSeason(null);
            clearSearch();
          }}
        >
          <Text style={styles.resetButtonText}>Reset Filters</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: colors.card }]}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={16} color={PRIMARY_COLOR} style={{marginRight: 5}} />
          <Text style={[styles.refreshButtonText, {color: PRIMARY_COLOR}]}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state for initial load
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            <Ionicons name="brush-outline" size={24} color={PRIMARY_COLOR} /> Decor Services
          </Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary || '#666' }]}>
            Loading decor services...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          value={searchInputText}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
          testID="search-input"
        />
        {searchInputText.length > 0 && (
          <TouchableOpacity onPress={clearSearch} testID="clear-search">
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
            testID="season-tab-all"
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
              testID={`season-tab-${season.name.toLowerCase()}`}
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
      
      {/* Status info - shows when pulling to refresh */}
      {refreshing && (
        <View style={styles.refreshingInfoContainer}>
          <Text style={styles.refreshingInfoText}>Refreshing data...</Text>
        </View>
      )}
      
      {/* Main Content */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF4D4F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: PRIMARY_COLOR }]}
            onPress={fetchDecorServices}
            testID="retry-button"
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_COLOR]}
              tintColor={PRIMARY_COLOR}
              title="Pull down to refresh..."
              titleColor={colors.textSecondary || '#666'}
              testID="refresh-control"
            />
          }
          onEndReachedThreshold={0.5}
          testID="decor-list"
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
  emptyActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  refreshButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  refreshingInfoContainer: {
    padding: 8,
    backgroundColor: `${PRIMARY_COLOR}20`,
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  refreshingInfoText: {
    color: PRIMARY_COLOR,
    fontWeight: '500',
  },
});

export default DecorListScreen;