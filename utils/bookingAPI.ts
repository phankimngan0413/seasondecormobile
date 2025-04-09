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
}

// Define request interfaces
export interface IBookingRequest {
  decorServiceId: number;
  addressId: number;
  surveyDate: string;
  surveyTime?: string;
}

// Define response interfaces
export interface IBookingResponse {
  success: boolean;
  booking?: IBooking;
  message?: string;
  errors?: string[];
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
  status?: string;
  decorServiceId?: number;
  pageIndex?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
}

/**
 * Lấy danh sách booking phân trang với các tùy chọn lọc
 * @param options - Các tùy chọn lọc và phân trang
 * @returns Promise với danh sách booking phân trang
 */
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
    status,
    decorServiceId,
    pageIndex = 1,
    pageSize = 10,
    sortBy = "createdAt",
    descending = true
  } = options;

  const url = "/api/Booking/getPaginatedBookingsForCustomer";
  console.log(`🔍 API URL: ${url}`);
  
  const params: Record<string, any> = {
    PageIndex: pageIndex,
    PageSize: pageSize,
    SortBy: sortBy,
    Descending: descending
  };

  // Thêm các tham số tùy chọn
  if (status) {
    params.Status = status;
    console.log(`🔍 Filtering by status: ${status}`);
  }
  if (decorServiceId) {
    params.DecorServiceId = decorServiceId;
    console.log(`🔍 Filtering by decorServiceId: ${decorServiceId}`);
  }
  
  console.log('🔍 Request parameters:', JSON.stringify(params, null, 2));
  
  const apiClient = await initApiClient();
  try {
    console.log('🔍 Sending API request...');
    const response = await apiClient.get(url, { params });
    
    console.log('🔍 API response headers:', JSON.stringify(response.headers, null, 2));
    
    if (response && response.data) {
      
      // Check data structure to determine response format
      if (response.data.items) {
      } else if (response.data.data && response.data.data.data) {
      }
      
      // Log the total count and total pages
      if (response.data.totalCount) {
      } else if (response.data.data && response.data.data.totalCount) {
      }
      
      if (response.data.totalPages) {
      } else if (response.data.data && response.data.data.totalPages) {
      }
      
      // Sample the first item if available
      if (response.data.items && response.data.items.length > 0) {
      } else if (response.data.data && response.data.data.data && response.data.data.data.length > 0) {
      }
      
      console.log('🔍 API call successful, returning data');
      return response.data;
    } else {
      console.error("🔴 Invalid paginated bookings response:", response);
      console.log('🔍 Returning empty response due to invalid data');
      return {
        items: [],
        totalCount: 0,
        pageIndex: pageIndex,
        pageSize: pageSize,
        totalPages: 0
      };
    }
  } catch (error: any) {
    console.error("🔴 Error fetching paginated bookings:", error);


    return {
      items: [],
      totalCount: 0,
      pageIndex: pageIndex,
      pageSize: pageSize,
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
  
  const apiClient = await initApiClient();
  try {
    const response: AxiosResponse<IBookingResponse> = await apiClient.post(url, bookingData);
    
    if (response && response.data) {
      return response.data;
    } else {
      console.error("🔴 Invalid booking response:", response);
      return {
        success: false,
        message: "Invalid response from server"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error creating booking:", error);
    
    if (error.response && error.response.data) {
      // Log the full error response for debugging
      console.error("API Error Response:", error.response.data);
      
      // Check if we have the specific address-in-use error
      if (error.response.data.message && 
          error.response.data.message.includes("address is currently in use")) {
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
  bookingCode: string
): Promise<IBookingResponse> => {
  const url = `/api/Booking/requestCancel/${bookingCode}`;
  
  const apiClient = await initApiClient();
  try {
    const response: AxiosResponse<IBookingResponse> = await apiClient.put(url);
    
    if (response && response.data) {
      return response.data;
    } else {
      console.error("🔴 Invalid cancellation request response:", response);
      return {
        success: false,
        message: "Failed to request cancellation"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error requesting cancellation:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      return {
        success: false,
        message: error.response.data.message || "Failed to request cancellation",
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
 * Confirm a booking
 * @param bookingCode Booking code to confirm
 * @returns Promise with confirmation result
 */
export const confirmBookingAPI = async (
  bookingCode: string
): Promise<IBookingResponse> => {
  const url = `/api/Booking/confirm/${bookingCode}`;
  
  const apiClient = await initApiClient();
  try {
    const response: AxiosResponse<IBookingResponse> = await apiClient.put(url);
    
    if (response && response.data) {
      return response.data;
    } else {
      console.error("🔴 Invalid booking confirmation response:", response);
      return {
        success: false,
        message: "Failed to confirm booking"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error confirming booking:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      return {
        success: false,
        message: error.response.data.message || "Failed to confirm booking",
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