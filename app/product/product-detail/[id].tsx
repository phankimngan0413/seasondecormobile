import React, { useEffect, useState } from "react";
import { 
  View, Text, Image, ActivityIndicator, StyleSheet, ScrollView, Alert, TouchableOpacity 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getProductDetailAPI, IProduct } from "@/utils/productAPI";
import { addToCartAPI } from "@/utils/cartAPI";
import CustomButton from "@/components/ui/Button/Button";
import Ionicons from "react-native-vector-icons/Ionicons";
import { getToken } from "@/services/auth";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      const data = await getProductDetailAPI(Number(id));
      if (data) {
        setProduct(data);
      } else {
        setError("Product not found.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (product && product.imageUrls && currentIndex < product.imageUrls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const token = await getToken();
    if (!token) {
      Alert.alert("🔒 Login Required", "You need to log in to add items to your cart.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }

    try {
      await addToCartAPI(product.id, 1, product.productPrice);
      Alert.alert("✅ Success", "Product added to cart!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add product to cart.";
      Alert.alert("❌ Error", errorMessage);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={colors.primary} />;
  if (error) return <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>;
  if (!product) return <Text style={[styles.noProductText, { color: colors.text }]}>No product details available.</Text>;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.imageContainer}>
        {/* Left Arrow */}
        <TouchableOpacity onPress={handlePrev} style={[styles.arrowButton, styles.leftArrow]}>
          <Ionicons name="chevron-back" size={30} color="#fff" />
        </TouchableOpacity>

        {/* Image Display */}
        {product.imageUrls && product.imageUrls.length > 0 && (
          <Image
            source={{ uri: product.imageUrls[currentIndex] + "?time=" + new Date().getTime() }}
            style={styles.productImage}
            onError={(e) => console.log("Image Load Error: ", e.nativeEvent.error)}
          />
        )}

        {/* Right Arrow */}
        <TouchableOpacity onPress={handleNext} style={[styles.arrowButton, styles.rightArrow]}>
          <Ionicons name="chevron-forward" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{product.productName}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>💰 ${product.productPrice.toFixed(2)}</Text>
        <Text style={[styles.description, { color: colors.text }]}>{product.description}</Text>

        <View style={[styles.infoContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.info, { color: colors.text }]}>📦 In Stock: {product.quantity}</Text>
          <Text style={[styles.info, { color: colors.text }]}>🌍 Made in: {product.madeIn}</Text>
          <Text style={[styles.info, { color: colors.text }]}>🚚 Ships from: {product.shipFrom}</Text>
        </View>

        <Text style={[styles.rating, { color: colors.icon }]}>⭐ {product.rate} / 5 ({product.totalRate} reviews)</Text>

        <CustomButton 
          title="🛒 Add to Cart" 
          onPress={handleAddToCart} 
          btnStyle={[styles.addToCartButton, { backgroundColor: colors.primary }]} 
          labelStyle={styles.addToCartText} 
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 15,
  },
  imageContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  productImage: {
    width: 380, 
    height: 300, 
    resizeMode: "cover",
    marginRight: 10,
    borderRadius: 8,
  },
  productCard: {
    width: "100%",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    alignItems: "center",
    marginTop: 15,
    borderWidth: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 15,
  },
  infoContainer: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  info: {
    fontSize: 15,
    marginBottom: 5,
  },
  rating: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 10,
  },
  addToCartButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
  },
  addToCartText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#ffffff",
  },
  arrowButton: {
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 50,
    zIndex: 10,
  },
  leftArrow: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: [{ translateY: -15 }],
  },
  rightArrow: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -15 }],
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  noProductText: {
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default ProductDetailScreen;
