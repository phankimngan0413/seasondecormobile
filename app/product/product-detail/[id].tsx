import React, { useEffect, useState } from "react";
import { 
  View, Text, Image, ActivityIndicator, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getProductDetailAPI, IProduct } from "@/utils/productAPI"; 
import { addToCartAPI, createCartAPI, getCartAPI } from "@/utils/cartAPI"; 
import CustomButton from "@/components/ui/Button/Button"; 
import Ionicons from "react-native-vector-icons/Ionicons";
import { getToken, getUserIdFromToken } from "@/services/auth";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const [product, setProduct] = useState<IProduct | null>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [cartId, setCartId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
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
  
      const userId = await getUserIdFromToken();
      if (!userId) return;
  
      const cartData = await getCartAPI(userId);
      console.log("Fetched Cart Data:", cartData);
  
      if (cartData && cartData.id) {
        setCartId(cartData.id);
        console.log("Cart fetched successfully:", cartData.id);
        return cartData.id;
      } else {
        const newCartId = await createCartAPI();
        setCartId(newCartId);
        console.log("New cart created with ID:", newCartId);
        return newCartId;
      }
    } catch (error) {
      console.error("Error fetching or creating cart:", error);
      setCartId(null);
      return null;
    }
  };
  
  const handleAddToCart = async () => {
    if (!product) return;

    const cartId = await fetchCartId();

    if (!cartId) {
      Alert.alert("❌ Error", "Failed to get a valid cart.");
      console.log("Failed to get a valid cart ID:", cartId);
      return;
    }

    const userId = await getUserIdFromToken();
    if (!userId) {
      Alert.alert("❌ Error", "Failed to retrieve user information.");
      console.log("Failed to retrieve user ID:", userId);
      return;
    }

    try {
      await addToCartAPI(userId, product.id, quantity);
      console.log("Product added to cart successfully");
      Alert.alert("✅ Success", "Product added to cart!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add product to cart.";
      console.log("Error adding to cart:", errorMessage);
      Alert.alert("❌ Error", errorMessage);
    }
  };
  
  const incrementQuantity = () => setQuantity(prevQuantity => prevQuantity + 1);
  const decrementQuantity = () => setQuantity(prevQuantity => (prevQuantity > 1 ? prevQuantity - 1 : 1));

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  if (loading) return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.text }]}>Loading product details...</Text>
    </View>
  );
  
  if (error) return (
    <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
      <Ionicons name="alert-circle" size={60} color={colors.error} />
      <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      <CustomButton 
        title="Go Back" 
        onPress={() => router.back()} 
        btnStyle={[styles.errorButton, { backgroundColor: colors.primary }]} 
        labelStyle={styles.errorButtonText} 
      />
    </View>
  );
  
  if (!product) return (
    <View style={[styles.noProductContainer, { backgroundColor: colors.background }]}>
      <Ionicons name="search" size={60} color={colors.text} />
      <Text style={[styles.noProductText, { color: colors.text }]}>No product details available.</Text>
      <CustomButton 
        title="Go Back" 
        onPress={() => router.back()} 
        btnStyle={[styles.errorButton, { backgroundColor: colors.primary }]} 
        labelStyle={styles.errorButtonText} 
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      {/* Image Gallery Section */}
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
        
        {/* Image indicator dots */}
        <View style={styles.imageDots}>
          {product.imageUrls && product.imageUrls.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                { backgroundColor: index === currentIndex ? colors.primary : '#ffffff' }
              ]} 
            />
          ))}
        </View>
      </View>

      {/* Basic Product Info */}
      <View style={[styles.productHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{product.productName}</Text>
        <View style={styles.priceRatingContainer}>
          <Text style={[styles.price, { color: colors.primary }]}>
            <Ionicons name="pricetag" size={20} color={colors.primary} /> ${product.productPrice.toFixed(2)}
          </Text>
          <Text style={[styles.rating, { color: colors.icon }]}>
            <Ionicons name="star" size={18} color="#FFD700" /> {product.rate} ({product.totalRate})
          </Text>
        </View>
      </View>

      {/* Quick Info */}
      <View style={[styles.quickInfoContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoItem}>
          <Ionicons name="cube-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>In Stock: {product.quantity}</Text>
        </View>
        <View style={styles.infoItemDivider} />
        <View style={styles.infoItem}>
          <Ionicons name="globe-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>Made in: {product.madeIn}</Text>
        </View>
        <View style={styles.infoItemDivider} />
        <View style={styles.infoItem}>
          <Ionicons name="boat-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>Ships from: {product.shipFrom}</Text>
        </View>
      </View>

      {/* Description Section */}
      <View style={[styles.descriptionContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.descriptionHeader}>
          <Text style={[styles.descriptionTitle, { color: colors.text }]}>
            <Ionicons name="information-circle-outline" size={22} color={colors.primary} /> Description
          </Text>
          <TouchableOpacity onPress={toggleDescription}>
            <Text style={[styles.readMoreLink, { color: colors.primary }]}>
              {showFullDescription ? "Read Less" : "Read More"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.descriptionDivider, { backgroundColor: colors.border }]} />
        <Text 
          style={[styles.descriptionText, { color: colors.text }]}
          numberOfLines={showFullDescription ? undefined : 4}
        >
          {product.description}
        </Text>
      </View>

      {/* Purchase Section */}
{/* Purchase Section */}
<View style={styles.purchaseContainer}>
  <View style={styles.quantityRow}>
    <Text style={styles.quantityLabel}>Quantity:</Text>
    <View style={styles.quantityControls}>
      <TouchableOpacity 
        style={styles.quantityButton}
        onPress={decrementQuantity}
      >
        <Text style={styles.quantityButtonText}>−</Text>
      </TouchableOpacity>
      
      <Text style={styles.quantityValue}>{quantity}</Text>
      
      <TouchableOpacity 
        style={styles.quantityButton}
        onPress={incrementQuantity}
      >
        <Text style={styles.quantityButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  </View>

  <View style={styles.actionButtons}>
    <TouchableOpacity style={styles.saveButton}>
      <Ionicons name="heart-outline" size={18} color="#0096b5" />
      <Text style={styles.saveButtonText}>Save</Text>
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.addToCartButton}>
      <Text style={styles.addToCartButtonText}>Add to Cart</Text>
    </TouchableOpacity>
  </View>
</View>
{/* Provider Section */}
<View style={styles.providerContainer}>
  <Text style={styles.sectionTitle}>Provider</Text>
  <View style={styles.providerCard}>
    <View style={styles.providerHeader}>
      <View style={styles.providerAvatar}>
        <Text style={styles.providerInitial}>
          {product?.provider?.businessName?.charAt(0) || "?"}
        </Text>
      </View>
      <View style={styles.providerInfo}>
        <View style={styles.providerNameRow}>
          <Text style={styles.providerName}>
            {product?.provider?.businessName || "Unknown Provider"}
          </Text>
          {product?.provider?.providerVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#0096b5" />
          )}
        </View>
        <Text style={styles.providerJoined}>
          Joined: {product?.provider?.joinedDate !== "01/01/0001"
            ? product?.provider?.joinedDate
            : "Recently"}
        </Text>
      </View>
    </View>
    
    <View style={styles.providerStats}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {product?.provider?.followersCount || 0}
        </Text>
        <Text style={styles.statLabel}>Followers</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {product?.provider?.followingsCount || 0}
        </Text>
        <Text style={styles.statLabel}>Following</Text>
      </View>
    </View>
    
    <TouchableOpacity 
      style={styles.viewProfileButton}
      onPress={() => product?.provider?.id && router.push(`/provider/${product.provider.id}`)}
    >
      <Text style={styles.viewProfileText}>View Profile</Text>
      <Ionicons name="chevron-forward" size={16} color="#0096b5" />
    </TouchableOpacity>
  </View>
</View>
      {/* Additional Info Section - Can be expanded for product specs, shipping details, etc. */}
      <View style={[styles.additionalInfoContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.additionalInfoItem}>
          <Text style={[styles.additionalInfoTitle, { color: colors.text }]}>
            <Ionicons name="list" size={18} color={colors.primary} /> Product Specifications
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.additionalInfoDivider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.additionalInfoItem}>
          <Text style={[styles.additionalInfoTitle, { color: colors.text }]}>
            <Ionicons name="gift" size={18} color={colors.primary} /> Shipping & Returns
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.additionalInfoDivider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.additionalInfoItem}>
          <Text style={[styles.additionalInfoTitle, { color: colors.text }]}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} /> Reviews
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
  errorButton: {
    width: 150,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  noProductContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noProductText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  
  // Image Gallery
  imageContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#000',
    height: 350,
    width: '100%',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: "cover",
  },
  arrowButton: {
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 50,
    zIndex: 10,
    position: "absolute",
  },
  leftArrow: {
    left: 15,
  },
  rightArrow: {
    right: 15,
  },
  imageDots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  
  // Basic Product Info
  productHeader: {
    width: "100%",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  priceRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
  },
  rating: {
    fontSize: 16,
    fontWeight: "bold",
  },
  
  // Quick Info
  quickInfoContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoText: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 14,
  },
  infoItemDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
  
  // Description
  descriptionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  readMoreLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionDivider: {
    height: 1,
    width: "100%",
    marginVertical: 10,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  purchaseContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '400',
    color: '#333',
  },
  quantityValue: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    height: 46,
    borderWidth: 1,
    borderColor: '#0096b5',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  saveButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#0096b5',
  },
  addToCartButton: {
    width: '48%',
    height: 46,
    borderRadius: 8,
    backgroundColor: '#0096b5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
// Modify the buttonsContainer style to make the buttons take equal space
buttonsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
},

// Modify the wishlistButton style to match the width of the addToCartButton
wishlistButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48%', // Changed from '30%' to '48%' to be closer to half width
  paddingVertical: 12,
  borderRadius: 8,
  borderWidth: 1,
},

// Update the addToCartButton style to match

  wishlistButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  addToCartText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 8,
  },
  
  // Additional Info
  additionalInfoContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 30,
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  additionalInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  additionalInfoTitle: {
    fontSize: 16,
  },
  additionalInfoDivider: {
    height: 1,
    width: "100%",
  },
  providerContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  providerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  providerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0096b5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  providerInitial: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
  },
  providerInfo: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  providerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 4,
  },
  providerJoined: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  providerStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "#eee",
    alignSelf: "center",
  },
  viewProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  viewProfileText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#0096b5",
    marginRight: 4,
  },
});

export default ProductDetailScreen;