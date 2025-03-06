import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import CustomButton from "@/components/ui/Button/Button";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/constants/ThemeContext";
import { jwtDecode } from "jwt-decode";
import { getToken, removeToken } from "@/services/auth";
import ProfileMenu from "@/components/ProfileMenu";

interface DecodedToken {
  email: string;
  unique_name: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  const [profile, setProfile] = useState<{ email: string; name: string } | null>(null);
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
        setProfile({
          email: decoded.email,
          name: decoded.unique_name,
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
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.primary }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}> 
        <LinearGradient colors={[colors.primary, colors.secondary]} style={[styles.header, { backgroundColor: colors.primary }]}> 
          <View style={styles.profileInfo}>
            <Text style={[styles.username, { color: "#fff" }]}>{profile?.name}</Text>
            <Text style={[styles.email, { color: "#fff" }]}>{profile?.email}</Text>
          </View>
        </LinearGradient>

        <ProfileMenu />

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Tracking</Text>
          <CustomButton title="Logout" onPress={handleLogout} style={{ backgroundColor: colors.primary }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16 },
  scrollContainer: { flexGrow: 1, paddingBottom: 20 },
  header: { padding: 40, paddingTop: 70, alignItems: "center" },
  profileInfo: { alignItems: "center", marginTop: 20 },
  username: { fontSize: 22, fontWeight: "bold" },
  email: { fontSize: 16 },
  content: { padding: 20, alignItems: "center" },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});