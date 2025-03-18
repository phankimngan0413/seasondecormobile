// src/config/apiConfig.ts

import Constants from "expo-constants";
import { Platform } from "react-native";

// If you're using Expo, you can store your API URL in `extra` properties
const TUNNEL_API = Constants.expoConfig?.extra?.apiUrl;
const LOCALHOST = "http://localhost:5297";
const LAN_IP = "http://10.0.2.2:5297"; // This is for Android Emulator

// Determine the platform (web or mobile)
const isWeb = Platform.OS === "web";

// Function to determine the API base URL dynamically
const getBaseUrl = (): string => {
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
