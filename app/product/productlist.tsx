// Assuming this is the code in your DecorCard component
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
  seasons: string[];
}

const DecorCard = ({ decor }: { decor: IDecor }) => {
  const imageUrl = decor.images.length > 0 ? decor.images[0] : 'https://via.placeholder.com/150'; // Use the first valid image

  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <Text style={styles.title}>{decor.style}</Text>
      <Text style={styles.price}>${decor.basePrice}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {decor.description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
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
});

export default DecorCard;
