import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  TextInput,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getPaginatedRelatedProductAPI, 
  addProductToServiceHolderAPI, 
  removeProductFromServiceHolderAPI,
  getAddedProductAPI
} from '@/utils/bookingAPI';

// Get screen dimensions for better layout calculations
const { width, height } = Dimensions.get('window');

interface Product {
  id: number;
  productId?: number; // For added products
  productName: string;
  productPrice?: number; // For available products
  unitPrice?: number; // For added products
  category?: string;
  imageUrls?: string[]; // For available products
  image?: string; // For added products
  status?: string;
  quantity?: number;
  rate?: number;
  totalSold?: number;
}

interface ProductCatalogProps {
  serviceId?: number;
  onAddProduct?: (productId: number, quantity: number) => void;
  onRemoveProduct?: (productId: number) => void;
}

interface SuccessNotificationProps {
  visible: boolean;
  message: string;
  details: string;
  onClose: () => void;
}

// Use the same color as quotation component for consistency
const PRODUCT_COLOR = "#34c759"; // Green color matching QUOTATION_COLOR
const LOADING_TIMEOUT = 10000; // 10 seconds timeout for API calls

// Custom success notification component
const SuccessNotification: React.FC<SuccessNotificationProps> = ({ 
  visible, 
  message, 
  details, 
  onClose 
}) => {
  if (!visible) return null;
  
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.notificationOverlay}>
        <View style={styles.notificationContainer}>
          <View style={styles.notificationHeader}>
            <Ionicons name="checkmark-circle" size={28} color="#34c759" />
            <Text style={styles.notificationTitle}>Success</Text>
          </View>
          
          <View style={styles.notificationContent}>
            <Text style={styles.notificationMessage}>{message}</Text>
            {details ? <Text style={styles.notificationDetails}>{details}</Text> : null}
          </View>
          
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={onClose}
          >
            <Text style={styles.notificationButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Main component
const ProductCatalog: React.FC<ProductCatalogProps> = ({ 
  serviceId,
  onAddProduct,
  onRemoveProduct
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [addedProducts, setAddedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'available' | 'added'>('available');
  
  // Success notification state
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [successDetails, setSuccessDetails] = useState<string>('');
  
  // Quantity selection modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<string>('1');
  
  // Use ref for scroll view to ensure it's scrollable to the bottom
  const scrollViewRef = useRef<ScrollView | null>(null);
  
  // Loading/request tracking
  const isLoadingRef = useRef<boolean>(false);
  const apiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (serviceId) {
      const timer = setTimeout(() => {
        fetchAllData();
      }, 300);
      
      return () => {
        clearTimeout(timer);
        if (apiTimeoutRef.current) {
          clearTimeout(apiTimeoutRef.current);
        }
      };
    }
  }, [serviceId]);
  
  // Function to fetch all data (both available and added products)
  const fetchAllData = async (refresh = false) => {
    await Promise.all([
      fetchProducts(refresh),
      fetchAddedProducts(refresh)
    ]);
  };
  
  // Function to fetch products
  const fetchProducts = async (refresh = false) => {
    if (isLoadingRef.current || !serviceId) return;
    
    isLoadingRef.current = true;
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    apiTimeoutRef.current = setTimeout(() => {
      if (isLoadingRef.current) {
        setError("Request timed out. Please try again.");
        setLoading(false);
        setRefreshing(false);
        isLoadingRef.current = false;
      }
    }, LOADING_TIMEOUT);
    
    try {
      console.log(`🔍 Fetching products for service: ${serviceId}`);
      const result = await getPaginatedRelatedProductAPI(serviceId, {
        pageSize: 20
        // Don't pass pageIndex to avoid negative offset error
      }); await getPaginatedRelatedProductAPI(serviceId, {
        pageSize: 20,
        pageIndex: 0
      });
      
      if (apiTimeoutRef.current) {
        clearTimeout(apiTimeoutRef.current);
        apiTimeoutRef.current = null;
      }
      
      if (!isLoadingRef.current) return;
      
      
      if (result && result.success !== false) {
        // Handle the specific API response structure
        if (result.data && Array.isArray(result.data)) {
          setProducts(result.data);
        } else if (Array.isArray(result)) {
          setProducts(result);
        } else if (result.items && Array.isArray(result.items)) {
          setProducts(result.items);
        } else {
          console.warn('⚠️ Unexpected data structure, setting empty array:', result);
          setProducts([]);
        }
      } else {
        setError(result?.message || "Failed to load products");
        setProducts([]);
      }
    } catch (err: any) {
      if (apiTimeoutRef.current) {
        clearTimeout(apiTimeoutRef.current);
        apiTimeoutRef.current = null;
      }
      
      console.error('🔴 Products fetch error:', err);
      setError(err.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingRef.current = false;
    }
  };
  
  // Function to fetch added products
  const fetchAddedProducts = async (refresh = false) => {
    if (!serviceId) return;
    
    try {
      console.log(`🔍 Fetching added products for service: ${serviceId}`);
      const result = await getAddedProductAPI(serviceId);
      
      
      if (result && result.success !== false) {
        if (Array.isArray(result)) {
          setAddedProducts(result);
        } else if (result.data && Array.isArray(result.data)) {
          setAddedProducts(result.data);
        } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
          setAddedProducts(result.data.data);
        } else if (result.items && Array.isArray(result.items)) {
          setAddedProducts(result.items);
        } else {
          console.warn('⚠️ Unexpected added products data structure:', result);
          setAddedProducts([]);
        }
      } else {
        console.warn('⚠️ Failed to load added products:', result?.message);
        setAddedProducts([]);
      }
    } catch (err: any) {
      console.error('🔴 Added products fetch error:', err);
      setAddedProducts([]);
    }
  };
  
  // Refresh all data
  const onRefresh = () => {
    fetchAllData(true);
  };
  
  // Open quantity selection modal
  const openQuantityModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity('1');
    setShowQuantityModal(true);
  };
  
  // Handle quantity change - validate numeric input
  const handleQuantityChange = (text: string) => {
    if (/^\d*$/.test(text)) {
      setQuantity(text);
    }
  };
  
  // Increment/decrement quantity
  const incrementQuantity = () => {
    const current = parseInt(quantity || '0');
    setQuantity((current + 1).toString());
  };
  
  const decrementQuantity = () => {
    const current = parseInt(quantity || '0');
    if (current > 1) {
      setQuantity((current - 1).toString());
    }
  };
  
  // Handle add product to service
  const handleAddProduct = async () => {
    if (!selectedProduct || !serviceId) return;
    
    setShowQuantityModal(false);
    const parsedQuantity = parseInt(quantity);
    
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }
    
    setAdding(selectedProduct.id);
    
    const addTimeout = setTimeout(() => {
      if (adding === selectedProduct.id) {
        setAdding(null);
        Alert.alert("Error", "Request timed out. Please try again.");
      }
    }, LOADING_TIMEOUT);
    
    try {
      const result = await addProductToServiceHolderAPI(serviceId, selectedProduct.id, parsedQuantity);
      
      
      if (result && result.success !== false) {
        // Format the success message
        const productName = selectedProduct.productName;
        let message = `Added ${parsedQuantity} ${productName}`;
        let details = '';
        
        const productPrice = selectedProduct.productPrice || selectedProduct.unitPrice;
        if (productPrice) {
          const totalCost = productPrice * parsedQuantity;
          const formattedCost = new Intl.NumberFormat('vi-VN', { 
            style: 'decimal', 
            maximumFractionDigits: 0 
          }).format(totalCost);
          details = `Total: ${formattedCost} đ`;
        }
        
        // Show custom success notification
        setSuccessMessage(message);
        setSuccessDetails(details);
        setShowSuccess(true);
        
        // Call parent callback
        if (onAddProduct) {
          onAddProduct(selectedProduct.id, parsedQuantity);
        }
        
        // Refresh both product lists
        fetchAllData();
      } else {
        Alert.alert("Error", result?.message || "Failed to add product to service");
      }
    } catch (error: any) {
      console.error('🔴 Add product error:', error);
      Alert.alert("Error", error.message || "Failed to add product to service");
    } finally {
      clearTimeout(addTimeout);
      setAdding(null);
    }
  };
  
  // Handle remove product from service
  const handleRemoveProduct = async (productId: number) => {
    if (!serviceId) return;
    
    Alert.alert(
      "Remove Product",
      "Are you sure you want to remove this product from the service?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            setRemoving(productId);
            
            try {
              const result = await removeProductFromServiceHolderAPI(serviceId, productId);
              
              console.log('🟢 Remove product result:', result);
              
              if (result && result.success !== false) {
                // Call parent callback
                if (onRemoveProduct) {
                  onRemoveProduct(productId);
                }
                
                // Refresh both product lists
                fetchAllData();
                
                Alert.alert("Success", "Product removed from service");
              } else {
                Alert.alert("Error", result?.message || "Failed to remove product from service");
              }
            } catch (error: any) {
              console.error('🔴 Remove product error:', error);
              Alert.alert("Error", error.message || "Failed to remove product from service");
            } finally {
              setRemoving(null);
            }
          }
        }
      ]
    );
  };
  
  const getFilteredProducts = () => {
    const sourceProducts = activeTab === 'available' ? products : addedProducts;
    const filtered = searchText 
      ? sourceProducts.filter(p => 
          p.productName?.toLowerCase().includes(searchText.toLowerCase()) ||
          (p.category && p.category.toLowerCase().includes(searchText.toLowerCase()))
        )
      : sourceProducts;
    return filtered;
  };
  
  const filteredProducts = getFilteredProducts();
  
  // Render product item - with price displayed
  const renderProduct = (product: Product, index: number) => {
    // Get the appropriate price and image based on product type
    const price = product.productPrice || product.unitPrice || 0;
    const imageUrl = product.imageUrls && product.imageUrls.length > 0 
      ? product.imageUrls[0] 
      : product.image;
    const productId = product.productId || product.id;
    
    // Debug log to see the actual product data
    
    
    return (
      <View 
        key={`product-${productId}-${index}-${activeTab}`} 
        style={[
          styles.productCardSimple,
          // Remove bottom border for the last item
          index === filteredProducts.length - 1 ? { borderBottomWidth: 0 } : null
        ]}
      >
        {/* Product Image */}
        <View style={styles.productImageContainer}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
              onError={(error) => {
                console.error(`❌ Image load error for product ${productId}:`, error);
              }}
              onLoad={() => {
                console.log(`✅ Image loaded for product ${productId}`);
              }}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={18} color="#ccc" />
            </View>
          )}
        </View>
        
        {/* Product Info */}
        <View style={styles.productInfoColumn}>
          <Text style={styles.productNameSimple} numberOfLines={1}>
            {product.productName || 'Unknown Product'}
          </Text>
          <Text style={styles.productCategory}>
            {product.category || "Product"}
          </Text>
          <Text style={styles.productPriceSimple}>
            {price ? new Intl.NumberFormat('vi-VN', { 
              style: 'decimal', 
              maximumFractionDigits: 0 
            }).format(price) : '0'} đ
          </Text>
          {/* Show quantity for added products */}
          {activeTab === 'added' && product.quantity && (
            <Text style={styles.productQuantity}>
              Qty: {product.quantity}
            </Text>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {activeTab === 'available' ? (
            <TouchableOpacity 
              style={styles.addButtonSimple}
              onPress={() => openQuantityModal(product)}
              disabled={adding === productId}
            >
              {adding === productId ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="add" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.removeButtonSimple}
              onPress={() => handleRemoveProduct(product.productId || product.id)}
              disabled={removing === (product.productId || product.id)}
            >
              {removing === (product.productId || product.id) ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="remove" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  // Render quantity selection modal
  const renderQuantityModal = () => (
    <Modal
      visible={showQuantityModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowQuantityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Quantity</Text>
            <TouchableOpacity onPress={() => setShowQuantityModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {selectedProduct && (
            <View style={styles.modalProductInfo}>
              <Text style={styles.modalProductName}>{selectedProduct.productName}</Text>
              <Text style={styles.modalProductPrice}>
                {(selectedProduct.productPrice || selectedProduct.unitPrice || 0) ? new Intl.NumberFormat('vi-VN', { 
                  style: 'decimal', 
                  maximumFractionDigits: 0 
                }).format(selectedProduct.productPrice || selectedProduct.unitPrice || 0) : '0'} đ
              </Text>
            </View>
          )}
          
          <View style={styles.quantitySelector}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={decrementQuantity}
            >
              <Ionicons name="remove" size={20} color="#333" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={handleQuantityChange}
              keyboardType="numeric"
              selectTextOnFocus={true}
            />
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={incrementQuantity}
            >
              <Ionicons name="add" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowQuantityModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleAddProduct}
            >
              <Text style={styles.confirmButtonText}>Add to Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  // Handle case when serviceId is not provided
  if (!serviceId) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="information-circle-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>Service ID required to load products</Text>
        </View>
      </View>
    );
  }
  
  // Main component rendering
  if (loading && products.length === 0 && addedProducts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Related Products</Text>
          <ActivityIndicator size="small" color="#34c759" />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#34c759" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </View>
    );
  }
  
  if (error && products.length === 0 && addedProducts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Related Products</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => fetchProducts(true)}
          >
            <Ionicons name="refresh-outline" size={18} color="#34c759" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={40} color="#ff3b30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchProducts(true)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Products</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#34c759" />
          ) : (
            <Ionicons name="refresh-outline" size={18} color="#34c759" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'available' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'available' && styles.activeTabButtonText
          ]}>
            Available ({products.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'added' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('added')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'added' && styles.activeTabButtonText
          ]}>
            Added ({addedProducts.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={16} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={16} color="#888" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Product list */}
      {filteredProducts.length > 0 ? (
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          ref={scrollViewRef}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredProducts.map((product, index) => renderProduct(product, index))}
          <View style={styles.scrollBottomPadding} />
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchText ? "No products match your search" : 
             activeTab === 'available' ? "No products available" : "No products added yet"}
          </Text>
        </View>
      )}
      
      {/* Modals */}
      {renderQuantityModal()}
      <SuccessNotification 
        visible={showSuccess}
        message={successMessage}
        details={successDetails}
        onClose={() => setShowSuccess(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    padding: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  searchIcon: {
    marginRight: 8,
    color: '#aaa',
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 14,
    color: '#333',
  },
  scrollContainer: {
    maxHeight: 400,
    borderRadius: 8,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingTop: 5,
    paddingBottom: 15,
  },
  scrollBottomPadding: {
    height: 20,
  },
  centerContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  productCardSimple: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginHorizontal: 2,
  },
  productImageContainer: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfoColumn: {
    flex: 1,
    paddingRight: 10,
  },
  productNameSimple: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  productPriceSimple: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34c759',
    marginTop: 2,
  },
  productQuantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonSimple: {
    backgroundColor: '#34c759',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonSimple: {
    backgroundColor: '#ff3b30',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#34c759',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    textAlign: 'center',
    marginVertical: 10,
  },
  retryButton: {
    backgroundColor: '#34c759',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  
  // Quantity Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalProductInfo: {
    marginBottom: 20,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  modalProductPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34c759',
  },
  quantitySelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    width: 80,
    backgroundColor: 'white',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#34c759',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  
  // Custom Success Notification Styles
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  notificationContent: {
    padding: 20,
  },
  notificationMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  notificationDetails: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34c759',
  },
  notificationButton: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 12,
    alignItems: 'center',
  },
  notificationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34c759',
  }
});

export default ProductCatalog;