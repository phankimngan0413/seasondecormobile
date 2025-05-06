import { initApiClient } from "@/config/axiosConfig";
import { LogBox } from "react-native";

// ✅ Ẩn lỗi Axios 400 từ LogBox
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

// Thêm interface Provider mới
export interface IProvider {
  businessName: string;
  followersCount: number;
  followingsCount: number;
  id: number;
  isProvider: boolean;
  joinedDate: string;
  providerVerified: boolean;
  slug?: string;
}

export interface IProduct {
  id: number;
  productName: string;
  rate: number;
  totalRate: number;
  totalSold: number;
  description: string;
  productPrice: number;
  quantity: number;
  madeIn: string;
  shipFrom: string;
  categoryId: number;
  imageUrls: string[];
  reviews: any[];
  items: any[];
  // Thêm thuộc tính provider từ API response
  provider?: IProvider;
  
  // Các thuộc tính khác từ API response
  accountId?: number;
  basePrice?: number;
  categoryName?: string;
  createAt?: string;
  decorCategoryId?: number;
  favoriteCount?: number;
  images?: any[];
  province?: string;
  seasons?: any[];
  style?: string;
  slug?: string;
}
// Add this to your types
export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
// ✅ API GET danh sách sản phẩm
export const getProductsAPI = async (): Promise<IProduct[]> => {
  const url = "/api/Product/getList";

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response = await apiClient.get<IProduct[]>(url); // ✅ API trả về mảng

    // ✅ Nếu API trả về một mảng, trả về luôn
    if (Array.isArray(response.data)) {
      return response.data;
    }

    return Promise.reject(new Error("Invalid response from server."));
  } catch (error: any) {
    console.error("🔴 Get Products API Error:", error);

    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    return Promise.reject(new Error("Network error, please try again."));
  }
};

// ✅ API GET chi tiết sản phẩm theo ID
export const getProductDetailAPI = async (id: number): Promise<IProduct> => {
  const url = `/api/Product/getById/${id}`;

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response = await apiClient.get<IProduct>(url); // ✅ API trả về object trực tiếp

    // ✅ API trả về một object, trả về luôn
    if (response.data && typeof response.data === "object") {
      return response.data;
    }

    return Promise.reject(new Error("Invalid response from server."));
  } catch (error: any) {
    console.error("🔴 Get Product Detail API Error:", error);

    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    return Promise.reject(new Error("Network error, please try again."));
  }
};
// ✅ API GET danh sách sản phẩm theo Provider (có phân trang)
// ✅ API GET danh sách sản phẩm theo Provider (có phân trang)
export const getProductsByProviderAPI = async (
  slug: string, 
  page: number = 1, 
  pageSize: number = 10
): Promise<{
  items: IProduct[],
  totalItems: number,
  totalPages: number,
  currentPage: number
}> => {
  const url = `/api/Product/getPaginatedListByProvider`;
  
  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);
  
  try {
    const response = await apiClient.get(url, {
      params: {
        slug,
        page,
        pageSize
      }
    });
    
    
    // ✅ Handle the actual response structure with data and totalCount
    if (response.data && typeof response.data === "object") {
      // Check if response has data array
      if (Array.isArray(response.data.data)) {
        const totalItems = response.data.totalCount || response.data.data.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        
        return {
          items: response.data.data,
          totalItems: totalItems,
          totalPages: totalPages,
          currentPage: page
        };
      }
      
      // Handle case where data itself is an array
      if (Array.isArray(response.data)) {
        return {
          items: response.data,
          totalItems: response.data.length,
          totalPages: Math.ceil(response.data.length / pageSize),
          currentPage: page
        };
      }
    }
    
    return Promise.reject(new Error("Invalid response from server."));
  } catch (error: any) {
    console.error("🔴 Get Products By Provider API Error:", error);
    
    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }
    
    // Handle 404 specifically
    if (error.response && error.response.status === 404) {
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page
      };
    }
    
    return Promise.reject(new Error("Network error, please try again."));
  }
};