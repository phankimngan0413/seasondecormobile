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
  Platform,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { getContractFileAPI, requestSignatureAPI } from '@/utils/contractAPI';
import { WebView } from 'react-native-webview';
import ContractCancellation from '@/components/ContractCancellation';

const CONTRACT_COLOR = "#4caf50"; // Green color for contract elements

// Interface matching the API response
interface IContractDetail {
  contractCode: string;
  quotationCode: string;
  status: number;
  isSigned: boolean;
  isDeposited: boolean;
  isFinalPaid: boolean;
  isTerminatable: boolean;
  fileUrl: string;
  bookingCode: string;
  note?: string;
  surveyDate: string;
  constructionDate: string;
  signedDate: string;
  cancelDate?: string;
  completeDate?: string;
  totalPrice: number;
  depositAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  businessName: string;
  providerName: string;
  providerEmail: string;
  providerPhone: string;
}

// Status mapping utilities
const mapStatusCodeToString = (statusCode: number): string => {
  const statusMap: Record<number, string> = {
    0: 'Pending',
    1: 'Signed',
    2: 'Cancelled'
  };
  return statusMap[statusCode] || 'Unknown';
};

const getStatusColor = (statusCode: number): string => {
  switch (statusCode) {
    case 0: return '#ff9500'; // Orange
    case 1: return '#4caf50'; // Green
    case 2: return '#ff3b30'; // Red
    default: return '#8e8e93'; // Gray
  }
};

const getStatusIcon = (statusCode: number): string => {
  switch (statusCode) {
    case 0: return 'time-outline';
    case 1: return 'checkmark-circle-outline';
    case 2: return 'close-circle-outline';
    default: return 'help-circle-outline';
  }
};

const ContractScreen: React.FC = () => {
  // ==================== HOOKS & STATE ====================
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();
  const { code } = useLocalSearchParams();
  const quotationCode = Array.isArray(code) ? code[0] : code;

  const [contract, setContract] = useState<IContractDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [pdfLoading, setPdfLoading] = useState<boolean>(true);
  const [showCancellationModal, setShowCancellationModal] = useState<boolean>(false);

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchContractDetails();
  }, [quotationCode]);

  // ==================== API FUNCTIONS ====================
  const fetchContractDetails = async () => {
    if (!quotationCode) {
      setError('Quotation code is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await getContractFileAPI(quotationCode);
      
      if (response && response.success && response.data) {
        setContract(response.data);
      } else {
        setError(response.message || 'Failed to load contract details');
      }
    } catch (err: any) {
      console.error('❌ Error fetching contract details:', err);
      setError('Failed to load contract details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
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

  const openEmailApp = async (emailAddress = '') => {
    try {
      const emailApps = [
        `mailto:${emailAddress}`,
        'content://com.android.email.provider',
        'content://gmail.provider',
        'googlegmail://',
        'com.google.android.gm:/',
        'message://',
        'readdle-spark://',
        'airmail://',
        'ms-outlook://',
        'ymail://',
        'googlemail://',
        'https://mail.google.com',
        'https://outlook.live.com'
      ];
      
      for (const app of emailApps) {
        try {
          const canOpen = await Linking.canOpenURL(app);
          if (canOpen) {
            console.log(`Opening email app with URI: ${app}`);
            await Linking.openURL(app);
            return true;
          }
        } catch (err) {
          console.log(`Failed to open ${app}`);
        }
      }
      
      Alert.alert(
        'Email App Not Found',
        'Please manually check your email inbox to verify your signature.',
        [{ text: 'OK' }]
      );
      return false;
      
    } catch (error) {
      console.error('Error opening email app:', error);
      Alert.alert(
        'Email App Not Available',
        'Please open your email app manually and check for our verification message.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  // ==================== ACTION HANDLERS ====================
  const handleSignContract = async () => {
    if (!contract || !contract.contractCode) return;
    
    Alert.alert(
      'Sign Contract',
      'Are you sure you want to sign this contract?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('Requesting signature for contract:', contract.contractCode);
              const result = await requestSignatureAPI(contract.contractCode);
              console.log('Signature request result:', result);
              
              setLoading(false);
              showEmailCheckAlert(contract.customerEmail);
              
            } catch (error) {
              setLoading(false);
              showEmailCheckAlert(contract.customerEmail);
              console.error('Error signing contract:', error);
            }
          }
        }
      ]
    );
  };

  const showEmailCheckAlert = (customerEmail: string) => {
    Alert.alert(
      'Check Your Email',
      'We\'ve sent a signature verification link to your email. Please open your email app and click the "Confirm Your Signature" button.',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Open Email App',
          style: 'default',
          onPress: async () => {
            const opened = await openEmailApp(customerEmail);
            if (!opened) {
              console.log('Could not open email app, showing fallback message');
            }
          }
        }
      ],
      { cancelable: false }
    );
  };

  const handleMakeDeposit = () => {
    if (!contract || !contract.contractCode || !contract.bookingCode) return;
    
    console.log('📘 Navigating to deposit payment screen for booking:', contract.bookingCode);
    
    router.push({
      pathname: '/booking/deposit-payment',
      params: { 
        contractCode: contract.contractCode,
        bookingCode: contract.bookingCode 
      }
    });
  };

  const handleCancellationSuccess = () => {
    setShowCancellationModal(false);
    fetchContractDetails(); // Refresh contract details to get updated status
    Alert.alert('Success', 'Contract has been cancelled successfully!');
  };

  // ==================== PDF FUNCTIONS ====================
  const openContractFile = () => {
    if (!contract || !contract.fileUrl) return;
    setShowPdfModal(true);
    setPdfLoading(true);
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
          <div class="header-title">Contract Document</div>
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

  // ==================== RENDER FUNCTIONS ====================
  const renderHeader = (): React.ReactElement => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Contract Details</Text>
      <View style={styles.spacer} />
    </View>
  );

  const renderLoadingState = (): React.ReactElement => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {renderHeader()}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CONTRACT_COLOR} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading contract details...
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
          {error || 'Contract not found'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchContractDetails}>
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
              <ActivityIndicator size="large" color={CONTRACT_COLOR} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading document...
              </Text>
            </View>
          )}
          
          {contract && contract.fileUrl && (
            <WebView
              originWhitelist={['*']}
              source={{ html: createPdfHtml(contract.fileUrl) }}
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

  const renderActionButtons = (): React.ReactElement | null => {
    if (!contract) return null;

    // Contract chưa ký (Pending)
    if (contract.status === 0) {
      return (
        <TouchableOpacity style={styles.signButton} onPress={handleSignContract}>
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          <Text style={styles.signButtonText}>Sign Contract</Text>
        </TouchableOpacity>
      );
    }

    // Contract đã ký (Signed)
    if (contract.status === 1) {
      return (
        <View style={styles.actionButtonsContainer}>
          {/* Pay Deposit button (chỉ hiển thị khi chưa deposit) */}
          {!contract.isDeposited && (
            <TouchableOpacity
              style={[styles.actionButton, styles.depositButton]}
              onPress={handleMakeDeposit}
            >
              <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Pay Deposit</Text>
            </TouchableOpacity>
          )}
          
         
        </View>
      );
    }

    return null;
  };

  // ==================== MAIN RENDER ====================
  if (loading) return renderLoadingState();
  if (error || !contract) return renderErrorState();

  const statusColor = getStatusColor(contract.status);
  const statusText = mapStatusCodeToString(contract.status);
  const formattedSurveyDate = formatDateWithTextMonth(contract.surveyDate);
  const formattedConstructionDate = formatDateWithTextMonth(contract.constructionDate);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {renderHeader()}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contract Header Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.contractHeader}>
            <Text style={[styles.contractCode, { color: colors.text }]}>
              {contract.contractCode}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Ionicons 
                name={getStatusIcon(contract.status) as keyof typeof Ionicons.glyphMap} 
                size={14} 
                color={statusColor} 
                style={styles.statusIcon} 
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={20} color={CONTRACT_COLOR} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Provider:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {contract.businessName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={20} color={CONTRACT_COLOR} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Quotation:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {contract.quotationCode}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color={CONTRACT_COLOR} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Booking:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {contract.bookingCode}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={20} color={CONTRACT_COLOR} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Price:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.totalPrice)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="wallet-outline" size={20} color={CONTRACT_COLOR} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Deposit:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.depositAmount)}
              </Text>
            </View>

            {contract.signedDate && (
              <View style={styles.detailRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color={CONTRACT_COLOR} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Signed:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDateWithTextMonth(contract.signedDate)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Important Dates Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Important Dates</Text>
          
          <View style={styles.dateRow}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={24} color={CONTRACT_COLOR} />
              <View style={styles.dateTextContainer}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Survey Date</Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>{formattedSurveyDate}</Text>
              </View>
            </View>
            
            <View style={styles.dateContainer}>
              <Ionicons name="construct-outline" size={24} color={CONTRACT_COLOR} />
              <View style={styles.dateTextContainer}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Construction Date</Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>{formattedConstructionDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contract Parties Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contract Parties</Text>
          
          {/* Customer Information */}
          <View style={styles.partySection}>
            <Text style={[styles.partyTitle, { color: colors.text }]}>Customer</Text>
            <View style={styles.partyDetail}>
              <Ionicons name="person-outline" size={18} color={CONTRACT_COLOR} />
              <Text style={[styles.partyLabel, { color: colors.textSecondary }]}>Name:</Text>
              <Text style={[styles.partyValue, { color: colors.text }]}>{contract.customerName}</Text>
            </View>
            <View style={styles.partyDetail}>
              <Ionicons name="mail-outline" size={18} color={CONTRACT_COLOR} />
              <Text style={[styles.partyLabel, { color: colors.textSecondary }]}>Email:</Text>
              <Text style={[styles.partyValue, { color: colors.text }]}>{contract.customerEmail}</Text>
            </View>
            <View style={styles.partyDetail}>
              <Ionicons name="call-outline" size={18} color={CONTRACT_COLOR} />
              <Text style={[styles.partyLabel, { color: colors.textSecondary }]}>Phone:</Text>
              <Text style={[styles.partyValue, { color: colors.text }]}>{contract.customerPhone}</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          {/* Provider Information */}
          <View style={styles.partySection}>
            <Text style={[styles.partyTitle, { color: colors.text }]}>Provider</Text>
            <View style={styles.partyDetail}>
              <Ionicons name="business-outline" size={18} color={CONTRACT_COLOR} />
              <Text style={[styles.partyLabel, { color: colors.textSecondary }]}>Business:</Text>
              <Text style={[styles.partyValue, { color: colors.text }]}>{contract.businessName}</Text>
            </View>
            <View style={styles.partyDetail}>
              <Ionicons name="person-outline" size={18} color={CONTRACT_COLOR} />
              <Text style={[styles.partyLabel, { color: colors.textSecondary }]}>Name:</Text>
              <Text style={[styles.partyValue, { color: colors.text }]}>{contract.providerName}</Text>
            </View>
            <View style={styles.partyDetail}>
              <Ionicons name="mail-outline" size={18} color={CONTRACT_COLOR} />
              <Text style={[styles.partyLabel, { color: colors.textSecondary }]}>Email:</Text>
              <Text style={[styles.partyValue, { color: colors.text }]}>{contract.providerEmail}</Text>
            </View>
            <View style={styles.partyDetail}>
              <Ionicons name="call-outline" size={18} color={CONTRACT_COLOR} />
              <Text style={[styles.partyLabel, { color: colors.textSecondary }]}>Phone:</Text>
              <Text style={[styles.partyValue, { color: colors.text }]}>{contract.providerPhone}</Text>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        {contract.note && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.noteText, { color: colors.text }]}>{contract.note}</Text>
          </View>
        )}

        {/* Contract File Section */}
        {contract.fileUrl ? (
          <TouchableOpacity 
            style={[styles.fileButton, { backgroundColor: colors.card }]}
            onPress={openContractFile}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text" size={24} color={CONTRACT_COLOR} />
            <Text style={[styles.fileButtonText, { color: colors.text }]}>
              View Contract Document
            </Text>
            <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.noFileContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.noFileText, { color: colors.textSecondary }]}>
              No contract document available
            </Text>
          </View>
        )}
        
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* PDF Viewer Modal */}
      {renderPdfModal()}

      {/* Action Buttons */}
      {renderActionButtons()}
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
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
  
  // Contract Header Styles
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  contractCode: {
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
  
  // Info Container Styles
  infoContainer: {
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
  
  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  
  // Date Styles
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  dateTextContainer: {
    marginLeft: 10,
  },
  dateLabel: {
    fontSize: 12,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  
  // Party Styles
  partySection: {
    marginBottom: 15,
  },
  partyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  partyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  partyLabel: {
    marginLeft: 8,
    fontSize: 14,
    width: 60,
  },
  partyValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  
  // Notes Styles
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // File Button Styles
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
  
  // Spacing
  bottomSpace: {
    height: 30,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  
  // Error States
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
    backgroundColor: CONTRACT_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // PDF Modal Styles
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
  
  // Action Button Styles
  signButton: {
    backgroundColor: CONTRACT_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  signButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  depositButton: {
    backgroundColor: '#5ac8fa', // Light blue
  },
  cancelButton: {
    backgroundColor: '#ff3b30', // Red
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Cancellation Screen Styles
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },

  noteSignature: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  noteImportant: {
    fontSize: 14,
    fontWeight: '600',
  },
  countdownLabel: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  countdownDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  timeUnit: {
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  timeLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  proceedMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  cancellationDetails: {
    marginTop: 8,
  },
  confirmationTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  confirmationInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  cancellationActionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 12,
  },
  cancelActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  cancelActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueActionButton: {
    backgroundColor: '#dc3545',
  },
  continueActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContractScreen;