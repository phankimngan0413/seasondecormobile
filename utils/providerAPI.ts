import { initApiClient } from "@/utils/axiosConfig";
import { LogBox } from "react-native";

// ✅ Ẩn lỗi Axios 400 từ LogBox
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

// ✅ Interface cho nhà cung cấp
export interface IProvider {
  id: number;
  name: string;
  businessName: string;
  slug: string;
  avatar: string;
  bio: string;
  phone: string;
  address: string;
  isProvider: boolean;
  providerVerified: boolean;
  joinedDate: string;
  followersCount: number;
  followingsCount: number;
}

// ✅ Interface cho sản phẩm
export interface IProduct {
  totalRate: number;
  reviews: never[];
  imageUrls: never[];
  totalSold: number;
  rate: number;
  id: number;
  productName: string;
  description: string;
  productPrice: number;
  quantity: number;
  madeIn: string;
  shipFrom: string;
  createAt: string;
  status: string;
  categoryId: number;
  accountId: number;
}

// ✅ API GET danh sách nhà cung cấp
export const getProvidersAPI = async (): Promise<IProvider[]> => {
  const url = "/api/Provider/getAll";

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response = await apiClient.get<IProvider[]>(url);
    console.log("🟢 Full API Response:", response.data);

    if (Array.isArray(response.data)) {
      return response.data;
    }

    console.error("🔴 API Response không hợp lệ:", response.data);
    return Promise.reject(new Error("Invalid response from server."));
  } catch (error: any) {
    console.error("🔴 Get Providers API Error:", error);

    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    return Promise.reject(new Error("Network error, please try again."));
  }
};

// ✅ API GET chi tiết nhà cung cấp theo slug
export const getProviderDetailAPI = async (slug: string): Promise<IProvider> => {
  const url = `/api/Provider/profile/${slug}`;

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response = await apiClient.get<IProvider>(url);
    console.log("🟢 Full API Response:", response.data);

    if (response.data && typeof response.data === "object") {
      return {
        ...response.data,
        providerVerified: response.data.providerVerified || false, // Default to false if missing
        followersCount: response.data.followersCount || 0, // Default to 0 if missing
        followingsCount: response.data.followingsCount || 0, // Default to 0 if missing
      };
    }

    console.error("🔴 API Response không hợp lệ:", response.data);
    return Promise.reject(new Error("Invalid response from server."));
  } catch (error: any) {
    console.error("🔴 Get Provider Detail API Error:", error);

    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    return Promise.reject(new Error("Network error, please try again."));
  }
};
export const getProductsByProviderAPI = async (slug: string): Promise<IProduct[]> => {
  const url = `/api/Product/getProductByProvider/${slug}`;

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response = await apiClient.get<IProduct[]>(url);
    console.log("🟢 Full API Response:", response.data);

    if (Array.isArray(response.data)) {
      // Ensuring the returned products adhere to the IProduct interface with default values for missing fields
      return response.data.map((product) => ({
        ...product,
        rate: product.rate || 0, // Default rate to 0 if missing
        totalRate: product.totalRate || 0, // Default totalRate to 0 if missing
        totalSold: product.totalSold || 0, // Default totalSold to 0 if missing
        imageUrls: product.imageUrls || [], // Default imageUrls to empty array if missing
        reviews: product.reviews || [], // Default reviews to empty array if missing
      }));
    }

    console.error("🔴 API Response không hợp lệ:", response.data);
    return Promise.reject(new Error("Invalid response from server."));
  } catch (error: any) {
    console.error("🔴 Get Products by Provider API Error:", error);

    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    return Promise.reject(new Error("Network error, please try again."));
  }
};
