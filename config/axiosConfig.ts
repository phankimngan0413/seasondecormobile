import axios, { AxiosInstance } from "axios";
import { getToken, handleSessionExpired } from "@/services/auth"; // Token handling
import { Platform } from "react-native";
import Constants from "expo-constants";
import { getUniqueId } from "react-native-device-info";

// Lấy các giá trị BASE_URL từ biến môi trường
const TUNNEL_API = process.env.REACT_APP_API_URL;
const LAN_IP = process.env.REACT_APP_LAN_IP || "http://10.0.2.2:5297";
const EMULATOR_IP = process.env.REACT_APP_EMULATOR_IP || "http://10.0.2.2:5297";
const LOCALHOST = process.env.REACT_APP_LOCALHOST_URL || "http://localhost:5297";

const isWeb = Platform.OS === "web";

// Kiểm tra xem có phải emulator không
const isEmulator = async (): Promise<boolean> => {
  const uniqueId = await getUniqueId();
  return uniqueId.includes("emulator") || uniqueId.includes("genymotion");
};

// Thiết lập BASE_URL cho API requests
const setupBaseUrl = async (): Promise<string> => {
  let BASE_URL = LAN_IP;

  if (TUNNEL_API) {
    BASE_URL = TUNNEL_API;
  } else if (isWeb) {
    BASE_URL = LOCALHOST;
  } else if (await isEmulator()) {
    BASE_URL = EMULATOR_IP;
  } else {
    BASE_URL = LAN_IP;
  }

  console.log("🌐 API BASE URL:", BASE_URL);
  return BASE_URL;
};

let apiClient: AxiosInstance | null = null;

// Khởi tạo Axios client
export const initApiClient = async (): Promise<AxiosInstance> => {
  if (apiClient) return apiClient;

  const baseURL = await setupBaseUrl();

  apiClient = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  // Request Interceptor: Thêm Authorization token
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("❌ Error while getting token:", error);
      }
      return config;
    },
    (error) => {
      console.error("❌ Axios request error:", error);
      return Promise.reject(error);
    }
  );

  // Response Interceptor: Xử lý API response và errors
  apiClient.interceptors.response.use(
    (response) => response.data ?? response,
    async (error) => {
      if (!error.response) {
        console.error("❌ API connection error:", error.message);
        return Promise.reject({ message: "No connection to the server. Please check your network!" });
      }

      const { status, data } = error.response;
      console.error(`❌ API Error [${status}]:`, data);

      if (status === 401) {
        console.warn("⚠️ Token expired, logging out...");
        await handleSessionExpired();
      }

      return Promise.reject(data);
    }
  );

  return apiClient;
};

// Lấy API client đã khởi tạo
export const getApiClient = (): AxiosInstance => {
  if (!apiClient) throw new Error("API client not initialized. Call initApiClient() first.");
  return apiClient;
};
