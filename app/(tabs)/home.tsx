import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/ThemeContext";
import { tabsConfig, PRIMARY_COLOR } from "@/config/tabsConfig";
import { getProductsAPI } from "@/utils/productAPI";
import ProductCard from "../product/ProductCard";
import CustomButton from "@/components/ui/Button/Button";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";

interface IProduct {
  id: number;
  productName: string;
  productPrice: number;
  rate: number;
  totalSold: number;
  imageUrls: string[];
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [nestedSelectedTab, setNestedSelectedTab] = useState<{
    [key: number]: number;
  }>({});
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleTabChange = (index: number) => setSelectedTab(index);

  const handleNestedTabChange = (index: number, nestedIndex: number) => {
    setNestedSelectedTab((prev) => ({
      ...prev,
      [index]: nestedIndex,
    }));
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProductsAPI();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (tabsConfig[selectedTab]?.nestedTabs) {
      setNestedSelectedTab((prev) => ({
        ...prev,
        [selectedTab]: 0,
      }));
    }
  }, [selectedTab]);

  if (loading) return <ActivityIndicator size="large" color={colors.primary} />;
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error || "red" }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.reloadButton, { backgroundColor: colors.primary }]}
          onPress={fetchProducts}
        >
          <Ionicons name="reload" size={18} color="#fff" style={styles.reloadIcon} />
          <Text style={styles.reloadButtonText}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={[
        { key: "hero" },
        { key: "tabs" },
        { key: "nestedTabs" },
        { key: "services" },
        { key: "products" },
      ]}
      keyExtractor={(item) => item.key}
      style={{ backgroundColor: colors.background }}
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
                <Text
                  style={[styles.heroTitle, { color: colors.text }]}
                >
                  Transform Your Home with Expert Design
                </Text>
                <Text
                  style={[styles.heroSubtitle, { color: colors.secondary }]}
                >
                  Our platform connects you with talented decorators to make
                  your dream home a reality.
                </Text>
                <TouchableOpacity
                  style={[styles.heroButton, { backgroundColor: colors.primary }]}
                  onPress={() =>
                    router.push({
                      pathname: "/decor",
                      params: { source: "hero" },
                    })
                  }
                >
                  <Text style={styles.heroButtonText}>Get Started</Text>
                </TouchableOpacity>
              </View>
            );

          case "tabs":
            return (
              <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
                {tabsConfig.map((tab, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.tab,
                      selectedTab === index && [styles.activeTab, { borderBottomColor: colors.primary }],
                    ]}
                    onPress={() => handleTabChange(index)}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={30}
                      color={selectedTab === index ? colors.primary : colors.secondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            );

          case "nestedTabs":
            return (
              <View style={styles.imageComparisonContainer}>
                <View style={styles.imageRow}>
                  <View style={styles.imageWrapper}>
                    <Text style={[styles.imageLabel, { color: colors.text }]}>
                      Before
                    </Text>
                    <Image
                      source={{
                        uri: tabsConfig[selectedTab]?.nestedTabs[
                          nestedSelectedTab[selectedTab]
                        ]?.beforeImage,
                      }}
                      style={[styles.image, { borderColor: colors.border }]}
                    />
                  </View>
                  <View style={styles.imageWrapper}>
                    <Text style={[styles.imageLabel, { color: colors.text }]}>
                      After
                    </Text>
                    <Image
                      source={{
                        uri: tabsConfig[selectedTab]?.nestedTabs[
                          nestedSelectedTab[selectedTab]
                        ]?.afterImage,
                      }}
                      style={[styles.image, { borderColor: colors.border }]}
                    />
                  </View>
                </View>
              </View>
            );

          case "services":
            return (
              <View style={styles.decorServiceSection}>
                <Text style={[styles.decorServiceTitle, { color: colors.primary }]}>
                  Our Decor Services
                </Text>
                <Text style={[styles.decorServiceSubtitle, { color: colors.text }]}>
                  Transform your space with our professional decor services
                  tailored just for you.
                </Text>
                <FlatList
                  data={[
                    {
                      label: "Living Room Design",
                      imageUrl:
                        "https://housedesign.vn/wp-content/uploads/2019/12/cac-phong-cach-decor-noi-that-tieu-bieu-nhat.jpeg",
                      description:
                        "Bring a fresh, modern look to your living room.",
                    },
                    {
                      label: "Bedroom Styling",
                      imageUrl:
                        "https://www.nichepursuits.com/wp-content/uploads/2023/06/2-11-1024x581.png",
                      description:
                        "Turn your bedroom into a relaxing sanctuary.",
                    },
                  ]}
                  keyExtractor={(item, index) => item.label + index}
                  renderItem={({ item }) => (
                    <View style={styles.decorServiceItem}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.decorServiceImage}
                      />
                      <Text style={[styles.decorServiceText, { color: colors.text }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.decorServiceDescription, { color: colors.secondary }]}>
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
                <Text style={[styles.screenTitle, { color: colors.text }]}>
                  Featured Products
                </Text>
                <FlatList
                  data={products.slice(0, 10)}
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
                      <ProductCard
                        product={item}
                        onAddToCart={function (product: any): void {
                          throw new Error("Function not implemented.");
                        }}
                      />
                    </TouchableOpacity>
                  )}
                  numColumns={2}
                  contentContainerStyle={styles.productList}
                />
                <CustomButton
                  title="View More"
                  onPress={() => router.push("/product/productlist")}
                  btnStyle={[styles.viewMoreButton, { backgroundColor: colors.primary }]}
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
  },
  shopCategoryInfo: {
    marginTop: 20,
    alignItems: "center",
  },
  shopCategoryInfoText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
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
    justifyContent: "center",
    alignItems: "center",
  },
  productWrapper: {
    width: "50%",
    marginBottom: 20,
    alignItems: "center",
  },
  viewMoreButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  reloadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  reloadIcon: {
    marginRight: 8,
  },
  reloadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    justifyContent: "space-between",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabLabel: {
    fontSize: 16,
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
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  decorServiceSection: {
    width: "100%",
    marginTop: 20,
  },
  decorServiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
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
  },
});