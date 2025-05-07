import { initApiClient } from "@/config/axiosConfig"; // Assuming your axiosConfig is correctly set up
import { LogBox } from "react-native";

// Ignoring Axios 400 Errors for cleaner logs
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

// Interface for notification item
export interface INotification {
  id: number;
  title: string;
  content: string;
  url: string | null;
  notifiedAt: string;
  isRead: boolean;
  type?: 'CONTRACT' | 'BOOKING' | 'QUOTATION' | 'GENERAL' | 'ORDER' | 'SYSTEM';
}

// Interface for API response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  errors: string[];
  data: T;
}

/**
 * Fetches all notifications from the API - using the exact same code that works in your component
 * @returns Promise with array of notifications
 */
export const getAllNotificationsAPI = async (): Promise<INotification[]> => {
  try {
    const url = `/api/Notification/getAllNotifications`;
    console.log("🔍 Fetching notifications from:", url);
    
    const apiClient = await initApiClient();
    const response = await apiClient.get(url);
    
    console.log("📡 Response status:", response.status);
    
    if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
      console.log("✅ Successfully fetched", response.data.data.length, "notifications");
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      console.log("✅ Successfully fetched", response.data.length, "notifications (direct array)");
      return response.data;
    } else {
      console.error("❌ Unexpected API response format");
      return [];
    }
  } catch (error) {
    return [];
  }
};

/**
 * Fetches unread notifications from the API - using the same successful pattern
 * @returns Promise with array of unread notifications
 */
export const getUnreadNotificationsAPI = async (): Promise<INotification[]> => {
  try {
    const url = `/api/Notification/getUnreadNotification`;
    console.log("🔍 Fetching unread notifications from:", url);
    
    const apiClient = await initApiClient();
    const response = await apiClient.get(url);
    
    console.log("📡 Unread response status:", response.status);
    
    if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
      console.log("✅ Successfully fetched", response.data.data.length, "unread notifications");
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      console.log("✅ Successfully fetched", response.data.length, "unread notifications (direct array)");
      return response.data;
    } else {
      console.error("❌ Unexpected API response format for unread");
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching unread notifications:", error);
    return [];
  }
};