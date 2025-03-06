import axios from "axios";
import { getToken, handleSessionExpired } from "@/services/auth";
import { Platform } from "react-native";
import Constants from "expo-constants";

// ✅ Kiểm tra Expo Tunnel (nếu có)
const TUNNEL_API = Constants.expoConfig?.extra?.apiUrl; // Lấy URL của Expo Tunnel nếu có

// ✅ Địa chỉ IP LAN nếu không dùng Tunnel
const LAN_IP = "http://192.168.100.5:5297"; // ⚡️ Thay bằng IP thật của máy tính

// ✅ Địa chỉ IP cho Android Emulator
const EMULATOR_IP = "http://10.0.2.2:5297"; // Địa chỉ IP cho Android Emulator

// ✅ Chọn API URL tự động
const isRealDevice = Platform.OS === "android" && Constants.isDevice; // Kiểm tra thiết bị Android thật
const isWeb = Platform.OS === "web"; // Nếu là Web
const isEmulator = Platform.OS === "android" && !Constants.isDevice; // Nếu chạy trên Android Emulator

// Cập nhật BASE_URL cho điện thoại thật, máy ảo hoặc khi dùng Expo Tunnel
let BASE_URL = LAN_IP; // Mặc định là LAN_IP

if (TUNNEL_API) {
  BASE_URL = TUNNEL_API; // Nếu có Expo Tunnel, dùng URL Tunnel
} else if (isRealDevice) {
  BASE_URL = LAN_IP; // Nếu là điện thoại thật, dùng IP LAN
} else if (isEmulator) {
  BASE_URL = EMULATOR_IP; // Nếu là Android Emulator, dùng IP máy ảo
} else if (isWeb) {
  BASE_URL = "http://localhost:5297"; // Nếu là Web, dùng localhost
}

// In ra giá trị BASE_URL và kiểm tra thiết bị
console.log("Platform OS:", Platform.OS);
console.log("Device Check:", isRealDevice ? "Real Device" : isEmulator ? "Emulator" : "Web");
console.log("🔵 API BASE URL:", BASE_URL);

// ✅ Tạo instance Axios
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
      console.error("🔴 Lỗi lấy Token:", error);
    }
    return config;
  },
  (error) => {
    console.error("🔴 Lỗi request Axios:", error);
    return Promise.reject(error);
  }
);

// ✅ Middleware: Xử lý response
apiClient.interceptors.response.use(
  (response) => response.data ?? response,
  async (error) => {
    if (error?.response) {
      const { status, data } = error.response;
      console.error(`🔴 Lỗi API: ${status}`, data);

      // ❌ Xử lý lỗi 401 (Unauthorized)
      if (status === 401) {
        console.warn("⚠️ Token hết hạn, đăng xuất...");
        await handleSessionExpired();
      }
    }
    return Promise.reject(error);
  }
);

// ✅ Xuất Axios instance
export default apiClient;
