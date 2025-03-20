import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router"; 
import { getDecorServiceByIdAPI } from "@/utils/decorserviceAPI"; // Assuming you have an API to fetch decor details
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

const DecorDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [decorDetail, setDecorDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0); // Track image index
  
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  useEffect(() => {
    if (id) {
      fetchDecorDetails(id as string); 
    }
  }, [id]);

  const fetchDecorDetails = async (id: string) => {
    try {
      const data = await getDecorServiceByIdAPI(Number(id)); 
      setDecorDetail(data);
    } catch (err: any) {
      setError("Failed to load decor details.");
    } finally {
      setLoading(false);
    }
  };

  // Handle image navigation
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (decorDetail?.images.length > 1) {
      setCurrentIndex(decorDetail.images.length - 1); // Loop back to the last image
    }
  };

  const handleNext = () => {
    if (decorDetail?.images && currentIndex < decorDetail.images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Loop back to the first image
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      {decorDetail ? (
        <>
          {/* Image Navigation */}
          <View style={styles.imageContainer}>
            <TouchableOpacity onPress={handlePrev} style={[styles.arrowButton, styles.leftArrow]}>
              <Ionicons name="chevron-back" size={30} color="#fff" />
            </TouchableOpacity>

            <Image
              source={{
                uri: decorDetail.images[currentIndex] || "https://via.placeholder.com/150",
              }}
              style={styles.image}
            />

            <TouchableOpacity onPress={handleNext} style={[styles.arrowButton, styles.rightArrow]}>
              <Ionicons name="chevron-forward" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{decorDetail.style}</Text>
          <Text style={[styles.description, { color: colors.text }]}>{decorDetail.description}</Text>
          
          {/* Display Price */}
          {decorDetail.basePrice && (
            <Text style={[styles.price, { color: colors.primary }]}> ${decorDetail.basePrice.toFixed(2)}</Text>
          )}

          {/* Display Seasons */}
          <View style={styles.seasonsContainer}>
            <Text style={[styles.seasonsTitle, { color: colors.text }]}>Available Seasons:</Text>
            {decorDetail.seasons.length > 0 ? (
              decorDetail.seasons.map((season: string, index: number) => (
                <Text key={index} style={[styles.seasonText, { color: colors.text }]}>
                  {season}
                </Text>
              ))
            ) : (
              <Text style={[styles.noSeasonsText, { color: colors.text }]}>No seasons available</Text>
            )}
          </View>
        </>
      ) : (
        <Text style={[styles.noDataText, { color: colors.text }]}>No details available.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
  },
  imageContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  image: {
    width: 350,
    height: 300,
    resizeMode: "cover",
    marginRight: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "gray",
    marginTop: 10,
    textAlign: "center",
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  noDataText: {
    fontSize: 18,
    color: "gray",
    textAlign: "center",
  },
  seasonsContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  seasonsTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  seasonText: {
    fontSize: 16,
    color: "green",
  },
  noSeasonsText: {
    fontSize: 16,
    color: "gray",
  },
  arrowButton: {
    position: "absolute",
    top: "50%",
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 50,
    padding: 10,
  },
  leftArrow: {
    left: 10,
  },
  rightArrow: {
    right: 10,
  },
});

export default DecorDetailScreen;
