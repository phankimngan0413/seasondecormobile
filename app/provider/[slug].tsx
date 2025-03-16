import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { getProviderDetailAPI, getProductsByProviderAPI } from "@/utils/providerAPI";
import { addContactAPI } from "@/utils/contactAPI";
import { useSearchParams } from "expo-router/build/hooks";
import ProductCard from "@/app/product/ProductCard"; 
import { IProvider } from "@/utils/providerAPI"; 
import { IProduct } from "@/utils/productAPI"; 

const ProviderDetailScreen = () => {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchProviderDetail = async () => {
      try {
        if (slug) {
          const providerData = await getProviderDetailAPI(slug.toString());
          setProvider(providerData);
          const productData = await getProductsByProviderAPI(slug.toString());
          setProducts(productData);
        }
      } catch (err) {
        setError("Failed to fetch provider details or products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProviderDetail();
  }, [slug]);

  const handleMessageClick = async (receiverId: number) => {
    try {
      // Gọi API để thêm người này vào danh bạ
      await addContactAPI(receiverId);
      
      // Sau khi thêm liên hệ, điều hướng sang trang chat
      router.push({
        pathname: `/chat/[receiverId]`, // Điều hướng tới trang chat với receiverId
        params: { receiverId: receiverId },
      });
    } catch (err) {
      console.error("Error adding contact or navigating to chat:", err);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#3498db" />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Provider Details Section */}
      {provider && (
        <View style={styles.card}>
          <Image source={{ uri: provider.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{provider.name}</Text>
          <Text style={styles.businessName}>{provider.businessName}</Text>
          <Text style={styles.bio}>{provider.bio}</Text>
          <Text style={styles.phone}>{provider.phone}</Text>
          <Text style={styles.address}>{provider.address}</Text>
          <Text style={styles.joinedDate}>
            Joined on: {new Date(provider.joinedDate).toLocaleDateString() || "Invalid Date"}
          </Text>
          <Text style={styles.followers}>
            Followers: {provider.followersCount} | Following: {provider.followingsCount}
          </Text>

          {/* Follow and Message buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageButton} 
              onPress={() => handleMessageClick(provider.id)} // Passing provider id
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Products Section */}
      <Text style={styles.productListTitle}>Products:</Text>
      {products.length > 0 ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProductCard product={item} onAddToCart={() => console.log(`Added ${item.productName} to cart`)} />
          )}
          contentContainerStyle={styles.productList}
        />
      ) : (
        <Text>No products available.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  businessName: {
    fontSize: 20,
    color: "#3498db",
    textAlign: "center",
    marginBottom: 15,
  },
  bio: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 20,
    textAlign: "center",
  },
  phone: {
    fontSize: 16,
    marginBottom: 5,
  },
  address: {
    fontSize: 16,
    marginBottom: 5,
  },
  joinedDate: {
    fontSize: 14,
    marginBottom: 5,
    color: "#3498db",
  },
  followers: {
    fontSize: 14,
    marginBottom: 10,
    color: "#3498db",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  followButton: {
    backgroundColor: "#3498db",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    width: "48%",
  },
  followButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  messageButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    shadowColor: "#2ecc71",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    width: "48%",
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  productListTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
  },
  productList: {
    paddingBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});

export default ProviderDetailScreen;
