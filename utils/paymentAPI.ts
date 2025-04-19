import { initApiClient } from "@/config/axiosConfig";
import { getUserIdFromToken } from "@/services/auth";

export interface TopUpRequest {
  amount: number;
  transactionType: number; // 0 for top-up
  transactionStatus: number; // 0 for initial status
  customerId: number;
}

// Define response type for the API
interface TopUpResponse {
  success?: boolean;
  message?: string;
  customerId?: number;
  paymentUrl?: string;
  data?: {
    paymentUrl?: string;
    customerId?: number;
    [key: string]: any;
  } | string;
}

/**
 * Add funds to wallet (top-up)
 * @param amount Amount to add in VND
 * @returns Promise with the transaction result
 */
export const topUpWalletAPI = async (amount: number): Promise<TopUpResponse> => {
  const url = "/api/Payment/top-up-mobile";
  

  const apiClient = await initApiClient();
  
  try {
    // Get current user ID
    const userId = await getUserIdFromToken();
    
    console.log("👤 Retrieved User ID:", userId);

    if (!userId) {
      console.error("❌ User ID not found");
      return {
        success: false,
        message: "Unable to identify user. Please log in again."
      };
    }
    
    const payload: TopUpRequest = {
      amount: amount,
      transactionType: 0, // Top-up
      transactionStatus: 1, // Initial status
      customerId: userId,
    };
    
    console.log(" Payload to be sent:", JSON.stringify(payload, null, 2));

    try {
      const response = await apiClient.post(url, payload);
      
      // Log the ENTIRE backend response
      console.log(" COMPLETE BACKEND RESPONSE:", 
        JSON.stringify({
          status: response.status,
          headers: response.headers,
          data: response.data
        }, null, 2)
      );
      
      // Additional detailed logging
      console.log(" Response Status:", response.status);
      console.log(" Response Headers:", JSON.stringify(response.headers, null, 2));
      console.log(" Response Data:", JSON.stringify(response.data, null, 2));
      
      if (response && response.data) {
        console.log(" Top-Up Successful");
        return response.data;
      } else {
        console.error("🔴 Invalid top-up response");
        return {
          success: false,
          message: "Failed to process payment"
        };
      }
    } catch (apiError: any) {
      // Log full error response if available
      console.error(" COMPLETE API ERROR:", 
        JSON.stringify({
          message: apiError.message,
          response: apiError.response ? {
            status: apiError.response.status,
            data: apiError.response.data,
            headers: apiError.response.headers
          } : null
        }, null, 2)
      );
      
      return {
        success: false,
        message: apiError.response?.data?.message || "Failed to connect to payment service",
      };
    }
  } catch (error: any) {
    console.error(" Unexpected Error:", JSON.stringify(error, null, 2));
    
    return {
      success: false,
      message: error.message || "Unexpected error occurred"
    };
  }
};