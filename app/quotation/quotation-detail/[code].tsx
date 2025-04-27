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
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { getQuotationDetailByCustomerAPI, confirmQuotationAPI } from '@/utils/quotationsAPI';
import { WebView } from 'react-native-webview';

const PRIMARY_COLOR = "#5fc1f1";
const QUOTATION_COLOR = "#34c759"; // Green color for quotation elements

// Updated interface to match the actual API response
interface IQuotationDetail {
  id: number;
  quotationCode: string;
  provider: {
    id: number;
    businessName: string;
    avatar: string;
    isProvider: boolean;
    providerVerified: boolean;
    providerStatus: number;
    followersCount: number;
    followingsCount: number;
  };
  style: string;
  materialCost: number;
  constructionCost: number;
  depositPercentage: number;
  isQuoteExisted: boolean;
  isContractExisted: boolean;
  isSigned: boolean;
  createdAt: string;
  status: number;
  quotationFilePath: string;
  materials: Array<{
    id: number;
    materialName: string;
    quantity: number;
    cost: number;
    totalCost: number;
  }>;
  constructionTasks: Array<{
    id: number;
    taskName: string;
    cost: number;
    unit: string;
    area: number;
  }>;
  totalCost: number;
  bookingId: number;
}

// Status mapping utilities
const mapStatusCodeToString = (statusCode: number): string => {
  const statusMap: Record<number, string> = {
    0: 'Pending',     // Pending quotation
    1: 'Confirmed',   // Customer agreed to quotation
    2: 'Denied'       // Customer rejected quotation
  };
  
  return statusMap[statusCode] || 'Unknown';
};

const getStatusColor = (statusCode: number): string => {
  switch (statusCode) {
    case 0: // Pending
      return '#ff9500'; // Orange
    case 1: // Confirmed
      return '#4caf50'; // Green
    case 2: // Denied
      return '#ff3b30'; // Red
    default:
      return '#8e8e93'; // Gray
  }
};

const getStatusIcon = (statusCode: number): string => {
  switch (statusCode) {
    case 0: // Pending
      return 'time-outline';
    case 1: // Confirmed
      return 'checkmark-circle-outline';
    case 2: // Denied
      return 'close-circle-outline';
    default:
      return 'help-circle-outline';
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
  const [error, setError] = useState<string>('');
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [pdfLoading, setPdfLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchQuotationDetails();
  }, [quotationCode]);

  const fetchQuotationDetails = async () => {
    if (!quotationCode) {
      setError('Quotation code is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('📘 Fetching quotation details for:', quotationCode);
      const response = await getQuotationDetailByCustomerAPI(quotationCode);
      
      // The API returns the data directly, not wrapped in a success/data structure
      if (response && response.quotationCode) {
        console.log('📘 Found quotation data in response');
        setQuotation(response);
      } else {
        console.log('📘 No usable data found, setting error');
        setError('Failed to load quotation details');
      }
    } catch (err: any) {
      console.error('❌ Error fetching quotation details:', err);
      setError('Failed to load quotation details. Please try again.');
    } finally {
      setLoading(false);
    }
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
            padding-top: 70px;  /* Space for the fixed header */
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
          // Initialize PDF.js worker
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
          
          // Show loading indicator
          const loadingDiv = document.createElement('div');
          loadingDiv.className = 'loading';
          loadingDiv.innerHTML = 'Loading document...';
          container.appendChild(loadingDiv);
          
          // Add close button functionality
          closeBtn.addEventListener('click', function() {
            // Send message to React Native to close modal
            window.ReactNativeWebView.postMessage('close_modal');
          });
          
          // Function to render a PDF page
          async function renderPage(pageNumber) {
            if (!pdf) return;
            
            // Hide current page if it exists
            const existingPage = document.getElementById('page-' + currentPage);
            if (existingPage) {
              existingPage.style.display = 'none';
            }
            
            // Check if page has already been rendered
            let pageDiv = document.getElementById('page-' + pageNumber);
            if (!pageDiv) {
              try {
                // Get page info
                const page = await pdf.getPage(pageNumber);
                
                // Calculate size to fit screen
                const viewport = page.getViewport({ scale });
                
                // Create page div
                pageDiv = document.createElement('div');
                pageDiv.className = 'page';
                pageDiv.id = 'page-' + pageNumber;
                container.appendChild(pageDiv);
                
                // Create canvas for page rendering
                const canvas = document.createElement('canvas');
                pageDiv.appendChild(canvas);
                
                // Set canvas size
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Render page
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
            
            // Update current page
            currentPage = pageNumber;
            pageNumSpan.textContent = currentPage;
            
            // Update button states
            prevButton.disabled = currentPage <= 1;
            nextButton.disabled = currentPage >= pageCount;
            
            // Scroll to current page
            pageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          
          // Function to zoom the page
          function zoom(delta) {
            scale += delta;
            scale = Math.max(0.5, Math.min(3, scale)); // Limit zoom range
            
            // Remove all rendered pages
            for (let i = 1; i <= pageCount; i++) {
              const pageDiv = document.getElementById('page-' + i);
              if (pageDiv) {
                container.removeChild(pageDiv);
              }
            }
            
            // Re-render current page with new scale
            renderPage(currentPage);
          }
          
          // Load and display PDF
          async function loadPDF() {
            try {
              // Load PDF document
              pdf = await pdfjsLib.getDocument(pdfUrl).promise;
              pageCount = pdf.numPages;
              
              // Show controls
              controls.style.display = 'flex';
              
              // Remove loading indicator
              container.removeChild(loadingDiv);
              
              // Render first page
              await renderPage(1);
              
              // If multiple pages, preload next pages
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
          
          // Register event handlers
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
          
          // Make buttons more responsive on mobile
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
          
          // Start loading PDF
          loadPDF();
        </script>
      </body>
      </html>
    `;
  };
  
  const openQuotationFile = () => {
    if (!quotation || !quotation.quotationFilePath) return;
    setShowPdfModal(true);
    setPdfLoading(true);
  };
  
  const handleConfirmQuotation = async (): Promise<void> => {
    if (!quotation) return;

    Alert.alert(
      'Confirm Quotation',
      'Are you sure you want to confirm this quotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await confirmQuotationAPI(quotation.quotationCode);
              
              if (result && result.success) {
                Alert.alert('Success', 'Quotation confirmed successfully');
                fetchQuotationDetails();
              } else {
                Alert.alert('Error', (result && result.message) || 'Failed to confirm quotation');
              }
            } catch (err: any) {
              console.error('Error confirming quotation:', err);
              Alert.alert('Error', err.message || 'Failed to confirm quotation. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleExternalOpen = async () => {
    if (!quotation || !quotation.quotationFilePath) return;
    
    try {
      const supported = await Linking.canOpenURL(quotation.quotationFilePath);
      
      if (supported) {
        await Linking.openURL(quotation.quotationFilePath);
      } else {
        Alert.alert('Error', 'Cannot open the quotation file');
      }
    } catch (error) {
      console.error('Error opening quotation file:', error);
      Alert.alert('Error', 'Failed to open quotation file');
    }
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
          onPress={fetchQuotationDetails}
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
          
          {quotation && quotation.quotationFilePath && (
            <WebView
              originWhitelist={['*']}
              source={{ html: createPdfHtml(quotation.quotationFilePath) }}
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

  // Handle different view states
  if (loading) {
    return renderLoadingState();
  }

  if (error || !quotation) {
    return renderErrorState();
  }

  const statusColor = getStatusColor(quotation.status);
  const statusText = mapStatusCodeToString(quotation.status);
  const depositAmount = quotation.totalCost * (quotation.depositPercentage / 100);
  const canConfirm = canQuotationBeConfirmed(quotation.status);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {renderHeader()}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quotation header section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.quotationHeader}>
            <Text style={[styles.quotationCode, { color: colors.text }]}>
              {quotation.quotationCode}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Ionicons
                name={quotation.status === 3 ? "checkmark-circle-outline" : 
                       quotation.status === 4 ? "close-circle-outline" : 
                       "document-text-outline"}
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
                {new Date(quotation.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Price summary section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Summary</Text>
          
          <View style={styles.costRow}>
            <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Material Cost:</Text>
            <Text style={[styles.costValue, { color: colors.text }]}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quotation.materialCost)}
            </Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Construction Cost:</Text>
            <Text style={[styles.costValue, { color: colors.text }]}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quotation.constructionCost)}
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.costRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total:</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quotation.totalCost)}
            </Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Deposit ({quotation.depositPercentage}%):</Text>
            <Text style={[styles.costValue, { color: colors.text }]}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(depositAmount)}
            </Text>
          </View>
        </View>

        {/* Materials section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Materials</Text>
          
          {quotation.materials.length > 0 ? (
            quotation.materials.map((material, index) => (
              <View 
                key={`material-${material.id || index}`} 
                style={[
                  styles.itemContainer, 
                  index === quotation.materials.length - 1 ? {} : { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
              >
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {material.materialName}
                  </Text>
                  <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
                    x{material.quantity}
                  </Text>
                </View>
                
                <View style={styles.itemCostContainer}>
                  <Text style={[styles.itemUnitCost, { color: colors.textSecondary }]}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(material.cost)} each
                  </Text>
                  <Text style={[styles.itemTotalCost, { color: colors.text }]}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(material.totalCost)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No materials listed for this quotation
            </Text>
          )}
        </View>

        {/* Construction details section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Construction Tasks</Text>
          
          {quotation.constructionTasks.length > 0 ? (
            quotation.constructionTasks.map((task, index) => (
              <View 
                key={`task-${task.id || index}`}
                style={[
                  styles.itemContainer, 
                  index === quotation.constructionTasks.length - 1 ? {} : { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
              >
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {task.taskName}
                  </Text>
                  <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
                    {task.area} {task.unit}
                  </Text>
                </View>
                
                <View style={styles.itemCostContainer}>
                  <Text style={[styles.itemTotalCost, { color: colors.text }]}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(task.cost)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No construction tasks listed for this quotation
            </Text>
          )}
        </View>

        {/* Quotation file button */}
        {quotation.quotationFilePath ? (
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

        {/* Action buttons */}
        {canConfirm && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmQuotation}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Confirm Quotation</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* PDF Viewer Modal */}
      {renderPdfModal()}
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
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
});

export default QuotationDetailScreen;