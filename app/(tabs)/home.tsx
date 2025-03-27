import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/ThemeContext";
import { tabsConfig, PRIMARY_COLOR } from "@/config/tabsConfig"; // Import tabsConfig
import { getProductsAPI } from "@/utils/productAPI"; // Assuming this is the function that fetches the products
import ProductCard from "../product/ProductCard"; // Assuming this is your ProductCard component
import CustomButton from "@/components/ui/Button/Button";
import { router } from "expo-router";


interface IProduct {
  id: number;
  productName: string;
  productPrice: number;
  rate: number;
  totalSold: number;
  imageUrls: string[];
}

export default function HomeScreen() {
  const { theme } = useTheme(); // Get theme from context
  const isDark = theme === "dark"; // Check if theme is dark
  const [selectedTab, setSelectedTab] = useState(0); // Store selected tab index
  const [nestedSelectedTab, setNestedSelectedTab] = useState<{ [key: number]: number }>({});
  const [products, setProducts] = useState<IProduct[]>([]); // State to store fetched products
  const [loading, setLoading] = useState(true); // Loading state for products
  const [error, setError] = useState(""); // Error handling state

  // Handle tab change
  const handleTabChange = (index: number) => setSelectedTab(index);

  // Handle nested tab change
  const handleNestedTabChange = (index: number, nestedIndex: number) => {
    setNestedSelectedTab((prev) => ({
      ...prev,
      [index]: nestedIndex,
    }));
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const data = await getProductsAPI();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  // Automatically select the first nested tab when the selected tab changes
  useEffect(() => {
    if (tabsConfig[selectedTab]?.nestedTabs) {
      setNestedSelectedTab((prev) => ({
        ...prev,
        [selectedTab]: 0, // Automatically selects the first nested tab
      }));
    }
  }, [selectedTab]);

  if (loading) return <ActivityIndicator size="large" color="#3498db" />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  return (
    <FlatList
      data={[{ key: "hero" }, { key: "tabs" }, { key: "nestedTabs" }, { key: "services" }, { key: "products" }]}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => {
        switch (item.key) {
          case "hero":
            return (
              <View style={styles.hero}>
                <Image
                  source={{
                    uri: "https://havenly.com/blog/wp-content/uploads/2023/05/kyliefitts_havenly_melissashome_7-3-700x466.jpg",
                  }}
                  style={styles.heroImage}
                />
                <Text style={[styles.heroTitle, { color: isDark ? "#fff" : "#333" }]}>
                  Transform Your Home with Expert Design
                </Text>
                <Text style={[styles.heroSubtitle, { color: isDark ? "#bbb" : "#777" }]}>
                  Our platform connects you with talented decorators to make your dream home a reality.
                </Text>
                <TouchableOpacity style={styles.heroButton}>
                  <Text style={styles.heroButtonText}>Get Started</Text>
                </TouchableOpacity>
              </View>
            );

          case "tabs":
            return (
              <View style={styles.tabContainer}>
                {tabsConfig.map((tab, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.tab, selectedTab === index && styles.activeTab]}
                    onPress={() => handleTabChange(index)}
                  >
                    <Ionicons name={tab.icon} size={30} color={selectedTab === index ? PRIMARY_COLOR : "#888"} />
                  </TouchableOpacity>
                ))}
              </View>
            );

          case "nestedTabs":
            return (
              <View style={styles.imageComparisonContainer}>
                <View style={styles.imageRow}>
                  <View style={styles.imageWrapper}>
                    <Text style={[styles.imageLabel, { color: isDark ? "#fff" : "#333" }]}>Before</Text>
                    <Image
                      source={{
                        uri: tabsConfig[selectedTab]?.nestedTabs[nestedSelectedTab[selectedTab]]?.beforeImage,
                      }}
                      style={styles.image}
                    />
                  </View>
                  <View style={styles.imageWrapper}>
                    <Text style={[styles.imageLabel, { color: isDark ? "#fff" : "#333" }]}>After</Text>
                    <Image
                      source={{
                        uri: tabsConfig[selectedTab]?.nestedTabs[nestedSelectedTab[selectedTab]]?.afterImage,
                      }}
                      style={styles.image}
                    />
                  </View>
                </View>
              </View>
            );

            case "services":
              return (
                <View style={styles.decorServiceSection}>
                  <Text style={styles.decorServiceTitle}>Our Decor Services</Text>
                  <Text style={[styles.decorServiceSubtitle, { color: isDark ? "#fff" : "#333" }]}>
                    Transform your space with our professional decor services tailored just for you.
                  </Text>
                  <FlatList
                    data={[
                      {
                        label: "Living Room Design",
                        imageUrl: "https://static.asianpaints.com/content/dam/asianpaintsbeautifulhomes/gallery/living-room/contemporary-living-room-with-brick-wall-and-modern-decor/modern-living-room-with-brick-wall.jpg.transform/bh-image-gallery/image.webp",
                        description: "Bring a fresh, modern look to your living room.",
                      },
                      {
                        label: "Bedroom Styling",
                        imageUrl: "https://www.nichepursuits.com/wp-content/uploads/2023/06/2-11-1024x581.png",
                        description: "Turn your bedroom into a relaxing sanctuary.",
                      },
                  
                    ]}
                    keyExtractor={(item, index) => item.label + index}
                    renderItem={({ item }) => (
                      <View style={styles.decorServiceItem}>
                        <Image source={{ uri: item.imageUrl }} style={styles.decorServiceImage} />
                        <Text style={[styles.decorServiceText, { color: isDark ? "#fff" : "#333" }]}>{item.label}</Text>
                        <Text style={[styles.decorServiceDescription, { color: isDark ? "#bbb" : "#555" }]}>
                          {item.description}
                        </Text>
                      </View>
                    )}
                    horizontal
                    contentContainerStyle={styles.decorServiceList}
                  />
        
                </View>
                
              );
            
            

          case "products":
            return (
              <View style={styles.productSection}>
                <Text style={[styles.screenTitle, { color: isDark ? "#fff" : "#333" }]}>Featured Products</Text>
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
                <CustomButton
                  title="View More"
                  onPress={() => router.push("/product/productlist")}
                  btnStyle={styles.viewMoreButton}
                  labelStyle={styles.viewMoreText}
                />
              </View>
            );

          default:
            return null;
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 40,
  },
  hero: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  heroImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  heroSubtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  heroButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  heroButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  shopCategoriesSection: {
    marginTop: 20,
  },
  shopCategoriesTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: PRIMARY_COLOR,
  },
  shopCategoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shopCategory: {
    width: "30%",
    alignItems: "center",
  },
  shopCategoryImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
  shopCategoryLabel: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  shopCategoryDescription: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
    color: "#777",
  },
  shopCategoryInfo: {
    marginTop: 20,
    alignItems: "center",
  },
  shopCategoryInfoText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    color: "#777",
  },
  productSection: {
    marginTop: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  productList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",  // This will center the items horizontally
    alignItems: "center", // This will center the items vertically (if needed)
  },
  productWrapper: {
    width: "50%",  // This will allow two products per row, adjust as needed
    marginBottom: 20,
    alignItems: "center", // Center content inside the wrapper (like text)
  },
  
  viewMoreButton: {
    marginTop: 20,
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 10,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },

  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    justifyContent: "space-between",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: PRIMARY_COLOR,
  },
  tabLabel: {
    fontSize: 16,
    color: "#888",
  },
  activeTabText: {
    color: PRIMARY_COLOR,
  },
  imageComparisonContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  imageWrapper: {
    width: "48%",
    alignItems: "center",
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  decorServiceSection: {
    marginTop: 20,
  },
  decorServiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: PRIMARY_COLOR,
  },
  decorServiceSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  decorServiceList: {
    marginBottom: 20,
  },
  decorServiceItem: {
    marginRight: 10,
    width: 200,
    alignItems: "center",
  },
  decorServiceImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  decorServiceText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  decorServiceDescription: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
    color: "#777",
  },

});
