import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { getDecorServicesAPI, IDecor } from "@/utils/decorserviceAPI"; // Importing the API
import DecorCard from "@/components/DecorCard"; // DecorCard component for rendering each decor
import { useTheme } from "@/constants/ThemeContext"; // Importing theme context
import { Colors } from "@/constants/Colors"; // Importing theme colors

const DecorListScreen = () => {
  const [decorServices, setDecorServices] = useState<IDecor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null); // Added state for selected season
  const router = useRouter();

  // Access current theme
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark"; // Ensure theme is either light or dark
  const colors = Colors[validTheme]; // Use colors based on the current theme

  useEffect(() => {
    fetchDecorServices();
  }, []);

  const fetchDecorServices = async () => {
    try {
      const data = await getDecorServicesAPI(); // Assuming this API returns an array of decor services
      if (Array.isArray(data)) {
        setDecorServices(data);
      } else {
        setError("Invalid data format received.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch decor services.");
    } finally {
      setLoading(false);
    }
  };

  // Filter decor services based on the selected season
  const filteredDecorServices = selectedSeason
    ? decorServices.filter((decor) =>
        Array.isArray(decor.seasons) &&
        decor.seasons.length > 0 &&
        decor.seasons.some((season: string | { seasonName: string }) => {
          if (typeof season === "string") {
            return season.trim().toLowerCase() === selectedSeason.trim().toLowerCase();
          } else if (season?.seasonName) {
            return season.seasonName.trim().toLowerCase() === selectedSeason.trim().toLowerCase();
          }
          return false;
        })
      )
    : decorServices; // If no selectedSeason, show all

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  if (filteredDecorServices.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.noDecorText, { color: colors.text }]}>No decor services available.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Season Tabs */}
      <View style={styles.seasonTabs}>
        {["Spring", "Summer", "Autumn", "Winter"].map((season) => (
          <TouchableOpacity
            key={season}
            onPress={() => {
              setSelectedSeason(season);
            }}
            style={[
              styles.seasonTab,
              selectedSeason === season && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.seasonTabText,
                selectedSeason === season && { color: "#fff" },
              ]}
            >
              {season}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Decor List */}
      <FlatList
        data={filteredDecorServices}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // Display items in 2 columns
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/decor/[id]", // Navigating to the dynamic route `/decor/[id]`
                params: { id: item.id.toString() }, // Pass the decor id as a parameter
              })
            }
            style={styles.decorWrapper}
          >
            <DecorCard decor={item} />
          </TouchableOpacity>
        )}
        contentContainerStyle={[styles.decorList, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingHorizontal: 10,
    flex: 1,
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally
  },
  seasonTabs: {
    flexDirection: "row", // Display tabs horizontally
    marginBottom: 20,
    marginTop: 10,
  },
  seasonTab: {
    marginHorizontal: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  seasonTabText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
  },
  decorList: {
    justifyContent: "center", // Center items vertically in the list
    alignItems: "center", // Center items horizontally in the list
    paddingBottom: 20,
  },
  decorWrapper: {
    flexBasis: "48%", // Take up about half of the width (for 2 columns)
    marginHorizontal: "1%", // Add some space between items
    marginBottom: 20, // Add space below each item
    alignItems: "center", // Center items inside each decor wrapper
    justifyContent: "center", // Ensure content is centered within the wrapper
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  noDecorText: {
    color: "gray",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default DecorListScreen;
