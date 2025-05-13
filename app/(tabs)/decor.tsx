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
  RefreshControl,
  Modal
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { 
  getDecorServicesAPI, 
  searchDecorServicesAPI, 
  IDecor
} from "@/utils/decorserviceAPI";
import { getSeasonsAPI } from "@/utils/seasonAPI";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import debounce from 'lodash/debounce';

const { width } = Dimensions.get("window");
const PRIMARY_COLOR = "#5fc1f1";

// Interface để phù hợp với dữ liệu từ API
interface ApiSeason {
  id: number;
  seasonName: string;
  decorServiceSeasons: any[] | null;
}

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
  if (season && typeof season === 'object') {
    if ('seasonName' in season) return season.seasonName;
    if ('name' in season) return season.name;
  }
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
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputText, setSearchInputText] = useState("");
  const [seasons, setSeasons] = useState<ApiSeason[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [seasonDropdownVisible, setSeasonDropdownVisible] = useState(false);
  
  const router = useRouter();

  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  // Get selected season icon
  const getSeasonIcon = (seasonName?: string) => {
    if (!seasonName) return "calendar-outline";
    
    switch (seasonName.toLowerCase()) {
      case 'spring':
        return "leaf-outline";
      case 'summer':
        return "sunny-outline";
      case 'autumn':
        return "umbrella-outline";
      case 'winter':
        return "snow-outline";
      default:
        return "calendar-outline";
    }
  };

  // Initial load
  useEffect(() => {
    fetchDecorServices();
    fetchSeasons();
  }, []);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Only refresh if the screen has been out of focus for a while
      // or if we haven't loaded data yet
      const shouldRefresh = decorServices.length === 0;
      
      if (shouldRefresh) {
        fetchDecorServices();
      }
      
      return () => {
        // Cleanup if needed
      };
    }, [decorServices.length])
  );

  // Apply filters whenever selectedSeason or searchQuery changes
  useEffect(() => {
    if (decorServices.length > 0) {
      filterServices();
    }
  }, [selectedSeason, searchQuery]);

  // Debounced search function with longer delay
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text);
    }, 500),
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

  // Fetch all seasons from API
  const fetchSeasons = async () => {
  try {
    setLoadingSeasons(true);
    
    // Use the imported getSeasonsAPI function instead of direct fetch
    const data = await getSeasonsAPI();
    
    if (data && Array.isArray(data)) {
      console.log(`✅ Retrieved ${data.length} seasons successfully`);
      setSeasons(data);
    } else {
      console.error('❌ Failed to retrieve seasons:', 'Invalid data format');
      setSeasons([]);
    }
  } catch (err) {
    console.error('❌ Error fetching seasons:', err);
    setSeasons([]);
  } finally {
    setLoadingSeasons(false);
  }
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
    fetchDecorServices();
  }, []);

  // API-based filtering
  const filterServices = async () => {
    try {
      // Determine if we should use search API
      const hasFilters = selectedSeason || searchQuery.trim().length > 0;
      
      if (hasFilters) {
        setSearching(true);
        
        // Prepare search parameters
        const searchParams: {
          style?: string;
          sublocation?: string;
          categoryName?: string;
          seasonNames?: string[];
        } = {};
        
        // Add search query to style parameter if present
        if (searchQuery.trim()) {
          searchParams.style = searchQuery.trim();
        }
        
        // Add selected season if present
        if (selectedSeason) {
          searchParams.seasonNames = [selectedSeason];
        }
        
        // Call the search API with our parameters
        console.log("📊 Searching with params:", searchParams);
        const results = await searchDecorServicesAPI(searchParams);
        console.log(`🔍 Found ${results.length} services via API search`);
        
        setFilteredServices(results);
      } else {
        // No filters active, show all services
        setFilteredServices(decorServices);
      }
    } catch (err: any) {
      console.error('❌ Error searching decor services:', err);
      // Don't show error to user, just fallback to showing all services
      setFilteredServices(decorServices);
    } finally {
      setSearching(false);
    }
  };

  const renderDecorCard = ({ item }: { item: IDecor }) => {
    // Extract province or sublocation
    const location = item.province || item.sublocation || 'Unknown Location';
    
    return (
      <TouchableOpacity 
        style={[styles.decorCard, { backgroundColor: colors.card }]}
        onPress={() => {
          // Đảm bảo item.id là string
          const id = typeof item.id === 'number' ? item.id.toString() : item.id;
          console.log(`🔍 Navigating to decor detail: ${id}`);
          
          router.push({
            pathname: "/decor/[id]",
            params: { id }
          });
        }}
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

  // Season dropdown component
  const SeasonDropdown = () => {
    // Get selected season icon
    const getSelectedSeasonIcon = () => {
      if (!selectedSeason) return "apps-outline";
      const found = seasons.find(s => s.seasonName === selectedSeason);
      return found ? getSeasonIcon(found.seasonName) : "apps-outline";
    };

    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={[styles.dropdownButton, { backgroundColor: colors.card }]}
          onPress={() => setSeasonDropdownVisible(true)}
          testID="season-dropdown-button"
        >
          <Ionicons 
            name={getSelectedSeasonIcon() as any} 
            size={18} 
            color={PRIMARY_COLOR} 
            style={styles.dropdownIcon}
          />
          <Text style={[styles.dropdownButtonText, { color: colors.text }]}>
            {selectedSeason || 'All Seasons'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary || '#666'} />
        </TouchableOpacity>

        {/* Dropdown Modal */}
        <Modal
          visible={seasonDropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSeasonDropdownVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSeasonDropdownVisible(false)}
          >
            <View 
              style={[styles.dropdownModal, { backgroundColor: colors.card }]}
            >
              {/* Season options */}
              {!loadingSeasons ? (
                seasons.length > 0 ? (
                  <>
                    <TouchableOpacity 
                      style={[
                        styles.dropdownItem,
                        selectedSeason === null && styles.selectedDropdownItem
                      ]}
                      onPress={() => {
                        setSelectedSeason(null);
                        setSeasonDropdownVisible(false);
                      }}
                    >
                      <Ionicons 
                        name="apps-outline" 
                        size={20} 
                        color={selectedSeason === null ? PRIMARY_COLOR : colors.text} 
                        style={styles.dropdownItemIcon}
                      />
                      <Text 
                        style={[
                          styles.dropdownItemText, 
                          { color: colors.text },
                          selectedSeason === null && { color: PRIMARY_COLOR, fontWeight: 'bold' }
                        ]}
                      >
                        All Seasons
                      </Text>
                    </TouchableOpacity>
                    
                    {seasons.map((season) => (
                      <TouchableOpacity 
                        key={season.id}
                        style={[
                          styles.dropdownItem,
                          selectedSeason === season.seasonName && styles.selectedDropdownItem
                        ]}
                        onPress={() => {
                          setSelectedSeason(season.seasonName);
                          setSeasonDropdownVisible(false);
                        }}
                      >
                        <Ionicons 
                          name={getSeasonIcon(season.seasonName) as any} 
                          size={20} 
                          color={selectedSeason === season.seasonName ? PRIMARY_COLOR : colors.text} 
                          style={styles.dropdownItemIcon}
                        />
                        <Text 
                          style={[
                            styles.dropdownItemText, 
                            { color: colors.text },
                            selectedSeason === season.seasonName && { color: PRIMARY_COLOR, fontWeight: 'bold' }
                          ]}
                          numberOfLines={1}
                        >
                          {season.seasonName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <View style={styles.dropdownEmptyContainer}>
                    <Ionicons name="calendar-outline" size={30} color={colors.textSecondary} />
                    <Text style={[styles.dropdownEmptyText, { color: colors.textSecondary }]}>
                      No seasons available
                    </Text>
                  </View>
                )
              ) : (
                <View style={styles.dropdownLoadingContainer}>
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                  <Text style={[styles.dropdownLoadingText, { color: colors.textSecondary }]}>
                    Loading seasons...
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
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
          ? `No decor services available for "${selectedSeason}"${searchQuery ? ' matching your search' : ''}` 
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
      
      {/* Search Bar and Season Filter */}
      <View style={styles.filtersContainer}>
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

        {/* Season Dropdown */}
        <SeasonDropdown />
      </View>
      
      {/* Search Status Indicator */}
      {searching && (
        <View style={styles.refreshingInfoContainer}>
          <ActivityIndicator size="small" color={PRIMARY_COLOR} style={{marginRight: 8}} />
          <Text style={styles.refreshingInfoText}>Searching...</Text>
        </View>
      )}
      
      {/* Refresh Status Indicator */}
      {refreshing && !searching && (
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
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 4,
  },
  dropdownContainer: {
    width: '35%',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dropdownIcon: {
    marginRight: 6,
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    width: '80%',
    borderRadius: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '70%', // Prevent it from being too tall on small screens
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectedDropdownItem: {
    backgroundColor: `${PRIMARY_COLOR}15`,
  },
  dropdownItemIcon: {
    marginRight: 12,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  dropdownLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownLoadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  dropdownEmptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownEmptyText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
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
    flexDirection: 'row',
    padding: 8,
    backgroundColor: `${PRIMARY_COLOR}20`,
    alignItems: 'center',
    justifyContent: 'center',
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