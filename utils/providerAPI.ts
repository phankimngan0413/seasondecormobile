import { initApiClient } from "@/utils/axiosConfig";
import { LogBox } from "react-native";

// ✅ Ẩn lỗi Axios 400 từ LogBox
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

// ✅ Interface cho nhà cung cấp
export interface IProvider {
  id: number;
  name: string;
  slug: string;
  bio: string;
  phone: string;
  address: string;
  isProvider: boolean;
  joinedDate: string;
  followersCount: number;
  followingCount: number;
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

// ✅ API GET chi tiết nhà cung cấp theo ID
export const getProviderDetailAPI = async (id: number): Promise<IProvider> => {
  const url = `/api/Provider/getById/${id}`;

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response = await apiClient.get<IProvider>(url);
    console.log("🟢 Full API Response:", response.data);

    if (response.data && typeof response.data === "object") {
      return response.data;
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
