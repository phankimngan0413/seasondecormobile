import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAddedProductAPI } from '@/utils/bookingAPI';
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

interface AddedProduct {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  image?: string;
}

interface AddedProductsReviewProps {
  serviceId?: number;
}

const AddedProductsReview: React.FC<AddedProductsReviewProps> = ({ serviceId }) => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  const [products, setProducts] = useState<AddedProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (serviceId) {
      fetchAddedProducts();
    }
  }, [serviceId]);
  
  const fetchAddedProducts = async (refresh = false) => {
    if (!serviceId) return;
    
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      console.log(`🔍 Fetching added products for service: ${serviceId}`);
      const result = await getAddedProductAPI(serviceId);
      
      console.log('🟢 Added products result:', result);
      
      if (result && result.success !== false) {
        if (Array.isArray(result)) {
          setProducts(result);
        } else if (result.data && Array.isArray(result.data)) {
          setProducts(result.data);
        } else {
          console.warn('⚠️ Unexpected data structure:', result);
          setProducts([]);
        }
      } else {
        setError(result?.message || "Failed to load added products");
        setProducts([]);
      }
    } catch (err: any) {
      console.error('🔴 Error fetching added products:', err);
      setError(err.message || "Failed to load added products");
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    fetchAddedProducts(true);
  };
  
  const calculateTotal = () => {
    return products.reduce((total, product) => {
      return total + (product.unitPrice * product.quantity);
    }, 0);
  };
  
  const renderProduct = ({ item, index }: { item: AddedProduct; index: number }) => (
    <View style={[
      styles.productCard,
      { 
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
        borderBottomWidth: index === products.length - 1 ? 0 : 1
      }
    ]}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image 
            source={{ uri: item.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: colors.border }]}>
            <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
          </View>
        )}
      </View>
      
      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
          {item.productName}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={[styles.unitPrice, { color: colors.textSecondary }]}>
            {new Intl.NumberFormat('vi-VN', { 
              style: 'decimal', 
              maximumFractionDigits: 0 
            }).format(item.unitPrice)} đ
          </Text>
          <Text style={[styles.quantity, { color: colors.textSecondary }]}>
            × {item.quantity}
          </Text>
        </View>
        
        <Text style={[styles.totalPrice, { color: colors.primary }]}>
          {new Intl.NumberFormat('vi-VN', { 
            style: 'decimal', 
            maximumFractionDigits: 0 
          }).format(item.unitPrice * item.quantity)} đ
        </Text>
      </View>
      
      {/* Quantity Badge */}
      <View style={[styles.quantityBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.quantityBadgeText}>{item.quantity}</Text>
      </View>
    </View>
  );
  
  if (!serviceId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Ionicons name="cube-outline" size={20} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Selected Products
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Service ID required to load products
          </Text>
        </View>
      </View>
    );
  }
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Ionicons name="cube-outline" size={20} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Selected Products
          </Text>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading selected products...
          </Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Ionicons name="cube-outline" size={20} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Selected Products
          </Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#ff3b30" />
          <Text style={[styles.errorText, { color: "#ff3b30" }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (products.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Ionicons name="cube-outline" size={20} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Selected Products
          </Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No products selected yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Products added during survey will appear here
          </Text>
        </View>
      </View>
    );
  }
  
  const total = calculateTotal();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Ionicons name="cube-outline" size={20} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Selected Products ({products.length})
        </Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Replace FlatList with ScrollView or simple View mapping */}
      <View style={styles.productsList}>
        {products.map((item, index) => renderProduct({ item, index }))}
      </View>
      
      {/* Total Summary */}
      <View style={[styles.totalContainer, { 
        backgroundColor: `${colors.primary}08`,
        borderTopColor: colors.border
      }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>
            Total ({products.length} {products.length === 1 ? 'item' : 'items'}):
          </Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {new Intl.NumberFormat('vi-VN', { 
              style: 'decimal', 
              maximumFractionDigits: 0 
            }).format(total)} đ
          </Text>
        </View>
        <Text style={[styles.totalNote, { color: colors.textSecondary }]}>
          * This is an estimated cost for selected products
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.8,
  },
  productsList: {
    // Remove maxHeight to let it expand naturally
  },
  productCard: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  imageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  unitPrice: {
    fontSize: 13,
    marginRight: 8,
  },
  quantity: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  quantityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  quantityBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  totalContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalNote: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default AddedProductsReview;