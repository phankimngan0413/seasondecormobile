import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";
import CustomButton from "@/components/ui/Button/Button";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const PRIMARY_COLOR = "#5fc1f1"; // 🔹 Màu chủ đạo

interface ProductProps {
  product: {
    id: number;
    productName: string;
    productPrice: number;
    rate: number;
    totalSold: number;
    imageUrls: string[];
  };
  onAddToCart: (product: any) => void;
}

const ProductCard: React.FC<ProductProps> = ({ product, onAddToCart }) => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  return (
    <View
      style={[
        styles.productCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border, // Add border color based on theme
        },
      ]}
    >
      {/* 🔹 Hiển thị ảnh sản phẩm hoặc placeholder */}
      {product.imageUrls.length > 0 ? (
        <Image
          source={{ uri: product.imageUrls[0] + "?time=" + new Date().getTime() }}
          style={styles.productImage}
          onError={(e) => console.log("Image Load Error: ", e.nativeEvent.error)}
        />
      ) : (
        <View style={styles.noImageContainer}>
          <Ionicons name="image-outline" size={50} color="#ccc" />
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}

      {/* 🔹 Hiển thị thông tin sản phẩm */}
      <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
        {product.productName}
      </Text>

      <Text style={[styles.productPrice, { color: colors.primary }]}>
        ${product.productPrice.toFixed(2)}
      </Text>

      <Text style={[styles.rateText, { color: colors.icon }]}>
        ⭐ {product.rate} | 📦 Sold: {product.totalSold}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    width: width * 0.45, // ✅ Giảm kích thước để phù hợp 2 cột
    padding: 12,
    borderRadius: 8,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginHorizontal: 5, // ✅ Căn giữa giữa 2 card
    borderWidth: 1, // Adding border width
    borderColor: "#ddd", // Light border color for both themes
  },
  productImage: {
    width: "100%",
    height: 120, // ✅ Giảm chiều cao ảnh để phù hợp
    borderRadius: 6,
    marginBottom: 8,
    resizeMode: "cover",
  },
  noImageContainer: {
    width: "100%",
    height: 150, // Giảm chiều cao của container
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  noImageText: {
    fontSize: 10, // Giảm kích thước font chữ cho thông báo "No Image"
    color: "#888",
    marginTop: 5,
  },
  productTitle: {
    fontSize: 16, // Giảm kích thước chữ cho tên sản phẩm
    fontWeight: "600",
    marginBottom: 5,
    textAlign: "center",
  },
  productPrice: {
    fontSize: 14, // Giảm kích thước font chữ cho giá
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  rateText: {
    fontSize: 10, // Giảm kích thước font chữ cho đánh giá và số lượng đã bán
    marginBottom: 6,
    textAlign: "center",
  },
  // Smaller button and text styles
  smallButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 20,
    paddingVertical: 8, // Smaller padding
    paddingHorizontal: 18, // Smaller horizontal padding
    width: "100%", // Full width for button
  },
  smallButtonText: {
    color: "#fff",
    fontSize: 14, // Smaller font size for button text
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default ProductCard;
