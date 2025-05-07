import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { createServiceReviewByBookingCodeAPI } from '@/utils/reviewAPI';
import { launchImageLibrary, ImageLibraryOptions, PhotoQuality } from "react-native-image-picker";

const PRIMARY_COLOR = "#5856d6"; // Purple for rating screen

const RateBookingScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as keyof typeof Colors];
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId: string }>();
  const bookingId = params.bookingId;
  
  // States
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingDetails, setBookingDetails] = useState<any>({
    serviceName: 'Decoration Service',
    providerName: 'Service Provider'
  });
  
  useEffect(() => {
    if (!bookingId) {
      Alert.alert('Error', 'Invalid booking code');
      router.back();
      return;
    }
  }, [bookingId]);
  
  // Handle picking images with react-native-image-picker
  // Handle picking images with react-native-image-picker
  const pickImages = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      selectionLimit: 5 - images.length,
      includeBase64: false,
      maxHeight: 1200,
      maxWidth: 1200,
      quality: 0.8 as PhotoQuality,
    };
    
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to pick images. Please try again.');
      } else if (response.assets) {
        if (images.length + response.assets.length > 5) {
          Alert.alert('Too many images', 'You can only add up to 5 images in total.');
          return;
        }
        
        // Add selected image URIs to the state
        const newImages = response.assets.map(asset => asset.uri || '');
        setImages(prevImages => [...prevImages, ...newImages.filter(uri => uri !== '')]);
      }
    });
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };
  
  // Handle submit review
  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment for your review.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call the new API function with bookingCode
      const result = await createServiceReviewByBookingCodeAPI(
        rating,
        comment,
        bookingId,
        images
      );
      
      if (result && (result.success || result.id)) {
        Alert.alert(
          'Success',
          'Your review has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to bookings list
                router.replace('/screens/Bookings');
              }
            }
          ]
        );
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', error.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Rate Service</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Service Information */}
        <View style={[styles.serviceInfoContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.serviceTitle, { color: colors.text }]}>
            {bookingDetails.serviceName}
          </Text>
          <Text style={[styles.providerName, { color: colors.textSecondary }]}>
            by {bookingDetails.providerName}
          </Text>
          <Text style={[styles.bookingCode, { color: colors.textSecondary }]}>
            Booking: {bookingId}
          </Text>
        </View>
        
        {/* Rating Section */}
        <View style={[styles.ratingContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Rating</Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={`star-${star}`}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={36}
                  color={star <= rating ? "#FFD700" : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={[styles.ratingText, { color: colors.text }]}>
            {rating === 5 ? "Excellent" :
             rating === 4 ? "Very Good" :
             rating === 3 ? "Good" :
             rating === 2 ? "Fair" : "Poor"}
          </Text>
        </View>
        
        {/* Comment Section */}
        <View style={[styles.commentContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Comment</Text>
          
          <TextInput
            style={[styles.commentInput, { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Share your experience with this service..."
            placeholderTextColor={colors.textSecondary}
            multiline={true}
            numberOfLines={5}
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
          />
        </View>
        
        {/* Images Section */}
        <View style={[styles.imagesContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.imagesSectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Photos</Text>
            <Text style={[styles.imagesCount, { color: colors.textSecondary }]}>
              {images.length}/5
            </Text>
          </View>
          
          <View style={styles.imagesGrid}>
            {images.map((image, index) => (
              <View key={`image-${index}`} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
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
                style={[styles.addImageButton, { borderColor: colors.border }]}
                onPress={pickImages}
              >
                <Ionicons name="add" size={32} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
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
    marginTop:50
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  serviceInfoContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  providerName: {
    fontSize: 14,
    marginBottom: 8,
  },
  bookingCode: {
    fontSize: 12,
  },
  ratingContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  commentContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
  },
  imagesContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  imagesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagesCount: {
    fontSize: 14,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  imageContainer: {
    width: '33.3%',
    aspectRatio: 1,
    padding: 4,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 2,
  },
  addImageButton: {
    width: '33.3%',
    aspectRatio: 1,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    margin: 4,
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RateBookingScreen;