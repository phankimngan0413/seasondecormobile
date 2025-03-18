import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// Interface for Decor Service
interface IDecor {
  id: number;
  style: string;
  basePrice: number;
  description: string;
  province: string;
  createAt: string;
  accountId: number;
  decorCategoryId: number;
  favoriteCount: number;
  images: string[]; // Array of image URIs
  seasons: { id: number; seasonName: string }[]; // Array of season objects
}

const DecorCard = ({ decor }: { decor: IDecor }) => {
  // Ensure images are valid
  const validImages = decor.images.filter(image => image && image.trim() !== "");

  // Use the first valid image, or fallback to placeholder if no images are available
  const imageUrl = validImages.length > 0 ? validImages[0] : 'https://via.placeholder.com/150';

  // Handle missing or invalid data for style, description, and price
  const styleText = decor.style || "No Style Available";
  const descriptionText = decor.description || "No description available.";
  const priceText = decor.basePrice ? `$${decor.basePrice}` : "Price not available";

  // Render seasons data
  const seasonsText = decor.seasons.map(season => season.seasonName).join(", ");

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
      />
      <Text style={styles.title}>{styleText}</Text>
      <Text style={styles.price}>{priceText}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {descriptionText}
      </Text>

      {/* Conditionally render the seasons if available */}
      {seasonsText && (
        <Text style={styles.seasons}>Seasons: {seasonsText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%', // Ensures the width is consistent for all cards
    padding: 12,
    borderRadius: 8,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginHorizontal: 5, // Ensures equal spacing between cards
    borderWidth: 1, // Adds a border to the card
    borderColor: "#ddd",
    backgroundColor: "#fff", // White background for each card
    height: 300, // Fixed height for all cards
  },
  image: {
    width: "100%", // Make sure the image takes full width
    height: 150, // Fixed height for images
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  price: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
  },
  description: {
    fontSize: 12,
    color: "#555",
    marginTop: 5,
    textAlign: "center",
  },
  seasons: {
    fontSize: 12,
    color: "#444",
    marginTop: 5,
    textAlign: "center",
  },
});

export default DecorCard;
