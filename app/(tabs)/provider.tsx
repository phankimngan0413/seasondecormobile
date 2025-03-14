import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { getProvidersAPI, IProvider } from "@/utils/providerAPI";

const ProviderScreen = () => {
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const data = await getProvidersAPI();
      setProviders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderClick = (slug: string) => {
    router.push({
      pathname: "/provider/slug",
      params: { slug },
    });
  };

  if (loading) return <ActivityIndicator size="large" color="#3498db" />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;
  if (providers.length === 0) return <Text style={styles.noProviderText}>No providers available.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Providers</Text>
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleProviderClick(item.slug)}
            style={styles.providerWrapper}
          >
            {/* Căn giữa hình ảnh */}
            <View style={styles.avatarContainer}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.businessName}>{item.businessName}</Text>
              <Text style={styles.bio}>{item.bio}</Text>
              <Text style={styles.address}>{item.address}</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.followButton}>
                  <Text style={styles.followText}>Follow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageButton}>
                  <Text style={styles.messageText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.providerList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", 
    paddingTop: 20,
  },
  title: {
    fontSize: 26,  
    fontWeight: "700",  
    color: "#333",
    textAlign: "center",
    marginBottom: 30,  
  },
  providerWrapper: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5, 
    alignItems: "center", // Căn chỉnh các phần tử theo chiều ngang
  },
  avatarContainer: {
    alignItems: "center", // Căn giữa avatar
    marginRight: 20,  // Khoảng cách giữa ảnh và thông tin
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,  
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  businessName: {
    fontSize: 16,
    color: "#3498db",
    marginTop: 8,
  },
  bio: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 12,
  },
  address: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    marginTop: 15,
  },
  followButton: {
    backgroundColor: "#3498db",  
    borderRadius: 25,  // Increased roundness for a modern look
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginRight: 15,
    shadowColor: "#3498db", // Subtle shadow for elevation
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  followText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  messageButton: {
    backgroundColor: "#2ecc71",  
    borderRadius: 25,  // Increased roundness for a modern look
    paddingVertical: 12,
    paddingHorizontal: 25,
    shadowColor: "#2ecc71", // Subtle shadow for elevation
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  providerList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  noProviderText: {
    color: "gray",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default ProviderScreen;
