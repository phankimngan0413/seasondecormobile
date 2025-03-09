import axios, { AxiosInstance } from "axios";
import { getToken, handleSessionExpired } from "@/services/auth";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { getUniqueId } from "react-native-device-info";

// ✅ Định nghĩa các địa chỉ API
const TUNNEL_API = Constants.expoConfig?.extra?.apiUrl;
const LAN_IP = "http://192.168.100.5:5297"; // 🔹 Địa chỉ IP máy tính
const EMULATOR_IP = "http://10.0.2.2:5297"; // 🔹 Địa chỉ IP cho Android Emulator
const LOCALHOST = "http://localhost:5297"; // 🔹 Dùng localhost nếu chạy trên web

// ✅ Kiểm tra thiết bị đang chạy
const isWeb = Platform.OS === "web";

// 🔹 Hàm kiểm tra máy ảo chính xác hơn
const isEmulator = async (): Promise<boolean> => {
  const uniqueId = await getUniqueId();
  return uniqueId.includes("emulator") || uniqueId.includes("genymotion");
};

// 🔹 Xác định `BASE_URL`
const setupBaseUrl = async (): Promise<string> => {
  let BASE_URL = LAN_IP; // Mặc định IP máy tính

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

// ✅ Biến lưu trữ instance của `apiClient`
let apiClient: AxiosInstance | null = null; // 🛠️ Khai báo kiểu AxiosInstance

// ✅ Hàm khởi tạo `apiClient`
export const initApiClient = async (): Promise<AxiosInstance> => {
  if (apiClient) return apiClient; // 🔹 Nếu đã có, trả về luôn

  const baseURL = await setupBaseUrl();

  apiClient = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  // ✅ Thêm Token vào mỗi request
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("❌ Lỗi khi lấy Token:", error);
      }
      return config;
    },
    (error) => {
      console.error("❌ Lỗi request Axios:", error);
      return Promise.reject(error);
    }
  );

  // ✅ Xử lý response và lỗi API
  apiClient.interceptors.response.use(
    (response) => response.data ?? response,
    async (error) => {
      if (!error.response) {
        console.error("❌ Không thể kết nối API:", error.message);
        return Promise.reject({ message: "Mất kết nối tới máy chủ. Vui lòng kiểm tra mạng!" });
      }

      const { status, data } = error.response;
      console.error(`❌ Lỗi API [${status}]:`, data);

      if (status === 401) {
        console.warn("⚠️ Token hết hạn, đăng xuất...");
        await handleSessionExpired();
      }

      return Promise.reject(data);
    }
  );

  return apiClient;
};

// ✅ Xuất `apiClient` đã được khởi tạo (chỉ dùng nếu chắc chắn `initApiClient()` đã chạy trước)
export const getApiClient = (): AxiosInstance => {
  if (!apiClient) throw new Error("API client chưa được khởi tạo. Gọi initApiClient() trước.");
  return apiClient;
};
