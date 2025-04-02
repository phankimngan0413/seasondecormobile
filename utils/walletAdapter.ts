// Add this to your walletAPI.ts file or create a new adapter file

import { initApiClient } from "@/config/axiosConfig";
import { IWalletBalance } from "./walletAPI"; // Import your existing interface

/**
 * Adapter function that maps the actual API response to the expected IWalletBalance interface
 */
export const fetchWalletBalance = async (): Promise<IWalletBalance> => {
  const url = "/api/wallet/getWalletBalance";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    // Extract the data from the actual API response format
    if (response && response.data) {
      const apiResponse = response.data;
      
      // Check if the response has the expected structure
      if (apiResponse.success && apiResponse.data && typeof apiResponse.data.balance === 'number') {
        // Map from actual API format to your interface
        return {
          success: true,
          balance: apiResponse.data.balance,
          currency: "VND", // Add default currency since it's not in the response
          lastUpdated: new Date().toISOString(), // Add timestamp since it's not in the response
          message: apiResponse.message
        };
      }
    }
    
    // If we reach here, something was wrong with the response format
    console.error("🔴 Unexpected wallet balance response format:", response?.data);
    return {
      success: false,
      balance: 0,
      currency: "VND",
      lastUpdated: new Date().toISOString(),
      message: "Failed to retrieve balance information"
    };
  } catch (error: any) {
    console.error("🔴 Error fetching wallet balance:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      balance: 0,
      currency: "VND",
      lastUpdated: new Date().toISOString(),
      message: "Failed to connect to wallet service"
    };
  }
};