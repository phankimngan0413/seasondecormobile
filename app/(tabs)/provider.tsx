import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { getProvidersAPI, IProvider } from "@/utils/providerAPI";
import { useTheme } from "@/constants/ThemeContext"; // Import the theme context
import { Colors } from "@/constants/Colors";

const PRIMARY_COLOR = "#5fc1f1"; // Define the primary color

const ProviderScreen = () => {
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const { theme } = useTheme(); // Get the current theme
  const validTheme = theme as "light" | "dark"; // Ensure theme is either light or dark
  const colors = Colors[validTheme]; // Use colors based on the theme

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

  if (loading) return <ActivityIndicator size="large" color={colors.primary} />;
  if (error) return <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>;
  if (providers.length === 0) return <Text style={[styles.noProviderText, { color: colors.text }]}>No providers available.</Text>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: PRIMARY_COLOR }]}>Providers</Text>
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleProviderClick(item.slug)}
            style={[styles.providerWrapper, { borderColor: colors.primary, backgroundColor: colors.cardBackground }]} // Add white border
          >
            <View style={styles.avatarContainer}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            </View>
            <View style={styles.infoContainer}>
              <Text style={[styles.businessName, { color: colors.text }]}>{item.businessName}</Text>
              <Text style={[styles.bio, { color: colors.text }]}>{item.bio}</Text>
              <Text style={[styles.address, { color: colors.text }]}>{item.address}</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity style={[styles.followButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.followText}>Follow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.messageButton, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.messageText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.providerList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15, // Reduced padding for top
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 22, // Slightly reduced font size for title
    fontWeight: "700",
    marginBottom: 20, // Reduced margin for title
    textAlign: "left", // Remove centering
  },
  providerWrapper: {
    flexDirection: "row",
    padding: 16,  // Reduced padding for smaller card
    borderRadius: 10, // Reduced border radius for a more compact card
    marginBottom: 16, // Reduced margin between cards
    borderWidth: 1, // Add a white border
    borderColor: "#fff", // White border color
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    position: "relative", // Needed for absolute positioning of buttons
  },
  avatarContainer: {
    alignItems: "center",
    marginRight: 16, // Reduced margin to make it more compact
    justifyContent: "center", // Vertically center the avatar
  },
  avatar: {
    width: 60,  // Smaller avatar size
    height: 60, // Smaller avatar size
    borderRadius: 25, // Make it a circle
  },
  infoContainer: {
    flex: 1,
    marginTop: 0, // Removed unnecessary top margin for compactness
  },
  businessName: {
    fontSize: 18, // Adjusted font size for business name
    fontWeight: "600",
    marginTop: 6,
  },
  bio: {
    fontSize: 12, // Smaller font size for bio
    marginTop: 8,
  },
  address: {
    fontSize: 12, // Smaller font size for address
    marginTop: 6,
  },
  actionsContainer: {
    flexDirection: "row",
    marginTop: 10, // Reduced margin for actions
  },
  followButton: {
    borderRadius: 20,
    paddingVertical: 6,  // Reduced padding for smaller buttons
    paddingHorizontal: 16,
    marginRight: 8,  // Reduced space between buttons
  },
  followText: {
    color: "#fff",
    fontSize: 14, // Smaller font size for the text
    fontWeight: "bold",
  },
  messageButton: {
    borderRadius: 20,
    paddingVertical: 6,  // Reduced padding for smaller buttons
    paddingHorizontal: 16,
  },
  messageText: {
    color: "#fff",
    fontSize: 14, // Smaller font size for the text
    fontWeight: "bold",
  },
  providerList: {
    paddingBottom: 16, // Reduced padding at the bottom
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  noProviderText: {
    color: "gray",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default ProviderScreen;
