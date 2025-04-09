import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { getProductsAPI, IProduct } from "@/utils/productAPI";
import ProductCard from "@/app/product/ProductCard";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

const ProductListScreen = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Access current theme
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProductsAPI();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setError("Invalid data format received.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={colors.primary} />;
  if (error) return <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>;
  if (products.length === 0) return <Text style={[styles.noProductText, { color: colors.text }]}>No products available.</Text>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sản phẩm của chúng tôi</Text>
        <Text style={[styles.headerSubtitle, { color: colors.text }]}>
          Khám phá các sản phẩm trang trí cho mùa lễ hội
        </Text>
      </View>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/product/product-detail/[id]",
                params: { id: item.id.toString() },
              })
            }
            style={styles.productWrapper}
          >
            <ProductCard product={item} onAddToCart={() => {}} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.productList}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  productList: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    width: '100%',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productWrapper: {
    width: (width - 36) / 2, // Đảm bảo 2 sản phẩm trên một hàng với khoảng cách phù hợp
    marginBottom: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  noProductText: {
    color: "gray",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default ProductListScreen;