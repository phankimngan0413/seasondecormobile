// Enhanced AuthService to prevent redundant API calls
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";

// Storage key constants
const APP_TOKEN_KEY = "@app_token";

// Cached token to prevent multiple AsyncStorage reads
let cachedToken: string | null = null;
let decodedTokenData: any = null;
let isCheckingToken = false; // Flag to prevent simultaneous checks
let cachedUserId: number | null = null; // Cache the user ID to avoid repeated decoding
let lastUserIdFetch = 0; // Timestamp of the last getUserId call
const USER_ID_CACHE_TTL = 3600000; // Increased to 1 hour to reduce frequency

// Add a simple app-wide memory cache for authenticated state
const cachedAuthState: { isAuthenticated: boolean | null } = { isAuthenticated: null };

// Logging control
let debugLogging = false; // Set to false in production

// Promise cache to avoid duplicate requests in flight
const pendingPromises: Record<string, Promise<any>> = {};

// Helper function for controlled logging
const logDebug = (message: string, ...args: any[]) => {
  if (debugLogging) {
    console.log(message, ...args);
  }
};

/**
 * Authentication Service with token caching
 * - Avoids repeated AsyncStorage reads
 * - Maintains in-memory token cache
 * - Prevents duplicate API calls
 */
class AuthService {
  /**
   * Get the authentication token with promise deduplication
   * - Uses cached token if available
   * - Falls back to AsyncStorage if needed
   * - Prevents multiple simultaneous requests for the same token
   */
  async getToken(): Promise<string | null> {
    // First check memory cache for token before anything else
    if (cachedToken) {
      logDebug("🟢 Using cached token");
      return cachedToken;
    }
    
    const key = 'getToken';
    
    // Check if we already have a pending request
    if (key in pendingPromises) {
      logDebug("🔄 Reusing in-flight token request");
      // Return the existing promise
      return pendingPromises[key] as Promise<string | null>;
    }
  
    try {
      // Create and store the promise
      const promise = this._getTokenInternal();
      pendingPromises[key] = promise;
      
      // Wait for the result
      const result = await promise;
      
      // Clear the promise cache
      delete pendingPromises[key];
      
      return result;
    } catch (error) {
      // Clean up the promise cache on error
      delete pendingPromises[key];
      console.error("🔴 Error in getToken:", error);
      return null;
    }
  }
  
  private async _getTokenInternal(): Promise<string | null> {
    try {
      // Double check cached token (to handle race conditions)
      if (cachedToken) {
        logDebug("🟢 Using cached token (double-check)");
        return cachedToken;
      }

      logDebug("🟡 Getting token from AsyncStorage");
      const token = await AsyncStorage.getItem(APP_TOKEN_KEY);
      
      if (token) {
        // Update cache
        cachedToken = token;
        // Also decode and cache the token data
        this.decodeToken(token);
        cachedAuthState.isAuthenticated = true; // Update auth state
        logDebug("🟢 Token retrieved from storage and cached");
      } else {
        cachedAuthState.isAuthenticated = false; // Update auth state
        logDebug("🟡 No token found in storage");
      }
      
      return token;
    } catch (error) {
      console.error("🔴 Error getting token:", error);
      cachedAuthState.isAuthenticated = false; // Update auth state on error
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
      logDebug("🟡 Setting token");
      
      // Store token in AsyncStorage
      await AsyncStorage.setItem(APP_TOKEN_KEY, token);
      
      // Update cache immediately without verification to reduce calls
      cachedToken = token;
      // Decode and cache the token data
      this.decodeToken(token);
      cachedAuthState.isAuthenticated = true; // Update auth state
      logDebug("🟢 Token stored successfully and cached");
      return true;
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
      
      // Clear all caches
      this.clearCache();
      cachedAuthState.isAuthenticated = false; // Update auth state
      
      logDebug("✅ Token removed and cache cleared (Logout)");
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
      // Only decode if not already decoded or if decodedTokenData is null
      if (!decodedTokenData) {
        decodedTokenData = jwtDecode(token);
        
        // Also cache the user ID here to save additional work later
        if (decodedTokenData) {
          const userId = decodedTokenData?.nameid 
            ? parseInt(decodedTokenData.nameid, 10) 
            : (decodedTokenData?.sub ? parseInt(decodedTokenData.sub, 10) : null);
          
          if (userId) {
            cachedUserId = userId;
            lastUserIdFetch = Date.now();
            logDebug("🟢 User ID cached during token decode:", userId);
          }
        }
      }
    } catch (error) {
      console.error("🔴 Error decoding token:", error);
      decodedTokenData = null;
      cachedUserId = null;
    }
  }

  /**
   * Get user ID from token with caching
   * - Uses cached userId if available and not expired
   * - Falls back to token decoding if needed
   */
  async getUserId(): Promise<number | null> {
    // First, check if we have a cached userId before doing anything else
    const now = Date.now();
    if (cachedUserId !== null && now - lastUserIdFetch < USER_ID_CACHE_TTL) {
      logDebug("🟢 Using cached user ID:", cachedUserId);
      return cachedUserId;
    }
    
    // If we already have a pending promise for this request, return it
    if ('getUserId' in pendingPromises) {
      logDebug("🔄 Reusing in-flight user ID request");
      return pendingPromises['getUserId'];
    }

    try {
      // Create and store the promise
      pendingPromises['getUserId'] = this._getUserIdInternal();
      // Wait for the result
      const result = await pendingPromises['getUserId'];
      // Clear the promise cache
      delete pendingPromises['getUserId'];
      return result;
    } catch (error) {
      // Clean up the promise cache on error
      delete pendingPromises['getUserId'];
      console.error("🔴 Error in getUserId:", error);
      return null;
    }
  }

  /**
   * Internal method for user ID retrieval
   * @private
   */
  private async _getUserIdInternal(): Promise<number | null> {
    try {
      // Double check cache to avoid race conditions
      const now = Date.now();
      if (cachedUserId !== null && now - lastUserIdFetch < USER_ID_CACHE_TTL) {
        logDebug("🟢 Using cached user ID (double-check):", cachedUserId);
        return cachedUserId;
      }
      
      // We need to get and decode the token
      if (!decodedTokenData) {
        const token = await this.getToken();
        if (!token) {
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
        console.warn("⚠️ User ID not found in token");
        return null;
      }
      
      // Update cache
      cachedUserId = userId;
      lastUserIdFetch = now;
      
      logDebug("✅ User ID retrieved:", userId);
      return userId;
    } catch (error) {
      console.error("🔴 Error getting user ID:", error);
      return null;
    }
  }

  /**
   * Check if user is authenticated (without getting the token)
   * Uses cached authentication state for performance
   */
  isUserAuthenticated(): boolean {
    // If we have a cached authentication state, use it
    if (cachedAuthState.isAuthenticated !== null) {
      return cachedAuthState.isAuthenticated;
    }
    
    // If we have a cached token, the user is authenticated
    if (cachedToken) {
      cachedAuthState.isAuthenticated = true;
      return true;
    }
    
    // We don't know yet
    return false;
  }

  /**
   * Handle expired session
   * - Removes token
   * - Shows alert
   * - Redirects to login
   */


  /**
   * Internal method for handling expired sessions
   * @private
   */
  
  /**
   * Redirect to login screen
   * @private
   */
  private redirectToLogin(): void {
    logDebug("🔵 Redirecting to login page...");
    router.replace("/(auth)/login");
  }

  /**
   * Check if user is authenticated with deduplication
   * - Uses locking mechanism to prevent multiple parallel checks
   */
  async checkAuthStatus(): Promise<boolean> {
    // First check if we already know the auth status
    if (cachedAuthState.isAuthenticated !== null) {
      logDebug("🟢 Using cached auth status:", cachedAuthState.isAuthenticated);
      return cachedAuthState.isAuthenticated;
    }
    
    // If we have a cached token, the user is authenticated
    if (cachedToken) {
      cachedAuthState.isAuthenticated = true;
      logDebug("🟢 User is authenticated based on cached token");
      return true;
    }
    
    // If we already have a pending promise for this request, return it
    if ('checkAuthStatus' in pendingPromises) {
      logDebug("🔄 Reusing in-flight auth check");
      return pendingPromises['checkAuthStatus'];
    }
    
    try {
      pendingPromises['checkAuthStatus'] = this._checkAuthStatusInternal();
      const result = await pendingPromises['checkAuthStatus'];
      delete pendingPromises['checkAuthStatus'];
      return result;
    } catch (error) {
      delete pendingPromises['checkAuthStatus'];
      console.error("🔴 Error in checkAuthStatus:", error);
      return false;
    }
  }

  /**
   * Internal method for auth status check
   * @private
   */
  private async _checkAuthStatusInternal(): Promise<boolean> {
    // If another check is already in progress, skip this one
    if (isCheckingToken) {
      logDebug("⚠️ Auth check already in progress, skipping");
      return false;
    }
    
    try {
      isCheckingToken = true; // Mark as checking
      
      // Double check cached values to handle race conditions
      if (cachedAuthState.isAuthenticated !== null) {
        isCheckingToken = false;
        return cachedAuthState.isAuthenticated;
      }
      
      if (cachedToken) {
        cachedAuthState.isAuthenticated = true;
        isCheckingToken = false;
        return true;
      }
      
      const token = await this.getToken();
      const hasToken = !!token;
      cachedAuthState.isAuthenticated = hasToken; // Cache the result
      
      isCheckingToken = false; // Mark as done
      return hasToken;
    } catch (error) {
      console.error("🔴 Error checking auth status:", error);
      cachedAuthState.isAuthenticated = false; // Cache the negative result
      isCheckingToken = false; // Mark as done
      return false;
    }
  }

  /**
   * Refresh authentication token with deduplication
   */
  async refreshAuthToken(): Promise<boolean> {
    // If we already have a pending promise for this request, return it
    if ('refreshAuthToken' in pendingPromises) {
      logDebug("🔄 Reusing in-flight token refresh");
      return pendingPromises['refreshAuthToken'];
    }
    
    try {
      pendingPromises['refreshAuthToken'] = this._refreshAuthTokenInternal();
      const result = await pendingPromises['refreshAuthToken'];
      delete pendingPromises['refreshAuthToken'];
      return result;
    } catch (error) {
      delete pendingPromises['refreshAuthToken'];
      console.error("🔴 Error in refreshAuthToken:", error);
      return false;
    }
  }

  /**
   * Internal method for token refresh
   * @private
   */
  private async _refreshAuthTokenInternal(): Promise<boolean> {
    try {
      const currentToken = await this.getToken();
      if (!currentToken) return false;
      
      // TODO: Add your API call for token refresh
      // const response = await apiClient.post('/api/auth/refresh', { token: currentToken });
      // if (response.success && response.token) {
      //   await this.setToken(response.token);
      //   return true;
      // }
      
      logDebug("🔄 Token refresh functionality not implemented yet");
      return false;
    } catch (error) {
      console.error("🔴 Error refreshing token:", error);
      return false;
    }
  }

  /**
   * Clear cache (useful for testing and logout)
   */
  clearCache(): void {
    cachedToken = null;
    decodedTokenData = null;
    cachedUserId = null;
    lastUserIdFetch = 0;
    cachedAuthState.isAuthenticated = null;
    // Clear all pending promises
    for (const key in pendingPromises) {
      delete pendingPromises[key];
    }
    logDebug("🧹 Auth cache cleared completely");
  }
  
  /**
   * Enable or disable debug logging
   */
  setDebugLogging(enabled: boolean): void {
    debugLogging = enabled;
    console.log(`🔧 Auth debug logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get formatted token for SignalR connections
   * This ensures the token is always properly formatted with "Bearer " prefix
   */
  async getFormattedToken(): Promise<string | null> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.log("🔴 No token available for SignalR connection");
        return null;
      }
      
      // Ensure token has "Bearer " prefix
      const formattedToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      logDebug("🟢 Formatted token for SignalR:", formattedToken);
      return formattedToken;
    } catch (error) {
      console.error("🔴 Error getting formatted token for SignalR:", error);
      return null;
    }
  }

  /**
   * Verify token is valid before SignalR connection
   * Returns true if token is valid, false otherwise
   */
  async verifyTokenForSignalR(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.log("🔴 No token available for SignalR verification");
        return false;
      }
      
      // Check if token is still valid based on decoded data
      // If no decoded data, decode it again
      if (!decodedTokenData) {
        this.decodeToken(token);
      }
      
      if (!decodedTokenData) {
        console.log("🔴 Could not decode token for SignalR verification");
        return false;
      }
      
      // Check if token is still valid
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedTokenData.exp && decodedTokenData.exp < currentTime) {
        console.warn("🔴 SignalR token expired, attempting to refresh");
        const refreshed = await this.refreshAuthToken();
        return refreshed;
      }
      
      logDebug("🟢 Token valid for SignalR connection");
      return true;
    } catch (error) {
      console.error("🔴 Error verifying token for SignalR:", error);
      return false;
    }
  }

  /**
   * Special method for SignalR to get user ID without triggering full auth check
   * This prevents circular calls when SignalR needs user ID for connection
   */
  getUserIdForSignalR(): number | null {
    try {
      // Only get user ID from cache, don't call API
      if (cachedUserId !== null) {
        logDebug("🟢 Using cached user ID for SignalR:", cachedUserId);
        return cachedUserId;
      }
      
      // If we have decoded token data but no user ID
      if (decodedTokenData) {
        const userId = decodedTokenData?.nameid 
          ? parseInt(decodedTokenData.nameid, 10) 
          : (decodedTokenData?.sub ? parseInt(decodedTokenData.sub, 10) : null);
        
        if (userId) {
          cachedUserId = userId;
          lastUserIdFetch = Date.now();
          logDebug("🟢 Extracted user ID for SignalR from decoded token:", userId);
          return userId;
        }
      }
      
      console.log("🔴 Could not get user ID for SignalR");
      return null;
    } catch (error) {
      console.error("🔴 Error getting user ID for SignalR:", error);
      return null;
    }
  }

  /**
   * Check if token is expired
   * Used by SignalR services to proactively refresh token before connection
   */
  isTokenExpired(): boolean {
    try {
      if (!decodedTokenData || !decodedTokenData.exp) {
        // If we can't determine, assume it might be expired
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = decodedTokenData.exp < currentTime;
      
      if (isExpired) {
        logDebug("🔴 Token is expired");
      } else {
        logDebug("🟢 Token is still valid");
      }
      
      return isExpired;
    } catch (error) {
      console.error("🔴 Error checking token expiration:", error);
      return true; // Assume expired on error
    }
  }

  /**
   * Get token expiration time in seconds
   * Used by SignalR services to schedule reconnects before token expiry
   */
  getTokenExpiryTime(): number | null {
    try {
      if (!decodedTokenData || !decodedTokenData.exp) {
        return null;
      }
      
      return decodedTokenData.exp;
    } catch (error) {
      console.error("🔴 Error getting token expiry time:", error);
      return null;
    }
  }

  /**
   * Handle authentication error from SignalR
   * Special method to handle "User is not authenticated" errors 
   */
  async handleSignalRAuthError(): Promise<boolean> {
    try {
      console.warn("🔴 SignalR authentication error detected");
      
      // Check if token is expired
      if (this.isTokenExpired()) {
        console.log("🔄 Token expired, attempting refresh");
        return await this.refreshAuthToken();
      }
      
      // Token not expired but still authentication error
      // Force a new token fetch by clearing cache
      console.log("🔄 Forcing token refresh due to SignalR auth error");
      
      // Clear just the token cache but keep user info
      cachedToken = null;
      decodedTokenData = null;
      
      // Try to get a fresh token
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      console.error("🔴 Error handling SignalR auth error:", error);
      return false;
    }
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
export const checkAuthStatus = () => authService.checkAuthStatus();
export const refreshAuthToken = () => authService.refreshAuthToken();
export const checkIsAuthenticated = () => authService.isUserAuthenticated();

// Helper to toggle debug logging
export const setAuthDebugLogging = (enabled: boolean) => authService.setDebugLogging(enabled);

// New exports for SignalR support
export const getFormattedToken = () => authService.getFormattedToken();
export const verifyTokenForSignalR = () => authService.verifyTokenForSignalR();
export const getUserIdForSignalR = () => authService.getUserIdForSignalR();
export const isTokenExpired = () => authService.isTokenExpired();
export const getTokenExpiryTime = () => authService.getTokenExpiryTime();
export const handleSignalRAuthError = () => authService.handleSignalRAuthError();