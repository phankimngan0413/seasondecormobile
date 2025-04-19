// api-client.ts
import axios, { AxiosInstance } from "axios";
import { getToken, handleSessionExpired } from "@/services/auth"; // Token handling
import { Platform } from "react-native";
import { getUniqueId } from "react-native-device-info";

// API URL configurations
// const SEASON_DECOR_API = "http://season-decor.somee.com";
const TUNNEL_API = process.env.REACT_APP_API_URL;
const LAN_IP = process.env.REACT_APP_LAN_IP || "http://10.0.2.2:5297";
const EMULATOR_IP = process.env.REACT_APP_EMULATOR_IP || "http://10.0.2.2:5297";
const LOCALHOST = process.env.REACT_APP_LOCALHOST_URL || "http://localhost:5297";

const isWeb = Platform.OS === "web";
const isProduction = !__DEV__; // Kiểm tra môi trường production

// Check if running on an emulator
const isEmulator = async (): Promise<boolean> => {
  try {
    const uniqueId = await getUniqueId();
    return uniqueId.includes("emulator") || uniqueId.includes("genymotion");
  } catch (error) {
    console.error("Error checking for emulator:", error);
    return false;
  }
};

// Set up the base URL for API requests
const setupBaseUrl = async (): Promise<string> => {
  // Trong môi trường production, luôn sử dụng Season Decor API
  // if (isProduction) {
  //   console.log("🌐 Production mode: Using Season Decor API:", SEASON_DECOR_API);
  //   return SEASON_DECOR_API;
  // }
  
  // // Trong môi trường development, có thể chuyển đổi
  // const useSeasonDecorApi = true;
  
  // if (useSeasonDecorApi) {
  //   console.log("🌐 Development mode: Using Season Decor API:", SEASON_DECOR_API);
  //   return SEASON_DECOR_API;
  // }
  
  // Logic cho development environment
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

// Initialize Axios client
export const initApiClient = async (): Promise<AxiosInstance> => {
  if (apiClient) return apiClient;
  
  try {
    const baseURL = await setupBaseUrl();
    
    apiClient = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      timeout: 15000, // Tăng thời gian timeout cho mạng chậm
    });
    
    // Request Interceptor: Add Authorization token
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
    
    // Response Interceptor: Handle API responses and errors
    apiClient.interceptors.response.use(
      (response) => response.data ?? response,
      async (error) => {
        if (!error.response) {
          console.error("❌ API connection error:", error.message);
          return Promise.reject({ 
            message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng!" 
          });
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
    
    // Log successful initialization
    console.log("✅ API client initialized with baseURL:", baseURL);
    return apiClient;
  } catch (error) {
    console.error("❌ Failed to initialize API client:", error);
    throw error;
  }
};

// Get initialized API client with auto-initialization
export const getApiClient = async (): Promise<AxiosInstance> => {
  if (!apiClient) {
    return await initApiClient();
  }
  return apiClient;
};

// Synchronous version (for compatibility with existing code)
export const getApiClientSync = (): AxiosInstance => {
  if (!apiClient) {
    console.warn("⚠️ API client not initialized yet. Initializing now...");
    // Create a temporary client to avoid errors
    const tempClient = axios.create({
      // baseURL: SEASON_DECOR_API,
      headers: { "Content-Type": "application/json" },
    });
    
    // Trigger async initialization in background
    initApiClient().catch(err => console.error("Failed background initialization:", err));
    
    return tempClient;
  }
  return apiClient;
};