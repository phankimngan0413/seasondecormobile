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
    console.log("🟢 Response data:", JSON.stringify(response.data).substring(0, 200) + "...");
    
    // Direct data response (no success/data wrapper)
    if (response.data && typeof response.data === 'object') {
      // Check if the response data has the expected properties of a quotation
      if (response.data.quotationCode) {
        console.log("🟢 API returned quotation data directly");
        
        // Map field names if needed
        if (response.data.quotationFilePath && !response.data.filePath) {
          response.data.filePath = response.data.quotationFilePath;
        }
        
        if (response.data.materials && !response.data.materialDetails) {
          response.data.materialDetails = response.data.materials;
        }
        
        if (response.data.constructionTasks && !response.data.constructionDetails) {
          response.data.constructionDetails = response.data.constructionTasks;
        }
        
        return response.data;
      }
      
      // Handle nested data structure
      if (response.data.success === true && response.data.data) {
        console.log("🟢 API returned success/data structure");
        return response.data.data;
      }
      
      // Log what properties we got for debugging
      if (typeof response.data === 'object') {
        console.log("🟡 Received response but data structure not as expected:", 
          Object.keys(response.data));
      }
    }
    
    // If we got here, we couldn't find usable data
    console.log("🟡 No usable data found");
    return null;
    
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
    
    throw error; // Re-throw to be handled by the component
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
      null,  // Try with null body instead of true
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`🔍 Confirm quotation response:`, response.data);
    
    // Handle null response case
    if (response.data === null || response.data === undefined) {
      console.log(`🔍 API returned null/undefined - assuming success`);
      return {
        success: true,
        message: "Quotation confirmed successfully",
        data: null
      };
    }
    
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
/**
 * Remove a product from a quotation
 * @param quotationCode The code of the quotation
 * @param productId The ID of the product to remove
 * @returns API response
 */
export const removeProductFromQuotationAPI = async (quotationCode: string, productId: number): Promise<any> => {
  try {
    // More detailed logging for debugging
    console.log(`🔍 Removing product ${productId} from quotation ${quotationCode}`);
    console.log(`🔍 Product ID type: ${typeof productId}`);
    
    const apiClient = await initApiClient();
    const token = await getToken();
    
    if (!token) {
      console.error('🔍 No token available');
      throw new Error("Unauthorized: Please log in.");
    }
    
    // Check that we have valid parameters
    if (!quotationCode) {
      throw new Error("Quotation code is required");
    }
    
    if (!productId && productId !== 0) {
      throw new Error("Product ID is required");
    }
    
    // Log the exact URL and params we're using
    console.log(`🔍 API request URL: /api/Quotation/removeProductFromQuotation/${quotationCode}`);
    console.log(`🔍 API request params: { productId: ${productId} }`);
    
    // Make the API request
    const response = await apiClient.delete(
      `/api/Quotation/removeProductFromQuotation/${quotationCode}`, 
      {
        params: {
          productId: productId
        },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`🟢 Product removal response status: ${response.status}`);
    console.log(`🟢 Product removal response data:`, response.data);
    
    // Return the API response directly
    return response.data;
    
  } catch (error: any) {
    console.error("🔴 Remove Product From Quotation API Error:", error);
    
    // Log more details about the error
    if (error.response) {
      console.error(`🔴 API Error [${error.response.status}]:`, error.response.data);
      
      // Return the error response from the server
      return error.response.data;
    } 
    
    // For network errors or other issues
    return {
      success: false,
      message: error.message || "Failed to remove product from quotation",
      errors: [],
      data: null
    };
  }
};
export const getPaginatedRelatedProductAPI = async (
  quotationCode: string,
  options: {
    userId?: number;
    category?: string;
    pageIndex?: number;
    pageSize?: number;
    sortBy?: string;
    descending?: boolean;
  } = {}
): Promise<any> => {
  try {
    console.log(`🔍 Getting related products for quotation: ${quotationCode}`);
    const apiClient = await initApiClient();
    const token = await getToken();
    
    if (!token) {
      console.error('🔍 No token available');
      throw new Error("Unauthorized: Please log in.");
    }
    
    // Check that we have valid parameters
    if (!quotationCode) {
      throw new Error("Quotation code is required");
    }

    // Prepare the query parameters - ONLY include required parameters
    // quotationCode is required, all others are optional
    const params: Record<string, any> = {
      quotationCode
    };
    
    // Add other parameters ONLY if they are provided and valid
    if (options.userId !== undefined) params.userId = options.userId;
    if (options.category !== undefined && options.category.trim() !== '') params.category = options.category;
    if (options.pageIndex !== undefined && options.pageIndex >= 0) params.pageIndex = options.pageIndex;
    if (options.pageSize !== undefined && options.pageSize > 0) params.pageSize = options.pageSize;
    if (options.sortBy !== undefined && options.sortBy.trim() !== '') params.sortBy = options.sortBy;
    if (options.descending !== undefined) params.descending = options.descending;
    
    // Log the request parameters
    console.log(`🔍 API request params:`, params);
    
    // Make the API request
    const response = await apiClient.get(
      `/api/Quotation/getPaginatedRelatedProduct`,
      {
        params,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`🟢 Related products response status: ${response.status}`);
    
    // Return the API response
    if (response.data) {
      return response.data;
    } else {
      return {
        success: false,
        message: "No data received from API",
        data: null
      };
    }
    
  } catch (error: any) {
    console.error("🔴 Get Related Products API Error:", error.response?.data || error);
    
    // Log more details about the error
    if (error.response) {
      console.error(`🔴 API Error [${error.response.status}]:`, error.response.data);
      
      // Return the error response from the server
      return {
        success: false,
        message: error.response.data?.message || "Failed to get related products",
        errors: error.response.data?.errors || [],
        data: null
      };
    } 
    
    // For network errors or other issues
    return {
      success: false,
      message: error.message || "Failed to get related products",
      errors: [],
      data: null
    };
  }
};

export const addProductToQuotationAPI = async (
  quotationCode: string,
  productId: number,
  quantity: number
): Promise<any> => {
  try {
    console.log(`🔍 Adding product ${productId} (quantity: ${quantity}) to quotation ${quotationCode}`);
    const apiClient = await initApiClient();
    const token = await getToken();
    
    if (!token) {
      console.error('🔍 No token available');
      throw new Error("Unauthorized: Please log in.");
    }
    
    // Check that we have valid parameters
    if (!quotationCode) {
      throw new Error("Quotation code is required");
    }
    
    if (productId === undefined || productId === null) {
      throw new Error("Product ID is required");
    }
    
    if (quantity === undefined || quantity === null || quantity <= 0) {
      throw new Error("Valid quantity is required (must be greater than 0)");
    }
    
    // Log the request parameters
    console.log(`🔍 API request params: productId=${productId}, quantity=${quantity}`);
    
    // Make the API request
    const response = await apiClient.post(
      `/api/Quotation/addProductToQuotation/${quotationCode}`,
      null, // No request body needed
      {
        params: {
          productId,
          quantity
        },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`🟢 Add product response status: ${response.status}`);
    console.log(`🟢 Add product response data:`, response.data);
    
    // Return the API response
    return response.data;
    
  } catch (error: any) {
    console.error("🔴 Add Product To Quotation API Error:", error);
    
    // Log more details about the error
    if (error.response) {
      console.error(`🔴 API Error [${error.response.status}]:`, error.response.data);
      
      // Return the error response from the server
      return {
        success: false,
        message: error.response.data?.message || "Failed to add product to quotation",
        errors: error.response.data?.errors || [],
        data: null
      };
    } 
    
    // For network errors or other issues
    return {
      success: false,
      message: error.message || "Failed to add product to quotation",
      errors: [],
      data: null
    };
  }
};
export const rejectQuotationAPI = async (quotationCode: string, rejectReason: string = ''): Promise<any> => {
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
    
    console.log(`🔍 Sending requestDeniedQuotation request for code: ${quotationCode}`);
    
    // Create the URL with the optional reject reason as a query parameter
    let url = `/api/Quotation/requestDeniedQuotation/${quotationCode}`;
    if (rejectReason && rejectReason.trim() !== '') {
      url = `${url}?rejectReason=${encodeURIComponent(rejectReason.trim())}`;
    }
    
    // Send the request to reject the quotation
    const response = await apiClient.put(
      url,
      null, // No body needed
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`🔍 Reject quotation response:`, response.data);
    
    // Handle null response case
    if (response.data === null) {
      console.log(`🔍 API returned null - assuming success`);
      return {
        success: true,
        message: "Quotation rejected successfully",
        data: null
      };
    }
    
    // Return the API response if it exists
    return response.data;
    
  } catch (error: any) {
    console.error("🔴 Error rejecting quotation:", error);
    
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
        message: error.response.data.message || "Failed to reject quotation",
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