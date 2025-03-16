import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { getProductsAPI, IProduct } from "@/utils/productAPI";
import ProductCard from "@/app/product/ProductCard";
import { useTheme } from "@/constants/ThemeContext"; // Importing theme context
import { Colors } from "@/constants/Colors"; // Importing theme colors

const ProductListScreen = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Access current theme
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark"; // Ensure theme is either light or dark
  const colors = Colors[validTheme]; // Use colors based on the current theme

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
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // Display items in 2 columns
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
        contentContainerStyle={[styles.productList, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  productList: {
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  productWrapper: {
    flex: 1, // Ensuring items are displayed correctly in 2 columns
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
