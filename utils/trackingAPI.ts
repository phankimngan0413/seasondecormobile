import { initApiClient } from "@/config/axiosConfig";

// Types for tracking operations
export interface ITrackingImage {
  id: number;
  imageUrl: string;
}

export interface IServerTrackingItem {
  id: number;
  bookingCode: string;
  task: string;
  note: string;
  createdAt: string;
  images: ITrackingImage[];
}

// Interface for UI
export interface ITrackingItem {
  id: number;
  bookingCode: string;
  task: string;
  note: string;
  createdAt: string;
  images: ITrackingImage[];
}

export interface ITrackingHistoryResponse {
  success: boolean;
  trackingItems: ITrackingItem[];
  message?: string;
}

/**
 * Map server tracking item to UI tracking item
 */
function mapTrackingItem(item: IServerTrackingItem): ITrackingItem {
  return {
    id: item.id,
    bookingCode: item.bookingCode,
    task: item.task,
    note: item.note,
    createdAt: item.createdAt,
    images: item.images || []
  };
}

/**
 * Get tracking history by booking code
 * @param bookingCode The booking code to fetch tracking history for
 * @returns Promise with the tracking history
 */
export const getTrackingByBookingCodeAPI = async (bookingCode: string): Promise<ITrackingHistoryResponse> => {
  const url = "/api/Tracking/getTrackingByBookingCode";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url, {
      params: { bookingCode }
    });
    
    // Handle case where response.data is directly an array of tracking items
    if (response && response.data && Array.isArray(response.data)) {
      const trackingItems = response.data.map(mapTrackingItem);
      
      return {
        success: true,
        trackingItems,
        message: "Tracking history retrieved successfully"
      };
    }
    
    // Handle case where response.data has a nested data array
    if (response?.data?.success && Array.isArray(response.data.data)) {
      const trackingItems = response.data.data.map(mapTrackingItem);
      
      return {
        success: true,
        trackingItems,
        message: response.data.message
      };
    }
    
    // Log the response format for debugging
    console.log("Response data format:", JSON.stringify(response.data));
    
    // Handle case where no tracking data was found
    return {
      success: false,
      trackingItems: [],
      message: "No tracking information found"
    };
    
  } catch (error: any) {
    console.log("Error fetching tracking history:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      trackingItems: [],
      message: "Failed to retrieve tracking information"
    };
  }
};

/**
 * Add a new tracking entry
 * @param bookingCode The booking code to add tracking for
 * @param task The task description
 * @param note Optional notes for the tracking entry
 * @param images Optional array of image files to upload
 * @returns Promise with the response from the server
 */
export const addTrackingEntryAPI = async (
  bookingCode: string, 
  task: string, 
  note: string = "",
  images: File[] = []
): Promise<{ success: boolean; message: string }> => {
  const url = "/api/Tracking/addTrackingEntry";
  
  const apiClient = await initApiClient();
  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("bookingCode", bookingCode);
    formData.append("task", task);
    formData.append("note", note);
    
    // Add images if available
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });
    }
    
    const response = await apiClient.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    
    if (response && response.data) {
      return {
        success: response.data.success || true,
        message: response.data.message || "Tracking entry added successfully"
      };
    }
    
    return {
      success: false,
      message: "Failed to add tracking entry"
    };
    
  } catch (error: any) {
    console.log("Error adding tracking entry:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Error occurred while adding tracking entry"
    };
  }
};

/**
 * Delete a tracking entry
 * @param trackingId The ID of the tracking entry to delete
 * @returns Promise with the response from the server
 */
export const deleteTrackingEntryAPI = async (
  trackingId: number
): Promise<{ success: boolean; message: string }> => {
  const url = `/api/Tracking/deleteTrackingEntry/${trackingId}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.delete(url);
    
    if (response && response.data) {
      return {
        success: response.data.success || true,
        message: response.data.message || "Tracking entry deleted successfully"
      };
    }
    
    return {
      success: false,
      message: "Failed to delete tracking entry"
    };
    
  } catch (error: any) {
    console.log("Error deleting tracking entry:", error);
    
    if (error.response) {
      console.log("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Error occurred while deleting tracking entry"
    };
  }
};