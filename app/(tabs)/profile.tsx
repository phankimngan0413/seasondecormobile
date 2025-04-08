import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import CustomButton from "@/components/ui/Button/Button";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
import { jwtDecode } from "jwt-decode";
import { getToken, removeToken } from "@/services/auth";
import ProfileMenu from "@/components/ProfileMenu";
import { getAccountDetails } from "@/utils/accountAPI";
import { Ionicons } from "@expo/vector-icons";
// Import the wallet component
import WalletBalance from "@/components/WalletBalance";

interface DecodedToken {
  email: string;
  unique_name: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  const [profile, setProfile] = useState<{ email: string; name: string; avatar: string | null } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          router.replace("/(auth)/login");
          return;
        }

        const decoded: DecodedToken = jwtDecode(token);

        // Fetch account details, including the avatar image
        const accountData = await getAccountDetails();
        setProfile({
          email: decoded.email,
          name: decoded.unique_name,
          avatar: accountData.avatar || null,
        });
      } catch (error) {
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await removeToken();
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error || "#e74c3c"} />
        <Text style={[styles.errorText, { color: colors.text }]}>Account error, please log in again</Text>
        <CustomButton 
          title="Logout" 
          onPress={handleLogout} 
          style={{ backgroundColor: colors.primary, marginTop: 20 }} 
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={validTheme === "dark" ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary || '#2980b9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Profile Banner with Avatar */}
            <View style={styles.profileContainer}>
              {profile?.avatar ? (
                <Image 
                  source={{ uri: profile.avatar }} 
                  style={styles.avatar}
                  resizeMode="cover" 
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase()}</Text>
                </View>
              )}
              
              <View style={styles.profileTextContainer}>
                <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
                  {profile?.name}
                </Text>
                <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
                  {profile?.email}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => router.push("/screens/Account")}
              >
                <Ionicons name="pencil" size={14} color="#fff" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Account Stats */}
          {/* <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>12</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>3</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>5</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Wishlists</Text>
            </View>
          </View> */}

          {/* Wallet Balance */}
          <WalletBalance />

          {/* Account Settings Section */}
          <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>
            <ProfileMenu />
          </View>

          {/* Order Tracking Section
          <View style={[styles.orderTrackingContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Tracking</Text>
            <TouchableOpacity style={styles.trackingItem}>
              <View style={styles.trackingIconContainer}>
                <Ionicons name="cube-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.trackingContent}>
                <Text style={[styles.trackingTitle, { color: colors.text }]}>Recent Order #SC8742</Text>
                <Text style={[styles.trackingSubtitle, { color: colors.textSecondary }]}>In transit - Arriving Mar 31</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View> */}

          {/* Logout Button */}
          <View style={styles.logoutContainer}>
            <CustomButton 
              title="Logout" 
              onPress={handleLogout} 
              style={styles.logoutButton} 
              textStyle={styles.logoutButtonText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  walletWrapper: {
    marginTop: -8, // Bring it slightly closer to the stats container
    marginBottom: 8,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  profileContainer: {
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: "#fff",
  },
  profileTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  editButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 10,
  },
  
  // Menu Container
  menuContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  
  // Order Tracking
  orderTrackingContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  trackingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 150, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trackingContent: {
    flex: 1,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  trackingSubtitle: {
    fontSize: 14,
  },
  
  // Logout
  logoutContainer: {
    marginHorizontal: 16,
    marginTop: 30,
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#f8f8f8',  // Light gray background
    borderWidth: 1,
    borderColor: '#e74c3c',      // Red border
    borderRadius: 8,             // Slightly less rounded corners
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,                // Add slight elevation for the shadow effect
    marginVertical: 10,
  },
  logoutButtonText: {
    color: '#e74c3c',
    fontWeight: '600',
  },
});