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
  TextInput,
  Dimensions,
  SafeAreaView,
  Modal,
  Image,
  FlatList,
  PermissionsAndroid
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { getStyleColorByServiceIdAPI, getScopeOfWorkAPI } from "@/utils/decorserviceAPI";
import { launchImageLibrary, launchCamera, ImagePickerResponse, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';

const { width } = Dimensions.get('window');

interface UploadedImage {
  id: string;
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

// Simplified interface for React Native compatibility
export interface IBookingRequest {   
  decorServiceId: number;        
  addressId: number;             
  surveyDate: string;            
  note?: string;                 
  decorationStyleId: number;     
  themeColorIds: number | number[];
  spaceStyle: string;            
  roomSize: number;              
  style: string;                 
  themeColor: string;            
  primaryUser: string;           
  scopeOfWorkId: number | number[];
  images?: any[]; // Simplified to any[] for React Native compatibility               
  estimatedBudget?: number;      
}

const SurveyFormScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  // State for survey form
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // API Data
  const [apiColors, setApiColors] = useState<any[]>([]);
  const [apiDesigns, setApiDesigns] = useState<any[]>([]);
  const [scopeOfWork, setScopeOfWork] = useState<any[]>([]);
  
  // Form fields
  const [budget, setBudget] = useState<string>("");
  const [roomSize, setRoomSize] = useState<string>("");
  const [specialRequirements, setSpecialRequirements] = useState<string>("");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("");
  const [selectedPrimaryUser, setSelectedPrimaryUser] = useState<string>("");
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Multiple selections support
  const [selectedColorIds, setSelectedColorIds] = useState<number[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<number | null>(null);
  const [selectedScopeIds, setSelectedScopeIds] = useState<number[]>([]);
  
  // Dropdown states
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);
  const [showPrimaryUserModal, setShowPrimaryUserModal] = useState(false);
  
  // Booking data from previous screen
  const [bookingData, setBookingData] = useState<any>(null);
  
  // Predefined options
  const propertyTypes = [
    { id: 1, name: "Apartment" },
    { id: 2, name: "Villa / House" },
    { id: 3, name: "Studio" },
    { id: 4, name: "Office" },
    { id: 5, name: "Other" }
  ];
  
  const primaryUsers = [
    { id: 1, name: "Family" },
    { id: 2, name: "Couple" },
    { id: 3, name: "Single" },
    { id: 4, name: "Shared Living" },
    { id: 5, name: "Other" }
  ];
  
  useEffect(() => {
    requestPermissions();
    
    // Get booking data from global state or params
    const globalData = globalThis as any;
    
    if (globalData.currentBookingState?.bookingData) {
      setBookingData(globalData.currentBookingState.bookingData);
    } else {
      const fallbackData = {
        decorServiceId: Number(params.decorServiceId || params.serviceId),
        addressId: Number(params.addressId),
        surveyDate: params.surveyDate,
        note: params.note,
        serviceName: params.serviceName
      };
      setBookingData(fallbackData);
    }
    
    fetchAllData();
  }, []);
  
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES, // For Android 13+
        ]);
        
        console.log('📱 Permissions granted:', granted);
      } catch (err) {
        console.warn('❌ Permission error:', err);
      }
    }
  };
  
  const fetchAllData = async () => {
    try {
      setLoadingData(true);
      await fetchStylesAndColors();
      await fetchScopeOfWork();
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoadingData(false);
    }
  };
  
  const fetchStylesAndColors = async () => {
    try {
      const serviceId = Number(params.decorServiceId || params.serviceId) || 2;
      const response = await getStyleColorByServiceIdAPI(serviceId);
      
      if (response && (response.themeColors || response.designs)) {
        if (response.themeColors?.length > 0) {
          setApiColors(response.themeColors);
        }
        if (response.designs?.length > 0) {
          setApiDesigns(response.designs);
        }
      }
    } catch (error) {
      console.error("Failed to fetch styles and colors:", error);
      setApiColors([]);
      setApiDesigns([]);
    }
  };
  
  const fetchScopeOfWork = async () => {
    try {
      const scopeData = await getScopeOfWorkAPI();
      setScopeOfWork(scopeData);
    } catch (error) {
      console.error("Failed to fetch scope of work:", error);
      setScopeOfWork([]);
    }
  };

  // Simplified File object creation for React Native - No errors
  const createFileFromAsset = (asset: UploadedImage): any => {
    try {
      console.log('🔄 Creating file object for:', asset.fileName);
      
      if (!asset.uri) {
        console.error('❌ No URI in asset');
        return null;
      }
      
      // Create a simple object that works with FormData in React Native
      const fileName = asset.fileName || `survey_image_${Date.now()}.jpg`;
      const fileType = asset.type || 'image/jpeg';
      
      // Simple file-like object that FormData can handle
      const fileObject = {
        uri: asset.uri,
        type: fileType,
        name: fileName,
        size: asset.fileSize || 0,
        // Add additional properties for compatibility
        lastModified: Date.now(),
        constructor: { name: 'File' }
      };
      
      console.log('✅ File object created:', {
        name: fileObject.name,
        size: fileObject.size,
        type: fileObject.type,
        uri: 'Present'
      });
      
      return fileObject;
      
    } catch (error) {
      console.error('❌ Error creating file object:', error);
      // Return a basic object even if there's an error
      return {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `image_${Date.now()}.jpg`,
        size: asset.fileSize || 0
      };
    }
  };

  const removeImage = (imageId: string) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setUploadedImages(prev => {
              const newImages = prev.filter(img => img.id !== imageId);
              console.log(`🗑️ Removed image. ${newImages.length} images remaining`);
              return newImages;
            });
          }
        }
      ]
    );
  };
  
  // Enhanced image picker with better error handling
  const pickImageFromCamera = async () => {
    try {
      setUploadingImage(true);
      console.log('📷 Opening camera...');
      
      const options: CameraOptions = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 1200,
        maxWidth: 1200,
        quality: 0.8,
        saveToPhotos: false, // Don't save to gallery
      };

      launchCamera(options, (response: ImagePickerResponse) => {
        console.log('📷 Camera response:', {
          didCancel: response.didCancel,
          errorMessage: response.errorMessage,
          assetsLength: response.assets?.length
        });
        
        if (response.didCancel) {
          console.log('🚫 User cancelled camera');
        } else if (response.errorMessage) {
          console.error('❌ Camera Error:', response.errorMessage);
          Alert.alert('Camera Error', `Failed to capture image: ${response.errorMessage}`);
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          console.log('📸 Camera asset details:', {
            uri: asset.uri ? 'Present' : 'Missing',
            fileName: asset.fileName,
            type: asset.type,
            fileSize: asset.fileSize,
            width: asset.width,
            height: asset.height
          });
          
          // Validate file size (max 5MB)
          const maxSize = 5 * 1024 * 1024;
          if (asset.fileSize && asset.fileSize > maxSize) {
            Alert.alert('File Too Large', 'Please capture a smaller image (max 5MB)');
            setUploadingImage(false);
            setShowImageOptions(false);
            return;
          }
          
          const newImage: UploadedImage = {
            id: Date.now().toString(),
            uri: asset.uri || '',
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || `camera_${Date.now()}.jpg`,
            fileSize: asset.fileSize || 0,
            width: asset.width,
            height: asset.height
          };
          
          setUploadedImages(prev => {
            const updated = [...prev, newImage];
            console.log(`✅ Camera image added. Total: ${updated.length} images`);
            return updated;
          });
        }
        
        setUploadingImage(false);
        setShowImageOptions(false);
      });
    } catch (error) {
      console.error('❌ Error launching camera:', error);
      Alert.alert('Camera Error', 'Failed to launch camera. Please check permissions.');
      setUploadingImage(false);
      setShowImageOptions(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      setUploadingImage(true);
      console.log('🖼️ Opening gallery...');
      
      const options: ImageLibraryOptions = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 1200,
        maxWidth: 1200,
        quality: 0.8,
        selectionLimit: 3, // Allow up to 3 images
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        console.log('🖼️ Gallery response:', {
          didCancel: response.didCancel,
          errorMessage: response.errorMessage,
          assetsLength: response.assets?.length
        });
        
        if (response.didCancel) {
          console.log('🚫 User cancelled gallery');
        } else if (response.errorMessage) {
          console.error('❌ Gallery Error:', response.errorMessage);
          Alert.alert('Gallery Error', `Failed to select images: ${response.errorMessage}`);
        } else if (response.assets && response.assets.length > 0) {
          // Validate total size and individual sizes
          const maxTotalSize = 10 * 1024 * 1024; // 10MB total
          const maxIndividualSize = 5 * 1024 * 1024; // 5MB per image
          
          const validAssets = response.assets.filter(asset => {
            if (!asset.fileSize || asset.fileSize > maxIndividualSize) {
              console.warn('⚠️ Image too large:', asset.fileName, asset.fileSize);
              return false;
            }
            return true;
          });
          
          if (validAssets.length === 0) {
            Alert.alert('Invalid Images', 'All selected images are too large (max 5MB each)');
            setUploadingImage(false);
            setShowImageOptions(false);
            return;
          }
          
          const totalSize = validAssets.reduce((sum, asset) => sum + (asset.fileSize || 0), 0);
          
          if (totalSize > maxTotalSize) {
            Alert.alert('Total Size Too Large', 'Total size of selected images exceeds 10MB. Please select fewer or smaller images.');
            setUploadingImage(false);
            setShowImageOptions(false);
            return;
          }
          
          const newImages: UploadedImage[] = validAssets.map((asset, index) => {
            console.log(`📷 Gallery asset ${index + 1}:`, {
              uri: asset.uri ? 'Present' : 'Missing',
              fileName: asset.fileName,
              type: asset.type,
              fileSize: asset.fileSize,
              width: asset.width,
              height: asset.height
            });
            
            return {
              id: `${Date.now()}_${index}`,
              uri: asset.uri || '',
              type: asset.type || 'image/jpeg',
              fileName: asset.fileName || `gallery_${Date.now()}_${index}.jpg`,
              fileSize: asset.fileSize || 0,
              width: asset.width,
              height: asset.height
            };
          });
          
          setUploadedImages(prev => {
            const updated = [...prev, ...newImages];
            console.log(`✅ Gallery images added: ${newImages.length}. Total: ${updated.length} images`);
            console.log(`📊 Total size: ${Math.round(totalSize/1024/1024 * 10)/10}MB`);
            return updated;
          });
        }
        
        setUploadingImage(false);
        setShowImageOptions(false);
      });
    } catch (error) {
      console.error('❌ Error launching gallery:', error);
      Alert.alert('Gallery Error', 'Failed to launch gallery. Please check permissions.');
      setUploadingImage(false);
      setShowImageOptions(false);
    }
  };
  
  const formatDateForDisplay = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const validateAllData = () => {
    const errors = [];
    
    if (!bookingData?.decorServiceId && !params.decorServiceId && !params.serviceId) {
      errors.push("Missing service ID");
    }
    if (!bookingData?.addressId && !params.addressId) {
      errors.push("Missing address ID");
    }
    if (!bookingData?.surveyDate && !params.surveyDate) {
      errors.push("Missing survey date");
    }
    
    if (errors.length > 0) {
      console.error('❌ Data validation errors:', errors);
      Alert.alert('Data Error', `Missing required data: ${errors.join(', ')}`);
      return false;
    }
    
    return true;
  };

  // Multiple selection handlers
  const handleColorSelect = (colorId: number) => {
    setSelectedColorIds(prev => {
      const updated = prev.includes(colorId) 
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId];
      console.log('🎨 Color selection updated:', updated);
      return updated;
    });
    setError(null);
  };
  
  const handleDesignSelect = (designId: number) => {
    setSelectedDesignId(designId);
    console.log('🎨 Design selected:', designId);
    setError(null);
  };
  
  const handleScopeSelect = (scopeId: number) => {
    setSelectedScopeIds(prev => {
      const updated = prev.includes(scopeId)
        ? prev.filter(id => id !== scopeId)
        : [...prev, scopeId];
      console.log('📋 Scope selection updated:', updated);
      return updated;
    });
    setError(null);
  };
  
  // Enhanced validation
  const validateForm = (): boolean => {
    if (!budget.trim()) {
      setError("Please enter your estimated budget");
      return false;
    }
    
    const roomSizeNum = parseFloat(roomSize.trim());
    if (!roomSize.trim() || isNaN(roomSizeNum) || roomSizeNum <= 0) {
      setError("Please enter a valid room size (number greater than 0)");
      return false;
    }
    
    if (!selectedPropertyType) {
      setError("Please select property type");
      return false;
    }
    if (!selectedPrimaryUser) {
      setError("Please select primary user");
      return false;
    }
    if (selectedDesignId === null) {
      setError("Please select a design style");
      return false;
    }
    if (selectedColorIds.length === 0) {
      setError("Please select at least one color theme");
      return false;
    }
    if (selectedScopeIds.length === 0) {
      setError("Please select at least one scope of work");
      return false;
    }
    return true;
  };

  // Enhanced review preparation with better image handling and note integration
  const handleGoToReview = async () => {
    if (!validateForm() || !validateAllData()) {
      return;
    }
    
    console.log('📋 Preparing review data...');
    setLoading(true);
    
    try {
      // Get selected objects for display
      const selectedColors = selectedColorIds.map(id => {
        const color = apiColors.find(c => c.id === id);
        return color ? { id, ...color } : { id, name: `Color ${id}`, colorCode: '#CCCCCC' };
      });
      
      const selectedDesign = apiDesigns.find(d => d.id === selectedDesignId);
      
      const selectedScopes = selectedScopeIds.map(id => {
        const scope = scopeOfWork.find(s => s.id === id);
        return scope ? { id, ...scope } : { id, name: `Scope ${id}`, workType: `Work ${id}` };
      });
      
      // Simplified image processing - No async/await to avoid errors
      let imageFiles: any[] = [];
      if (uploadedImages.length > 0) {
        try {
          console.log(`🖼️ Processing ${uploadedImages.length} images...`);
          
          // Process images synchronously to avoid Promise issues
          imageFiles = uploadedImages.map((img, index) => {
            console.log(`🔄 Processing image ${index + 1}/${uploadedImages.length}: ${img.fileName}`);
            return createFileFromAsset(img);
          }).filter(file => file !== null); // Remove any null results
          
          console.log(`✅ Successfully processed ${imageFiles.length}/${uploadedImages.length} images`);
          
          if (imageFiles.length === 0 && uploadedImages.length > 0) {
            console.warn('⚠️ No images processed successfully');
            // Continue without images instead of showing error
          }
          
        } catch (error) {
          console.error('❌ Error processing images:', error);
          imageFiles = []; // Continue without images
          console.log('📤 Continuing without images due to processing error');
        }
      }
      
      // Create comprehensive note combining original note and survey data
      const createComprehensiveNote = () => {
        const noteParts = [];
        
        // Add original note if exists
        if (bookingData?.note || params.note) {
          noteParts.push(`Initial Request: ${bookingData?.note || params.note}`);
        }
        
        // Add survey details
        noteParts.push(`=== DESIGN SURVEY DETAILS ===`);
        noteParts.push(`Property Type: ${selectedPropertyType}`);
        noteParts.push(`Space Area: ${roomSize} m²`);
        noteParts.push(`Estimated Budget: ${parseInt(budget.replace(/\D/g, '')) || 0} VNĐ`);
        noteParts.push(`Primary User: ${selectedPrimaryUser}`);
        
        // Add design preferences
        if (selectedDesign) {
          noteParts.push(`Design Style: ${selectedDesign.name || selectedDesign.style}`);
        }
        
        if (selectedColors.length > 0) {
          const colorNames = selectedColors.map(c => c.name || c.colorCode).join(', ');
          noteParts.push(`Color Themes: ${colorNames}`);
        }
        
        if (selectedScopes.length > 0) {
          const scopeNames = selectedScopes.map(s => s.workType || s.name).join(', ');
          noteParts.push(`Scope of Work: ${scopeNames}`);
        }
        
        // Add special requirements if any
        if (specialRequirements.trim()) {
          noteParts.push(`=== SPECIAL REQUIREMENTS ===`);
          noteParts.push(specialRequirements.trim());
        }
        
        // Add image info
        if (uploadedImages.length > 0) {
          noteParts.push(`=== REFERENCE IMAGES ===`);
          noteParts.push(`${uploadedImages.length} reference image(s) attached`);
          uploadedImages.forEach((img, index) => {
            noteParts.push(`${index + 1}. ${img.fileName || 'Unnamed image'}`);
          });
        }
        
        return noteParts.join('\n');
      };
      
      // API payload with multiple selections support - simplified
      const apiPayload: any = {
        // Required API fields
        decorServiceId: bookingData?.decorServiceId || Number(params.decorServiceId || params.serviceId),
        addressId: bookingData?.addressId || Number(params.addressId),
        surveyDate: bookingData?.surveyDate || params.surveyDate,
        decorationStyleId: selectedDesignId!,
        
        // Multiple selections: Use arrays if multiple, single if one
        themeColorIds: selectedColorIds.length === 1 ? selectedColorIds[0] : selectedColorIds,
        scopeOfWorkId: selectedScopeIds.length === 1 ? selectedScopeIds[0] : selectedScopeIds,
        
        roomSize: parseFloat(roomSize),
        estimatedBudget: parseInt(budget.replace(/\D/g, '')) || 0,
        
        // Computed fields
        spaceStyle: selectedDesign?.name || selectedDesign?.style || 'Modern',
        style: selectedDesign?.name || selectedDesign?.style || 'Modern',
        themeColor: selectedColors.map(c => c.colorCode || c.name).join(', ') || '#FFFFFF',
        primaryUser: selectedPrimaryUser,
        
        // Comprehensive note with all survey data
        note: createComprehensiveNote(),
        
        // Images as simple objects (ready for FormData)
        images: imageFiles
      };
      
      // Review data for display purposes
      const reviewData = {
        bookingData: {
          decorServiceId: apiPayload.decorServiceId,
          addressId: apiPayload.addressId,
          surveyDate: apiPayload.surveyDate,
          note: bookingData?.note || params.note || "",
          serviceName: bookingData?.serviceName || params.serviceName || "Decoration Service"
        },
        
        surveyData: {
          // Display fields
          budget: budget,
          roomSize: roomSize,
          roomSizeNumber: apiPayload.roomSize,
          specialRequirements: specialRequirements,
          selectedPropertyType: selectedPropertyType,
          selectedPrimaryUser: selectedPrimaryUser,
          
          // Multiple selections for display
          selectedColors: selectedColors,
          selectedColorIds: selectedColorIds,
          selectedDesign: selectedDesign,
          selectedDesignId: selectedDesignId,
          selectedScopes: selectedScopes,
          selectedScopeIds: selectedScopeIds,
          
          // Image data
          uploadedImages: uploadedImages,
          
          // API-ready computed fields
          spaceStyle: apiPayload.spaceStyle,
          themeColor: apiPayload.themeColor,
          style: apiPayload.style,
          images: uploadedImages.map(img => img.uri),
          
          // Comprehensive note for display
          comprehensiveNote: apiPayload.note
        }
      };

      // Save to global state
      const globalData = globalThis as any;
      if (!globalData.currentBookingState) {
        globalData.currentBookingState = {};
      }
      
      globalData.currentBookingState.reviewData = reviewData;
      globalData.currentBookingState.apiPayload = apiPayload;
      globalData.currentBookingState.lastUpdate = new Date().toISOString();
      
      // Enhanced logging
      console.log('📋 API Payload ready:', {
        decorServiceId: apiPayload.decorServiceId,
        addressId: apiPayload.addressId,
        surveyDate: apiPayload.surveyDate,
        decorationStyleId: apiPayload.decorationStyleId,
        themeColorIds: apiPayload.themeColorIds,
        scopeOfWorkId: apiPayload.scopeOfWorkId,
        roomSize: apiPayload.roomSize,
        estimatedBudget: apiPayload.estimatedBudget,
        colorsSelected: selectedColorIds.length,
        scopesSelected: selectedScopeIds.length,
        imagesCount: apiPayload.images?.length || 0,
        imageFilesValid: imageFiles.length > 0 && imageFiles.every(img => img && img.uri) || false,
        noteLength: apiPayload.note.length
      });
      
      // Navigate to review
      router.push({
        pathname: "/booking/review",
        params: { 
          fromSurvey: "true",
          dataReady: "true",
          timestamp: Date.now().toString()
        }
      });
      console.log('✅ Navigation to review successful');
      
    } catch (error: any) {
      console.error('❌ Error preparing review data:', error);
      Alert.alert('Error', 'Failed to prepare data for review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render functions remain the same as original...
  const renderDesignStyles = () => {
    if (apiDesigns.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No design styles available
        </Text>
      );
    }
    
    return (
      <View style={styles.designGrid}>
        {apiDesigns.map((design) => (
          <TouchableOpacity
            key={design.id}
            style={[
              styles.designOption,
              {
                backgroundColor: selectedDesignId === design.id 
                  ? `${colors.primary}20` 
                  : `${colors.primary}05`,
                borderColor: selectedDesignId === design.id 
                  ? colors.primary 
                  : colors.border,
                borderWidth: selectedDesignId === design.id ? 2 : 1
              }
            ]}
            onPress={() => handleDesignSelect(design.id)}
          >
            <Ionicons 
              name={selectedDesignId === design.id ? "checkmark-circle" : "radio-button-off"} 
              size={20} 
              color={selectedDesignId === design.id ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.designText,
              { 
                color: selectedDesignId === design.id ? colors.primary : colors.text,
                fontWeight: selectedDesignId === design.id ? '600' : '400'
              }
            ]}>
              {design.name || design.style}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  const renderColorThemes = () => {
    if (apiColors.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No color themes available
        </Text>
      );
    }
    
    return (
      <View style={styles.colorSquareGrid}>
        {apiColors.map((color) => (
          <TouchableOpacity
            key={color.id}
            style={[
              styles.colorSquareOption,
              {
                borderColor: selectedColorIds.includes(color.id) 
                  ? colors.primary 
                  : colors.border,
                borderWidth: selectedColorIds.includes(color.id) ? 3 : 1
              }
            ]}
            onPress={() => handleColorSelect(color.id)}
          >
            <View 
              style={[
                styles.colorSquareSwatch, 
                { backgroundColor: color.colorCode || '#CCCCCC' }
              ]} 
            />
            {selectedColorIds.includes(color.id) && (
              <View style={styles.colorCheckmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
            <Text style={[
              styles.colorSquareName,
              { 
                color: selectedColorIds.includes(color.id) ? colors.primary : colors.text,
                fontWeight: selectedColorIds.includes(color.id) ? '600' : '400'
              }
            ]}>
              {color.name || color.colorCode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  const renderScopeOfWork = () => {
    if (scopeOfWork.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No scope of work available
        </Text>
      );
    }
    
    return (
      <View style={styles.scopeGrid}>
        {scopeOfWork.map((scope) => (
          <TouchableOpacity
            key={scope.id}
            style={[
              styles.scopeOption,
              {
                backgroundColor: selectedScopeIds.includes(scope.id) 
                  ? `${colors.primary}15` 
                  : colors.card,
                borderColor: selectedScopeIds.includes(scope.id) 
                  ? colors.primary 
                  : colors.border,
                borderWidth: selectedScopeIds.includes(scope.id) ? 2 : 1
              }
            ]}
            onPress={() => handleScopeSelect(scope.id)}
          >
            <Ionicons 
              name={selectedScopeIds.includes(scope.id) ? "checkmark-circle" : "radio-button-off"} 
              size={20} 
              color={selectedScopeIds.includes(scope.id) ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.scopeText,
              { 
                color: selectedScopeIds.includes(scope.id) ? colors.primary : colors.text,
                fontWeight: selectedScopeIds.includes(scope.id) ? '600' : '400'
              }
            ]}>
              {scope.workType || scope.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Enhanced image rendering with better info and error states
  const renderUploadedImages = () => {
    if (uploadedImages.length === 0) {
      return null;
    }

    const totalSize = uploadedImages.reduce((sum, img) => sum + (img.fileSize || 0), 0);
    const totalSizeMB = Math.round(totalSize / 1024 / 1024 * 10) / 10;

    return (
      <View style={styles.uploadedImagesContainer}>
        <View style={styles.imagesSummary}>
          <Text style={[styles.imagesSummaryText, { color: colors.textSecondary }]}>
            {uploadedImages.length} images • {totalSizeMB}MB total
          </Text>
          <Text style={[styles.imagesLimitText, { color: colors.textSecondary }]}>
            {3 - uploadedImages.length} slots remaining
          </Text>
        </View>
        <FlatList
          data={uploadedImages}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.imageItem}>
              <Image 
                source={{ uri: item.uri }} 
                style={styles.uploadedImage}
                onError={(error) => {
                  console.error(`❌ Image load error for ${item.fileName}:`, error);
                }}
                onLoad={() => {
                  console.log(`✅ Image loaded successfully: ${item.fileName}`);
                }}
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => removeImage(item.id)}
              >
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
              <Text style={[styles.imageName, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.fileName || `Image ${index + 1}`}
              </Text>
              <Text style={[styles.imageSize, { color: colors.textSecondary }]}>
                {item.fileSize ? `${Math.round(item.fileSize / 1024)}KB` : 'Unknown size'}
              </Text>
              <Text style={[styles.imageType, { color: colors.textSecondary }]}>
                {item.type || 'Unknown type'}
              </Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        />
      </View>
    );
  };

  // Enhanced image upload section with better messaging and status
  const renderImageUploadSection = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        <Ionicons name="camera" size={18} color={colors.primary} /> 
        Reference Images (Optional)
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        Upload photos of spaces you like, current space, or inspiration images
        {'\n'}• Max 3 images, 5MB each, 10MB total
        {'\n'}• Supported formats: JPG, PNG
        {'\n'}• Images help us understand your vision better
      </Text>
      
      {/* Upload Status */}
      {uploadedImages.length > 0 && (
        <View style={[styles.uploadStatus, { backgroundColor: `${colors.primary}08` }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          <Text style={[styles.uploadStatusText, { color: colors.primary }]}>
            {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''} ready for upload
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.uploadButton, { 
          borderColor: colors.border, 
          backgroundColor: `${colors.primary}08`,
          opacity: (uploadingImage || uploadedImages.length >= 3) ? 0.5 : 1
        }]}
        onPress={() => setShowImageOptions(true)}
        disabled={uploadingImage || uploadedImages.length >= 3}
      >
        <Ionicons 
          name={uploadingImage ? "hourglass" : "cloud-upload"} 
          size={24} 
          color={colors.primary} 
        />
        <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
          {uploadingImage ? 'Processing Image...' : 
           uploadedImages.length >= 3 ? 'Maximum Images Reached' : 
           uploadedImages.length === 0 ? 'Add Images' : 'Add More Images'}
        </Text>
        {uploadingImage && <ActivityIndicator size="small" color={colors.primary} />}
      </TouchableOpacity>

      {renderUploadedImages()}
      
      {/* Image tips - Fixed icon name */}
      {uploadedImages.length === 0 && (
        <View style={[styles.imageTips, { backgroundColor: `${colors.primary}05` }]}>
          <Ionicons name="bulb" size={16} color={colors.primary} />
          <Text style={[styles.imageTipsText, { color: colors.textSecondary }]}>
            💡 Tips: Include room photos, inspiration images, or style references to help our designers understand your preferences
          </Text>
        </View>
      )}
    </View>
  );
  
  const renderDropdownModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: any[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.modalOption,
                  {
                    backgroundColor: selectedValue === option.name 
                      ? `${colors.primary}20` 
                      : 'transparent'
                  }
                ]}
                onPress={() => {
                  onSelect(option.name);
                  onClose();
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  { 
                    color: selectedValue === option.name ? colors.primary : colors.text,
                    fontWeight: selectedValue === option.name ? '600' : '400'
                  }
                ]}>
                  {option.name}
                </Text>
                {selectedValue === option.name && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderImageOptionsModal = () => (
    <Modal
      visible={showImageOptions}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImageOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.imageOptionsModal, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Images</Text>
            <TouchableOpacity onPress={() => setShowImageOptions(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.imageOptionButton, { borderBottomColor: colors.border }]}
            onPress={pickImageFromCamera}
            disabled={uploadingImage}
          >
            <Ionicons name="camera" size={24} color={colors.primary} />
            <View style={styles.imageOptionTextContainer}>
              <Text style={[styles.imageOptionTitle, { color: colors.text }]}>Take Photo</Text>
              <Text style={[styles.imageOptionSubtitle, { color: colors.textSecondary }]}>
                Capture with camera (Max 5MB)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.imageOptionButton}
            onPress={pickImageFromGallery}
            disabled={uploadingImage}
          >
            <Ionicons name="images" size={24} color={colors.primary} />
            <View style={styles.imageOptionTextContainer}>
              <Text style={[styles.imageOptionTitle, { color: colors.text }]}>Choose from Gallery</Text>
              <Text style={[styles.imageOptionSubtitle, { color: colors.textSecondary }]}>
                Select up to 3 images (Max 10MB total)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  if (loadingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading design survey...
          </Text>
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
              Design Survey
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>
              {bookingData?.serviceName || 'Decor Service'}
            </Text>
          </View>
          <View style={styles.spacer} />
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Booking Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="clipboard-outline" size={24} color={colors.primary} />
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                Booking Information
              </Text>
            </View>
            {bookingData && (
              <>
                <View style={styles.summaryRow}>
                  <Ionicons name="calendar" size={16} color={colors.primary} />
                  <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                    Survey Date: {formatDateForDisplay(bookingData.surveyDate)}
                  </Text>
                </View>
                {bookingData.note && (
                  <View style={styles.summaryRow}>
                    <Ionicons name="document-text" size={16} color={colors.primary} />
                    <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                      Initial Note: {bookingData.note}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
          
          {/* Survey Form */}
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <View style={styles.formHeader}>
              <Ionicons name="brush" size={24} color={colors.primary} />
              <Text style={[styles.formTitle, { color: colors.text }]}>
                Share Your Vision
              </Text>
            </View>
            <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
              All fields marked with * are required. You can select multiple colors and work scopes.
            </Text>
            
            {/* 1. Design Styles - Single selection */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="color-palette" size={18} color={colors.primary} /> 
                Design Style *
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Choose one design style that best represents your vision
              </Text>
              {renderDesignStyles()}
            </View>
            
            {/* 2. Color Themes - Multiple selection */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="color-filter" size={18} color={colors.primary} /> 
                Color Themes * ({selectedColorIds.length} selected)
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Select one or more colors that appeal to you
              </Text>
              {renderColorThemes()}
            </View>
            
            {/* 3. Property Type - Dropdown */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="business" size={18} color={colors.primary} /> 
                Property Type *
              </Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, { 
                  borderColor: colors.border, 
                  backgroundColor: `${colors.primary}08` 
                }]}
                onPress={() => setShowPropertyTypeModal(true)}
              >
                <Ionicons name="home" size={20} color={colors.primary} style={styles.inputIcon} />
                <Text style={[
                  styles.dropdownText, 
                  { color: selectedPropertyType ? colors.text : colors.textSecondary }
                ]}>
                  {selectedPropertyType || "Select property type"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* 4. Space Area */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="expand" size={18} color={colors.primary} /> 
                Space Area *
              </Text>
              <View style={[styles.inputWrapper, { 
                borderColor: colors.border, 
                backgroundColor: `${colors.primary}08` 
              }]}>
                <Ionicons name="square" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="e.g., 80"
                  placeholderTextColor={colors.textSecondary}
                  value={roomSize}
                  onChangeText={setRoomSize}
                  keyboardType="numeric"
                />
                <Text style={[styles.unitText, { color: colors.textSecondary }]}>m²</Text>
              </View>
            </View>
            
            {/* 5. Estimated Budget */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="cash" size={18} color={colors.primary} />
                {" "}Estimated Budget (VNĐ) *
              </Text>
              <View style={[styles.inputWrapper, {
                borderColor: colors.border,
                backgroundColor: `${colors.primary}08`
              }]}>
                <Ionicons name="wallet" size={20} color={colors.primary} style={styles.inputIcon} />
                <Text style={[styles.currencySymbol, { color: colors.primary }]}>₫</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="vd: 50,000,000"
                  placeholderTextColor={colors.textSecondary}
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            {/* 6. Primary User - Dropdown */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="people" size={18} color={colors.primary} /> 
                Primary User *
              </Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, { 
                  borderColor: colors.border, 
                  backgroundColor: `${colors.primary}08` 
                }]}
                onPress={() => setShowPrimaryUserModal(true)}
              >
                <Ionicons name="person" size={20} color={colors.primary} style={styles.inputIcon} />
                <Text style={[
                  styles.dropdownText, 
                  { color: selectedPrimaryUser ? colors.text : colors.textSecondary }
                ]}>
                  {selectedPrimaryUser || "Select primary user"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* 7. Scope of Work - Multiple selection */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="list" size={18} color={colors.primary} /> 
                Scope of Work * ({selectedScopeIds.length} selected)
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Select the work items you want to include
              </Text>
              {renderScopeOfWork()}
            </View>
            
            {/* 8. Special Requirements */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="star" size={18} color={colors.primary} /> 
                Special Requirements (Optional)
              </Text>
              {/* <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Any specific needs, constraints, accessibility requirements, etc.
                {'\n'}This information will be included in your booking notes.
              </Text> */}
              <View style={[styles.textAreaWrapper, { 
                borderColor: colors.border, 
                backgroundColor: `${colors.primary}08` 
              }]}>
                <Ionicons 
                  name="create" 
                  size={20} 
                  color={colors.primary} 
                  style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 12 }]} 
                />
                <TextInput
                  style={[styles.textAreaInput, { color: colors.text }]}
                  placeholder="Tell us about any specific requirements or preferences..."
                  placeholderTextColor={colors.textSecondary}
                  value={specialRequirements}
                  onChangeText={setSpecialRequirements}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>
              {specialRequirements.length > 400 && (
                <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                  {specialRequirements.length}/500 characters
                </Text>
              )}
            </View>

            {/* 9. Image Upload Section */}
            {renderImageUploadSection()}
          </View>
          
          {/* Error Display */}
          {error && (
            <View style={[styles.errorContainer, { 
              borderLeftColor: colors.error,
              backgroundColor: `${colors.error}10`
            }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}
          
          {/* Required fields note */}
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              * All fields marked with asterisk are required. Your survey details will be included in the booking notes for our designers.
            </Text>
          </View>
        </ScrollView>
        
        {/* Review Button - Fixed at bottom */}
        <View style={[styles.buttonContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={[styles.submitButton, { 
              backgroundColor: colors.primary,
              opacity: loading ? 0.7 : 1
            }]}
            onPress={handleGoToReview}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="eye" size={22} color="#fff" />
            )}
            <Text style={styles.submitButtonText}>
              {loading ? "Processing..." : "Review Information"}
            </Text>
            {!loading && (
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Dropdown Modals */}
      {renderDropdownModal(
        showPropertyTypeModal,
        () => setShowPropertyTypeModal(false),
        "Select Property Type",
        propertyTypes,
        selectedPropertyType,
        setSelectedPropertyType
      )}
      
      {renderDropdownModal(
        showPrimaryUserModal,
        () => setShowPrimaryUserModal(false),
        "Select Primary User",
        primaryUsers,
        selectedPrimaryUser,
        setSelectedPrimaryUser
      )}

      {/* Image Options Modal */}
      {renderImageOptionsModal()}
    </SafeAreaView>
  );
};

// Enhanced styles with improved image components
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
    paddingBottom: 100,
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
    textAlign: 'center',
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
  spacer: {
    width: 40,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  formCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  formSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
    opacity: 0.8,
    lineHeight: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
    minHeight: 44,
  },
  textAreaWrapper: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  textAreaInput: {
    flex: 1,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputIcon: {
    marginRight: 10,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
  },
  designGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  designOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 48,
  },
  designText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  colorSquareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSquareOption: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  colorSquareSwatch: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginBottom: 4,
  },
  colorCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSquareName: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  scopeGrid: {
    gap: 8,
  },
  scopeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  scopeText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  // Enhanced Image Upload Styles
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  uploadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  uploadStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  uploadedImagesContainer: {
    marginTop: 8,
  },
  imagesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  imagesSummaryText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  imagesLimitText: {
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  imageItem: {
    alignItems: 'center',
    width: 100,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  imageName: {
    fontSize: 10,
    textAlign: 'center',
    maxWidth: 80,
    marginBottom: 2,
  },
  imageSize: {
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 1,
  },
  imageType: {
    fontSize: 8,
    textAlign: 'center',
    opacity: 0.6,
  },
  imageTips: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  imageTipsText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  imageOptionsModal: {
    width: '85%',
    borderRadius: 12,
    padding: 20,
  },
  imageOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  imageOptionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  imageOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageOptionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalList: {
    maxHeight: 300,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionText: {
    fontSize: 16,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  buttonContainer: {
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
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
    opacity: 0.7,
  }
});

export default SurveyFormScreen;