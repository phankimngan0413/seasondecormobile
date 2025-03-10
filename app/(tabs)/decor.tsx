import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { getProductsAPI, IProduct } from "@/utils/productAPI";
import ProductCard from "@/app/product/ProductCard";

const ProductListScreen = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

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

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;
  if (products.length === 0) return <Text style={styles.noProductText}>No products available.</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // ✅ Đã sửa, không cần flexWrap
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/product-detail/[id]",
                params: { id: item.id.toString() },
              })
            }
            style={styles.productWrapper} // ✅ Thêm style để căn chỉnh
          >
            <ProductCard product={item} onAddToCart={() => {}} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  productList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  productWrapper: {
    flex: 1, // ✅ Đảm bảo item hiển thị đúng trong 2 cột
    margin: 5, // ✅ Khoảng cách giữa các item
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
