// Cập nhật AuthService để tránh gọi liên tục
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";

// Storage key constants
const APP_TOKEN_KEY = "@app_token";

// Cached token to prevent multiple AsyncStorage reads
let cachedToken: string | null = null;
let decodedTokenData: any = null;
let isCheckingToken = false; // Flag để tránh kiểm tra đồng thời

/**
 * Authentication Service with token caching
 * - Avoids repeated AsyncStorage reads
 * - Maintains in-memory token cache
 */
class AuthService {
  /**
   * Get the authentication token
   * - Uses cached token if available
   * - Falls back to AsyncStorage if needed
   */
  async getToken(): Promise<string | null> {
    try {
      // Return cached token if available
      if (cachedToken) {
        console.log("🟢 Using cached token");
        return cachedToken;
      }

      console.log("🟡 Getting token from AsyncStorage");
      const token = await AsyncStorage.getItem(APP_TOKEN_KEY);
      
      if (token) {
        // Update cache
        cachedToken = token;
        // Also decode and cache the token data
        this.decodeToken(token);
        console.log("🟢 Token retrieved from storage and cached");
      } else {
        console.log("🟡 No token found in storage");
      }
      
      return token;
    } catch (error) {
      console.error("🔴 Error getting token:", error);
      return null;
    }
  }

  /**
   * Set authentication token
   * - Stores in AsyncStorage
   * - Updates in-memory cache
   */
  async setToken(token: string): Promise<boolean> {
    try {
      console.log("🟡 Setting token");
      
      // Store token in AsyncStorage
      await AsyncStorage.setItem(APP_TOKEN_KEY, token);
      
      // Verify storage was successful
      const storedToken = await AsyncStorage.getItem(APP_TOKEN_KEY);
      if (storedToken === token) {
        // Update cache
        cachedToken = token;
        // Also decode and cache the token data
        this.decodeToken(token);
        console.log("🟢 Token stored successfully and cached");
        return true;
      } else {
        console.error("🔴 Token verification failed");
        return false;
      }
    } catch (error) {
      console.error("🔴 Error storing token:", error);
      throw new Error("Failed to save authentication data");
    }
  }

  /**
   * Remove the token (logout)
   * - Clears AsyncStorage
   * - Clears in-memory cache
   */
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(APP_TOKEN_KEY);
      
      // Clear cache
      cachedToken = null;
      decodedTokenData = null;
      
      console.log("✅ Token removed and cache cleared (Logout)");
    } catch (error) {
      console.error("🔴 Error removing token:", error);
    }
  }

  /**
   * Decode and cache token data
   * @private
   */
  private decodeToken(token: string): void {
    try {
      decodedTokenData = jwtDecode(token);
    } catch (error) {
      console.error("🔴 Error decoding token:", error);
      decodedTokenData = null;
    }
  }

  /**
   * Get user ID from token
   * - Uses cached decoded token data if available
   */
  async getUserId(): Promise<number | null> {
    try {
      // If we don't have decoded data but might have a token
      if (!decodedTokenData) {
        const token = await this.getToken();
        if (!token) {
          console.warn("No token found, unable to extract user ID");
          return null;
        }
        
        // Token should already be decoded by getToken()
        if (!decodedTokenData) {
          console.warn("⚠️ Failed to decode token data");
          return null;
        }
      }
      
      // Extract user ID from decoded token
      const userId = decodedTokenData?.nameid 
        ? parseInt(decodedTokenData.nameid, 10) 
        : (decodedTokenData?.sub ? parseInt(decodedTokenData.sub, 10) : null);
      
      if (!userId) {
        console.warn("⚠️ User ID not found in token. Token data:", decodedTokenData);
        return null;
      }
      
      console.log("✅ User ID retrieved:", userId);
      return userId;
    } catch (error) {
      console.error("🔴 Error getting user ID:", error);
      return null;
    }
  }

  /**
   * Handle expired session
   * - Removes token
   * - Shows alert
   * - Redirects to login
   */
  async handleSessionExpired(): Promise<void> {
    try {
      console.warn("⚠️ Token expired, logging out...");
      await this.removeToken();
      
      // Show alert and redirect
      Alert.alert(
        "Phiên đăng nhập hết hạn", 
        "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.", 
        [{ text: "OK", onPress: () => this.redirectToLogin() }]
      );
    } catch (error) {
      console.error("🔴 Error handling expired session:", error);
      // Try to redirect anyway
      this.redirectToLogin();
    }
  }

  /**
   * Redirect to login screen
   * @private
   */
  private redirectToLogin(): void {
    console.log("🔵 Redirecting to login page...");
    router.replace("/(auth)/login");
  }

  /**
   * Check if user is authenticated
   * - Uses locking mechanism to prevent multiple parallel checks
   */
  async checkAuthStatus(): Promise<boolean> {
    // Nếu đang kiểm tra, bỏ qua
    if (isCheckingToken) {
      console.log("⚠️ Auth check already in progress, skipping");
      return false;
    }
    
    try {
      isCheckingToken = true; // Đánh dấu đang kiểm tra
      
      // Nếu đã có token trong cache, sử dụng ngay
      if (cachedToken) {
        console.log("🟢 Using cached token for auth check");
        isCheckingToken = false;
        return true;
      }
      
      const token = await this.getToken();
      const hasToken = !!token;
      
      isCheckingToken = false; // Đánh dấu đã xong
      return hasToken;
    } catch (error) {
      console.error("🔴 Error checking auth status:", error);
      isCheckingToken = false; // Đánh dấu đã xong
      return false;
    }
  }

  /**
   * Refresh authentication token
   * - Implement your API call here
   */
  async refreshAuthToken(): Promise<boolean> {
    try {
      const currentToken = await this.getToken();
      if (!currentToken) return false;
      
      // TODO: Add your API call for token refresh
      // const response = await apiClient.post('/api/auth/refresh', { token: currentToken });
      // if (response.success && response.token) {
      //   await this.setToken(response.token);
      //   return true;
      // }
      
      console.log("🔄 Token refresh functionality not implemented yet");
      return false;
    } catch (error) {
      console.error("🔴 Error refreshing token:", error);
      return false;
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    cachedToken = null;
    decodedTokenData = null;
    console.log("🧹 Auth cache cleared");
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;

// Export individual methods for backward compatibility
export const getToken = () => authService.getToken();
export const setToken = (token: string) => authService.setToken(token);
export const removeToken = () => authService.removeToken();
export const getUserIdFromToken = () => authService.getUserId();
export const handleSessionExpired = () => authService.handleSessionExpired();
export const checkAuthStatus = () => authService.checkAuthStatus();
export const refreshAuthToken = () => authService.refreshAuthToken();