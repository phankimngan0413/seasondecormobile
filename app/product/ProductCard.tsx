import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Alert } from "react-native";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { addToCartAPI } from "@/utils/cartAPI";
import { getUserIdFromToken } from "@/services/auth";

const { width } = Dimensions.get("window");

const PRIMARY_COLOR = "#5fc1f1";

interface ProductProps {
  product: {
    id: number;
    productName: string;
    productPrice: number;
    rate: number;
    totalSold: number;
    imageUrls: string[];
  };
  onAddToCart?: (product: any) => void; // Make this optional
}

const ProductCard: React.FC<ProductProps> = ({ product, onAddToCart }) => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Format price with comma for thousands
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(product.productPrice);
  
  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      
      // Get account ID from token
      const accountId = await getUserIdFromToken();
      
      if (!accountId) {
        Alert.alert("Error", "Please log in to add items to cart");
        return;
      }
      
      console.log(`Adding product ${product.id} to cart for account ${accountId}`);
      
      // Call the API with correct parameters
      await addToCartAPI(accountId, product.id, 1);
      
      Alert.alert("Success", `${product.productName} added to your cart!`);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      Alert.alert("Error", "Failed to add item to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <View
      style={[
        styles.productCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Image Section with Badge */}
      <View style={styles.imageContainer}>
        {product.imageUrls && product.imageUrls.length > 0 ? (
          <Image
            source={{ uri: product.imageUrls[0] + "?time=" + new Date().getTime() }}
            style={styles.productImage}
            onError={(e) => console.log("Image Load Error: ", e.nativeEvent.error)}
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}
        
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FFC107" />
          <Text style={styles.ratingText}>{product.rate.toFixed(1)}</Text>
        </View>
      </View>

      {/* Product Info Section */}
      <View style={styles.infoContainer}>
        <Text 
          style={[styles.productTitle, { color: colors.text }]} 
          
          ellipsizeMode="tail"
        >
          {product.productName}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.productPrice, { color: colors.primary }]}>
           {formattedPrice}
          </Text>
          <Text style={styles.soldText}>
            {product.totalSold} sold
          </Text>
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity 
          style={[
            styles.addToCartButton,
            isAddingToCart && styles.disabledButton
          ]}
          onPress={handleAddToCart}
          disabled={isAddingToCart}
          activeOpacity={0.7}
        >
          {isAddingToCart ? (
            <Ionicons name="hourglass-outline" size={16} color="#fff" />
          ) : (
            <Ionicons name="cart-outline" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  addToCartButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: PRIMARY_COLOR,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#a0d0e8',
    opacity: 0.8,
  },
  productCard: {
    width: width * 0.45,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 14,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#efefef",
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: '#f8f8f8',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: "cover",
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  infoContainer: {
    padding: 12,
    position: 'relative',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  soldText: {
    fontSize: 11,
    color: '#999',
  },

});

export default ProductCard;