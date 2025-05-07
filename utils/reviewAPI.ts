import { initApiClient } from "@/config/axiosConfig";
import { getToken, getUserIdFromToken } from "@/services/auth";

// Define interfaces for the API response structure
export interface IReview {
  id: number;
  name: string;
  userName?: string;
  avatar: string;
  rate: number;
  comment: string;
  createAt: string;
  images: string[];
  // Product-specific properties
  productId?: number;
  productName?: string;
  productImage?: string;
  // Service-specific properties
  serviceId?: number;
  serviceName?: string;
  serviceImage?: string;
}
interface RateCount {
  [key: string]: number; // For dynamic keys like "5": 1
}

interface ReviewData {
  averageRate: number;
  rateCount: RateCount;
  data: IReview[]; // The array of reviews
  totalCount: number;
}

interface ReviewResponse {
  success: boolean;
  message: string;
  errors: string[];
  data: ReviewData | null;
}

// Create Product Review API
export const createProductReviewAPI = async (
  rate: number,
  comment: string,
  orderId: number,
  productId: number,
  images: string[] = []
) => {
  const apiClient = await initApiClient();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }
  
  try {
    const accountId = await getUserIdFromToken(); // Get the current user's ID from token
    
    if (!accountId) {
      throw new Error("User ID not found. Please log in again.");
    }
    
    console.log(`Creating review for product ID ${productId}, order ID ${orderId}`);
    
    // Create a FormData object to properly handle image uploads
    const formData = new FormData();
    formData.append('rate', rate.toString());
    formData.append('comment', comment);
    formData.append('accountId', accountId.toString());
    formData.append('orderId', orderId.toString());
    formData.append('productId', productId.toString());
    
    // Always append an "Images" field, even if it's empty
    if (images.length > 0) {
      // If there are images, append each one
      images.forEach((uri, index) => {
        // Extract file name from uri
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        
        formData.append('Images', {
          uri: uri,
          name: fileName,
          type: 'image/jpeg', // Adjust the type if needed
        } as any);
      });
    } else {
      // If no images, append an empty array for the Images field
      formData.append('Images', JSON.stringify([]));
    }
    
    const response = await apiClient.post(
      "/api/Review/reviewProduct",
      formData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      }
    );
    
    console.log("🟢 Review Created:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Create Review API Error:", error.response?.data);
    
    // More detailed error logging
    if (error.response) {
      console.error("Status code:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    
    throw new Error(error.response?.data?.message || "Failed to create product review. Please try again.");
  }
};

// Create Service Review API
export const createServiceReviewAPI = async (
  rate: number,
  comment: string,
  bookingId: number,
  serviceId: number,
  images: string[] = []
) => {
  const apiClient = await initApiClient();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }
  
  try {
    const accountId = await getUserIdFromToken();
    
    if (!accountId) {
      throw new Error("User ID not found. Please log in again.");
    }
    
    console.log(`Creating review for service ID ${serviceId}, booking ID ${bookingId}`);
    
    const formData = new FormData();
    formData.append('rate', rate.toString());
    formData.append('comment', comment);
    formData.append('accountId', accountId.toString());
    formData.append('bookingId', bookingId.toString());
    formData.append('serviceId', serviceId.toString());
    
    if (images.length > 0) {
      images.forEach((uri, index) => {
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        
        formData.append('Images', {
          uri: uri,
          name: fileName,
          type: 'image/jpeg',
        } as any);
      });
    } else {
      formData.append('Images', JSON.stringify([]));
    }
    
    const response = await apiClient.post(
      "/api/Review/reviewService",
      formData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      }
    );
    
    console.log("🟢 Service Review Created:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Create Service Review API Error:", error.response?.data);
    
    if (error.response) {
      console.error("Status code:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    
    throw new Error(error.response?.data?.message || "Failed to create service review. Please try again.");
  }
};

// Get User Reviews API
export const getUserReviewsAPI = async () => {
  const apiClient = await initApiClient();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }
  
  try {
    const accountId = await getUserIdFromToken();
    const response = await apiClient.get(`/api/Review/getUserReviews/${accountId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("🟢 User Reviews Retrieved:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Get User Reviews API Error:", error.response?.data);
    throw new Error("Failed to fetch your reviews. Please try again.");
  }
};

// Delete Review API
export const deleteReviewAPI = async (reviewId: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }
  
  try {
    const response = await apiClient.delete(`/api/Review/deleteReview/${reviewId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("🟢 Review Deleted:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Delete Review API Error:", error.response?.data);
    throw new Error("Failed to delete review. Please try again.");
  }
};

// Update Product Review API
export const updateProductReviewAPI = async (
  reviewId: number,
  rate: number,
  comment: string,
  images: string[] = []
) => {
  const apiClient = await initApiClient();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }
  
  try {
    const formData = new FormData();
    formData.append('rate', rate.toString());
    formData.append('comment', comment);
    
    if (images.length > 0) {
      images.forEach((uri, index) => {
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        
        formData.append('Images', {
          uri: uri,
          name: fileName,
          type: 'image/jpeg',
        } as any);
      });
    } else {
      formData.append('Images', JSON.stringify([]));
    }
    
    const response = await apiClient.put(
      `/api/Review/updateProductReview/${reviewId}`,
      formData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      }
    );
    
    console.log("🟢 Product Review Updated:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Update Product Review API Error:", error.response?.data);
    
    if (error.response) {
      console.error("Status code:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    
    throw new Error(error.response?.data?.message || "Failed to update product review. Please try again.");
  }
};

// Update Service Review API
export const updateServiceReviewAPI = async (
  reviewId: number,
  rate: number,
  comment: string,
  images: string[] = []
) => {
  const apiClient = await initApiClient();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }
  
  try {
    const formData = new FormData();
    formData.append('rate', rate.toString());
    formData.append('comment', comment);
    
    if (images.length > 0) {
      images.forEach((uri, index) => {
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        
        formData.append('Images', {
          uri: uri,
          name: fileName,
          type: 'image/jpeg',
        } as any);
      });
    } else {
      formData.append('Images', JSON.stringify([]));
    }
    
    const response = await apiClient.put(
      `/api/Review/updateServiceReview/${reviewId}`,
      formData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      }
    );
    
    console.log("🟢 Service Review Updated:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Update Service Review API Error:", error.response?.data);
    
    if (error.response) {
      console.error("Status code:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    
    throw new Error(error.response?.data?.message || "Failed to update service review. Please try again.");
  }
};

// Create Service Review by Booking Code
export const createServiceReviewByBookingCodeAPI = async (
  rate: number,
  comment: string,
  BookingId: string,
  images: string[] = []
) => {
  const apiClient = await initApiClient();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }
  
  try {
    const accountId = await getUserIdFromToken();
    
    if (!accountId) {
      throw new Error("User ID not found. Please log in again.");
    }
    
    console.log(`Creating review for booking code: ${BookingId}`);
    
    const formData = new FormData();
    formData.append('rate', rate.toString());
    formData.append('comment', comment);
    formData.append('accountId', accountId.toString());
    formData.append('bookingid', BookingId);
    
    if (images.length > 0) {
      images.forEach((uri, index) => {
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        
        formData.append('Images', {
          uri: uri,
          name: fileName,
          type: 'image/jpeg',
        } as any);
      });
    } else {
      formData.append('Images', JSON.stringify([]));
    }
    
    const response = await apiClient.post(
      "/api/Review/reviewService",
      formData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      }
    );
    
    console.log("🟢 Service Review Created:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Create Service Review API Error:", error.response?.data);
    
    if (error.response) {
      console.error("Status code:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    
    throw new Error(error.response?.data?.message || "Failed to create service review. Please try again.");
  }
};

// Get Reviews by Service ID API - FIXED
export const getReviewByServiceIdAPI = async (serviceId: number | string) => {
  const apiClient = await initApiClient();
  
  try {
  
    const response = await apiClient.get(`/api/Review/getReviewByService/${serviceId}`);
    
    // Log the raw response for debugging
    
    // Handle successful response
    if (response.data) {
      // More detailed logging of what we received
      if (Array.isArray(response.data)) {
      } else {
        // If it's an object with data property, try to extract the array
        if (typeof response.data === 'object' && response.data.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      
      // Make sure we always return an array
      return Array.isArray(response.data) ? response.data : [];
    } else {
      console.log("🟡 Service Reviews Retrieved: No reviews found, response data was null or undefined");
      return [];
    }
  } catch (error: any) {
    // Enhanced error logging
    console.error("🔴 Get Service Review API Error:", error.message);
    
    // Detailed error logging based on error type
    if (error.response) {
      console.error(`Status: ${error.response.status} - ${error.response.statusText}`);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      
      const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          `Server error (${error.response.status})`;
      
      throw new Error(`Review fetch failed: ${errorMessage}`);
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("Network error: No response from server. Please check your connection.");
    } else {
      console.error("Error setting up request:", error.message);
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
};
// Get Reviews by Product ID API - FIXED
export const getReviewByProductIdAPI = async (productId: number | string): Promise<ReviewResponse> => {
  const apiClient = await initApiClient();
  
  try {
    // Log the request
    console.log(`📝 Fetching reviews for product ID: ${productId}`);
    
    // Make API call
    const response = await apiClient.get(`/api/Review/getReviewByProduct/${productId}`);
    
    // Log the success
    if (response.data && response.data.success && response.data.data) {
      const reviewCount = response.data.data.data ? response.data.data.data.length : 0;
      const totalCount = response.data.data.totalCount || 0;
      console.log(`🟢 Product Reviews Retrieved: ${reviewCount} reviews found (Total: ${totalCount})`);
    } else {
      console.log("🟡 Product Reviews Retrieved: No reviews or invalid response format");
    }
    
    return response.data;
  } catch (error: any) {
    // Error logging
    console.error("🔴 Get Product Review API Error:", error.message);
    
    if (error.response) {
      console.error("Status code:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    
    // Return a properly structured error response
    return {
      success: false,
      message: "Failed to fetch reviews",
      errors: [error.message || "Unknown error"],
      data: null
    };
  }
};
// Direct endpoint call without parameters
export const getReviewByAccountDirectAPI = async () => {
  const apiClient = await initApiClient();
  
  try {
    console.log(`📝 Fetching reviews using direct endpoint call`);
    
    // Call API with only minimal required parameters
    const response = await apiClient.get('/api/Review/getReviewByAccount', {
      params: {
        PageIndex: 0, // Always use first page
        PageSize: 100 // Use large page size to get all records at once
      }
    });
    
    // Validate the response
    if (response.data) {
      console.log(`✅ Successfully fetched reviews using direct call`);
      return response.data;
    } else {
      throw new Error('Empty response received');
    }
  } catch (error: any) {
    // Log error details
    if (error.response) {
      console.error(`❌ API Error [${error.response.status}]:`, error.response.data);
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
    } else {
      console.error('❌ Error setting up request:', error.message);
    }
    
    // Return error object
    const errorResponse = {
      success: false,
      message: error.message || 'Failed to fetch account reviews',
      data: null
    };
    
    return errorResponse;
  }
};