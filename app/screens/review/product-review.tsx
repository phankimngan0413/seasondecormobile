import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createProductReviewAPI } from '@/utils/reviewAPI';
import { getOrderByIdAPI } from '@/utils/orderAPI';

const PRIMARY_COLOR = "#3498db";

const ProductReviewScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = Number(params.orderId);
  const productId = Number(params.productId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    // Request permissions on Android
    if (Platform.OS === 'android') {
      requestStoragePermission();
    }

    // Fetch order details to get product information
    fetchOrderDetails();
  }, []);

  const requestStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: "Storage Permission",
          message: "This app needs access to your storage to upload photos",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'You need to grant storage permission to upload photos');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setInitialLoading(true);
      const orderData = await getOrderByIdAPI(orderId);
      
      // Find the specific product from order details
      const productData = orderData.orderDetails.find(
        (item: any) => item.productId === productId
      );
      
      if (productData) {
        setProduct(productData);
      } else {
        Alert.alert('Error', 'Product not found in this order.');
        router.back();
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      Alert.alert('Error', 'Failed to load product details.');
    } finally {
      setInitialLoading(false);
    }
  };

  const selectImages = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      selectionLimit: 5 - images.length, // Limit how many images can be selected
      quality: 0.8 as any, // Cast to any to avoid type issues
    };
  
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'There was an error picking the images.');
      } else if (response.assets) {
        const newImages = response.assets.map(asset => asset.uri || '');
        // Limit to maximum 5 images
        if (images.length + newImages.length > 5) {
          Alert.alert('Limit Exceeded', 'You can only upload up to 5 images.');
          return;
        }
        setImages([...images, ...newImages]);
      }
    });
  };

  const removeImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating.');
      return;
    }

    if (comment.trim() === '') {
      Alert.alert('Error', 'Please write a comment for your review.');
      return;
    }

    try {
      setLoading(true);
      await createProductReviewAPI(
        rating,
        comment,
        orderId,
        productId,
        images
      );

      Alert.alert(
        'Success',
        'Your review has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error("Error submitting review:", error);
      Alert.alert('Error', error.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Product Review</Text>
      <View style={styles.spacer} />
    </View>
  );

  const renderRatingStars = () => (
    <View style={styles.ratingContainer}>
      <Text style={[styles.ratingLabel, { color: colors.text }]}>Rating:</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={rating >= star ? "star" : "star-outline"}
              size={36}
              color={rating >= star ? "#FFD700" : colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
        {rating === 0 ? "Tap to rate" : 
         rating === 1 ? "Poor" :
         rating === 2 ? "Fair" :
         rating === 3 ? "Good" :
         rating === 4 ? "Very Good" : "Excellent"}
      </Text>
    </View>
  );

  const renderCommentInput = () => (
    <View style={styles.commentContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>Your Review:</Text>
      <TextInput
        style={[
          styles.commentInput,
          { 
            color: colors.text,
            backgroundColor: colors.card,
            borderColor: colors.border
          }
        ]}
        value={comment}
        onChangeText={setComment}
        placeholder="Share your experience with this product..."
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />
    </View>
  );

  const renderImageUpload = () => (
    <View style={styles.imageUploadContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>Add Photos (Optional):</Text>
      
      <View style={styles.imagePreviewContainer}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imagePreviewWrapper}>
            <Image source={{ uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        ))}
        
        {images.length < 5 && (
          <TouchableOpacity
            style={[
              styles.addImageButton,
              { borderColor: colors.border, backgroundColor: colors.card }
            ]}
            onPress={selectImages}
          >
            <Ionicons name="add" size={40} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.imageHelpText, { color: colors.textSecondary }]}>
        You can add up to {5 - images.length} more photo{5 - images.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderProductInfo = () => {
    if (!product) return null;
    
    return (
      <View style={[styles.productContainer, { backgroundColor: colors.card }]}>
        <Image
          source={{ uri: product.image || 'https://via.placeholder.com/100' }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]}>
            {product.productName}
          </Text>
          <Text style={[styles.productPrice, { color: PRIMARY_COLOR }]}>
            {new Intl.NumberFormat('vi-VN', { 
              style: 'currency', 
              currency: 'VND' 
            }).format(product.unitPrice || 0)}
          </Text>
        </View>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading product details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      {renderHeader()}
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderProductInfo()}
        {renderRatingStars()}
        {renderCommentInput()}
        {renderImageUpload()}
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: PRIMARY_COLOR },
            loading && { opacity: 0.7 }
          ]}
          onPress={handleSubmitReview}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center'
  },
  spacer: {
    width: 40
  },
  
  // Product Info
  productContainer: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center'
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8
  },
  productInfo: {
    marginLeft: 15,
    flex: 1
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600'
  },
  
  // Rating
  ratingContainer: {
    marginBottom: 20,
    alignItems: 'center'
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    alignSelf: 'flex-start'
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 10
  },
  starButton: {
    marginHorizontal: 5
  },
  ratingText: {
    marginTop: 5,
    fontSize: 14
  },
  
  // Comment
  commentContainer: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    fontSize: 16
  },
  
  // Image Upload
  imageUploadContainer: {
    marginBottom: 20
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10
  },
  imagePreviewWrapper: {
    position: 'relative',
    margin: 5
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5
  },
  imageHelpText: {
    fontSize: 12,
    marginTop: 8
  },
  
  // Submit Button
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16
  }
});

export default ProductReviewScreen;