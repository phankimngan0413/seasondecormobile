import { AxiosResponse } from 'axios';
import { initApiClient } from "@/config/axiosConfig";

// Define a more specific status type to avoid 'any' type issues
export type BookingStatusCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

// Updated Booking interface with numeric status
export interface IBooking {
  id?: number;
  bookingId: number;
  bookingCode: string;
  decorServiceId?: number;
  userId?: number;
  addressId?: number;
  address: string;
  surveyDate?: string;
  surveyTime?: string;
  status: BookingStatusCode; // Using the specific type for status
  createdAt: string;
  updatedAt?: string;
  totalPrice?: number;
  cost?: number;
  serviceItems?: string;
  note?: string;                 // Added note field
  expectedCompletion?: string;   // Added expectedCompletion field
  decorService?: {
    id: number;
    style: string;
    description: string;
    category?: string;
    image?: string;
    createAt?: string;
    status?: number;
    accountId?: number;
    decorCategoryId?: number;
    favoriteCount?: number;
    images?: Array<{id: number, imageURL: string}>;
    seasons?: Array<{id: number, seasonName: string}>;
  };
  provider?: {
    id: number;
    businessName: string;
    avatar?: string;
    phone?: string;
    slug?: string;
    isProvider?: boolean;
    providerVerified?: boolean;
    providerStatus?: number;
    followersCount?: number;
    followingsCount?: number;
  };
  timeSlots?: Array<{
    id: number;
    bookingId: number;
    surveyDate: string;
  }>;
}

// Updated request interface with new fields
export interface IBookingRequest {
  decorServiceId: number;
  addressId: number;
  surveyDate: string;
  note?: string;
  decorationStyleId: number;
  themeColorIds: number[];
  spaceStyle: string;
  roomSize: number;
  style: string;
  themeColor: string;
  primaryUser: string;
  scopeOfWorldId: number[];
  images: string[];
}

// Define response interfaces
export interface IBookingResponse {
  success: boolean;
  booking?: IBooking;
  message?: string;
  errors?: string[];
  data?: IBooking;
}

export interface IBookingListResponse {
  success: boolean;
  bookings: IBooking[];
  totalCount: number;
  message?: string;
}

export interface IPaginatedBookingsResponse {
  success?: boolean;
  message?: string;
  errors?: any[];
  data?: {
    data: IBooking[];
    totalCount: number;
    pageIndex?: number;
    pageSize?: number;
    totalPages?: number;
  };
  items?: IBooking[];  // Kept for backward compatibility
  totalCount?: number; // Kept for backward compatibility
  pageIndex?: number;  // Kept for backward compatibility
  pageSize?: number;   // Kept for backward compatibility
  totalPages?: number; // Kept for backward compatibility
}

export interface IBookingFilterOptions {
  Status?: number; // Changed to match API parameter (PascalCase)
  DecorServiceId?: number; // Changed to match API parameter (PascalCase)
  PageIndex?: number; // Changed to match API parameter (PascalCase)
  PageSize?: number; // Changed to match API parameter (PascalCase)
  SortBy?: string; // Changed to match API parameter (PascalCase)
  Descending?: boolean; // Changed to match API parameter (PascalCase)
}
export interface ICancelType {
  id: number;
  type: string;
  name?: string; // Optional for backward compatibility
  description?: string;
  isActive?: boolean;
}

export interface ICancelTypeResponse {
  success: boolean;
  message?: string;
  errors?: string[];
  data?: ICancelType[];
}

/**
 * Lấy danh sách booking phân trang với các tùy chọn lọc
 * @param options - Các tùy chọn lọc và phân trang
 * @returns Promise với danh sách booking phân trang
 */
export const getPaginatedBookingsForCustomerAPI = async (
  options: IBookingFilterOptions = {}
): Promise<IPaginatedBookingsResponse> => {
  console.log('🔍 getPaginatedBookingsForCustomerAPI - Starting API call with options:', JSON.stringify(options, null, 2));
  
  const {
    Status,
    DecorServiceId,
    PageIndex = 1,
    PageSize = 10,
    SortBy = "createdAt",
    Descending = true
  } = options;

  const url = "/api/Booking/getPaginatedBookingsForCustomer";
  console.log(`🔍 API URL: ${url}`);
  
  // Use parameters directly from options without transformation
  const params: Record<string, any> = {
    PageIndex,
    PageSize,
    SortBy,
    Descending
  };

  // Thêm các tham số tùy chọn
  if (Status !== undefined) {
    params.Status = Status;
    console.log(`🔍 Filtering by Status: ${Status}`);
  }
  if (DecorServiceId !== undefined) {
    params.DecorServiceId = DecorServiceId;
    console.log(`🔍 Filtering by DecorServiceId: ${DecorServiceId}`);
  }
  
  console.log('🔍 Request parameters:', JSON.stringify(params, null, 2));
  
  const apiClient = await initApiClient();
  try {
    console.log('🔍 Sending API request...');
    const response = await apiClient.get(url, { params });
    
    console.log('🔍 API response headers:', JSON.stringify(response.headers, null, 2));
    
    if (response && response.data) {
      console.log('🔍 API call successful, returning data');
      return response.data;
    } else {
      console.error("🔴 Invalid paginated bookings response:", response);
      console.log('🔍 Returning empty response due to invalid data');
      return {
        items: [],
        totalCount: 0,
        pageIndex: PageIndex,
        pageSize: PageSize,
        totalPages: 0
      };
    }
  } catch (error: any) {
    console.error("🔴 Error fetching paginated bookings:", error);

    return {
      items: [],
      totalCount: 0,
      pageIndex: PageIndex,
      pageSize: PageSize,
      totalPages: 0
    };
  }
};

/**
 * Create a booking
 * @param bookingData Booking information
 * @returns Promise with booking result
 */
export const createBookingAPI = async (
  bookingData: IBookingRequest
): Promise<IBookingResponse> => {
  const url = "/api/Booking/create";
  
  // Log the complete request data
  console.log("📤 BOOKING REQUEST DATA:", JSON.stringify(bookingData, null, 2));
  
  const apiClient = await initApiClient();
  try {
    console.log(`🔷 Making POST request to ${url}`);
    
    // Additional log of request headers if needed
    // console.log("📋 Request Headers:", apiClient.defaults.headers);
    
    const response: AxiosResponse = await apiClient.post(url, bookingData);
    
    // Log the raw response
    console.log("📥 BOOKING RESPONSE:", JSON.stringify(response.data, null, 2));
    
    if (response && response.data) {
      // Check if the response has a success property
      if (response.data.success !== undefined) {
        // Standard wrapped response, return as is
        console.log(`✅ Booking API call ${response.data.success ? 'succeeded' : 'failed'}: ${response.data.message}`);
        return response.data;
      } else if (response.data.id) {
        // Direct booking object response, wrap it in proper structure
        console.log(`✅ Booking created with ID: ${response.data.id}`);
        return {
          success: true,
          message: "Booking created successfully",
          data: response.data
        };
      } else {
        console.error("🔴 Invalid booking response structure:", response.data);
        return {
          success: false,
          message: "Invalid response from server"
        };
      }
    } else {
      console.error("🔴 Empty or invalid booking response");
      return {
        success: false,
        message: "Invalid response from server"
      };
    }
  } catch (error: any) {
    // Log detailed error information
    console.error("🔴 Error creating booking:", error.message);
    
    if (error.request) {
      console.error("📋 Request that caused error:", {
        url: url,
        method: 'POST',
        data: JSON.stringify(bookingData, null, 2)
      });
    }
    
    if (error.response) {
      console.error("📋 Error Response Status:", error.response.status);
      console.error("📋 Error Response Headers:", error.response.headers);
      console.error("📋 Error Response Data:", JSON.stringify(error.response.data, null, 2));
      
      // Check if we have the specific address-in-use error
      if (error.response.data.message && 
          error.response.data.message.includes("address is currently in use")) {
        console.error("🚫 Address in use error detected");
        return {
          success: false,
          message: error.response.data.message,
          errors: error.response.data.errors || []
        };
      }
      
      // Return the exact error message from the backend
      return {
        success: false,
        message: error.response.data.message || "Failed to create booking",
        errors: error.response.data.errors || []
      };
    }
    
    // For network errors or when response structure is unexpected
    if (error.message && error.message.includes("Network Error")) {
      console.error("🌐 Network error detected");
      return {
        success: false,
        message: "Network error or server unavailable"
      };
    }
    
    // Return a generic error if we can't get a specific message
    return {
      success: false,
      message: error.message || "Failed to process your booking request"
    };
  }
};
export const requestCancelBookingAPI = async (
  bookingCode: string,
  cancelTypeId: number,
  cancelReason: string
): Promise<IBookingResponse> => {
  const url = `/api/Booking/requestCancel/${bookingCode}`;
  
  const payload = {
    cancelTypeId,
    cancelReason
  };
  
  console.log(`🔍 Sending cancellation request to ${url} with payload:`, payload);
  
  const apiClient = await initApiClient();
  try {
    const response: AxiosResponse = await apiClient.put(url, payload);
    
    // Log the complete API response
    console.log(`🔍 Complete API response:`, response);
    
    // The issue is that response.data is null, but the response itself has success details
    // Let's check if we need to extract success info from the response rather than response.data
    if (response.data === null) {
      console.log("📘 Response data is null, extracting success info from response");
      
      // Check if response has a status in the 200 range (successful HTTP status)
      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: "Booking has been canceled successfully."
        };
      }
    }
    
    // If response.data exists, return it
    if (response.data) {
      return response.data;
    }
    
    // Default success response
    return {
      success: true,
      message: "Request processed successfully"
    };
  } catch (error: any) {
    console.error("🔴 Error requesting cancellation:", error);
    
    // Handle axios error with response
    if (error.response) {
      console.error("API Error Response:", error.response);
      
      // If the error response has data, return it
      if (error.response.data) {
        return error.response.data;
      }
      
      // Otherwise create an error based on status
      return {
        success: false,
        message: `Error: ${error.response.status} - ${error.response.statusText}`
      };
    }
    
    // Return a generic error for network issues
    return {
      success: false,
      message: error.message || "Network error or server unavailable"
    };
  }
};
export const confirmBookingAPI = async (
  bookingCode: string
): Promise<IBookingResponse> => {
  const url = `/api/Booking/confirm/${bookingCode}`;
  
  console.log(`🔍 Attempting to confirm booking: ${bookingCode}`);
  
  const apiClient = await initApiClient();
  try {
    const response: AxiosResponse = await apiClient.put(url);
    
    console.log(`🟢 Booking confirmation response:`, response.data);
    
    // If we have response data with defined success property, return it directly
    if (response.data && typeof response.data.success === 'boolean') {
      return response.data;
    }
    
    // For any 2xx status code, treat as success even if response format is unexpected
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        message: "Booking confirmed successfully",
        data: response.data
      };
    }
    
    console.error("🔴 Invalid booking confirmation response:", response);
    return {
      success: false,
      message: "Failed to confirm booking"
    };
  } catch (error: any) {
    console.error("🔴 Error confirming booking:", error);
    
    // Special handling for error response that might actually indicate success
    if (error.response && error.response.status >= 200 && error.response.status < 300) {
      console.log("✅ Received 2xx status in error response - treating as success");
      return {
        success: true,
        message: "Booking confirmed successfully"
      };
    }
    
    // Check if error response contains a success:true indicator
    if (error.response && error.response.data && error.response.data.success === true) {
      console.log("✅ Found success:true in error response - treating as success");
      return error.response.data;
    }
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      
      // For specific error status codes
      if (error.response.status === 401) {
        return {
          success: false,
          message: "Please log in to confirm this booking"
        };
      } else if (error.response.status === 403) {
        return {
          success: false,
          message: "You don't have permission to confirm this booking"
        };
      } else if (error.response.status === 404) {
        return {
          success: false,
          message: "Booking not found or already processed"
        };
      }
      
      return {
        success: false,
        message: error.response.data?.message || "Failed to confirm booking",
        errors: error.response.data?.errors
      };
    }
    
    return {
      success: false,
      message: error.message || "Network error or server unavailable"
    };
  }
};
/**
 * Make a deposit payment for a booking
 * @param bookingCode Booking code to make deposit for
 * @param depositData Deposit payment data
 * @returns Promise with deposit result
 */
export const makeBookingDepositAPI = async (
  bookingCode: string,
  depositData: any
): Promise<IBookingResponse> => {
  const url = `/api/Booking/deposit/${bookingCode}`;
  
  const apiClient = await initApiClient();
  try {
    const response: AxiosResponse<IBookingResponse> = await apiClient.post(url, depositData);
    
    if (response && response.data) {
      return response.data;
    } else {
      console.error("🔴 Invalid deposit response:", response);
      return {
        success: false,
        message: "Failed to make deposit"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error making deposit:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      return {
        success: false,
        message: error.response.data.message || "Failed to make deposit",
        errors: error.response.data.errors
      };
    }
    
    return {
      success: false,
      message: "Network error or server unavailable"
    };
  }
};
/**
 * Fetch all available cancellation types
 * @returns Promise with cancellation types
 */
export const getAllCancelTypesAPI = async (): Promise<ICancelTypeResponse> => {
  const url = "/api/CancelType/getAllCancelType";
  
  const apiClient = await initApiClient();
  try {
    console.log('🔍 Sending request to fetch cancel types');
    const response = await apiClient.get(url);
    
    console.log('🔍 Cancel types API response:', JSON.stringify(response.data, null, 2));
    
    // Check if response has the expected structure
    if (response && response.data) {
      // Handle different possible response structures
      if (response.data.success !== undefined) {
        // Standard wrapped response structure
        return response.data;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        return {
          success: true,
          data: response.data
        };
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Nested data property with array
        return {
          success: true,
          data: response.data.data
        };
      } else {
        console.error("🔴 Unexpected cancel types response format:", response.data);
        return {
          success: false,
          message: "Unexpected response format from server"
        };
      }
    } else {
      console.error("🔴 Invalid cancel types response:", response);
      return {
        success: false,
        message: "Failed to retrieve cancellation types"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error fetching cancellation types:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      return {
        success: false,
        message: error.response.data?.message || "Failed to retrieve cancellation types",
        errors: error.response.data?.errors
      };
    }
    
    return {
      success: false,
      message: error.message || "Network error or server unavailable"
    };
  }
};
export const processCommitDepositAPI = async (
  bookingCode: string
): Promise<IBookingResponse> => {
  const url = `/api/Booking/processCommitDeposit/${bookingCode}`;
  
  console.log(`🔍 Processing initial commitment deposit for booking: ${bookingCode}`);
  
  const apiClient = await initApiClient();
  try {
    // Using POST method as indicated in the Swagger documentation
    const response: AxiosResponse = await apiClient.post(url);
    
    console.log(`🟢 Deposit processing response:`, response.data);
    
    // Check if the response contains success property and it's true
    if (response.data && typeof response.data.success === 'boolean') {
      // Important fix: directly return the original response data
      // This preserves the original success and message properties
      return response.data;
    }
    
    // For backward compatibility or unusual response formats
    if (response.status >= 200 && response.status < 300) {
      // If response has data object with booking info
      if (response.data && (response.data.id || response.data.bookingId)) {
        return {
          success: true,
          message: "Deposit processed successfully",
          data: response.data
        };
      }
      
      // Even with empty/null data but 2xx status, consider success
      return {
        success: true,
        message: "Deposit processed successfully"
      };
    }
    
    return {
      success: false,
      message: "Failed to process deposit commitment"
    };
  } catch (error: any) {
    console.error("🔴 Error processing initial deposit:", error);
    
    // Check if the error contains a successful response
    // This is crucial based on your error log showing success:true in an error
    if (error.response && error.response.data) {
      // Critical fix: Some APIs return success:true in the error object
      if (error.response.data.success === true) {
        console.log("✅ Found success:true in error response - treating as success");
        return {
          success: true,
          message: error.response.data.message || "Deposit processed successfully",
          data: error.response.data.data
        };
      }
      
      // If explicit success:false is present, return that with the message
      if (error.response.data.success === false) {
        return {
          success: false,
          message: error.response.data.message || "Failed to process deposit commitment"
        };
      }
    }
    
    // Handle other error scenarios with proper status code checking
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      
      // Status code-based error messages
      if (error.response.status === 401) {
        return {
          success: false,
          message: "Authentication required to process this deposit"
        };
      } else if (error.response.status === 403) {
        return {
          success: false,
          message: "You don't have permission to process this deposit"
        };
      }
      
      // Return server error message if available
      return {
        success: false,
        message: error.response.data?.message || "Failed to process initial deposit",
        errors: error.response.data?.errors
      };
    }
    
    // Network errors
    return {
      success: false,
      message: error.message || "Network error or server unavailable"
    };
  }
};