// src/config/apiConfig.ts
import Constants from "expo-constants";
import { Platform } from "react-native";

// API URLs
const SEASON_DECOR_API = "https://seasondecor.azurewebsites.net";
const TUNNEL_API = Constants.expoConfig?.extra?.apiUrl;
const LOCALHOST = "http://localhost:5297";
const LAN_IP = "http://10.0.2.2:5297"; // This is for Android Emulator

// Determine the platform (web or mobile)
const isWeb = Platform.OS === "web";
const isProduction = !__DEV__; // Kiểm tra xem đây có phải môi trường production hay không

// Function to determine the API base URL dynamically
export const getBaseUrl = (): string => {
  // Trong môi trường production (APK), luôn sử dụng Season Decor API
  if (isProduction) {
    console.log("🌐 Production mode: Using Season Decor API:", SEASON_DECOR_API);
    return SEASON_DECOR_API;
  }
  
  // // Trong môi trường development
  const useSeasonDecorApi = true;
  
  if (useSeasonDecorApi) {
    console.log("🌐 Development mode: Using Season Decor API:", SEASON_DECOR_API);
    return SEASON_DECOR_API;
  }
  
  if (TUNNEL_API) {
    return TUNNEL_API; // Use the URL from the Expo config
  }
  
  if (isWeb) {
    return LOCALHOST; // For web use localhost
  }
  
  return LAN_IP; // For mobile apps, use LAN_IP for Android Emulator
};

// Export BASE_URL dynamically
export const BASE_URL = getBaseUrl();

// Kiểm tra kết nối đến API
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/api/health`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Tránh cache
      cache: 'no-cache',
    });
    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

// src/config/apiConfig.ts
// import Constants from "expo-constants";
// import { Platform } from "react-native";

// // API URLs
// const TUNNEL_API = Constants.expoConfig?.extra?.apiUrl;
// const LOCALHOST = "http://10.0.2.2:5297";
// const LAN_IP = "http://10.0.2.2:5297"; // This is for Android Emulator

// // Determine the platform (web or mobile)
// const isWeb = Platform.OS === "web";
// const isProduction = !__DEV__; // Kiểm tra xem đây có phải môi trường production hay không

// // Function to determine the API base URL dynamically
// export const getBaseUrl = (): string => {
//   // Even in production, use localhost for now
//   if (isWeb) {
//     console.log("🌐 Using localhost:", LOCALHOST);
//     return LOCALHOST;
//   } else {
//     console.log("🌐 Using LAN IP for mobile:", LAN_IP);
//     return LAN_IP; // For Android Emulator
//   }
// };

// // Export BASE_URL dynamically
// export const BASE_URL = getBaseUrl();

// // Kiểm tra kết nối đến API
// export const testApiConnection = async (): Promise<boolean> => {
//   try {
//     const response = await fetch(`${BASE_URL}/api/health`, {
//       method: 'GET',
//       headers: { 'Content-Type': 'application/json' },
//       // Tránh cache
//       cache: 'no-cache',
//     });
//     return response.ok;
//   } catch (error) {
//     console.error('API connection test failed:', error);
//     return false;
//   }
// };