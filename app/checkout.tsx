import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useRouter, useLocalSearchParams } from 'expo-router';

// Interfaces for typing
interface Product {
  id: number;
  name: string;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
}

interface Address {
  name: string;
  phone: string;
  fullAddress: string;
}

interface ShippingOption {
  type: 'Nhanh' | 'Hỏa Tốc';
  price: number;
  description: string;
  voucher?: number;
}

const CheckoutScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];
  const router = useRouter();
  const params = useLocalSearchParams();

  // State for checkout details
  const [address, setAddress] = useState<Address>({
    name: 'Ngan phan',
    phone: '(+84) 943 500 454',
    fullAddress: 'Vinhomes Grandpark, S301, Nguyễn Xiển, Phường Long Bình, Thành Phố Thủ Đức, TP. Hồ Chí Minh'
  });

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Kính Chống Nhìn Trộm Kuzoom iPhone 12-16 Series...',
      image: 'https://via.placeholder.com/100', // Replace with actual image
      originalPrice: 145000,
      discountedPrice: 96000,
      quantity: 1
    }
  ]);

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([
    {
      type: 'Nhanh',
      price: 16500,
      description: 'Đảm bảo nhận hàng từ 3 Tháng 4 - 5 Tháng 4. Nhận Voucher trị giá ₫15.000 nếu đơn hàng được giao đến bạn sau ngày 5 Tháng 4 2025.',
      voucher: 15000
    },
    {
      type: 'Hỏa Tốc',
      price: 104600,
      description: 'Nhận hàng vào ngày mai. Nhận Voucher trị giá ₫15.000 nếu đơn hàng được giao đến bạn sau ngày 2 Tháng 4 2025.',
      voucher: 15000
    }
  ]);

  const [selectedShipping, setSelectedShipping] = useState<ShippingOption>(shippingOptions[0]);

  // Calculate totals
  const subtotal = products.reduce((sum, product) => 
    sum + (product.discountedPrice * product.quantity), 0);
  const total = subtotal + selectedShipping.price;
  const savings = products.reduce((sum, product) => 
    sum + ((product.originalPrice - product.discountedPrice) * product.quantity), 0);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Thanh toán</Text>
    </View>
  );

  const renderAddressSection = () => (
    <TouchableOpacity style={styles.addressContainer}>
      <View style={styles.addressIconContainer}>
        <Ionicons name="location" size={24} color="#FF5252" />
      </View>
      <View style={styles.addressDetails}>
        <View style={styles.addressNameContainer}>
          <Text style={styles.addressName}>{address.name}</Text>
          <Text style={styles.addressPhone}>{address.phone}</Text>
        </View>
        <Text style={styles.addressFull}>{address.fullAddress}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderProductSection = () => (
    <View style={styles.productSection}>
      <View style={styles.productHeader}>
        <Text style={styles.shopName}>CloverB</Text>
        <TouchableOpacity>
          <Text style={styles.shopLink}>Xem shop</Text>
        </TouchableOpacity>
      </View>
      {products.map((product) => (
        <View key={product.id} style={styles.productItem}>
          <Image 
            source={{ uri: product.image }} 
            style={styles.productImage} 
          />
          <View style={styles.productInfo}>
            <Text 
              style={styles.productName} 
              numberOfLines={2}
            >
              {product.name}
            </Text>
            <View style={styles.productPriceContainer}>
              <Text style={styles.originalPrice}>
                ₫{product.originalPrice.toLocaleString()}
              </Text>
              <Text style={styles.discountedPrice}>
                ₫{product.discountedPrice.toLocaleString()}
              </Text>
              <Text style={styles.quantity}>x{product.quantity}</Text>
            </View>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.voucherContainer}>
        <Text style={styles.voucherText}>Voucher của Shop</Text>
        <View style={styles.voucherDiscount}>
          <Text style={styles.voucherDiscountText}>-₫5k</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderShippingSection = () => (
    <View style={styles.shippingSection}>
      <Text style={styles.sectionTitle}>Phương thức vận chuyển</Text>
      {shippingOptions.map((option) => (
        <TouchableOpacity 
          key={option.type}
          style={[
            styles.shippingOption,
            selectedShipping.type === option.type && styles.selectedShippingOption
          ]}
          onPress={() => setSelectedShipping(option)}
        >
          <View style={styles.shippingOptionHeader}>
            <Text style={styles.shippingOptionType}>{option.type}</Text>
            <Text style={styles.shippingOptionPrice}>
              ₫{option.price.toLocaleString()}
            </Text>
          </View>
          <Text 
            style={styles.shippingOptionDescription}
            numberOfLines={2}
          >
            {option.description}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPriceBreakdown = () => (
    <View style={styles.priceBreakdownSection}>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Tạm tính</Text>
        <Text style={styles.priceValue}>₫{subtotal.toLocaleString()}</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Phí vận chuyển</Text>
        <Text style={styles.priceValue}>
          ₫{selectedShipping.price.toLocaleString()}
        </Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng thanh toán</Text>
        <Text style={styles.totalValue}>₫{total.toLocaleString()}</Text>
      </View>
      <View style={styles.savingsRow}>
        <Text style={styles.savingsText}>
          Tiết kiệm: ₫{savings.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderCheckoutButton = () => (
    <TouchableOpacity style={styles.checkoutButton}>
      <Text style={styles.checkoutButtonText}>Đặt hàng</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeader()}
        {renderAddressSection()}
        {renderProductSection()}
        {renderShippingSection()}
        {renderPriceBreakdown()}
      </ScrollView>
      
      {renderCheckoutButton()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Space for checkout button
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  addressIconContainer: {
    marginRight: 15,
  },
  addressDetails: {
    flex: 1,
  },
  addressNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
  },
  addressFull: {
    fontSize: 14,
    color: '#666',
  },
  productSection: {
    backgroundColor: 'white',
    marginTop: 10,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
  },
  shopLink: {
    color: '#FF5252',
  },
  productItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productImage: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    marginBottom: 10,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    color: '#666',
    textDecorationLine: 'line-through',
    marginRight: 10,
    fontSize: 12,
  },
  discountedPrice: {
    color: '#FF5252',
    fontWeight: '600',
    marginRight: 10,
  },
  quantity: {
    color: '#666',
  },
  voucherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  voucherText: {
    fontSize: 14,
  },
  voucherDiscount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherDiscountText: {
    color: '#FF5252',
    marginRight: 5,
  },
  shippingSection: {
    backgroundColor: 'white',
    marginTop: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  shippingOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  selectedShippingOption: {
    borderColor: '#FF5252',
  },
  shippingOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  shippingOptionType: {
    fontWeight: '600',
  },
  shippingOptionPrice: {
    color: '#FF5252',
  },
  shippingOptionDescription: {
    fontSize: 12,
    color: '#666',
  },
  priceBreakdownSection: {
    backgroundColor: 'white',
    marginTop: 10,
    padding: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    color: '#666',
  },
  priceValue: {
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    color: '#FF5252',
    fontWeight: '600',
  },
  savingsRow: {
    alignItems: 'flex-end',
    marginTop: 5,
  },
  savingsText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  checkoutButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF5252',
    padding: 15,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;