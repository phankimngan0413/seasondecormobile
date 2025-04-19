import { initApiClient } from "@/config/axiosConfig";
import { getToken, getUserIdFromToken } from "@/services/auth";

// Create Product Review API
export interface IReview {
  id: number;
  rate: number;
  comment: string;
  createAt: string;
  userName?: string; // Optional if sometimes missing
  images?: string[]; // Optional array of image URLs
}

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

// Get Review by Product ID API
export const getReviewByProductIdAPI = async (productId: number) => {
  const apiClient = await initApiClient();
  
  try {
    const response = await apiClient.get(`/api/Review/getReviewByProduct/${productId}`);
    console.log("🟢 Product Reviews Retrieved:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Get Product Review API Error:", error.response?.data);
    throw new Error("Failed to fetch product reviews. Please try again.");
  }
};

// Get Review by Service ID API
export const getReviewByServiceIdAPI = async (serviceId: number) => {
  const apiClient = await initApiClient();
  
  try {
    const response = await apiClient.get(`/api/Review/getReviewByService/${serviceId}`);
    console.log("🟢 Service Reviews Retrieved:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Get Service Review API Error:", error.response?.data);
    throw new Error("Failed to fetch service reviews. Please try again.");
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