import React, { useEffect, useState } from "react";
import { 
  View, Text, Image, ActivityIndicator, StyleSheet, ScrollView, Alert, TouchableOpacity 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getProductDetailAPI, IProduct } from "@/utils/productAPI"; 
import { addToCartAPI, createCartAPI, getCartAPI } from "@/utils/cartAPI"; 
import CustomButton from "@/components/ui/Button/Button"; 
import Ionicons from "react-native-vector-icons/Ionicons";
import { getToken, getUserIdFromToken } from "@/services/auth";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const [product, setProduct] = useState<IProduct | null>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [cartId, setCartId] = useState<number | null>(null); // Track cartId
  const [quantity, setQuantity] = useState(1); // Track quantity
  
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  useEffect(() => {
    if (id && !isNaN(Number(id))) {
      fetchProductDetail();
    } else {
      setError("Invalid product ID.");
      setLoading(false);
    }
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

  const fetchCartId = async () => {
    try {
      const token = await getToken();
      if (!token) return;
  
      const userId = await getUserIdFromToken(); // Fetch userId from the token
      if (!userId) return;
  
      // Fetch the cart using the userId
      const cartData = await getCartAPI(userId);  // Fetch cart by userId
      console.log("Fetched Cart Data:", cartData); // Log the cart data fetched from the API
  
      if (cartData && cartData.id) {
        setCartId(cartData.id);  // Set the cartId from the response
        console.log("Cart fetched successfully:", cartData.id);
        return cartData.id; // Return the cartId immediately
      } else {
        // If no cart exists, create a new cart
        const newCartId = await createCartAPI();
        setCartId(newCartId); // Store the new cartId
        console.log("New cart created with ID:", newCartId);
        return newCartId; // Return the new cartId
      }
    } catch (error) {
      console.error("Error fetching or creating cart:", error);
      setCartId(null);  // In case of an error, ensure cartId is set to null
      return null; // Return null to indicate no valid cartId
    }
  };
  
  const handleAddToCart = async () => {
    if (!product) return; // Ensure product exists before proceeding

    // Fetch or create the cart dynamically before adding the product
    const cartId = await fetchCartId(); // Get the cartId and wait for it

    if (!cartId) {
      Alert.alert("❌ Error", "Failed to get a valid cart.");
      console.log("Failed to get a valid cart ID:", cartId);  // Log cartId value
      return; // Don't proceed without a valid cartId
    }

    // Fetch the userId from token
    const userId = await getUserIdFromToken(); // Fetch userId from the token
    if (!userId) {
      Alert.alert("❌ Error", "Failed to retrieve user information.");
      console.log("Failed to retrieve user ID:", userId);  // Log userId value
      return; // Don't proceed if userId is not available
    }

    try {
      // Make the API call to add the product to the cart using the correct userId and cartId
      await addToCartAPI(userId, product.id, quantity); // Use quantity from state
      console.log("Product added to cart successfully");
      Alert.alert("✅ Success", "Product added to cart!");
    } catch (error) {
      // Error handling for API call failure
      const errorMessage = error instanceof Error ? error.message : "Failed to add product to cart.";
      console.log("Error adding to cart:", errorMessage);
      Alert.alert("❌ Error", errorMessage);
    }
  };

  
  
  
  // Quantity adjustment
  const incrementQuantity = () => setQuantity(prevQuantity => prevQuantity + 1);
  const decrementQuantity = () => setQuantity(prevQuantity => (prevQuantity > 1 ? prevQuantity - 1 : 1)); // Prevent 0 or negative values

  if (loading) return <ActivityIndicator size="large" color={colors.primary} />;
  if (error) return <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>;
  if (!product) return <Text style={[styles.noProductText, { color: colors.text }]}>No product details available.</Text>;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={handlePrev} style={[styles.arrowButton, styles.leftArrow]}>
          <Ionicons name="chevron-back" size={30} color="#fff" />
        </TouchableOpacity>

        {product.imageUrls && product.imageUrls.length > 0 && (
          <Image
            source={{ uri: product.imageUrls[currentIndex] + "?time=" + new Date().getTime() }}
            style={styles.productImage}
            onError={(e) => console.log("Image Load Error: ", e.nativeEvent.error)}
          />
        )}

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

        {/* Quantity Input with Buttons */}
        <View style={styles.quantityContainer}>
        <TouchableOpacity onPress={decrementQuantity} style={styles.quantityButton}>
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{quantity}</Text>
        <TouchableOpacity onPress={incrementQuantity} style={styles.quantityButton}>
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
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

  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 5,
    borderRadius: 5,
    marginBottom: 10,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: 15,
    
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
