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
import { getReviewByProductIdAPI, IReview } from "@/utils/reviewAPI";
import { addFavoriteProductAPI } from "@/utils/favoriteAPI";
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
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
const [favoriteLoading, setFavoriteLoading] = useState(false);


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
        // After product data is loaded, fetch reviews
        fetchProductReviews(Number(id));
      } else {
        setError("Product not found.");
      }
    } catch (err: any) {
      setError(err.message); 
    } finally {
      setLoading(false);
    }
  };
  const handleAddToFavorite = async () => {
    if (!product) return;
  
    try {
      setFavoriteLoading(true);
      const userId = await getUserIdFromToken();
      if (!userId) {
        Alert.alert("Error", "Please log in to save this product.");
        return;
      }
  
      const response = await addFavoriteProductAPI(product.id);
      
      // Cập nhật trạng thái yêu thích
      setIsFavorite(true);
      
      // Hiển thị thông báo thành công
      Alert.alert("Success", "Product saved to your favorites!");
      
    } catch (error: any) {
      console.error("Error saving product:", error);
      
      // Cập nhật UI về trạng thái ban đầu vì có lỗi xảy ra
      setIsFavorite(false);
      
      // Luôn hiển thị thông báo này khi có lỗi xảy ra
      Alert.alert(
        "Information", 
        "This product is already in your favorites list."
      );
    } finally {
      setFavoriteLoading(false);
    }
  };
  const fetchProductReviews = async (productId: number) => {
    try {
      setReviewsLoading(true);
      const response = await getReviewByProductIdAPI(productId);
      
      // Kiểm tra cấu trúc dữ liệu và gán giá trị đúng
      if (response) {
        if (Array.isArray(response)) {
          setReviews(response);
        } else if (response.data && Array.isArray(response.data)) {
          setReviews(response.data);
        } else {
          console.log("❌ Không thể xác định cấu trúc dữ liệu review:", response);
          setReviews([]);
        }
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("❌ Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
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
  
    try {
      const userId = await getUserIdFromToken();
      if (!userId) {
        Alert.alert("❌ Error", "Please log in to add items to cart.");
        return;
      }
  
      console.log(`Adding product ID ${product.id} to cart for user ID ${userId} with quantity ${quantity}`);
      
      // Call API with correct parameters
      await addToCartAPI(userId, product.id, quantity);
      
      // Show success message
      Alert.alert("✅ Success", "Product added to cart!");
    } catch (error) {
      // Error handling
      const errorMessage = error instanceof Error ? error.message : "Failed to add product to cart.";
      console.error("Error adding to cart:", errorMessage);
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
            <Ionicons name="pricetag" size={20} color={colors.primary} /> 
            {product.productPrice.toLocaleString()} ₫
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
      <View style={[styles.purchaseContainer, { backgroundColor: colors.card }]}>
        <View style={styles.quantityRow}>
          <Text style={[styles.quantityLabel, { color: colors.text }]}>Quantity:</Text>
          <View style={[styles.quantityControls, { borderColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.quantityButton, { backgroundColor: colors.border }]}
              onPress={decrementQuantity}
            >
              <Text style={[styles.quantityButtonText, { color: colors.text }]}>−</Text>
            </TouchableOpacity>
            
            <Text style={[styles.quantityValue, { color: colors.text }]}>{quantity}</Text>
            
            <TouchableOpacity 
              style={[styles.quantityButton, { backgroundColor: colors.border }]}
              onPress={incrementQuantity}
            >
              <Text style={[styles.quantityButtonText, { color: colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionButtons}>
        <TouchableOpacity 
  style={[
    styles.saveButton, 
    { 
      borderColor: colors.primary, 
      backgroundColor: isFavorite ? colors.primary : colors.card 
    }
  ]}
  onPress={handleAddToFavorite}
  disabled={favoriteLoading}
>
  {favoriteLoading ? (
    <ActivityIndicator size="small" color={isFavorite ? "white" : colors.primary} />
  ) : (
    <>
      <Ionicons 
        name={isFavorite ? "heart" : "heart-outline"} 
        size={18} 
        color={isFavorite ? "white" : colors.primary} 
      />
      <Text 
        style={[
          styles.saveButtonText, 
          { color: isFavorite ? "white" : colors.primary }
        ]}
      >
        {isFavorite ? "Saved" : "Save"}
      </Text>
    </>
  )}
</TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addToCartButton, { backgroundColor: colors.primary }]} 
            onPress={handleAddToCart}
          >
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Provider Section */}
      <View style={styles.providerContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Provider</Text>
        <View style={[styles.providerCard, { backgroundColor: colors.card }]}>
          <View style={styles.providerHeader}>
            <View style={[styles.providerAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.providerInitial}>
                {product?.provider?.businessName?.charAt(0) || "?"}
              </Text>
            </View>
            <View style={styles.providerInfo}>
              <View style={styles.providerNameRow}>
                <Text style={[styles.providerName, { color: colors.text }]}>
                  {product?.provider?.businessName || "Unknown Provider"}
                </Text>
                {product?.provider?.providerVerified && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                )}
              </View>
              <Text style={[styles.providerJoined, { color: colors.textSecondary }]}>
                Joined: {product?.provider?.joinedDate !== "01/01/0001"
                  ? product?.provider?.joinedDate
                  : "Recently"}
              </Text>
            </View>
          </View>
          
          <View style={[styles.providerStats, { borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {product?.provider?.followersCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {product?.provider?.followingsCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </View>
          </View>
          
          {product.provider?.slug && (
            <TouchableOpacity 
              style={styles.viewProfileButton}
              onPress={() => router.push(`/provider/${product.provider?.slug}`)}
            >
              <Text style={[styles.viewProfileText, { color: colors.primary }]}>View Profile</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Reviews Section - Thiết kế cải tiến */}
      <View style={[styles.reviewsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header với icon và số lượng review */}
        <View style={styles.reviewsHeader}>
          <View style={styles.reviewsHeaderLeft}>
            <Ionicons name="star" size={20} color={colors.primary} />
            <Text style={[styles.reviewsHeaderTitle, { color: colors.text }]}>
              Customer Reviews
            </Text>
          </View>
          <Text style={[styles.reviewsCount, { color: colors.textSecondary }]}>
            ({product.totalRate || 0})
          </Text>
        </View>
        
        {/* Rating Summary */}
        <View style={styles.ratingSummary}>
          <Text style={[styles.ratingScore, { color: colors.text }]}>
            {product.rate ? product.rate.toFixed(1) : "5.0"}
          </Text>
          <View style={styles.starRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons 
                key={star}
                name="star" 
                size={24} 
                color="#FFD700" 
                style={styles.starIcon}
              />
            ))}
          </View>
          <Text style={[styles.ratingBaseText, { color: colors.textSecondary }]}>
            Based on {product.totalRate || 0} reviews
          </Text>
        </View>
        
        {/* Divider */}
        <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
        
        {/* Reviews List or Empty State */}
        {reviewsLoading ? (
          <View style={styles.loadingReviews}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingReviewsText, { color: colors.textSecondary }]}>
              Loading reviews...
            </Text>
          </View>
        ) : reviews && reviews.length > 0 ? (
          <>
            {/* Reviews List */}
            {reviews.map((review, index) => (
              <View key={index} style={styles.reviewItem}>
                {/* Rating and Date */}
                <View style={styles.reviewTopRow}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons 
                        key={star}
                        name={review.rate >= star ? "star" : "star-outline"} 
                        size={16} 
                        color="#FFD700" 
                        style={styles.reviewStarIcon}
                      />
                    ))}
                  </View>
                  <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
                    {new Date(review.createAt).toLocaleDateString()}
                  </Text>
                </View>
                
                {/* Username (or Anonymous) */}
                <Text style={[styles.reviewUsername, { color: colors.text }]}>
                  {review.userName || 'Anonymous User'}
                </Text>
                
                {/* Review Comment */}
                <Text style={[styles.reviewComment, { color: colors.text }]}>
                  {review.comment}
                </Text>
                
                {/* Review Images if any */}
                {review.images && review.images.length > 0 && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.reviewImagesScroll}
                  >
                    {review.images.map((imageUrl, imgIndex) => (
                      <View key={imgIndex} style={styles.reviewImageContainer}>
                        <Image 
                          source={{ uri: imageUrl }} 
                          style={styles.reviewImage}
                          resizeMode="cover"
                        />
                      </View>
                    ))}
                  </ScrollView>
                )}
                
                {/* Divider between reviews */}
                {index < reviews.length - 1 && (
                  <View style={[styles.reviewItemDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyReviewState}>
            <Ionicons name="chatbubbles-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyReviewText, { color: colors.textSecondary }]}>
              No reviews yet for this product
            </Text>
          </View>
        )}
      </View>

      {/* Additional Info Section - Specs and Shipping
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
      </View> */}
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
  
  // Purchase Section
  purchaseContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 16,
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
  
  // Provider Section
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
  
  // Reviews Section - Cải tiến
  reviewsContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 0,
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  reviewsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  reviewsCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingSummary: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  ratingScore: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  starRating: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starIcon: {
    marginHorizontal: 2,
  },
  ratingBaseText: {
    fontSize: 14,
  },
  reviewDivider: {
    height: 1,
    width: '100%',
  },
  loadingReviews: {
    alignItems: 'center',
    padding: 24,
  },
  loadingReviewsText: {
    marginTop: 8,
    fontSize: 14,
  },
  reviewItem: {
    padding: 16,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewStarIcon: {
    marginRight: 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewUsername: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewImagesScroll: {
    marginBottom: 12,
  },
  reviewImageContainer: {
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewImage: {
    width: 100,
    height: 100,
  },
  reviewItemDivider: {
    height: 1,
    width: '100%',
    marginTop: 8,
  },
  emptyReviewState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyReviewText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  }
});

export default ProductDetailScreen;