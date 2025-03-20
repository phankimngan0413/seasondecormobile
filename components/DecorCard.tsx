import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/ThemeContext'; // Importing theme context
import { Colors } from '@/constants/Colors'; // Importing theme colors

// Interface for Decor Service
export interface IDecor {
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
  seasons: { id: number; seasonName: string }[] | string[]; // Array of season objects or simple strings
}

const DecorCard = ({ decor }: { decor: IDecor }) => {
  // Access current theme
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark"; // Ensure theme is either light or dark
  const colors = Colors[validTheme]; // Use colors based on the current theme

  // Ensure images are valid
  const validImages = decor.images && Array.isArray(decor.images) ? decor.images.filter((image) => image && image.trim() !== "") : [];

  // Use the first valid image, or fallback to placeholder if no images are available
  const imageUrl = validImages.length > 0 ? validImages[0] : 'https://via.placeholder.com/150';

  // Handle missing or invalid data for style, description, and price
  const styleText = decor.style || "No Style Available";
  const descriptionText = decor.description || "No description available.";
  const priceText = decor.basePrice ? `$${decor.basePrice}` : "Price not available";

  // Handle the seasons rendering based on the structure of seasons data
  let seasonsText = '';
  if (Array.isArray(decor.seasons)) {
    if (typeof decor.seasons[0] === 'string') {
      // If seasons is an array of strings (e.g., ["Summer"])
      seasonsText = decor.seasons.join(", ");
    } else if (typeof decor.seasons[0] === 'object' && decor.seasons[0].seasonName) {
      // If seasons is an array of objects (e.g., [{ id: 1, seasonName: "Summer" }])
      seasonsText = (decor.seasons as { id: number; seasonName: string }[]).map(season => season.seasonName).join(", ");
    }
  } else {
    seasonsText = "No seasons available"; // Default if seasons is not an array
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <Text style={[styles.title, { color: colors.titleColor }]}>{styleText}</Text>
      <Text style={[styles.price, { color: colors.priceColor }]}>{priceText}</Text>
      <Text style={[styles.description, { color: colors.descriptionColor }]} numberOfLines={2}>
        {descriptionText}
      </Text>

      {/* Conditionally render the seasons if available */}
      <Text style={[styles.seasons, { color: colors.seasonColor }]}>Seasons: {seasonsText}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginHorizontal: 5, // Ensures equal spacing between cards
    borderWidth: 1, // Adds a border to the card
    borderColor: "#ddd",
    height: 300, // Fixed height for all cards
  },
  image: {
    width: '100%', // Make sure the image takes full width
    height: 150, // Fixed height for images
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  price: {
    fontSize: 14,
    marginTop: 5,
  },
  description: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  seasons: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default DecorCard;
