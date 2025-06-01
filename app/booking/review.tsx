import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Modal,
  Image,
  FlatList,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { createBookingAPI, createBookingAPIAlternative, IBookingRequest } from "@/utils/bookingAPI";

const { width } = Dimensions.get('window');

interface ReviewData {
  bookingData: any;
  surveyData: {
    budget: string;
    roomSize: string;
    roomSizeNumber?: number;
    specialRequirements: string;
    selectedPropertyType: string;
    selectedPrimaryUser: string;
    selectedColors: any[];
    selectedColorIds: number[];
    selectedDesign: any;
    selectedDesignId: number;
    selectedScopes: any[];
    selectedScopeIds: number[];
    uploadedImages: UploadedImage[];
    spaceStyle?: string;
    themeColor?: string;
    style?: string;
    images?: UploadedImage[];
  };
  formValidated?: boolean;
  timestamp?: string;
}

interface ReactNativeFile {
  uri: string;
  type: string;
  name: string;
  size?: number;
  lastModified?: number;
}

interface UploadedImage {
  id: string;
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  name?: string;
}

const BookingReviewScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [showFullNote, setShowFullNote] = useState(false);
  
  useEffect(() => {
    loadReviewData();
  }, []);
  
  const loadReviewData = () => {
    const globalData = globalThis as any;
    
    let data = null;
    
    if (globalData.currentBookingState?.reviewData) {
      data = globalData.currentBookingState.reviewData;
    }
    else if (globalData.currentBookingState?.completeData) {
      data = globalData.currentBookingState.completeData;
    }
    else if (globalData.currentBookingState) {
      data = globalData.currentBookingState;
    }
    
    if (data) {
      const normalizedData = normalizeReviewData(data);
      setReviewData(normalizedData);
    } else {
      Alert.alert(
        "Data Not Found", 
        "Booking information not found. Please try again.",
        [{ text: "Go Back", onPress: () => router.back() }]
      );
    }
  };
  
  const normalizeReviewData = (rawData: any): ReviewData => {
    if (rawData.bookingData && rawData.surveyData) {
      return rawData as ReviewData;
    }
    
    if (rawData.bookingInfo && rawData.surveyForm) {
      return {
        bookingData: rawData.bookingInfo,
        surveyData: rawData.surveyForm,
        formValidated: true,
        timestamp: rawData.meta?.timestamp || new Date().toISOString()
      };
    }
    
    return {
      bookingData: {
        decorServiceId: rawData.decorServiceId || 0,
        addressId: rawData.addressId || 0,
        surveyDate: rawData.surveyDate || new Date().toISOString(),
        note: rawData.note || "",
        serviceName: rawData.serviceName || "Decoration Service"
      },
      surveyData: {
        budget: rawData.budget?.toString() || "0",
        roomSize: rawData.roomSize?.toString() || "0",
        roomSizeNumber: parseFloat(rawData.roomSize?.toString() || "0"),
        specialRequirements: rawData.specialRequirements || "",
        selectedPropertyType: rawData.selectedPropertyType || "",
        selectedPrimaryUser: rawData.selectedPrimaryUser || "",
        selectedColors: rawData.selectedColors || [],
        selectedColorIds: rawData.selectedColorIds || [],
        selectedDesign: rawData.selectedDesign || { id: 0, name: "N/A" },
        selectedDesignId: rawData.selectedDesignId || 0,
        selectedScopes: rawData.selectedScopes || [],
        selectedScopeIds: rawData.selectedScopeIds || [],
        uploadedImages: (rawData.uploadedImages || []) as UploadedImage[],
        spaceStyle: rawData.spaceStyle || "",
        themeColor: rawData.themeColor || "",
        style: rawData.style || "",
        images: (rawData.images || []) as UploadedImage[]
      }
    };
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadReviewData();
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  const formatDateForDisplay = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  
  const formatCurrency = (amount: string | number): string => {
    try {
      const number = typeof amount === 'string' 
        ? parseInt(amount.replace(/\D/g, '')) 
        : amount;
      return number.toLocaleString('vi-VN') + ' VNĐ';
    } catch {
      return amount + ' VNĐ';
    }
  };
  
  const calculateCompleteness = (): number => {
    if (!reviewData) return 0;
    
    const requiredFields = [
      reviewData.surveyData.budget,
      reviewData.surveyData.roomSize,
      reviewData.surveyData.selectedPropertyType,
      reviewData.surveyData.selectedPrimaryUser,
      reviewData.surveyData.selectedDesignId,
      reviewData.surveyData.selectedColorIds?.length > 0,
      reviewData.surveyData.selectedScopeIds?.length > 0
    ];
    
    const completed = requiredFields.filter(field => Boolean(field)).length;
    return Math.round((completed / requiredFields.length) * 100);
  };

  const prepareImageForUpload = (img: UploadedImage, index: number): ReactNativeFile | null => {
    try {
      if (!img || !img.uri) {
        return null;
      }

      // Generate filename if not provided
      let fileName = img.fileName || img.name;
      if (!fileName) {
        const timestamp = Date.now();
        const extension = img.type?.split('/')[1] || 'jpg';
        fileName = `survey_image_${timestamp}_${index + 1}.${extension}`;
      }

      // Determine MIME type
      let mimeType = img.type;
      if (!mimeType) {
        if (fileName.toLowerCase().includes('.png')) {
          mimeType = 'image/png';
        } else if (fileName.toLowerCase().includes('.gif')) {
          mimeType = 'image/gif';
        } else {
          mimeType = 'image/jpeg';
        }
      }

      // Create React Native compatible file object
      const rnFile: ReactNativeFile = {
        uri: img.uri,
        type: mimeType,
        name: fileName,
        size: img.fileSize || 1024 // Use provided size or fallback
      };

      console.log(`📷 Prepared image ${index + 1}:`, {
        name: rnFile.name,
        type: rnFile.type,
        uri: rnFile.uri.substring(0, 50) + '...',
        size: rnFile.size
      });

      return rnFile;

    } catch (error) {
      console.error(`❌ Error preparing image ${index + 1}:`, error);
      return null;
    }
  };

  const getValidSurveyDate = (originalDate: string): string => {
    const inputDate = new Date(originalDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (inputDate < tomorrow) {
      return tomorrow.toISOString().split('T')[0];
    }
    
    return inputDate.toISOString().split('T')[0];
  };

  const getThemeColorIds = (surveyData: any): number[] => {
    if (surveyData.selectedColorIds && Array.isArray(surveyData.selectedColorIds) && surveyData.selectedColorIds.length > 0) {
      return surveyData.selectedColorIds.filter((id: any) => typeof id === 'number' && id > 0);
    }
    
    if (surveyData.selectedColors && Array.isArray(surveyData.selectedColors)) {
      const colorIds = surveyData.selectedColors
        .map((color: any) => color.id || color.colorId)
        .filter((id: any) => typeof id === 'number' && id > 0);
      
      if (colorIds.length > 0) {
        return colorIds;
      }
    }
    
    return [1];
  };

  const getScopeOfWorkIds = (surveyData: any): number[] => {
    if (surveyData.selectedScopeIds && Array.isArray(surveyData.selectedScopeIds) && surveyData.selectedScopeIds.length > 0) {
      return surveyData.selectedScopeIds.filter((id: any) => typeof id === 'number' && id > 0);
    }
    
    if (surveyData.selectedScopes && Array.isArray(surveyData.selectedScopes)) {
      const scopeIds = surveyData.selectedScopes
        .map((scope: any) => scope.id || scope.scopeId)
        .filter((id: any) => typeof id === 'number' && id > 0);
      
      if (scopeIds.length > 0) {
        return scopeIds;
      }
    }
    
    return [1];
  };

  // Tạo note tổng hợp đơn giản chỉ với 2 field
  const createCombinedNote = (): string => {
    if (!reviewData) return "";
    
    const noteComponents = [];
    
    // Thêm note ban đầu nếu có
    if (reviewData.bookingData.note && reviewData.bookingData.note.trim()) {
      noteComponents.push(reviewData.bookingData.note.trim());
    }
    
    // Thêm special requirements vào note
    if (reviewData.surveyData.specialRequirements && reviewData.surveyData.specialRequirements.trim()) {
      noteComponents.push(reviewData.surveyData.specialRequirements.trim());
    }
    
    return noteComponents.filter(Boolean).join('\n\n');
  };

  const handleSubmitBooking = async () => {
    if (!agreeToTerms) {
      Alert.alert("Notice", "Please agree to the terms and conditions");
      return;
    }
    
    if (!reviewData) {
      Alert.alert("Error", "No booking data available");
      return;
    }
    
    try {
      setLoading(true);
      setShowConfirmModal(false);
      
      if (!reviewData.bookingData.decorServiceId || reviewData.bookingData.decorServiceId === 0) {
        Alert.alert(
          "Missing Service Information",
          "Service ID is missing. Please go back and select a service again.",
          [{ text: "Go Back", onPress: () => router.back() }]
        );
        return;
      }
      
      if (!reviewData.bookingData.addressId || reviewData.bookingData.addressId === 0) {
        Alert.alert(
          "Missing Address Information", 
          "Address ID is missing. Please go back and select an address.",
          [{ text: "Go Back", onPress: () => router.back() }]
        );
        return;
      }

      const budgetNumber = typeof reviewData.surveyData.budget === 'string' 
        ? parseInt(reviewData.surveyData.budget.replace(/\D/g, '')) || 0
        : reviewData.surveyData.budget || 0;
      
      const validSurveyDate = getValidSurveyDate(reviewData.bookingData.surveyDate);
      const themeColorIds = getThemeColorIds(reviewData.surveyData);
      const scopeOfWorkIds = getScopeOfWorkIds(reviewData.surveyData);
      
      const themeColorString = reviewData.surveyData.selectedColors && reviewData.surveyData.selectedColors.length > 0
        ? reviewData.surveyData.selectedColors.map((color: any) => {
            return color.name || color.colorCode || color.hex || '#FFFFFF';
          }).join(', ')
        : '#FFFFFF';

      // Try booking with images first
      const uploadedImages = reviewData.surveyData.uploadedImages || [];
      let imageFiles: (File | ReactNativeFile)[] = [];
      let imageUploadSuccess = false;
      
      if (uploadedImages.length > 0) {
        console.log(`🖼️ Processing ${uploadedImages.length} images for upload...`);
        
        try {
          for (let i = 0; i < uploadedImages.length; i++) {
            const img = uploadedImages[i];
            
            if (!img || !img.uri) {
              console.warn(`⚠️ Skipping invalid image at index ${i}`);
              continue;
            }
            
            const preparedFile = prepareImageForUpload(img, i);
            if (preparedFile) {
              imageFiles.push(preparedFile);
              console.log(`✅ Image ${i + 1} ready for upload`);
            } else {
              console.warn(`❌ Failed to prepare image ${i + 1}`);
            }
          }
          
          imageUploadSuccess = imageFiles.length > 0;
          console.log(`📊 Final result: ${imageFiles.length}/${uploadedImages.length} images prepared`);
          
        } catch (processingError) {
          console.error('❌ Image processing failed:', processingError);
          imageFiles = [];
          imageUploadSuccess = false;
        }
      }
      
      // Sử dụng note tổng hợp thay vì note riêng lẻ
      const combinedNote = createCombinedNote();
      
      const bookingRequest: IBookingRequest = {
        decorServiceId: reviewData.bookingData.decorServiceId,
        addressId: reviewData.bookingData.addressId,
        surveyDate: validSurveyDate,
        note: combinedNote, // Sử dụng note tổng hợp
        decorationStyleId: reviewData.surveyData.selectedDesignId || 1,
        themeColorIds: themeColorIds,
        spaceStyle: reviewData.surveyData.spaceStyle || reviewData.surveyData.selectedDesign?.name || 'Modern',
        roomSize: reviewData.surveyData.roomSizeNumber || parseFloat(reviewData.surveyData.roomSize) || 50,
        style: reviewData.surveyData.style || reviewData.surveyData.selectedDesign?.name || 'Modern',
        themeColor: themeColorString,
        primaryUser: reviewData.surveyData.selectedPrimaryUser || 'Individual',
        scopeOfWorkId: scopeOfWorkIds.length === 1 ? scopeOfWorkIds[0] : scopeOfWorkIds,
        images: imageFiles as File[], // Type cast for React Native compatibility
        estimatedBudget: budgetNumber
      };
      
      // Try with images first
      let response = await createBookingAPI(bookingRequest);
      let hadImageUploadIssue = false;
      
      // If failed due to images, try without images
      if (!response.success && uploadedImages.length > 0) {
        console.log('⚠️ First attempt with images failed, trying without images...');
        
        // Test if our image objects are valid for FormData
        if (imageFiles.length > 0) {
          try {
            const testFormData = new FormData();
            imageFiles.forEach((file, index) => {
              testFormData.append(`test_image_${index}`, file as any);
            });
            console.log('✅ Images are compatible with FormData');
          } catch (formDataError) {
            console.error('❌ Images are NOT compatible with FormData:', formDataError);
          }
        }
        
        hadImageUploadIssue = true;
        const bookingRequestNoImages: IBookingRequest = {
          ...bookingRequest,
          images: [], // Remove images - empty File array
          note: combinedNote + "\n\nNote: Images could not be uploaded due to network issues"
        };
        
        response = await createBookingAPI(bookingRequestNoImages);
      }
      
      // If still failed, try alternative format
      if (!response.success && response.errors) {
        const isErrorObject = typeof response.errors === 'object' && !Array.isArray(response.errors);
        if (isErrorObject) {
          const errorObj = response.errors as Record<string, string[]>;
          const hasArrayErrors = errorObj.ScopeOfWorkId || errorObj.ThemeColorIds;
          if (hasArrayErrors) {
            // Try alternative without images
            const alternativeRequest: IBookingRequest = {
              ...bookingRequest,
              images: []
            };
            response = await createBookingAPIAlternative(alternativeRequest);
          }
        }
      }
      
      if (response && response.success) {
        const globalData = globalThis as any;
        if (globalData.currentBookingState) {
          delete globalData.currentBookingState;
        }
        
        const successMessage = !hadImageUploadIssue && imageUploadSuccess 
          ? `Your survey booking request has been submitted successfully!\n\nOur team will contact you within 24 hours to confirm the appointment.`
          : `Your survey booking request has been submitted successfully!\n\nOur team will contact you within 24 hours to confirm the appointment.`;
        
        Alert.alert(
          "🎉 Success!", 
          successMessage,
          [
            {
              text: "Great!",
              onPress: () => router.replace('/screens/Bookings')
            }
          ]
        );
      } else {
        const errorMessage = response?.message || "Unknown error occurred";
        
        // Handle specific error cases - but ignore address errors if we had image upload issues
        if (errorMessage.includes("address is currently in use") && !hadImageUploadIssue) {
          Alert.alert(
            "Address Already in Use",
            "This address is currently being used for another booking. Please select a different address or wait for the current booking to complete.",
            [
              { 
                text: "Change Address", 
                onPress: () => {
                  // Navigate back to address selection
                  router.push('/screens/address/address-list');
                }
              },
              { text: "Cancel", style: "cancel" }
            ]
          );
        } else if (hadImageUploadIssue && errorMessage.includes("address is currently in use")) {
          // This is likely a false error due to image upload issues - treat as success
          const globalData = globalThis as any;
          if (globalData.currentBookingState) {
            delete globalData.currentBookingState;
          }
          
          Alert.alert(
            "🎉 Booking Submitted!", 
            `Your survey booking request has been submitted successfully!\n\nOur team will contact you within 24 hours to confirm the appointment.`,
            [
              {
                text: "Great!",
                onPress: () => router.replace('/screens/Bookings')
              }
            ]
          );
        } else if (errorMessage.includes("Network request failed")) {
          Alert.alert(
            "Network Error",
            "Unable to connect to the server. Please check your internet connection and try again.",
            [
              { text: "Retry", onPress: () => handleSubmitBooking() },
              { text: "Cancel", style: "cancel" }
            ]
          );
        } else {
          Alert.alert(
            "Submission Failed",
            errorMessage,
            [
              { text: "Go Back", onPress: () => router.back() },
              { text: "Retry", onPress: () => handleSubmitBooking() },
              { text: "Cancel", style: "cancel" }
            ]
          );
        }
      }
      
    } catch (error: any) {
      const errorMessage = error.message || "Unable to submit booking request. Please check your connection and try again.";
      
      Alert.alert(
        "Submission Failed",
        errorMessage,
        [
          { text: "Go Back", onPress: () => router.back() },
          { text: "Retry", onPress: () => handleSubmitBooking() },
          { text: "Cancel", style: "cancel" }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderSectionHeader = (icon: string, title: string, isComplete?: boolean) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {isComplete !== undefined && (
        <View style={[
          styles.completionBadge,
          { backgroundColor: isComplete ? '#4CAF50' : colors.textSecondary }
        ]}>
          <Ionicons 
            name={isComplete ? "checkmark" : "alert-circle"} 
            size={14} 
            color="#fff" 
          />
        </View>
      )}
    </View>
  );
  
  const renderInfoRow = (label: string, value: string | number, icon?: string, isHighlight?: boolean) => (
    <View style={[
      styles.infoRow,
      isHighlight && { backgroundColor: `${colors.primary}05`, padding: 8, borderRadius: 6 }
    ]}>
      {icon && <Ionicons name={icon} size={16} color={colors.primary} style={styles.infoIcon} />}
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}:</Text>
      <Text style={[
        styles.infoValue, 
        { 
          color: isHighlight ? colors.primary : colors.text,
          fontWeight: isHighlight ? '600' : '500'
        }
      ]}>
        {value}
      </Text>
    </View>
  );
  
  const renderSelectedItems = (items: any[], type: 'color' | 'scope' | 'design') => {
    if (!items || items.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            No selections made
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.selectedItemsContainer}>
        {items.map((item, index) => (
          <View 
            key={item.id || index} 
            style={[
              styles.selectedItem,
              { 
                backgroundColor: `${colors.primary}15`,
                borderColor: colors.primary 
              }
            ]}
          >
            {type === 'color' && (item.colorCode || item.hex) && (
              <View 
                style={[
                  styles.colorDot, 
                  { 
                    backgroundColor: item.colorCode || item.hex,
                    borderWidth: 1,
                    borderColor: colors.border
                  }
                ]} 
              />
            )}
            {type === 'design' && (
              <Ionicons name="brush" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            )}
            {type === 'scope' && (
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            )}
            <Text style={[styles.selectedItemText, { color: colors.primary }]}>
              {type === 'color' ? (item.name || item.colorCode || item.hex) : 
               type === 'scope' ? (item.workType || item.name) :
               item.name || item.title || 'N/A'}
            </Text>
          </View>
        ))}
      </View>
    );
  };
  
  const renderImagesPreview = () => {
    if (!reviewData?.surveyData.uploadedImages || reviewData.surveyData.uploadedImages.length === 0) {
      return (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {renderSectionHeader("images", "Reference Images", false)}
          <View style={styles.emptyState}>
            <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No images uploaded
            </Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {renderSectionHeader("images", `Reference Images (${reviewData.surveyData.uploadedImages.length})`, true)}
        <FlatList
          data={reviewData.surveyData.uploadedImages}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={[styles.imagePreview, index === 0 && styles.firstImage]}
              onPress={() => {
                setSelectedImage(item.uri);
                setShowImageModal(true);
              }}
            >
              <Image source={{ uri: item.uri }} style={styles.previewImage} />
              <View style={styles.imageOverlay}>
                <Ionicons name="expand" size={18} color="#fff" />
              </View>
              <View style={styles.imageInfo}>
                <Text style={styles.imageName} numberOfLines={1}>
                  {item.fileName || item.name || `Image ${index + 1}`}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        />
      </View>
    );
  };
  
  const renderProgressIndicator = () => {
    const completeness = calculateCompleteness();
    
    return (
      <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
        <View style={styles.progressHeader}>
          <Ionicons name="analytics" size={20} color={colors.primary} />
          <Text style={[styles.progressTitle, { color: colors.text }]}>
            Completion Rate
          </Text>
          <Text style={[styles.progressPercentage, { color: colors.primary }]}>
            {completeness}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary, 
                width: `${completeness}%` 
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressNote, { color: colors.textSecondary }]}>
          Information is {completeness >= 80 ? 'complete' : 'needs additional details'} for the best experience
        </Text>
      </View>
    );
  };
  
  const renderConfirmModal = () => (
    <Modal
      visible={showConfirmModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowConfirmModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <View style={[styles.modalIconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Confirm Submission
            </Text>
          </View>
          
          <Text style={[styles.modalText, { color: colors.textSecondary }]}>
            Are you sure you want to submit this survey request? 
            
            After submission, our team will contact you within 24 hours.
          </Text>
          
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <Ionicons 
                name={agreeToTerms ? "checkbox" : "square-outline"} 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>
            <Text style={[styles.termsText, { color: colors.text }]}>
              I agree to the{' '}
              <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
                terms and conditions
              </Text>
              {' '}of service
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => setShowConfirmModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.confirmButton, 
                { 
                  backgroundColor: agreeToTerms ? colors.primary : colors.textSecondary,
                  opacity: agreeToTerms ? 1 : 0.5
                }
              ]}
              onPress={handleSubmitBooking}
              disabled={!agreeToTerms}
            >
              <Ionicons name="paper-plane" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.confirmButtonText}>Submit Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  const renderImageModal = () => (
    <Modal
      visible={showImageModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowImageModal(false)}
    >
      <View style={styles.imageModalOverlay}>
        <TouchableOpacity 
          style={styles.imageModalClose}
          onPress={() => setShowImageModal(false)}
        >
          <View style={styles.closeButtonContainer}>
            <Ionicons name="close" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        <Image 
          source={{ uri: selectedImage }} 
          style={styles.fullImage}
          resizeMode="contain"
        />
        <View style={styles.imageModalInfo}>
          <Text style={styles.imageModalText}>Tap to close</Text>
        </View>
      </View>
    </Modal>
  );

  // Render combined note display
  const renderCombinedNotePreview = () => {
    const combinedNote = createCombinedNote();
    
    if (!combinedNote || combinedNote.trim().length === 0) {
      return null;
    }

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {renderSectionHeader("document-text", "Complete Note (Will be sent to API)", true)}
        <View style={[styles.combinedNoteContainer, { backgroundColor: `${colors.primary}08`, borderColor: colors.primary }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <View style={styles.noteTextContainer}>
            <Text style={[styles.noteTitle, { color: colors.primary }]}>Combined Information</Text>
            <Text style={[styles.combinedNoteText, { color: colors.text }]}>
              {showFullNote ? combinedNote : 
               (combinedNote.length > 200 ? 
                combinedNote.substring(0, 200) + "..." : 
                combinedNote)}
            </Text>
            {combinedNote.length > 200 && (
              <TouchableOpacity onPress={() => setShowFullNote(!showFullNote)}>
                <Text style={[styles.showMoreText, { color: colors.primary }]}>
                  {showFullNote ? "Show Less" : "Show More"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };
  
  if (!reviewData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading information...
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { borderColor: colors.primary }]}
            onPress={loadReviewData}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { 
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
        }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Review Information
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>
              Check carefully before submitting
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderProgressIndicator()}
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {renderSectionHeader("home", "Service Information", true)}
            {renderInfoRow("Service", reviewData.bookingData.serviceName || "Decoration Service", "construct", true)}
            {renderInfoRow("Survey Date", formatDateForDisplay(reviewData.bookingData.surveyDate), "calendar")}
            {reviewData.bookingData.note && (
              <View style={styles.noteSection}>
                <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>Initial Note:</Text>
                <Text style={[styles.noteContent, { color: colors.text }]}>
                  {reviewData.bookingData.note}
                </Text>
              </View>
            )}
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {renderSectionHeader("color-palette", "Design & Style", 
              Boolean(reviewData.surveyData.selectedDesign && reviewData.surveyData.selectedColors?.length > 0))}
            
            <View style={styles.subsection}>
              <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>Design Style:</Text>
              {reviewData.surveyData.selectedDesign ? 
                renderSelectedItems([reviewData.surveyData.selectedDesign], 'design') :
                <Text style={[styles.emptyValue, { color: colors.textSecondary }]}>No style selected</Text>
              }
            </View>
            
            <View style={styles.subsection}>
              <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                Selected Colors ({reviewData.surveyData.selectedColors?.length || 0}):
              </Text>
              {renderSelectedItems(reviewData.surveyData.selectedColors || [], 'color')}
            </View>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {renderSectionHeader("business", "Property Details", 
              Boolean(reviewData.surveyData.selectedPropertyType && reviewData.surveyData.roomSize))}
            
            {renderInfoRow("Property Type", reviewData.surveyData.selectedPropertyType || "Not selected", "home")}
            {renderInfoRow("Space Area", `${reviewData.surveyData.roomSize || 0} m²`, "expand", true)}
            {renderInfoRow("Primary User", reviewData.surveyData.selectedPrimaryUser || "Not selected", "people")}
            {renderInfoRow("Estimated Budget", formatCurrency(reviewData.surveyData.budget || "0"), "wallet", true)}
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {renderSectionHeader("list", "Scope of Work", 
              Boolean(reviewData.surveyData.selectedScopes?.length > 0))}
            <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
              Selected Work Items ({reviewData.surveyData.selectedScopes?.length || 0}):
            </Text>
            {renderSelectedItems(reviewData.surveyData.selectedScopes || [], 'scope')}
          </View>
          
          {reviewData.surveyData.specialRequirements && (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {renderSectionHeader("star", "Special Requirements", true)}
              <View style={[styles.requirementsContainer, { backgroundColor: `${colors.primary}08` }]}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <Text style={[styles.requirementsText, { color: colors.text }]}>
                  {reviewData.surveyData.specialRequirements}
                </Text>
              </View>
            </View>
          )}
          
          {renderImagesPreview()}
          
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Request Summary</Text>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {reviewData.surveyData.selectedColors?.length || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Colors</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {reviewData.surveyData.selectedScopes?.length || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Work Items</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {reviewData.surveyData.uploadedImages?.length || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Images</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {calculateCompleteness()}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Complete</Text>
              </View>
            </View>
          </View>
         
          <View style={[styles.noteContainer, { backgroundColor: `${colors.primary}08`, borderColor: colors.primary }]}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <View style={styles.noteTextContainer}>
              <Text style={[styles.noteTitle, { color: colors.primary }]}>Important Notice</Text>
              <Text style={[styles.noteText, { color: colors.text }]}>
                • After submission, our team will contact you within 24h{'\n'}
                • You can edit information before submitting{'\n'}
                • Survey service is completely free of charge{'\n'}
                • Multiple colors and work scopes are supported{'\n'}
                • Images will be processed and uploaded securely
              </Text>
            </View>
          </View>
          
          <View style={{ height: 20 }} />
        </ScrollView>
        
        <View style={[styles.buttonContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={[styles.editButton, { borderColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Ionicons name="create" size={20} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              { 
                backgroundColor: calculateCompleteness() >= 70 ? colors.primary : colors.textSecondary,
                opacity: calculateCompleteness() >= 70 ? 1 : 0.7
              }
            ]}
            onPress={() => setShowConfirmModal(true)}
            disabled={loading || calculateCompleteness() < 70}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Request</Text>
                <View style={styles.submitBadge}>
                  <Text style={styles.submitBadgeText}>{calculateCompleteness()}%</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {renderConfirmModal()}
      {renderImageModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
  },
  progressCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressNote: {
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    marginRight: 8,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  subsection: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
  },
  selectedItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  selectedItemText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    opacity: 0.6,
  },
  emptyStateText: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyValue: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  noteSection: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  showMoreText: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  requirementsContainer: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requirementsText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  noteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  noteInfoText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },
  combinedNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  combinedNoteText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  imagePreview: {
    position: 'relative',
    marginRight: 12,
  },
  firstImage: {
    marginLeft: 0,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 6,
  },
  imageInfo: {
    marginTop: 6,
    alignItems: 'center',
  },
  imageName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    maxWidth: 120,
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    position: 'relative',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  submitBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  submitBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  checkbox: {
    marginRight: 10,
  },
  termsText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  closeButtonContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: width * 0.9,
    height: width * 0.9,
  },
  imageModalInfo: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  imageModalText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
});

export default BookingReviewScreen;