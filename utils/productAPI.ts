import { initApiClient } from "@/utils/axiosConfig";
import { LogBox } from "react-native";

// ✅ Ẩn lỗi Axios 400 từ LogBox
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

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
  
}


// ✅ API GET danh sách sản phẩm
export const getProductsAPI = async (): Promise<IProduct[]> => {
  const url = "/api/Product/getList";

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response = await apiClient.get<IProduct[]>(url); // ✅ API trả về mảng
    console.log("🟢 Full API Response:", response.data);

    // ✅ Nếu API trả về một mảng, trả về luôn
    if (Array.isArray(response.data)) {
      return response.data;
    }

    console.error("🔴 API Response không hợp lệ:", response.data);
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
    console.log("🟢 Full API Response:", response.data);

    // ✅ API trả về một object, trả về luôn
    if (response.data && typeof response.data === "object") {
      return response.data;
    }

    console.error("🔴 API Response không hợp lệ:", response.data);
    return Promise.reject(new Error("Invalid response from server."));
  } catch (error: any) {
    console.error("🔴 Get Product Detail API Error:", error);

    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    return Promise.reject(new Error("Network error, please try again."));
  }
};

