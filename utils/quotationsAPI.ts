import { initApiClient } from "@/config/axiosConfig";
import { getToken, getUserIdFromToken } from "@/services/auth";

/**
 * Get paginated quotations for the current customer
 */
// Updated API function that works without parameters
export const getPaginatedQuotationsForCustomerAPI = async () => {
  try {
    console.log('🔍 Initializing API client');
    const apiClient = await initApiClient();
    
    console.log('🔍 Getting authentication token');
    const token = await getToken();

    if (!token) {
      console.error('🔍 No token available');
      throw new Error("Unauthorized: Please log in.");
    }

    console.log('🔍 Token available, proceeding with request');
    
    // Make the request without any parameters since that works
    const response = await apiClient.get(
      "/api/Quotation/getPaginatedQuotationsForCustomer",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("🟢 Paginated Quotations Retrieved:", response.data);
    return response.data || { success: false, data: [], message: "No data received from API" };
  } catch (error: any) {
    console.error("🔴 Get Paginated Quotations API Error:", error);
    
    return { 
      success: false, 
      data: [], 
      message: error.response?.data?.message || "Failed to retrieve quotations." 
    };
  }
};
export const getQuotationDetailByCustomerAPI = async (quotationCode: string) => {
  try {
    console.log('🔍 Getting quotation details for code:', quotationCode);
    const apiClient = await initApiClient();
    const token = await getToken();
    
    if (!token) {
      console.log('🔍 No token available');
      throw new Error("Unauthorized: Please log in.");
    }
    
    // Make the API request
    const response = await apiClient.get(
      `/api/Quotation/getQuotationDetailByCustomer/${quotationCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log("🟢 Quotation detail response received:", response.status);
    
    // Check if the response contains data and has the expected structure
    if (response.data && response.data.success) {
      console.log("🟢 Quotation detail data received successfully");
      return response.data;
    } else {
      console.log("🟡 Received response but data may be incomplete:", response.data);
      return response.data || { 
        success: false, 
        data: null, 
        message: "No data or incomplete data received" 
      };
    }
    
  } catch (error: any) {
    console.error("🔴 Get Quotation Detail API Error:", error);
    
    // Log details about the error
    if (error.response) {
      console.error("🔴 Error status:", error.response.status);
      console.error("🔴 Error data:", error.response.data);
    } else if (error.request) {
      console.error("🔴 No response received:", error.request);
    } else {
      console.error("🔴 Error message:", error.message);
    }
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || "Failed to retrieve quotation details."
    };
  }
};
export const createQuotationByBookingCodeAPI = async (bookingCode: string, quotationData: any) => {
  try {
    const apiClient = await initApiClient();
    const token = await getToken();

    if (!token) {
      throw new Error("Unauthorized: Please log in.");
    }

    const response = await apiClient.post(
      `/api/Quotation/createQuotationByBookingCode/${bookingCode}`,
      quotationData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error creating quotation:", error);
    throw new Error(error.response?.data?.message || "Failed to create quotation");
  }
};

/**
 * Upload a quotation file for a specific booking
 */
export const uploadQuotationFileByBookingCodeAPI = async (bookingCode: string, formData: FormData) => {
  try {
    const apiClient = await initApiClient();
    const token = await getToken();

    if (!token) {
      throw new Error("Unauthorized: Please log in.");
    }

    const response = await apiClient.post(
      `/api/Quotation/uploadQuotationFileByBookingCode/${bookingCode}`,
      formData,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } 
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error uploading quotation file:", error);
    throw new Error(error.response?.data?.message || "Failed to upload quotation file");
  }
};

/**
 * Confirm a quotation by its code
 */
export const confirmQuotationAPI = async (quotationCode: string): Promise<any> => {
  try {
    const apiClient = await initApiClient();
    const token = await getToken();
    
    if (!token) {
      console.error("No authentication token found");
      return {
        success: false,
        message: "Unauthorized: Please log in.",
        errors: [],
        data: null
      };
    }
    
    console.log(`🔍 Sending confirmQuotation request for code: ${quotationCode}`);
    
    // Send true as the request body to confirm the quotation
    const response = await apiClient.put(
      `/api/Quotation/confirmQuotation/${quotationCode}`,
      true,  // Boolean true as request body
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`🔍 Confirm quotation response:`, response.data);
    
    // Return the API response directly since it already matches our expected format
    return response.data;
    
  } catch (error: any) {
    console.error("🔴 Error confirming quotation:", error);
    
    // If the error contains a response from the server, use that information
    if (error.response && error.response.data) {
      console.log("🔴 Server error response:", error.response.data);
      
      // If the server response is already in our expected format
      if (typeof error.response.data === 'object' && 'success' in error.response.data) {
        return error.response.data;
      }
      
      // Otherwise create a standardized error response
      return {
        success: false,
        message: error.response.data.message || "Failed to confirm quotation",
        errors: error.response.data.errors || [],
        data: null
      };
    }
    
    // For network errors or other issues
    return {
      success: false,
      message: error.message || "Network error or server unavailable",
      errors: [],
      data: null
    };
  }
};
/**
 * A debug function to test the API directly
 */
export const testQuotationAPI = async () => {
  try {
    const apiClient = await initApiClient();
    const token = await getToken();
    
    if (!token) {
      return { success: false, message: "No authentication token available" };
    }
    
    const response = await apiClient.get(
      "/api/Quotation/getPaginatedQuotationsForCustomer",
      { 
        params: {
          PageIndex: 0,
          PageSize: 10
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data || { success: false, message: "No data received" };
  } catch (error: any) {
    console.error("API test error:", error);
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};
