// api-client.ts
import axios, { AxiosInstance } from "axios";
import { getToken } from "@/services/auth"; // Token handling
import { Platform } from "react-native";
import { getUniqueId } from "react-native-device-info";

// API URL configurations
const SEASON_DECOR_API = "https://seasondecor.azurewebsites.net";
const TUNNEL_API = process.env.REACT_APP_API_URL;
const LAN_IP = process.env.REACT_APP_LAN_IP || "http://10.0.2.2:5297";
const EMULATOR_IP = process.env.REACT_APP_EMULATOR_IP || "http://10.0.2.2:5297";
const LOCALHOST = process.env.REACT_APP_LOCALHOST_URL || "http://localhost:5297";

const isWeb = Platform.OS === "web";
const isProduction = !__DEV__; // Check for production environment

// Track Google authentication state to prevent error alerts
let isProcessingGoogleAuth = false;
let isHandlingSessionExpiry = false;

// Utility function to set Google auth processing state
export const setGoogleAuthProcessing = (isProcessing: boolean) => {
  isProcessingGoogleAuth = isProcessing;
  console.log(`Google auth processing state: ${isProcessing ? 'ON' : 'OFF'}`);
  
  // Auto-reset after timeout
  if (isProcessing) {
    setTimeout(() => {
      isProcessingGoogleAuth = false;
    }, 10000);
  }
};

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
  // Logic for development environment
  let BASE_URL = LAN_IP;
  
  if (SEASON_DECOR_API) {
    BASE_URL = SEASON_DECOR_API;
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
      timeout: 30000, // Increased timeout for slower networks
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
        // Handle network errors (no response)
        if (!error.response) {
          console.error("❌ API connection error:", error.message);
          const message = error.message.includes("timeout") 
            ? "Request timed out. Please try again." 
            : "Cannot connect to the server. Please check your internet connection!";
          return Promise.reject({ message });
        }
        
        const { status, data } = error.response;
        console.error(`❌ API Error [${status}]:`, data);
        
        // Handle unauthorized errors (401)
        if (status === 401) {
          // Skip session expired handling if processing Google auth
          if (isProcessingGoogleAuth) {
            console.log("Suppressing 401 error during Google authentication");
            return Promise.reject(data);
          }
          
          // Prevent multiple session expired handlers
          if (!isHandlingSessionExpiry) {
            isHandlingSessionExpiry = true;
            
            try {
              // await handleSessionExpired();
            } finally {
              // Reset flag after delay
              setTimeout(() => {
                isHandlingSessionExpiry = false;
              }, 3000);
            }
          } else {
          }
        }
        
        // Meaningful error message for bad requests
        if (status === 400 && data.message) {
          return Promise.reject({
            message: data.message || "Invalid request",
            errors: data.errors || []
          });
        }
        
        // Return standardized error format
        return Promise.reject(data || { 
          message: `Server error (${status})` 
        });
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
      headers: { "Content-Type": "application/json" },
    });
    
    // Trigger async initialization in background
    initApiClient().catch(err => console.error("Failed background initialization:", err));
    
    return tempClient;
  }
  return apiClient;
};