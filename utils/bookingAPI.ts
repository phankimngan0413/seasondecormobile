import { AxiosResponse } from 'axios';
import { initApiClient } from "@/config/axiosConfig";
import { getToken } from "@/services/auth";

// Define booking status type
export type BookingStatusCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

// Booking interface
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
  status: BookingStatusCode;
  createdAt: string;
  updatedAt?: string;
  totalPrice?: number;
  cost?: number;
  serviceItems?: string;
  note?: string;
  expectedCompletion?: string;
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

// Updated booking request interface with support for multiple theme colors
export interface IBookingRequest {   
  decorServiceId: number;        
  addressId: number;             
  surveyDate: string;            
  note?: string;                 
  decorationStyleId: number;     
  themeColorIds: number[];       // Changed from number to number[] for multiple colors
  spaceStyle: string;            
  roomSize: number;              
  style: string;                 
  themeColor: string;            
  primaryUser: string;           
  scopeOfWorkId: number | number[]; // Can be single or multiple scope of work IDs
  images?: File[];               
  estimatedBudget?: number;      
}

// Response interfaces
export interface IBookingResponse {
  success: boolean;
  booking?: IBooking;
  message?: string;
  errors?: string[] | Record<string, string[]>; // Allow both array and object formats
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
  items?: IBooking[];
  totalCount?: number;
  pageIndex?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface IBookingFilterOptions {
  Status?: number;
  DecorServiceId?: number;
  PageIndex?: number;
  PageSize?: number;
  SortBy?: string;
  Descending?: boolean;
}

export interface ICancelType {
  id: number;
  type: string;
  name?: string;
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
 * Helper function to handle multiple theme colors
 */
const formatThemeColorIds = (themeColorIds: number | number[]): string => {
  if (Array.isArray(themeColorIds)) {
    return themeColorIds.join(','); // Convert array to comma-separated string
  }
  return String(themeColorIds); // Use String() instead of toString()
};

/**
 * Helper function to handle multiple scope of work IDs
 */
const formatScopeOfWorkIds = (scopeOfWorkId: number | number[]): string => {
  if (Array.isArray(scopeOfWorkId)) {
    return scopeOfWorkId.join(','); // Convert array to comma-separated string
  }
  return String(scopeOfWorkId); // Use String() instead of toString()
};

/**
 * Create a booking - Updated version with multiple theme colors support
 */
export const createBookingAPI = async (bookingData: IBookingRequest): Promise<IBookingResponse> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    console.log("Sending booking request data:", bookingData);
    
    // Use direct fetch instead of axios to bypass interceptors
    const formData = new FormData();
    
    // Required fields with PascalCase (exactly like successful direct test)
    formData.append('DecorServiceId', String(bookingData.decorServiceId));
    formData.append('AddressId', String(bookingData.addressId));
    formData.append('SurveyDate', bookingData.surveyDate);
    formData.append('DecorationStyleId', String(bookingData.decorationStyleId));
    
    // Handle multiple theme colors - try different formats based on backend requirements
    if (Array.isArray(bookingData.themeColorIds)) {
      // Option 1: Send each color ID as separate form field
      bookingData.themeColorIds.forEach((colorId, index) => {
        formData.append(`ThemeColorIds[${index}]`, String(colorId));
      });
      
      // Option 2: Also try sending as comma-separated for backup
      // formData.append('ThemeColorIds', bookingData.themeColorIds.join(','));
    } else {
      formData.append('ThemeColorIds', String(bookingData.themeColorIds));
    }
    
    formData.append('SpaceStyle', bookingData.spaceStyle || '');
    formData.append('RoomSize', String(bookingData.roomSize));
    formData.append('Style', bookingData.style || '');
    formData.append('ThemeColor', bookingData.themeColor || '');
    formData.append('PrimaryUser', bookingData.primaryUser || '');
    
    // Handle scope of work ID(s) - try array format
    if (Array.isArray(bookingData.scopeOfWorkId)) {
      bookingData.scopeOfWorkId.forEach((scopeId, index) => {
        formData.append(`ScopeOfWorkId[${index}]`, String(scopeId));
      });
    } else {
      formData.append('ScopeOfWorkId', String(bookingData.scopeOfWorkId));
    }
    
    // Optional fields
    formData.append('Note', bookingData.note || '');
    formData.append('EstimatedBudget', bookingData.estimatedBudget ? String(bookingData.estimatedBudget) : '');
    
    // Add images if present with correct field name for your API
    if (bookingData.images && bookingData.images.length > 0) {
      
      let validImageCount = 0;
      for (let index = 0; index < bookingData.images.length; index++) {
        const file = bookingData.images[index] as any; // Type assertion for React Native compatibility
        if (file && (file.size > 0 || file.uri)) { // Accept both File objects and RN objects
          
          // Use the field name that your API expects
          formData.append('Images', file); // Try PascalCase first
          
          validImageCount++;
        } else {
          console.warn(`⚠️ Skipping invalid image at index ${index}:`, file);
        }
      }
      
    } else {
      console.log(' No images to add');
    }
    
    // Use direct fetch with exact same headers as successful test
    const response = await fetch("https://seasondecor.azurewebsites.net/api/Booking/create", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // DON'T set Content-Type - let browser handle FormData boundary
      },
      body: formData,
    });
    
    const responseData = await response.json();
    console.log("Raw booking API response:", responseData);
    
    // Return the response data directly
    return responseData;
    
  } catch (error: any) {
    console.error("Error in createBookingAPI:", error);
    return {
      success: false,
      message: error.message || "Failed to create booking",
      errors: []
    };
  }
};

/**
 * Alternative method: Try different array formats for backend compatibility
 */
export const createBookingAPIAlternative = async (bookingData: IBookingRequest): Promise<IBookingResponse> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    
    const formData = new FormData();
    
    // Basic fields
    formData.append('DecorServiceId', String(bookingData.decorServiceId));
    formData.append('AddressId', String(bookingData.addressId));
    formData.append('SurveyDate', bookingData.surveyDate);
    formData.append('DecorationStyleId', String(bookingData.decorationStyleId));
    
    // Try different formats for theme colors
    if (Array.isArray(bookingData.themeColorIds)) {
      // Format 1: Try simple repeated field names
      bookingData.themeColorIds.forEach((colorId) => {
        formData.append('ThemeColorIds', String(colorId));
      });
    } else {
      formData.append('ThemeColorIds', String(bookingData.themeColorIds));
    }
    
    formData.append('SpaceStyle', bookingData.spaceStyle || '');
    formData.append('RoomSize', String(bookingData.roomSize));
    formData.append('Style', bookingData.style || '');
    formData.append('ThemeColor', bookingData.themeColor || '');
    formData.append('PrimaryUser', bookingData.primaryUser || '');
    
    // Try different formats for scope of work
    if (Array.isArray(bookingData.scopeOfWorkId)) {
      // Format 1: Try simple repeated field names
      bookingData.scopeOfWorkId.forEach((scopeId) => {
        formData.append('ScopeOfWorkId', String(scopeId));
      });
    } else {
      formData.append('ScopeOfWorkId', String(bookingData.scopeOfWorkId));
    }
    
    formData.append('Note', bookingData.note || '');
    formData.append('EstimatedBudget', bookingData.estimatedBudget ? String(bookingData.estimatedBudget) : '');
    
    // Add images with correct field name
    if (bookingData.images && bookingData.images.length > 0) {
      console.log(`📷 Adding ${bookingData.images.length} images to alternative FormData...`);
      
      let validImageCount = 0;
      bookingData.images.forEach((file: any, index) => { // Type assertion for React Native compatibility
        if (file && (file.size > 0 || file.uri)) {
          console.log(`📎 Adding image ${index + 1}: ${file.name} (${file.size || 'unknown'} bytes)`);
          
          // Use correct field name for your API
          formData.append('Images', file); // PascalCase
          
          validImageCount++;
        } else {
          console.warn(`⚠️ Skipping invalid image at index ${index}`);
        }
      });
      
      console.log(`✅ Added ${validImageCount} valid images with field name 'Images'`);
    }
    
    const response = await fetch("https://seasondecor.azurewebsites.net/api/Booking/create", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    const responseData = await response.json();
    console.log("📥 Alternative format response:", responseData);
    
    return responseData;
    
  } catch (error: any) {
    console.error("❌ Error in createBookingAPIAlternative:", error);
    return {
      success: false,
      message: error.message || "Failed to create booking with alternative format",
      errors: []
    };
  }
};

/**
 * Helper function for debugging array formats
 */

export const createBookingAPIAxios = async (bookingData: IBookingRequest): Promise<IBookingResponse> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    console.log("Sending booking request data via axios:", bookingData);
    
    const apiClient = await initApiClient();
    
    // Create FormData
    const formData = new FormData();
    formData.append('DecorServiceId', String(bookingData.decorServiceId));
    formData.append('AddressId', String(bookingData.addressId));
    formData.append('SurveyDate', bookingData.surveyDate);
    formData.append('DecorationStyleId', String(bookingData.decorationStyleId));
    
    // Handle multiple theme colors
    if (Array.isArray(bookingData.themeColorIds)) {
      bookingData.themeColorIds.forEach((colorId, index) => {
        formData.append(`ThemeColorIds[${index}]`, String(colorId));
      });
    } else {
      formData.append('ThemeColorIds', String(bookingData.themeColorIds));
    }
    
    formData.append('SpaceStyle', bookingData.spaceStyle || '');
    formData.append('RoomSize', String(bookingData.roomSize));
    formData.append('Style', bookingData.style || '');
    formData.append('ThemeColor', bookingData.themeColor || '');
    formData.append('PrimaryUser', bookingData.primaryUser || '');
    
    // Handle scope of work ID(s)
    if (Array.isArray(bookingData.scopeOfWorkId)) {
      bookingData.scopeOfWorkId.forEach((scopeId, index) => {
        formData.append(`ScopeOfWorkId[${index}]`, String(scopeId));
      });
    } else {
      formData.append('ScopeOfWorkId', String(bookingData.scopeOfWorkId));
    }
    
    formData.append('Note', bookingData.note || '');
    formData.append('EstimatedBudget', bookingData.estimatedBudget ? String(bookingData.estimatedBudget) : '');
    
    if (bookingData.images && bookingData.images.length > 0) {
      bookingData.images.forEach((file, index) => {
        if (file && file.size > 0) {
          formData.append('images', file);
        } else {
          console.warn(`⚠️ Skipping invalid image at index ${index} in axios version`);
        }
      });
    }
    
    // BYPASS interceptors by creating a fresh axios instance
    const freshAxios = require('axios').create({
      baseURL: 'https://seasondecor.azurewebsites.net',
      timeout: 30000,
    });
    
    const response = await freshAxios.post('/api/Booking/create', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // Don't set Content-Type for FormData
      },
    });
    
    console.log("Fresh axios response:", response.data);
    return response.data;
    
  } catch (error: any) {
    console.error("Error in createBookingAPIAxios:", error);
    return {
      success: false,
      message: error.message || "Failed to create booking",
      errors: []
    };
  }
};

/**
 * Get paginated bookings for customer
 */
export const getPaginatedBookingsForCustomerAPI = async (
  options: IBookingFilterOptions = {}
): Promise<IPaginatedBookingsResponse> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const {
      Status,
      DecorServiceId,
      PageIndex = 1,
      PageSize = 10,
      SortBy = "createdAt",
      Descending = true
    } = options;

    const params: Record<string, any> = {
      PageIndex,
      PageSize,
      SortBy,
      Descending
    };

    if (Status !== undefined) params.Status = Status;
    if (DecorServiceId !== undefined) params.DecorServiceId = DecorServiceId;
    
    const apiClient = await initApiClient();
    const response = await apiClient.get("/api/Booking/getPaginatedBookingsForCustomer", { 
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    return response.data || {
      items: [],
      totalCount: 0,
      pageIndex: PageIndex,
      pageSize: PageSize,
      totalPages: 0
    };
    
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return {
      items: [],
      totalCount: 0,
      pageIndex: 1,
      pageSize: 10,
      totalPages: 0
    };
  }
};

/**
 * Request cancel booking
 */
export const requestCancelBookingAPI = async (
  bookingCode: string,
  cancelTypeId: number,
  cancelReason: string
): Promise<IBookingResponse> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const payload = {
      cancelTypeId,
      cancelReason
    };
    
    const apiClient = await initApiClient();
    const response = await apiClient.put(`/api/Booking/requestCancel/${bookingCode}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    return response.data || {
      success: true,
      message: "Booking cancellation requested successfully"
    };
    
  } catch (error: any) {
    console.error("Error requesting cancellation:", error);
    return {
      success: false,
      message: error.message || "Failed to request cancellation",
      errors: []
    };
  }
};

/**
 * Confirm booking
 */
export const confirmBookingAPI = async (bookingCode: string): Promise<IBookingResponse> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    const response = await apiClient.put(`/api/Booking/confirm/${bookingCode}`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    return response.data || {
      success: true,
      message: "Booking confirmed successfully"
    };
    
  } catch (error: any) {
    console.error("Error confirming booking:", error);
    return {
      success: false,
      message: error.message || "Failed to confirm booking",
      errors: []
    };
  }
};

/**
 * Make booking deposit
 */
export const makeBookingDepositAPI = async (
  bookingCode: string,
  depositData: any
): Promise<IBookingResponse> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    const response = await apiClient.post(`/api/Booking/deposit/${bookingCode}`, depositData, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    return response.data || {
      success: false,
      message: "Failed to make deposit"
    };
    
  } catch (error: any) {
    console.error("Error making deposit:", error);
    return {
      success: false,
      message: error.message || "Failed to make deposit",
      errors: []
    };
  }
};

/**
 * Get all cancel types
 */
export const getAllCancelTypesAPI = async (): Promise<ICancelTypeResponse> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    const response = await apiClient.get("/api/CancelType/getAllCancelType", {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    // Handle different response formats
    if (response.data) {
      if (response.data.success !== undefined) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return { success: true, data: response.data.data };
      }
    }
    
    return response.data;
    
  } catch (error: any) {
    console.error("Error fetching cancel types:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve cancellation types",
      errors: []
    };
  }
};

/**
 * Process commit deposit
 */
export const processCommitDepositAPI = async (bookingCode: string): Promise<IBookingResponse> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    const response = await apiClient.post(`/api/Booking/processCommitDeposit/${bookingCode}`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    return response.data || {
      success: true,
      message: "Deposit processed successfully"
    };
    
  } catch (error: any) {
    console.error("Error processing deposit:", error);
    return {
      success: false,
      message: error.message || "Failed to process deposit",
      errors: []
    };
  }
};
export const getAddedProductAPI = async (serviceId: number): Promise<any> => {
  try {
    const apiClient = await initApiClient();
    const token = await getToken();
    
    if (!token) {
      throw new Error("Unauthorized: Please log in.");
    }
    
    // Check that we have valid serviceId
    if (!serviceId) {
      throw new Error("Service ID is required");
    }
    
    // Log the request
    
    // Make the API request
    const response = await apiClient.get(
      `/api/DecorService/getAddedProduct/${serviceId}`,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  
    return response.data;
    
  } catch (error: any) {
    console.error("🔴 Get Added Products API Error:", error);
    
    if (error.response) {
      console.error(`🔴 API Error [${error.response.status}]:`, error.response.data);
      
      return {
        success: false,
        message: error.response.data?.message || "Failed to get added products",
        errors: error.response.data?.errors || [],
        data: null
      };
    } 
    
    return {
      success: false,
      message: error.message || "Failed to get added products",
      errors: [],
      data: null
    };
  }
};

/**
 * Get paginated related products for a service
 * GET /api/DecorService/getPaginatedRelatedProduct
 */
export const getPaginatedRelatedProductAPI = async (
  serviceId: number,
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
    const apiClient = await initApiClient();
    const token = await getToken();
    
    if (!token) {
      throw new Error("Unauthorized: Please log in.");
    }
    
    // Check that we have valid serviceId
    if (!serviceId) {
      throw new Error("Service ID is required");
    }

    // Prepare the query parameters
    const params: Record<string, any> = {
      ServiceId: serviceId  // Required parameter
    };
    
    // Add optional parameters ONLY if they have valid values
    if (options.userId !== undefined && options.userId > 0) params.UserId = options.userId;
    if (options.category !== undefined && options.category.trim() !== '') params.Category = options.category;
    // Only add pageIndex if it's greater than 0 to avoid negative offset
    if (options.pageIndex !== undefined && options.pageIndex > 0) params.PageIndex = options.pageIndex;
    if (options.pageSize !== undefined && options.pageSize > 0) params.PageSize = options.pageSize;
    if (options.sortBy !== undefined && options.sortBy.trim() !== '') params.SortBy = options.sortBy;
    if (options.descending !== undefined) params.Descending = options.descending;
    
    // Log the request parameters
    console.log(`🔍 API request params:`, params);
    
    // Make the API request
    const response = await apiClient.get(
      `/api/DecorService/getPaginatedRelatedProduct`,
      {
        params,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  
    // Return the API response
    return response.data;
    
  } catch (error: any) {
    console.error("🔴 Get Related Products API Error:", error);
    
    if (error.response) {
      console.error(`🔴 API Error [${error.response.status}]:`, error.response.data);
      
      return {
        success: false,
        message: error.response.data?.message || "Failed to get related products",
        errors: error.response.data?.errors || [],
        data: null
      };
    } 
    
    return {
      success: false,
      message: error.message || "Failed to get related products",
      errors: [],
      data: null
    };
  }
};

/**
 * Add product to service holder
 * POST /api/DecorService/addProductToServiceHolder/{serviceId}
 */
export const addProductToServiceHolderAPI = async (
  serviceId: number,
  productId: number,
  quantity: number
): Promise<any> => {
  try {
    console.log(`🔍 Adding product ${productId} (quantity: ${quantity}) to service ${serviceId}`);
    const apiClient = await initApiClient();
    const token = await getToken();
    
    if (!token) {
      console.error('🔍 No token available');
      throw new Error("Unauthorized: Please log in.");
    }
    
    // Validate parameters
    if (!serviceId) {
      throw new Error("Service ID is required");
    }
    
    if (productId === undefined || productId === null) {
      throw new Error("Product ID is required");
    }
    
    if (quantity === undefined || quantity === null || quantity <= 0) {
      throw new Error("Valid quantity is required (must be greater than 0)");
    }
    
    // Log the request parameters
    console.log(`🔍 API request: serviceId=${serviceId}, productId=${productId}, quantity=${quantity}`);
    
    // Make the API request
    const response = await apiClient.post(
      `/api/DecorService/addProductToServiceHolder/${serviceId}`,
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
    
    return response.data;
    
  } catch (error: any) {
    console.error("🔴 Add Product To Service Holder API Error:", error);
    
    if (error.response) {
      console.error(`🔴 API Error [${error.response.status}]:`, error.response.data);
      
      return {
        success: false,
        message: error.response.data?.message || "Failed to add product to service",
        errors: error.response.data?.errors || [],
        data: null
      };
    } 
    
    return {
      success: false,
      message: error.message || "Failed to add product to service",
      errors: [],
      data: null
    };
  }
};

/**
 * Remove product from service holder
 * DELETE /api/DecorService/removeProductFromServiceHolder/{serviceId}
 */
export const removeProductFromServiceHolderAPI = async (
  serviceId: number, 
  productId: number
): Promise<any> => {
  try {
    console.log(`🔍 Removing product ${productId} from service ${serviceId}`);
    const apiClient = await initApiClient();
    const token = await getToken();
    
    if (!token) {
      throw new Error("Unauthorized: Please log in.");
    }
    
    // Validate parameters
    if (!serviceId) {
      throw new Error("Service ID is required");
    }
    
    if (!productId && productId !== 0) {
      throw new Error("Product ID is required");
    }

    const response = await apiClient.delete(
      `/api/DecorService/removeProductFromServiceHolder/${serviceId}`, 
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
    
    return response.data;
    
  } catch (error: any) {
    console.error("🔴 Remove Product From Service Holder API Error:", error);
    
    if (error.response) {
      console.error(`🔴 API Error [${error.response.status}]:`, error.response.data);
      
      return {
        success: false,
        message: error.response.data?.message || "Failed to remove product from service",
        errors: error.response.data?.errors || [],
        data: null
      };
    } 
    
    return {
      success: false,
      message: error.message || "Failed to remove product from service",
      errors: [],
      data: null
    };
  }
};