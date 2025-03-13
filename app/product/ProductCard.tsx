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
    <View style={[styles.productCard, { backgroundColor: colors.card, shadowColor: colors.border }]}>
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

      {/* 🔹 Nút thêm vào giỏ hàng */}
      <CustomButton 
        title="Add to Cart" 
        onPress={() => onAddToCart(product)}
        icon={<Ionicons name="add-circle-outline" size={20} color={"#fff"} />} 
        btnStyle={{ backgroundColor: PRIMARY_COLOR }} 
        labelStyle={{ color: "#fff" }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    width: width * 0.45, // ✅ Giảm kích thước để phù hợp 2 cột
    padding: 12,
    borderRadius: 10,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginHorizontal: 5, // ✅ Căn giữa giữa 2 card
  },
  productImage: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: "cover",
  },
  noImageContainer: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  noImageText: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    textAlign: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  rateText: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
});

export default ProductCard;
