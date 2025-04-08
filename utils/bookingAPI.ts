import { initApiClient } from "@/config/axiosConfig";

// Interfaces cho Booking
export interface IBooking {
  id: number;
  bookingId?: number;
  bookingCode: string;
  decorServiceId: number;
  userId: number;
  addressId: number;
  address: string;
  surveyDate: string;
  surveyTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  totalPrice?: number;
  cost?: number;
  serviceItems?: string;
  decorService?: {
    id: number;
    style: string;
    description: string;
    category?: string;
    image?: string;
    createdAt?: string;
    status?: number;
    accountId?: number;
    decorCategoryId?: number;
    favoriteCount?: number;
  };
}

export interface IBookingRequest {
  decorServiceId: number;
  addressId: number;
  surveyDate: string;
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

export interface IPaginatedBookingsResponse {
  items: IBooking[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
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
 * @param options Các tùy chọn lọc và phân trang
 * @returns Promise với danh sách booking phân trang
 */
export const getPaginatedBookingsForCustomerAPI = async (
  options: IBookingFilterOptions = {}
): Promise<IPaginatedBookingsResponse> => {
  const {
    status,
    decorServiceId,
    pageIndex = 1,
    pageSize = 10,
    sortBy = "createdAt",
    descending = true
  } = options;

  const url = "/api/Booking/getPaginatedBookingsForCustomer";
  
  const params: Record<string, any> = {
    PageIndex: pageIndex,
    PageSize: pageSize,
    SortBy: sortBy,
    Descending: descending
  };

  // Thêm các tham số tùy chọn
  if (status) params.Status = status;
  if (decorServiceId) params.DecorServiceId = decorServiceId;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url, { params });
    
    if (response && response.data) {
      const responseData = response.data.data || response.data;
      return {
        items: responseData.data || responseData.items || [],
        totalCount: responseData.totalCount || 0,
        pageIndex: responseData.pageIndex || pageIndex,
        pageSize: responseData.pageSize || pageSize,
        totalPages: responseData.totalPages || 0
      };
    } else {
      console.error("🔴 Invalid paginated bookings response:", response);
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
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
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
 * Tạo một booking mới
 * @param bookingData Thông tin booking
 * @returns Promise với kết quả booking
 */
export const createBookingAPI = async (
  bookingData: IBookingRequest
): Promise<IBookingResponse> => {
  const url = "/api/Booking/create";

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
export const requestCancelBookingAPI = async (
  bookingCode: string
): Promise<IBookingResponse> => {
  const url = `/api/Booking/requestCancel/${bookingCode}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.put(url);
    
    if (response && response.data) {
      return {
        success: true,
        booking: response.data.booking,
        message: response.data.message || "Cancellation request submitted successfully"
      };
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
export const makeBookingDepositAPI = async (
  bookingCode: string,
  depositData: any
): Promise<IBookingResponse> => {
  const url = `/api/Booking/deposit/${bookingCode}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.post(url, depositData);
    
    if (response && response.data) {
      return {
        success: true,
        booking: response.data.booking,
        message: response.data.message || "Deposit made successfully"
      };
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
export const makeBookingPaymentAPI = async (
  bookingCode: string,
  paymentData: any
): Promise<IBookingResponse> => {
  const url = `/api/Booking/payment/${bookingCode}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.post(url, paymentData);
    
    if (response && response.data) {
      return {
        success: true,
        booking: response.data.booking,
        message: response.data.message || "Payment made successfully"
      };
    } else {
      console.error("🔴 Invalid payment response:", response);
      return {
        success: false,
        message: "Failed to make payment"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error making payment:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      return {
        success: false,
        message: error.response.data.message || "Failed to make payment",
        errors: error.response.data.errors
      };
    }
    
    return {
      success: false,
      message: "Network error or server unavailable"
    };
  }
};