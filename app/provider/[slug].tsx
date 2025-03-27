import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { getProviderDetailAPI, getProductsByProviderAPI } from "@/utils/providerAPI";
import { addContactAPI } from "@/utils/contactAPI"; // API to add contact
import { useSearchParams } from "expo-router/build/hooks";
import ProductCard from "@/app/product/ProductCard";  // Correct import for ProductCard
import { IProvider } from "@/utils/providerAPI"; 
import { IProduct } from "@/utils/productAPI"; 
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

const PRIMARY_COLOR = "#5fc1f1"; // Define the primary color

const ProviderDetailScreen = () => {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const { theme } = useTheme(); // Get the current theme
  const validTheme = theme as "light" | "dark"; // Ensure theme is either light or dark
  const colors = Colors[validTheme]; // Use colors based on the theme

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
      const response = await addContactAPI(receiverId);

      if (response.success || response.message === "Contact already exists.") {
        console.log("🟢 Navigating to chat...");
        router.push("/chat");
      } else {
        console.error("🔴 Error adding contact:", response.message);
        throw new Error(response.message || "Failed to add contact.");
      }
    } catch (err) {
      console.error("🔴 Error adding contact or navigating to chat:", err);
      router.push("/chat");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={colors.primary} />;
  }

  if (error) {
    return <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>;
  }

  return (
    <FlatList
      data={[{ key: "provider" }, { key: "products" }]}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => {
        switch (item.key) {
          case "provider":
            return (
              <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                {provider && (
                  <>
                    <Image source={{ uri: provider.avatar }} style={styles.avatar} />
                    <Text style={[styles.businessName, { color: PRIMARY_COLOR }]}>{provider.businessName}</Text>
                    <Text style={[styles.bio, { color: colors.text }]}>{provider.bio}</Text>
                    <Text style={[styles.phone, { color: colors.text }]}>{provider.phone}</Text>
                    <Text style={[styles.address, { color: colors.text }]}>{provider.address}</Text>
                    <Text style={[styles.joinedDate, { color: PRIMARY_COLOR }]} >
                      Joined on: {new Date(provider.joinedDate).toLocaleDateString() || "Invalid Date"}
                    </Text>
                    <Text style={[styles.followers, { color: PRIMARY_COLOR }]} >
                      Followers: {provider.followersCount} | Following: {provider.followingsCount}
                    </Text>

                    {/* Follow and Message buttons */}
                    <View style={styles.buttonsContainer}>
                      <TouchableOpacity style={[styles.followButton, { backgroundColor: colors.primary }]}>
                        <Text style={styles.followButtonText}>Follow</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.messageButton, { backgroundColor: colors.secondary }]} 
                        onPress={() => handleMessageClick(provider.id)} // Passing provider id
                      >
                        <Text style={styles.messageButtonText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );

          case "products":
            return (
              <View>
                <Text style={[styles.productListTitle, { color: colors.text }]}>Products:</Text>
                {products.length > 0 ? (
                 <FlatList
                 data={products.slice(0, 6)} // Display the first 6 products
                 keyExtractor={(item) => item.id.toString()}
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
                     <ProductCard product={item} onAddToCart={function (product: any): void {
                       throw new Error("Function not implemented.");
                     } } />
                   </TouchableOpacity>
                 )}
                 numColumns={2} // Display products in a grid layout
                 contentContainerStyle={styles.productList}
               />
                ) : (
                  <Text style={{ color: colors.text }}>No products available.</Text>
                )}
              </View>
            );

          default:
            return null;
        }
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 10,
    padding: 10,
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
  businessName: {
    fontSize: 20,
    color: "#3498db",
    textAlign: "center",
    marginBottom: 15,
  },
  bio: {
    fontSize: 16,
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
    paddingVertical: 8,
    paddingHorizontal: 18,
    width: "48%",
  },
  followButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  messageButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 18,
    width: "48%",
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  productListTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 20,
  },
  productList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",  // This will center the items horizontally
    alignItems: "center", // This will center the items vertically (if needed)
  },
  productWrapper:{
    width: "50%",  // This will allow two products per row, adjust as needed
    marginBottom: 20,
    alignItems: "center", // Center content inside the wrapper (like text)

  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});

export default ProviderDetailScreen;
