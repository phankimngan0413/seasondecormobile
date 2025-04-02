import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import CustomButton from "@/components/ui/Button/Button";
import { getCartAPI, removeProductFromCartAPI } from "@/utils/cartAPI";
import { getUserIdFromToken } from "@/services/auth";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const PRIMARY_COLOR = "#5fc1f1";

interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  image: string;
}

const CartScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  
  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchCartItems();
    
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      setError("");
      
      const userId = await getUserIdFromToken();
      if (!userId) {
        setError("Please log in to view your cart");
        setLoading(false);
        return;
      }

      const cartData = await getCartAPI(userId);

      if (cartData?.cartItems) {
        setCartItems(cartData.cartItems || []);
        calculateTotal(cartData.cartItems || []);
      } else {
        setCartItems([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load your cart items");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateTotal = (items: CartItem[]) => {
    const total = items.reduce((sum, item) => {
      const price = item.unitPrice && item.quantity ? item.unitPrice * item.quantity : 0;
      return sum + price;
    }, 0);
    setTotalPrice(total);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCartItems();
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedItems = cartItems.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setCartItems(updatedItems);
    calculateTotal(updatedItems);
    
    // Here you would typically call an API to update the quantity
    // For now we're just updating the local state
  };

  const handleDeleteCartItem = async (productId: number) => {
    try {
      setRemovingItemId(productId);
      
      const userId = await getUserIdFromToken();
      if (!userId) {
        Alert.alert("Sign In Required", "Please sign in to manage your cart");
        return;
      }
      
      // Animate the item out before removing it
      const itemToRemove = cartItems.find(item => item.productId === productId);
      if (itemToRemove) {
        // Optimistically update UI first for better UX
        const updatedItems = cartItems.filter(item => item.productId !== productId);
        setCartItems(updatedItems);
        calculateTotal(updatedItems);
      }
  
      // Call API to remove the item
      await removeProductFromCartAPI(userId, productId);
      
      // No need to show any success message or check response structure
      // The UI is already updated optimistically
      
    } catch (error: any) {
      console.error("Error removing product:", error);
      // Don't show error alert, just log it
      
      // Still refresh cart to ensure UI is in sync with server
      fetchCartItems();
    } finally {
      setRemovingItemId(null);
    }
  };
  
  const navigateToCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Add items to your cart before checking out");
      return;
    }
    
    // Navigate directly to checkout screen without showing the alert
    router.push("/screens/checkout");
  };
  
  const navigateToProductDetails = (productId: number) => {
    router.push(`/product/product-detail/${productId}`);
  };

  const handleGoBack = () => {
    router.back();
  };

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => {
    const isRemoving = removingItemId === item.productId;
    const itemAnimatedStyle = {
      transform: [
        { 
          translateX: slideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [width, 0]
          }) 
        }
      ],
      opacity: fadeAnimation,
    };
    
    // Stagger animation based on item index
    const delay = index * 100;
    
    return (
      <Animated.View 
        style={[
          styles.cartItemContainer, 
          { backgroundColor: colors.card },
          itemAnimatedStyle
        ]}
      >
        {/* Product Image */}
        <TouchableOpacity 
          onPress={() => navigateToProductDetails(item.productId)}
          style={styles.productImageContainer}
        >
          <Image
            source={{ uri: item.image || "https://via.placeholder.com/150" }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
        
        {/* Product Details */}
        <View style={styles.productDetails}>
          <TouchableOpacity onPress={() => navigateToProductDetails(item.productId)}>
            <Text 
              style={[styles.productName, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.productName}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            {isNaN(item.unitPrice) ? '₫0.00' : 
              new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(item.unitPrice)}
          </Text>
          
          {/* Quantity Controls */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={[styles.quantityButton, { borderColor: colors.border }]}
              onPress={() => handleQuantityChange(item.productId, item.quantity - 1)}
            >
              <Ionicons name="remove" size={16} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.quantityText, { color: colors.text }]}>
              {item.quantity}
            </Text>
            
            <TouchableOpacity 
              style={[styles.quantityButton, { borderColor: colors.border }]}
              onPress={() => handleQuantityChange(item.productId, item.quantity + 1)}
            >
              <Ionicons name="add" size={16} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => handleDeleteCartItem(item.productId)}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="trash-outline" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyCart = () => {
    return (
      <Animated.View 
        style={[
          styles.emptyContainer,
          { opacity: fadeAnimation }
        ]}
      >
        <Ionicons name="cart-outline" size={80} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Add items to your cart to start shopping
        </Text>
        
        <CustomButton
          title="Browse Products"
          onPress={() => router.push("/(tabs)/decor")}
          style={[
            styles.browseButton,
            { backgroundColor: PRIMARY_COLOR }
          ]}
          textStyle={styles.browseButtonText}
        />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      
      {/* Safe area padding for status bar */}
      <SafeAreaView style={{ backgroundColor: colors.background }}>
        {/* Custom Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shopping Cart</Text>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={loading || refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={loading || refreshing ? colors.border : colors.text} 
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      {/* Main Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your cart...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.error || "#e74c3c"} />
          <Text style={[styles.errorText, { color: colors.error || "#e74c3c" }]}>{error}</Text>
          <CustomButton
            title="Try Again"
            onPress={fetchCartItems}
            style={{ backgroundColor: PRIMARY_COLOR, marginTop: 16 }}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.productId.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={renderEmptyCart}
          />
          
          {/* Order Summary (only shown when cart has items) */}
          {cartItems.length > 0 && (
            <Animated.View 
              style={[
                styles.summaryContainer, 
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{
                    translateY: slideAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0]
                    })
                  }]
                }
              ]}
            >
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {new Intl.NumberFormat('vi-VN', { 
                    style: 'currency', 
                    currency: 'VND' 
                  }).format(totalPrice)}
                </Text>
              </View>
              
              <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  {new Intl.NumberFormat('vi-VN', { 
                    style: 'currency', 
                    currency: 'VND' 
                  }).format(totalPrice)}
                </Text>
              </View>
              
              <CustomButton
                title="Proceed to Checkout"
                onPress={navigateToCheckout}
                style={styles.checkoutButton}
                textStyle={styles.checkoutButtonText}
              />
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0, // Add padding for status bar height
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120, // Extra padding at the bottom for the summary
  },
  cartItemContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
 
  productImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 16,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  checkoutButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    paddingVertical: 14,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen;