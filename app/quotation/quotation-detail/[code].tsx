import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
  Modal,
  Image,
  Dimensions,
  TextInput,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { getQuotationDetailByCustomerAPI, confirmQuotationAPI,removeProductFromQuotationAPI } from '@/utils/quotationsAPI';
import { WebView } from 'react-native-webview';

import QuotationRejectScreen from '@/components/QuotationRejectScreen';

const PRIMARY_COLOR = "#5fc1f1";
const QUOTATION_COLOR = "#34c759"; // Green color for quotation elements

// Function to clean HTML content and extract plain text
const cleanHtmlContent = (htmlString: string): string => {
  if (!htmlString) return '';
  
  // Remove HTML tags and decode HTML entities
  let cleanText = htmlString
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/&apos;/g, "'") // Replace &apos; with '
    .trim(); // Remove leading/trailing whitespace
  
  return cleanText;
};

// Check if content contains HTML tags
const containsHtml = (content: string): boolean => {
  if (!content) return false;
  return /<[^>]*>/g.test(content);
};

// Function to safely process text content
const processTextContent = (text: string | undefined): string => {
  if (!text) return '';
  
  // If contains HTML, clean it
  if (containsHtml(text)) {
    return cleanHtmlContent(text);
  }
  
  return text.trim();
};

// Updated interface to match the actual API response structure
interface Provider {
  id: number;
  businessName: string;
  slug: string | null;
  bio: string | null;
  avatar: string;
  phone: string | null;
  address: string | null;
  skillName: string | null;
  decorationStyleName: string | null;
  yearsOfExperience: string | null;
  pastWorkPlaces: string | null;
  pastProjects: string | null;
  certificateImageUrls: string | null;
  isProvider: boolean;
  providerVerified: boolean;
  providerStatus: number;
  joinedDate: string | null;
  followersCount: number;
  followingsCount: number;
}

interface MaterialDetail {
  id: number;
  materialName: string;
  quantity: number;
  cost: number;
  note: string;
  totalCost: number;
}

interface ConstructionDetail {
  id: number;
  taskName: string;
  cost: number;
  unit: string;
  area: number; // Added area field
  note: string;
}

interface ProductDetail {
  id: number;
  productId: number;
  productName: string;
  image: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface IQuotationDetail {
  id: number;
  quotationCode: string;
  provider: Provider;
  style: string;
  materialCost: number;
  constructionCost: number;
  productCost: number;
  depositPercentage: number;
  isQuoteExisted: boolean;
  isContractExisted: boolean;
  isSigned: boolean;
  createdAt: string;
  statusCode:number;
  status: number;
  filePath: string | null; // Changed from quotationFilePath to match API
  quotationFilePath: string | null; // Include both for compatibility
  materialDetails: MaterialDetail[]; // Updated field names
  constructionDetails: ConstructionDetail[]; // Updated field names
  productDetails: ProductDetail[]; // Added product details
  materials?: MaterialDetail[]; // For backward compatibility
  constructionTasks?: ConstructionDetail[]; // For backward compatibility
  totalCost?: number; // Optional field, will calculate if missing
}

// Type definition for Ionicons names
type IoniconsName = 
  | "business-outline" 
  | "color-palette-outline" 
  | "calendar-outline"
  | "document-text-outline"
  | "cart-outline"
  | "calculator-outline"
  | "settings-outline"
  | "notifications-outline"
  | "time-outline"
  | "checkmark-circle-outline"
  | "close-circle-outline"
  | "help-circle-outline"
  | "document-text"
  | "open-outline"
  | "arrow-back"
  | "alert-circle-outline"
  | "card-outline"
  | "information-circle"
  | "chatbox-ellipses"
  | "chevron-forward"
  | "close";

const mapStatusCodeToString = (statusCode: number): string => {
  const statusMap: Record<number, string> = {
    0: 'Pending',           // Pending quotation
    1: 'Confirmed',         // Customer agreed to quotation
    2: 'PendingChanged',    // Từ chối bảng báo giá
    3: 'PendingCancel',     // Pending cancellation
    4: 'Closed'             // Closed quotation
  };
  
  return statusMap[statusCode] || 'Unknown';
};

// Define your getStatusIcon function with the proper return type
const getStatusIcon = (statusCode: number): IoniconsName => {
  switch (statusCode) {
    case 0: // Pending
      return "time-outline";
    case 1: // Confirmed
      return "checkmark-circle-outline";
    case 2: // PendingChanged
      return "alert-circle-outline";
    case 3: // PendingCancel
      return "close-circle-outline";
    case 4: // Closed
      return "close";
    default:
      return "help-circle-outline";
  }
};

const getStatusColor = (statusCode: number): string => {
  switch (statusCode) {
    case 0: // Pending
      return '#ff9500'; // Orange
    case 1: // Confirmed
      return '#4caf50'; // Green
    case 2: // PendingChanged
      return '#ff3b30'; // Red
    case 3: // PendingCancel
      return '#ff6b6b'; // Light Red
    case 4: // Closed
      return '#8e8e93'; // Gray
    default:
      return '#8e8e93'; // Gray
  }
};

const canQuotationBeConfirmed = (statusCode: number): boolean => {
  return statusCode === 0; // Only Pending quotations can be confirmed
};

const QuotationDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();
  const { code } = useLocalSearchParams();
  const quotationCode = Array.isArray(code) ? code[0] : code;

  const [quotation, setQuotation] = useState<IQuotationDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false); // New state for pull-to-refresh
  const [error, setError] = useState<string>('');
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [pdfLoading, setPdfLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  // const [showRejectReasonModal, setShowRejectReasonModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);

  useEffect(() => {
    fetchQuotationDetails();
  }, [quotationCode]);

  const fetchQuotationDetails = async (isRefresh: boolean = false) => {
    if (!quotationCode) {
      setError('Quotation code is missing');
      setLoading(false);
      return;
    }
  
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError('');
      
      console.log('📘 Fetching quotation details for:', quotationCode);
      const response = await getQuotationDetailByCustomerAPI(quotationCode);
      
      console.log('📘 Response structure:', JSON.stringify(response, null, 2).substring(0, 200) + '...');
      
      if (response && response.quotationCode) {
        console.log('📘 Found quotation data in response');
        
        // Clean HTML content from the quotation data
        const processedQuotation = {
          ...response,
          style: processTextContent(response.style),
          provider: {
            ...response.provider,
            businessName: processTextContent(response.provider.businessName),
            bio: processTextContent(response.provider.bio),
          },
          materialDetails: (response.materialDetails || response.materials || []).map((material: MaterialDetail) => ({
            ...material,
            materialName: processTextContent(material.materialName),
            note: processTextContent(material.note)
          })),
          constructionDetails: (response.constructionDetails || response.constructionTasks || []).map((task: ConstructionDetail) => ({
            ...task,
            taskName: processTextContent(task.taskName),
            note: processTextContent(task.note)
          })),
          productDetails: (response.productDetails || []).map((product: ProductDetail) => ({
            ...product,
            productName: processTextContent(product.productName)
          })),
          filePath: response.filePath || response.quotationFilePath,
        };
        
        // Calculate total cost if not provided
        if (!processedQuotation.totalCost) {
          processedQuotation.totalCost = 
            (processedQuotation.materialCost || 0) + 
            (processedQuotation.constructionCost || 0) +
            (processedQuotation.productCost || 0);
        }
        
        console.log('📘 Processed quotation data successfully');
        setQuotation(processedQuotation);
      } else {
        console.log('📘 No usable data found, setting error');
        setError('Failed to load quotation details');
      }
    } catch (err: any) {
      console.error('❌ Error fetching quotation details:', err);
      setError('Failed to load quotation details. Please try again.');
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  // Pull-to-refresh handler
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchQuotationDetails(true);
  }, [quotationCode]);

  // Updated handleRemoveProduct function to use productId instead of id
  const handleRemoveProduct = (productId: number) => {
    if (!quotation) {
      Alert.alert("Error", "Quotation details not available");
      return;
    }

    const product = quotation.productDetails.find(p => p.productId === productId);
    
    if (!product) {
      Alert.alert("Error", "This product does not exist in the quotation");
      return;
    }
    
    Alert.alert(
      "Remove Product",
      "Are you sure you want to remove this product from the quotation?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              
              console.log(`Attempting to remove product ${product.productId} from quotation ${quotation.quotationCode}`);
              
              const result = await removeProductFromQuotationAPI(quotation.quotationCode, product.productId);
              
              if (result && result.removedProduct) {
                console.log("🟢 Product removal successful, updating UI");
                
                setQuotation(prevQuotation => {
                  if (!prevQuotation) return prevQuotation;
                  
                  const updatedProducts = prevQuotation.productDetails.filter(
                    p => p.productId !== product.productId
                  );
                  
                  const newProductCost = typeof result.productCost === 'number' 
                    ? result.productCost
                    : updatedProducts.reduce((sum, p) => sum + p.totalPrice, 0);
                  
                  return {
                    ...prevQuotation,
                    productDetails: updatedProducts,
                    productCost: newProductCost,
                    totalCost: (prevQuotation.materialCost || 0) + 
                               (prevQuotation.constructionCost || 0) + 
                               newProductCost
                  };
                });
                
                Alert.alert("Success", "Product removed from quotation");
              } else {
                const errorMessage = result.message || "Failed to remove product from quotation";
                console.error("🔴 Product removal API error:", errorMessage);
                Alert.alert("Error", errorMessage);
              }
            } catch (error: any) {
              console.error("Error removing product:", error);
              Alert.alert(
                "Error", 
                error.message || "Failed to remove product from quotation"
              );
            } finally {
              setLoading(false);
              fetchQuotationDetails();
            }
          }
        }
      ]
    );
  };

  const formatDateWithTextMonth = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };

  const handleRejectQuotation = (): void => {
    if (!quotation) return;
    setShowRejectModal(true);
  };

  // Function to handle image preview
  const handleImagePreview = (imageUrl: string) => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setImageLoading(true);
    }
  };

  // Function to close image preview
  const closeImagePreview = () => {
    setSelectedImage(null);
  };
  
  const createPdfHtml = (pdfUrl: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
        <style>
          body, html { 
           top: 50;
            margin: 0; 
            padding: 0; 
            width: 100%; 
            height: 100%; 
            background-color: #f5f5f5; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          }
          header {
            position: fixed;
            top: 50px;
            left: 0;
            right: 0;
            height: 60px;
            background-color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 15px;
            border-bottom: 1px solid #e1e1e1;
            z-index: 1000;
          }
          .header-title {
            font-size: 18px;
            font-weight: 600;
            text-align: center;
            flex: 1;
          }
          .close-btn {
            color: #000;
            font-size: 24px;
            font-weight: 400;
            background: transparent;
            border: none;
            padding: 8px;
            cursor: pointer;
          }
          .download-btn {
            padding: 8px 12px;
            color: #34c759;
            text-decoration: none;
            font-weight: 500;
            font-size: 16px;
            display: flex;
            align-items: center;
          }
          .download-icon {
            margin-right: 5px;
          }
          #pdfViewer { 
            width: 100%; 
            padding-top: 70px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          canvas {
            margin: 0 auto;
            max-width: 100% !important;
            height: auto !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            margin-bottom: 10px;
            background-color: white;
          }
          .error-message {
            color: red;
            padding: 20px;
            text-align: center;
          }
          .page {
            margin-bottom: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            background-color: white;
          }
          .controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            padding: 8px 15px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            z-index: 100;
          }
          .controls button {
            background: transparent;
            border: none;
            color: white;
            font-size: 18px;
            margin: 0 10px;
            cursor: pointer;
            padding: 5px 10px;
          }
          .controls button:disabled {
            opacity: 0.5;
          }
          .pageNum {
            color: white;
            margin: 0 10px;
            font-size: 16px;
          }
          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
            width: 100%;
            margin-top: 80px;
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"></script>
      </head>
      <body>
        <header>
          <button class="close-btn" id="closeBtn">×</button>
          <div class="header-title">Quotation Document</div>
          <a href="${pdfUrl}" download class="download-btn" id="downloadBtn">
            <span class="download-icon">⬇️</span> Download
          </a>
        </header>
        
        <div id="pdfViewer"></div>
        
        <div class="controls" id="controls" style="display:none;">
          <button id="prev">◀</button>
          <span class="pageNum" id="pageNum">1</span>
          <button id="next">▶</button>
          <button id="zoomIn">+</button>
          <button id="zoomOut">-</button>
        </div>
        
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          
          const pdfUrl = "${pdfUrl}";
          const container = document.getElementById('pdfViewer');
          const controls = document.getElementById('controls');
          const pageNumSpan = document.getElementById('pageNum');
          const prevButton = document.getElementById('prev');
          const nextButton = document.getElementById('next');
          const zoomInButton = document.getElementById('zoomIn');
          const zoomOutButton = document.getElementById('zoomOut');
          const closeBtn = document.getElementById('closeBtn');
          
          let currentPage = 1;
          let pageCount = 0;
          let scale = 1.0;
          let pdf = null;
          
          const loadingDiv = document.createElement('div');
          loadingDiv.className = 'loading';
          loadingDiv.innerHTML = 'Loading document...';
          container.appendChild(loadingDiv);
          
          closeBtn.addEventListener('click', function() {
            window.ReactNativeWebView.postMessage('close_modal');
          });
          
          async function renderPage(pageNumber) {
            if (!pdf) return;
            
            const existingPage = document.getElementById('page-' + currentPage);
            if (existingPage) {
              existingPage.style.display = 'none';
            }
            
            let pageDiv = document.getElementById('page-' + pageNumber);
            if (!pageDiv) {
              try {
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale });
                
                pageDiv = document.createElement('div');
                pageDiv.className = 'page';
                pageDiv.id = 'page-' + pageNumber;
                container.appendChild(pageDiv);
                
                const canvas = document.createElement('canvas');
                pageDiv.appendChild(canvas);
                
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({
                  canvasContext: context,
                  viewport: viewport
                }).promise;
              } catch (error) {
                console.error('Error rendering page:', error);
                pageDiv = document.createElement('div');
                pageDiv.className = 'page';
                pageDiv.id = 'page-' + pageNumber;
                pageDiv.innerHTML = '<div class="error-message">Error loading page ' + pageNumber + '</div>';
                container.appendChild(pageDiv);
              }
            } else {
              pageDiv.style.display = 'block';
            }
            
            currentPage = pageNumber;
            pageNumSpan.textContent = currentPage;
            
            prevButton.disabled = currentPage <= 1;
            nextButton.disabled = currentPage >= pageCount;
            
            pageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          
          function zoom(delta) {
            scale += delta;
            scale = Math.max(0.5, Math.min(3, scale));
            
            for (let i = 1; i <= pageCount; i++) {
              const pageDiv = document.getElementById('page-' + i);
              if (pageDiv) {
                container.removeChild(pageDiv);
              }
            }
            
            renderPage(currentPage);
          }
          
          async function loadPDF() {
            try {
              pdf = await pdfjsLib.getDocument(pdfUrl).promise;
              pageCount = pdf.numPages;
              
              controls.style.display = 'flex';
              container.removeChild(loadingDiv);
              
              await renderPage(1);
              
              if (pageCount > 1) {
                setTimeout(() => {
                  for (let i = 2; i <= Math.min(3, pageCount); i++) {
                    renderPage(i);
                  }
                }, 500);
              }
            } catch (error) {
              console.error('Error loading PDF:', error);
              container.innerHTML = '<div class="error-message">Could not load PDF document. Error: ' + error.message + '</div>';
            }
          }
          
          prevButton.addEventListener('click', function() {
            if (currentPage > 1) {
              renderPage(currentPage - 1);
            }
          });
          
          nextButton.addEventListener('click', function() {
            if (currentPage < pageCount) {
              renderPage(currentPage + 1);
            }
          });
          
          zoomInButton.addEventListener('click', function() { zoom(0.2); });
          zoomOutButton.addEventListener('click', function() { zoom(-0.2); });
          
          function makeTouchable(element) {
            element.addEventListener('touchstart', function(e) {
              e.target.click();
              e.preventDefault();
              e.stopPropagation();
            }, false);
          }
          
          makeTouchable(prevButton);
          makeTouchable(nextButton);
          makeTouchable(zoomInButton);
          makeTouchable(zoomOutButton);
          makeTouchable(closeBtn);
          
          loadPDF();
        </script>
      </body>
      </html>
    `;
  };
  
  const openQuotationFile = () => {
    const pdfPath = quotation?.filePath || quotation?.quotationFilePath;
    
    if (!quotation || !pdfPath) {
      Alert.alert("Error", "No document available for this quotation");
      return;
    }
    
    setShowPdfModal(true);
    setPdfLoading(true);
  };
  
  const handleConfirmQuotation = async (): Promise<void> => {
    if (!quotation) return;
      
    Alert.alert(
      'Accept Quotation',
      'Are you sure you want to accept this quotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setLoading(true);
              console.log(`Attempting to accept quotation: ${quotation.quotationCode}`);
              
              const result = await confirmQuotationAPI(quotation.quotationCode);
              console.log(`Accept result:`, result);
              
              Alert.alert('Success', 'Quotation accepted successfully');
              fetchQuotationDetails();
              
            } catch (err: any) {
              console.error('Error accepting quotation:', err);
              Alert.alert('Success', 'Quotation accepted successfully');
              fetchQuotationDetails();
              
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const renderHeader = (): React.ReactElement => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Quotation Details</Text>
      <View style={styles.spacer} />
    </View>
  );

  const renderLoadingState = (): React.ReactElement => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {renderHeader()}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={QUOTATION_COLOR} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading quotation details...
        </Text>
      </View>
    </SafeAreaView>
  );

  const renderErrorState = (): React.ReactElement => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {renderHeader()}
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#ff3b30" />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {error || 'Quotation not found'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchQuotationDetails()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderPdfModal = (): React.ReactElement => (
    <Modal
      visible={showPdfModal}
      animationType="slide"
      onRequestClose={() => setShowPdfModal(false)}
      statusBarTranslucent={true}
    >
      <View style={{flex: 1, backgroundColor: colors.background}}>
        <View style={styles.webViewContainer}>
          {pdfLoading && (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={QUOTATION_COLOR} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading document...
              </Text>
            </View>
          )}
          
          {quotation && (quotation.filePath || quotation.quotationFilePath) && (
            <WebView
              originWhitelist={['*']}
              source={{ 
                html: createPdfHtml(quotation.filePath || quotation.quotationFilePath || '') 
              }}
              style={styles.webView}
              onLoadStart={() => setPdfLoading(true)}
              onLoadEnd={() => setPdfLoading(false)}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              onMessage={(event) => {
                if (event.nativeEvent.data === 'close_modal') {
                  setShowPdfModal(false);
                }
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
  
  // Image preview modal
  const renderImageModal = (): React.ReactElement => (
    <Modal
      visible={selectedImage !== null}
      transparent={true}
      animationType="fade"
      onRequestClose={closeImagePreview}
      statusBarTranslucent={true}
    >
      <View style={styles.imageModalContainer}>
        <TouchableOpacity
          style={styles.closeModalButton}
          onPress={closeImagePreview}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        {imageLoading && (
          <ActivityIndicator 
            size="large" 
            color={QUOTATION_COLOR} 
            style={{ position: 'absolute' }} 
          />
        )}
        
        {selectedImage && (
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullImage}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
        )}
      </View>
    </Modal>
  );

  // Handle different view
  if (loading) {
    return renderLoadingState();
  }

  if (error || !quotation) {
    return renderErrorState();
  }

  const statusColor = getStatusColor(quotation.status);
  const statusText = mapStatusCodeToString(quotation.status);
  const totalCost = quotation.totalCost || 
                   ((quotation.materialCost || 0) + 
                    (quotation.constructionCost || 0) + 
                    (quotation.productCost || 0));
  const depositAmount = totalCost * (quotation.depositPercentage / 100);
  const canConfirm = canQuotationBeConfirmed(quotation.status);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {renderHeader()}
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[QUOTATION_COLOR]} // Android
            tintColor={QUOTATION_COLOR} // iOS
            title="Pull to refresh"
            titleColor={colors.textSecondary}
          />
        }
      >
        {/* Quotation header section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.quotationHeader}>
            <Text style={[styles.quotationCode, { color: colors.text }]}>
              {quotation.quotationCode}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Ionicons
                name={getStatusIcon(quotation.status)}
                size={14}
                color={statusColor}
                style={styles.statusIcon}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>

          <View style={styles.providerInfoContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={20} color={QUOTATION_COLOR} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Provider:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {quotation.provider.businessName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="color-palette-outline" size={20} color={QUOTATION_COLOR} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Style:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {quotation.style}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color={QUOTATION_COLOR} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Created:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDateWithTextMonth(quotation.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Price summary section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Summary</Text>
          
          <View style={styles.costSummaryContainer}>
            {/* Material Cost */}
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Material Cost:</Text>
              <Text style={[styles.costValue, { color: colors.text }]}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quotation.materialCost || 0)}
              </Text>
            </View>

            {/* Construction Cost */}
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Construction Cost:</Text>
              <Text style={[styles.costValue, { color: colors.text }]}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quotation.constructionCost || 0)}
              </Text>
            </View>

            {/* Product Cost - Show only if there are products */}
            {quotation.productCost > 0 && (
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Product Cost:</Text>
                <Text style={[styles.costValue, { color: colors.text }]}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quotation.productCost || 0)}
                </Text>
              </View>
            )}

            {/* Divider line before total */}
            <View style={[styles.costDivider, { backgroundColor: colors.border }]} />

            {/* Total Cost */}
            <View style={styles.totalCostRow}>
              <Text style={[styles.totalCostLabel, { color: colors.text }]}>Total Cost:</Text>
              <Text style={[styles.totalCostValue, { color: colors.primary }]}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  (quotation.materialCost || 0) + 
                  (quotation.constructionCost || 0) + 
                  (quotation.productCost || 0)
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Materials section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Materials</Text>
          
          {quotation.materialDetails && quotation.materialDetails.length > 0 ? (
            <>
              {/* Table header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.materialNameColumn, { color: colors.textSecondary }]}>
                  MATERIAL NAME
                </Text>
                <Text style={[styles.tableHeaderText, styles.quantityColumn, { color: colors.textSecondary }]}>
                  QUANTITY
                </Text>
                <Text style={[styles.tableHeaderText, styles.costColumn, { color: colors.textSecondary }]}>
                  COST
                </Text>
                <Text style={[styles.tableHeaderText, styles.totalCostColumn, { color: colors.textSecondary }]}>
                  TOTAL COST
                </Text>
              </View>

              {/* Table rows */}
              {quotation.materialDetails.map((material, index) => (
                <View 
                  key={`material-${material.id || index}`} 
                  style={[
                    styles.tableRow,
                    index === quotation.materialDetails.length - 1 ? {} : 
                    { borderBottomWidth: 1, borderBottomColor: colors.border }
                  ]}
                >
                  <Text style={[styles.tableCell, styles.materialNameColumn, { color: colors.text }]}>
                    {material.materialName}
                  </Text>
                  <Text style={[styles.tableCell, styles.quantityColumn, { color: colors.text }]}>
                    {material.quantity}
                  </Text>
                  <Text style={[styles.tableCell, styles.costColumn, { color: colors.text }]}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(material.cost)}
                  </Text>
                  <Text style={[styles.tableCell, styles.totalCostColumn, { color: colors.text }]}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(material.totalCost)}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No materials listed for this quotation
            </Text>
          )}
        </View>

        {/* Construction Tasks section (Labour) - Updated with Area column */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Labour Tasks</Text>
          
          {quotation.constructionDetails && quotation.constructionDetails.length > 0 ? (
            <>
              {/* Updated Table header with Area column */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.taskNameColumn, { color: colors.textSecondary }]}>
                  TASK NAME
                </Text>
                <Text style={[styles.tableHeaderText, styles.areaColumn, { color: colors.textSecondary }]}>
                  AREA
                </Text>
                <Text style={[styles.tableHeaderText, styles.unitColumn, { color: colors.textSecondary }]}>
                  UNIT
                </Text>
                <Text style={[styles.tableHeaderText, styles.taskCostColumn, { color: colors.textSecondary }]}>
                  COST
                </Text>
              </View>

              {/* Updated Table rows with Area column */}
              {quotation.constructionDetails.map((task, index) => (
                <View 
                  key={`task-${task.id || index}`} 
                  style={[
                    styles.tableRow,
                    index === quotation.constructionDetails.length - 1 ? {} : 
                    { borderBottomWidth: 1, borderBottomColor: colors.border }
                  ]}
                >
                  <Text style={[styles.tableCell, styles.taskNameColumn, { color: colors.text }]}>
                    {task.taskName}
                  </Text>
                  <Text style={[styles.tableCell, styles.areaColumn, { color: colors.text }]}>
                    {task.area || 0}
                  </Text>
                  <Text style={[styles.tableCell, styles.unitColumn, { color: colors.text }]}>
                    {task.unit}
                  </Text>
                  <Text style={[styles.tableCell, styles.taskCostColumn, { color: colors.text }]}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(task.cost)}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No construction tasks listed for this quotation
            </Text>
          )}
        </View>

        {/* Compact Products section */}
        {quotation.productDetails && quotation.productDetails.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Products</Text>
              <Text style={[styles.productsTotalAmount, { color: colors.text }]}>
                Total: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quotation.productCost || 0)}
              </Text>
            </View>
            
            {quotation.productDetails.map((product, index) => (
              <View 
                key={`product-${product.productId || index}`} 
                style={[
                  styles.compactProductItem, 
                  index === quotation.productDetails.length - 1 ? {} : { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
              >
                <View style={styles.compactProductRow}>
                  {/* Product image (if available) */}
                  {product.image ? (
                    <TouchableOpacity 
                      activeOpacity={0.7}
                      onPress={() => handleImagePreview(product.image)}
                      style={styles.compactImageContainer}
                    >
                      <Image 
                        source={{ uri: product.image }}
                        style={styles.compactProductImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.compactImagePlaceholder}>
                      <Ionicons name="image-outline" size={18} color={colors.textSecondary} />
                    </View>
                  )}
                  
                  {/* Product number and name */}
                  <View style={styles.compactProductInfo}>
                    <Text style={[styles.compactProductNumber, { color: colors.textSecondary }]}>
                      {index + 1}
                    </Text>
                    <Text style={[styles.compactProductName, { color: colors.text }]} numberOfLines={1}>
                      {product.productName}
                    </Text>
                    <Text style={[styles.compactProductQuantity, { color: colors.textSecondary }]}>
                      Quantity: {product.quantity}
                    </Text>
                  </View>
                  
                  {/* Product price */}
                  <View style={styles.compactPriceColumn}>
                    <Text style={[styles.compactPriceLabel, { color: colors.textSecondary }]}>
                      Unit Price:
                    </Text>
                    <Text style={[styles.compactPrice, { color: colors.text }]}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.unitPrice)}
                    </Text>
                    <Text style={[styles.compactPriceLabel, { color: colors.textSecondary, marginTop: 4 }]}>
                      Total:
                    </Text>
                    <Text style={[styles.compactPriceTotal, { color: colors.text }]}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.totalPrice)}
                    </Text>
                  </View>
                  
                  {/* Delete button */}
                  {/* <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleRemoveProduct(product.productId)}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                  </TouchableOpacity> */}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quotation file button */}
        {(quotation.filePath || quotation.quotationFilePath) ? (
          <TouchableOpacity 
            style={[styles.fileButton, { backgroundColor: colors.card }]}
            onPress={openQuotationFile}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text" size={24} color={QUOTATION_COLOR} />
            <Text style={[styles.fileButtonText, { color: colors.text }]}>
              View Quotation Document
            </Text>
            <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.noFileContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.noFileText, { color: colors.textSecondary }]}>
              No quotation document available
            </Text>
          </View>
        )}

        {/* Rejection Reason Modal */}
        <QuotationRejectScreen
          visible={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          quotationCode={quotation?.quotationCode || ''}
          onSuccess={fetchQuotationDetails}
        />
          
        {canConfirm && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleConfirmQuotation}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleRejectQuotation}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact Provider */}
        <TouchableOpacity 
          style={[styles.contactButton, { backgroundColor: colors.card }]}
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert(
              "Contact Provider",
              "Would you like to contact the provider?",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                { 
                  text: "Message", 
                  onPress: () => {
                    router.push({
                      pathname: "/chat",
                      params: { providerId: quotation.provider.id.toString() }
                    });
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="chatbox-ellipses" size={24} color={QUOTATION_COLOR} />
          <Text style={[styles.contactButtonText, { color: colors.text }]}>
            Contact Provider
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Additional Info */}
        <View style={[styles.infoContainer, { backgroundColor: `${QUOTATION_COLOR}15` }]}>
          <Ionicons name="information-circle" size={24} color={QUOTATION_COLOR} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            This quotation is valid for 30 days from the creation date. Please contact the provider if you have any questions or need modifications.
          </Text>
        </View>

        {/* {quotation && quotation.status !== 1 && (
          <ProductCatalog
            quotationCode={quotation.quotationCode}
            onProductAdded={fetchQuotationDetails}
          />
        )} */}

        <View style={styles.bottomSpace} />
        
      </ScrollView>

      {/* PDF Viewer Modal */}
      {renderPdfModal()}
      
      {/* Image Viewer Modal */}
      {renderImageModal()}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  scrollContent: {
    padding: 15,
  },
  section: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  quotationCode: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  providerInfoContainer: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    marginLeft: 8,
    fontSize: 14,
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  costLabel: {
    fontSize: 14,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  itemContainer: {
    marginBottom: 12,
    paddingBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    marginLeft: 8,
  },
  itemCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemUnitCost: {
    fontSize: 12,
  },
  itemTotalCost: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  fileButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 10,
  },
  noFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    opacity: 0.7,
  },
  noFileText: {
    fontSize: 16,
    marginLeft: 10,
  },
  confirmButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: QUOTATION_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  // PDF Modal styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  modalActionButton: {
    padding: 8,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  webViewError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  webViewErrorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
  },
  webViewErrorButton: {
    backgroundColor: QUOTATION_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  webViewErrorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  // Payment Information styles
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentInfoLabel: {
    marginLeft: 8,
    fontSize: 14,
    width: 110,
  },
  paymentInfoValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  paymentInstructions: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Contact button styles
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 10,
  },
  
  // Info container styles
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    marginLeft: 10,
  },
  
  // Image preview modal styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
    resizeMode: 'contain',
  },
  closeModalButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  compactProductItem: {
    paddingVertical: 10,
    marginBottom: 5,
  },
  compactProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactImageContainer: {
    marginRight: 10,
  },
  compactProductImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  compactImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  compactProductInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  compactProductNumber: {
    fontSize: 12,
    marginBottom: 2,
  },
  compactProductName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactProductQuantity: {
    fontSize: 12,
  },
  compactPriceColumn: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  compactPriceLabel: {
    fontSize: 10,
  },
  compactPrice: {
    fontSize: 12,
  },
  compactPriceTotal: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productsTotalAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 15,
  },
  rejectReasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    marginRight: 8,
  },
  confirmRejectButton: {
    backgroundColor: '#ff3b30',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmRejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  costSummaryContainer: {
    paddingTop: 10,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  costDivider: {
    height: 1,
    marginVertical: 12,
  },
  totalCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalCostValue: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  
  // Table styles
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableCell: {
    fontSize: 14,
  },
  
  // Column widths for Materials table
  materialNameColumn: {
    flex: 3,
    paddingRight: 8,
  },
  quantityColumn: {
    flex: 1,
    textAlign: 'center',
  },
  costColumn: {
    flex: 2,
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  totalCostColumn: {
    flex: 2,
    textAlign: 'right',
  },
  
  // Updated Column widths for Labour Tasks table with Area
  taskNameColumn: {
    flex: 2.5, // Reduced to make room for area
    paddingRight: 8,
  },
  areaColumn: {
    flex: 1,
    textAlign: 'center',
  },
  unitColumn: {
    flex: 1,
    textAlign: 'center',
  },
  taskCostColumn: {
    flex: 1.5,
    textAlign: 'right',
  },
});

export default QuotationDetailScreen;