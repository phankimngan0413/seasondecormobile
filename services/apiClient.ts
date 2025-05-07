// src/services/apiClient.ts
import axios, { AxiosInstance, AxiosError } from "axios";
import { BASE_URL } from "../config/apiConfig";
import { getToken } from "@/services/auth"; // Token handling
import { Platform } from "react-native";

let apiClient: AxiosInstance | null = null;

// Connection status for the app
export const connectionStatus = {
  isConnected: false,
  lastError: null as string | null,
  baseUrl: BASE_URL,
};

// Initialize Axios client
export const initApiClient = async (force = false): Promise<AxiosInstance> => {
  if (apiClient && !force) return apiClient;
  
  try {
    console.log("Initializing API client...");
    
    // Use the BASE_URL from config
    const baseURL = BASE_URL;
    connectionStatus.baseUrl = baseURL;
    
    // Create new client
    apiClient = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-Client-Platform": Platform.OS,
      },
      timeout: 15000, // Increased timeout for slower connections
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
      (response) => {
        // Reset connection state on successful response
        connectionStatus.isConnected = true;
        connectionStatus.lastError = null;
        return response.data ?? response;
      },
      async (error: AxiosError) => {
        if (!error.response) {
          console.error("❌ API connection error:", error.message);
          connectionStatus.isConnected = false;
          connectionStatus.lastError = "No connection to the server";
          return Promise.reject({ message: "No connection to the server. Please check your network!" });
        }
        
        const { status, data } = error.response;
        console.error(`❌ API Error [${status}]:`, data);
        
        if (status === 401) {
          console.warn("⚠️ Token expired, logging out...");
        }
        
        return Promise.reject(data);
      }
    );
    
    // Simple test to make sure we can connect
    try {
      await apiClient.get("/api/health");
      connectionStatus.isConnected = true;
      connectionStatus.lastError = null;
    } catch (err) {
      console.warn("API health check failed, but continuing anyway");
    }
    
    console.log("🌐 API client initialized successfully with base URL:", baseURL);
    return apiClient;
  } catch (error) {
    console.error("Failed to initialize API client:", error);
    throw error;
  }
};

// Get initialized API client with auto-init
export const getApiClient = async (): Promise<AxiosInstance> => {
  if (!apiClient) {
    return await initApiClient();
  }
  return apiClient;
};

// For synchronous code that needs an API client immediately
// Will throw an error if used before initialization
export const getApiClientSync = (): AxiosInstance => {
  if (!apiClient) {
    throw new Error("API client not initialized. Call initApiClient() first.");
  }
  return apiClient;
};