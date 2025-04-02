import { initApiClient } from "@/config/axiosConfig";

// Interfaces cho Booking
export interface IBooking {
  id: number;
  decorServiceId: number;
  userId: number;
  addressId: number;
  surveyDate: string;
  surveyTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface IBookingRequest {
  decorServiceId: number;
  addressId: number;
  surveyDate: string;
  surveyTime: string;
}

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

/**
 * Tạo một booking mới
 * @param bookingData Thông tin booking
 * @returns Promise với kết quả booking
 */
export const createBookingAPI = async (
  bookingData: IBookingRequest
): Promise<IBookingResponse> => {
  const url = "/api/bookings/create";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.post(url, bookingData);
    
    if (response && response.data) {
      return {
        success: true,
        booking: response.data.booking,
        message: response.data.message || "Booking created successfully"
      };
    } else {
      console.error("🔴 Invalid booking response:", response);
      return {
        success: false,
        message: "Invalid response from server"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error creating booking:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      return {
        success: false,
        message: error.response.data.message || "Failed to create booking",
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
 * Lấy danh sách booking của người dùng
 * @param page Trang hiện tại
 * @param limit Số lượng booking trên mỗi trang
 * @returns Promise với danh sách booking
 */
export const getBookingsAPI = async (
  page: number = 1, 
  limit: number = 20
): Promise<IBookingListResponse> => {
  const url = "/api/bookings";
  const params = { page, limit };
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url, { params });
    
    if (response && response.data && Array.isArray(response.data.bookings)) {
      return {
        success: true,
        bookings: response.data.bookings,
        totalCount: response.data.totalCount || 0,
        message: response.data.message
      };
    } else {
      console.error("🔴 Invalid bookings response:", response);
      return {
        success: false,
        bookings: [],
        totalCount: 0,
        message: "Invalid response format"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error fetching bookings:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      bookings: [],
      totalCount: 0,
      message: "Failed to fetch booking history"
    };
  }
};

/**
 * Lấy chi tiết một booking cụ thể
 * @param bookingId ID của booking
 * @returns Promise với chi tiết booking
 */
export const getBookingByIdAPI = async (
  bookingId: number
): Promise<IBookingResponse> => {
  const url = `/api/bookings/${bookingId}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    if (response && response.data && response.data.booking) {
      return {
        success: true,
        booking: response.data.booking,
        message: response.data.message
      };
    } else {
      console.error("🔴 Invalid booking detail response:", response);
      return {
        success: false,
        message: "Booking not found or invalid response"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error fetching booking details:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: "Failed to retrieve booking details"
    };
  }
};

/**
 * Hủy một booking
 * @param bookingId ID của booking cần hủy
 * @returns Promise với kết quả hủy booking
 */
export const cancelBookingAPI = async (
  bookingId: number
): Promise<IBookingResponse> => {
  const url = `/api/bookings/${bookingId}/cancel`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.put(url);
    
    if (response && response.data) {
      return {
        success: true,
        booking: response.data.booking,
        message: response.data.message || "Booking cancelled successfully"
      };
    } else {
      console.error("🔴 Invalid cancel booking response:", response);
      return {
        success: false,
        message: "Failed to cancel booking"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error cancelling booking:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      return {
        success: false,
        message: error.response.data.message || "Failed to cancel booking",
        errors: error.response.data.errors
      };
    }
    
    return {
      success: false,
      message: "Network error or server unavailable"
    };
  }
};