import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  SafeAreaView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { unfollowUserAPI } from "@/utils/followAPI";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import Ionicons from "react-native-vector-icons/Ionicons";
import { initApiClient } from "@/config/axiosConfig";
import { StatusBar } from "expo-status-bar";

const PRIMARY_COLOR = "#5fc1f1";

// Interface that matches the actual API data structure
interface IFollowingUser {
  accountId: number;
  avatar: string;
  businessName: string;
}

// Direct API function instead of using getFollowingsAPI
const fetchFollowingsDirectly = async (userId?: number): Promise<IFollowingUser[]> => {
  const url = userId ? `/api/follow/followings?userId=${userId}` : "/api/follow/followings";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    // Check response structure
    if (response && response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    } else {
      throw new Error("Invalid response format from the server.");
    }
  } catch (error: any) {
    console.error("🔴 Error fetching followings:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    throw new Error("Failed to fetch followings from the server.");
  }
};

const FollowingScreen = () => {
  const [followings, setFollowings] = useState<IFollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId ? Number(params.userId) : undefined;

  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  useEffect(() => {
    loadFollowings();
  }, [userId]);

  const loadFollowings = async () => {
    try {
      const data = await fetchFollowingsDirectly(userId);
      setFollowings(data);
    } catch (err: any) {
      console.error("Error fetching followings:", err);
      setError(err.message || "Unable to load following list");
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (accountId: number) => {
    // router.push({
    //   pathname: "/profile/[id]",
    //   params: { id: accountId },
    // });
  };

  const handleUnfollow = async (accountId: number) => {
    try {
      await unfollowUserAPI(accountId);
      setFollowings(followings.filter(user => user.accountId !== accountId));
    } catch (err: any) {
      console.error("Error unfollowing user:", err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadFollowings}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Following</Text>
        <View style={styles.placeholder} />
      </View>
      
      <FlatList
        data={followings}
        keyExtractor={(item) => item.accountId.toString()}
        renderItem={({ item }) => (
          <View style={[styles.userItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => handleUserClick(item.accountId)}
            >
              <Image 
                source={{ uri: item.avatar || 'https://via.placeholder.com/40' }} 
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {item.businessName || `User ${item.accountId}`}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.unfollowButton}
              onPress={() => handleUnfollow(item.accountId)}
            >
              <Text style={styles.unfollowText}>Unfollow</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary || '#666' }]}>
              No users found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 50,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 28,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  unfollowButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  unfollowText: {
    color: 'white',
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  }
});

export default FollowingScreen;