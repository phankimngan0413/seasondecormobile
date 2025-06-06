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
  StatusBar,
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { getProvidersAPI, IProvider } from "@/utils/providerAPI";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width } = Dimensions.get("window");
const PRIMARY_COLOR = "#5fc1f1";

// Hàm xóa các thẻ HTML khỏi văn bản
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, " ").trim();
};

const ProviderScreen = () => {
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const data = await getProvidersAPI();
      setProviders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderClick = (slug: string) => {
    router.push({
      pathname: "/provider/[slug]",
      params: { slug },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading providers...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color="#ff4d4f" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchProviders}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (providers.length === 0) {
    return (
      <SafeAreaView style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="people-outline" size={60} color={colors.text} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Providers Found</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary || '#666' }]}>
          We couldn't find any providers. Check back later for updates.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: PRIMARY_COLOR }]}>Seasonal Decor Providers</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary || '#666' }]}>
          Discover professional services for your home
        </Text>
      </View>
      
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleProviderClick(item.slug)}
            style={[styles.providerCard, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              {item.avatar ? (
                // Show image if avatar URL exists
                <Image 
                  source={{ uri: item.avatar }} 
                  style={styles.avatar}
                  onError={(e) => console.log('Image load error', e.nativeEvent.error)}
                />
              ) : (
                // Show icon placeholder if no avatar
                <View style={[styles.avatarPlaceholder, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                  <Ionicons name="person" size={30} color={PRIMARY_COLOR} />
                </View>
              )}
              
              <View style={styles.headerInfo}>
                <Text style={[styles.businessName, { color: colors.text }]}>
                  {item.businessName}
                </Text>
                
                <View style={styles.badgeContainer}>
                  {item.providerVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.viewButton, { backgroundColor: PRIMARY_COLOR }]}
                    onPress={() => handleProviderClick(item.slug)}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary || '#666'} />
                  <Text style={[styles.locationText, { color: colors.textSecondary || '#666' }]}
                    numberOfLines={1}>
                    {item.address?.split(',').pop()?.trim() || 'Location not available'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            {/* Sử dụng text đã loại bỏ HTML tags cho bioText */}
            <Text 
              style={[styles.bioText, { color: colors.text }]}
              numberOfLines={2}
            >
              {stripHtmlTags(item.bio) || 'No description available'}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 12,
    marginBottom: 8,
    color: '#ff4d4f',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 300,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  providerCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    marginLeft: 4,
    flex: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  viewButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProviderScreen;