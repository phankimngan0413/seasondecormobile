import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { getProvidersAPI, IProvider } from "@/utils/providerAPI";
import { useTheme } from "@/constants/ThemeContext"; // Import the theme context
import { Colors } from "@/constants/Colors";

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
      <Text style={[styles.title, { color: colors.text }]}>Providers</Text>
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleProviderClick(item.slug)}
            style={[styles.providerWrapper, { borderColor: colors.primary, backgroundColor: colors.background }]} // Add white border
          >
            <View style={styles.avatarContainer}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            </View>
            <View style={styles.infoContainer}>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.businessName, { color: colors.primary }]}>{item.businessName}</Text>
              <Text style={[styles.bio, { color: colors.secondary }]}>{item.bio}</Text>
              <Text style={[styles.address, { color: colors.secondary }]}>{item.address}</Text>
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
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 30,
    textAlign: "center",
  },
  providerWrapper: {
    flexDirection: "row",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1, // Add a white border
    borderColor: "#fff", // White border color
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginRight: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
  },
  businessName: {
    fontSize: 16,
    marginTop: 8,
  },
  bio: {
    fontSize: 14,
    marginTop: 12,
  },
  address: {
    fontSize: 14,
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    marginTop: 15,
  },
  followButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginRight: 15,
  },
  followText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  messageButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  providerList: {
    paddingBottom: 20,
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
