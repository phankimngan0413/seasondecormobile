import React, { useEffect, useState, useCallback } from "react";
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
  RefreshControl,
  Alert
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
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const fetchProfile = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        // handleRedirectToLogin();
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
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, [fetchProfile]);

  

  const handleLogout = async () => {
    // Prevent multiple logout attempts
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          onPress: () => setIsRedirecting(false),
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            await removeToken();
            // Using replace instead of push to prevent going back to profile
            router.replace("/(auth)/login");
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
      </View>
    );
  }

  // if (error) {
  //   return (
  //     <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
  //       <Ionicons name="alert-circle-outline" size={48} color={colors.error || "#e74c3c"} />
  //       <Text style={[styles.errorText, { color: colors.text }]}>Account error, please log in again</Text>
  //       <CustomButton 
  //         title="Log in" 
  //         onPress={handleRedirectToLogin} 
  //         style={{ backgroundColor: colors.primary, marginTop: 20 }} 
  //       />
  //     </View>
  //   );
  // }

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]} // Android
              tintColor={colors.primary} // iOS
              title="Pull to refresh" // iOS
              titleColor={colors.text} // iOS
            />
          }
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

          {/* Wallet Balance */}
          <WalletBalance />

          {/* Account Settings Section */}
          <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>
            <ProfileMenu />
          </View>

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