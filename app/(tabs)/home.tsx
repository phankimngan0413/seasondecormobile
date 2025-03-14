import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/ThemeContext"; 
import ProductCard from "../product/ProductCard";

interface IProduct {
  id: number;
  productName: string;
  productPrice: number;
  rate: number;
  totalSold: number;
  imageUrls: string[];
}
import { getProductsAPI } from "@/utils/productAPI";
import CustomButton from "@/components/ui/Button/Button";
import { router } from "expo-router";


export default function HomeScreen() {
  const { theme } = useTheme(); // ✅ Lấy theme từ Context
  const isDark = theme === "dark"; // ✅ Kiểm tra theme
  const [selectedTab, setSelectedTab] = useState(0);
  const [nestedSelectedTab, setNestedSelectedTab] = useState<{
    [key: number]: number;
  }>({});

  const handleTabChange = (index: number) => {
    setSelectedTab(index);
  };
 
  const handleNestedTabChange = (index: number, nestedIndex: number) => {
    setNestedSelectedTab((prev) => ({
      ...prev,
      [index]: nestedIndex,
    }));
  };
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const handleAddToCart = (product: any) => {
    console.log("🛒 Added to cart:", product.productName);
    // ✅ Thêm logic giỏ hàng tại đây (nếu có)
  };

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;
  const tabsConfig = [
    {
      label: 'Living Room',
      icon: 'tv-outline',
      nestedTabs: [
        {
          label: "Spring's Living Room",
          beforeImage: 'https://havenly.com/blog/wp-content/uploads/2023/05/Screen-Shot-2022-01-24-at-4.26.21-PM-700x455.jpg',
          afterImage: 'https://havenly.com/blog/wp-content/uploads/2023/05/kyliefitts_havenly_melissashome_7-3-700x466.jpg',
        },
        {
          label: "Jenna's Living Room",
          beforeImage: 'https://havenly.com/blog/wp-content/uploads/2022/06/phpL8m1FZ-700x525.jpeg',
          afterImage: 'https://havenly.com/blog/wp-content/uploads/2022/06/laurenmurdoch_020420_685575_01-700x473.jpg',
        },
        
      ],
    },
    {
      label: 'Bedroom',
      icon: 'bed-outline',
      nestedTabs: [
        {
          label: "Spring's Bedroom",
          beforeImage: 'https://havenly.com/blog/wp-content/uploads/2022/06/php5kBn3J-700x525.jpeg',
          afterImage: 'https://havenly.com/blog/wp-content/uploads/2022/06/kyliefitts_havenly_julibauer_16-700x457.jpg',
        },
        {
          label: "Jenna's Bedroom",
          beforeImage: 'https://havenly.com/blog/wp-content/uploads/2023/11/daniellechiprut_021220_designerhometour_before06-700x452.jpg',
          afterImage: 'https://havenly.com/blog/wp-content/uploads/2023/11/daniellechiprut_021220_designerhometour_22-2-700x448.jpg',
        },
      ],
    },
    {
      label: 'Dining Room',
      icon: 'restaurant-outline',
      nestedTabs: [
        {
          label: "Spring's Dining Room",
          beforeImage: 'https://havenly.com/blog/wp-content/uploads/2023/05/IMG_2180-1-700x933.jpg',
          afterImage: 'https://havenly.com/blog/wp-content/uploads/2023/05/kyliefitts_havenly_bradyburke_19-1-700x993.jpg',
        },
      ],
    },
    {
      label: 'Bathroom',
      icon: 'water-outline',
      nestedTabs: [
        {
          label: "Spring's Bathroom",
          beforeImage: 'https://havenly.com/blog/wp-content/uploads/2022/06/83f085b3f15ab843a8d27e40397d876a-uncropped_scaled_within_1536_1152-700x467.jpg',
          afterImage: 'https://havenly.com/blog/wp-content/uploads/2022/06/kyliefitts_havenly-process_51-3-700x1015.jpg',
        },
      ],
    },
  ];


  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDark ? "#121212" : "#fff" }]}>
      {/* Hero Section */}
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
        <Text style={[styles.heroSubtitle,{ color: isDark ? "#bbb" : "#777" }]}>
          Our platform connects you with talented decorators to make your dream
          home a reality.
        </Text>
        <TouchableOpacity style={styles.heroButton}>
          <Text style={styles.heroButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 0 && styles.activeTab]}
          onPress={() => handleTabChange(0)}
        >
          <Ionicons name="home-outline" size={30} color={selectedTab === 0 ? PRIMARY_COLOR : "#888"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 1 && styles.activeTab]}
          onPress={() => handleTabChange(1)}
        >
          <Ionicons name="bed-outline" size={30} color={selectedTab === 1 ? PRIMARY_COLOR : "#888"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 2 && styles.activeTab]}
          onPress={() => handleTabChange(2)}
        >
          <Ionicons name="restaurant-outline" size={30} color={selectedTab === 2 ? PRIMARY_COLOR : "#888"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 3 && styles.activeTab]}
          onPress={() => handleTabChange(3)}
        >
          <Ionicons name="water-outline" size={30} color={selectedTab === 3 ? PRIMARY_COLOR : "#888"} />
        </TouchableOpacity>
      </View>

      {/* Nested Tabs for each section */}
      <View style={styles.nestedTabsContainer}>
        {tabsConfig[selectedTab].nestedTabs.map((nestedTab, nestedIndex) => (
          <TouchableOpacity
            key={nestedIndex}
            style={[
              styles.nestedTab,
              nestedSelectedTab[selectedTab] === nestedIndex &&
                styles.activeNestedTab,
            ]}
            onPress={() => handleNestedTabChange(selectedTab, nestedIndex)}
          >
            <Text
              style={[
                styles.nestedTabText,
                nestedSelectedTab[selectedTab] === nestedIndex &&
                  styles.activeNestedTabText,
              ]}
            >
              {nestedTab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.imageComparisonContainer}>
  
  <View style={styles.imageRow}>
    <View style={styles.imageWrapper}>
      <Text style={[styles.imageLabel,{ color: isDark ? "#fff" : "#333" }]}>Before</Text>
      <Image
        source={{
          uri: tabsConfig[selectedTab].nestedTabs[nestedSelectedTab[selectedTab]]?.beforeImage,
        }}
        style={styles.image}
      />
    </View>
    <View style={styles.imageWrapper}>
      <Text style={[styles.imageLabel,{ color: isDark ? "#fff" : "#333" }]}>After</Text>
      <Image
        source={{
          uri: tabsConfig[selectedTab].nestedTabs[nestedSelectedTab[selectedTab]]?.afterImage,
        }}
        style={styles.image}
      />
    </View>
  </View>
</View>


    

      {/* Services Section */}
      

      {/* Home Decor Tips Section */}
      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>Home Decor Tips</Text>
        <Text style={[styles.tipsSubtitle,{ color: isDark ? "#fff" : "#333" }]}>
          Check out some of our top tips for transforming your home.
        </Text>
        <View style={styles.tipsContainer}>
          <TouchableOpacity style={styles.tipItem}>
            <Image
              source={{ uri: "https://havenly.com/blog/wp-content/uploads/2022/08/IMG_1503-960x1317.jpg" }}
              style={styles.tipImage}
            />
            <Text style={[styles.tipTitle,{ color: isDark ? "#fff" : "#333" }]}>
              How to Choose the Perfect Paint Color
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tipItem}>
            <Image
              source={{ uri: "https://havenly.com/blog/wp-content/uploads/2022/08/MorganLevy-3252-700x1050.jpg" }}
              style={styles.tipImage}
            />
            <Text style={[styles.tipTitle,{ color: isDark ? "#fff" : "#333" }]}>
              Maximizing Small Spaces: Smart Design Tips
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Call-to-Action Section */}
      <View style={styles.cta}>
        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>Get Your Free Consultation</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#fff"
            style={styles.ctaButtonIcon}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.screenTitle}>Featured Products</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
           <FlatList
         data={products.slice(0, 6)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/product/product-detail/[id]",
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

          {/* ✅ Nút Xem Thêm */}
          <CustomButton
            title="View More"
            onPress={() => router.push("/decor")}
            btnStyle={styles.viewMoreButton}
            labelStyle={styles.viewMoreText}
          />
        </>
      )}
    
    </ScrollView>
  );
}

const PRIMARY_COLOR = "#5fc1f1"; 

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
        paddingTop: 40,
    padding: 8,

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
  cardImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    color: "#333",
  },
  heroSubtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#555",
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
  tabText: {
    fontSize: 16,
    color: "#888",
  },
  activeTabText: {
    color: PRIMARY_COLOR,
  },
  nestedTabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  nestedTab: {
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: "#ddd",
  },
  activeNestedTab: {
    backgroundColor: PRIMARY_COLOR,
  },
  nestedTabText: {
    color: "#333",
  },
  activeNestedTabText: {
    color: "#fff",
  },
  contentContainer: {
    marginTop: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  productList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
},
productWrapper: {
  flex: 1,
  margin: 8,
},
tips: {
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    textAlign: "center",
    marginBottom: 15,
  },
  tipsSubtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 30,
  },
  tipsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  tipItem: {
    width: "45%",
    marginBottom: 20,
    alignItems: "center",
  },
  tipImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  cta: {
    alignItems: "center",
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 18,
    marginRight: 10,
    fontWeight: "bold",
  },
  ctaButtonIcon: {
    color: "#fff",
    fontSize: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
  emptyListText: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    marginTop: 20,
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  imageWrapper: {
    width: "48%",
    alignItems: "center",
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#666",
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
  imageComparisonContainer: {
    marginTop: 20,
    alignItems: "center",
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
});
