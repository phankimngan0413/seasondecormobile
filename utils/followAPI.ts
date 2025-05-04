import { initApiClient } from "@/config/axiosConfig";
import { LogBox } from "react-native";

// Ignoring Axios 400 Errors for cleaner logs
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

// Interface for follower/following data
export interface IFollowUser {
  id: number;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  isFollowing?: boolean;
}

// Interface for counts
export interface IFollowCounts {
  followers: number;
  following: number;
}

// Response interfaces
interface IFollowResponse {
  success: boolean;
  message?: string;
  // Add optional properties for special cases
  alreadyFollowing?: boolean;
  alreadyNotFollowing?: boolean;
}

// OR you can use a more flexible approach if needed:
interface IExtendedFollowResponse extends IFollowResponse {
  [key: string]: any; // Allows any additional properties
}
/**
 * Follow a user
 * POST /api/follow/follow
 */
/**
 * Unfollow a user with better error handling
 * DELETE /api/follow/unfollow
 */
// Corrected unfollowUserAPI function with proper endpoint
export const unfollowUserAPI = async (followingId: number): Promise<any> => {
  // The correct URL format with query parameter
  const url = `/api/Follow/unfollow?followingId=${followingId}`;
  
  try {
    const apiClient = await initApiClient();
    // Use DELETE method without a body
    const response = await apiClient.delete(url);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Unfollow User API Error:", error.response?.data || error);
    
    // Check if it's the specific "relationship doesn't exist" error
    const errorData = error.response?.data;
    if (errorData && 
        Array.isArray(errorData.errors) && 
        errorData.errors.some((e: string) => e.includes("relationship does not exist") || 
                                           e.includes("Follow relationship does not exist"))) {
      // Return a fake success response - don't throw
      console.log("Relationship doesn't exist - returning success anyway");
      return { 
        success: true, 
        message: "Already not following"
      };
    }
    
    // Rethrow any other errors
    throw error;
  }
};
export const getFollowersAPI = async (userId?: number): Promise<IFollowUser[]> => {
  const url = userId ? `/api/follow/followers?userId=${userId}` : "/api/follow/followers";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    // Log the full response for debugging
    console.log("Followers API Response:", response);
    
    // Check if response contains 'data' and it's an array
    if (response && Array.isArray(response.data)) {
      return response.data;
    } else {
      return Promise.reject(new Error("Invalid response format from the server."));
    }
  } catch (error: any) {
    // Log the error for troubleshooting
    console.error("🔴 Error fetching followers:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return Promise.reject(new Error("Failed to fetch followers from the server."));
  }
};

/**
 * Get followings list
 * GET /api/follow/followings
 */
export const getFollowingsAPI = async (userId?: number): Promise<IFollowUser[]> => {
  const url = userId ? `/api/follow/followings?userId=${userId}` : "/api/follow/followings";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    // Log the full response for debugging
    console.log("Followings API Response:", response);
    
    // Check if response contains 'data' and it's an array
    if (response && Array.isArray(response.data)) {
      return response.data;
    } else {
      return Promise.reject(new Error("Invalid response format from the server."));
    }
  } catch (error: any) {
    // Log the error for troubleshooting
    console.error("🔴 Error fetching followings:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return Promise.reject(new Error("Failed to fetch followings from the server."));
  }
};

/**
 * Get follow counts
 * GET /api/follow/counts
 */
export const getFollowCountsAPI = async (userId?: number): Promise<IFollowCounts> => {
  const url = userId ? `/api/follow/counts?userId=${userId}` : "/api/follow/counts";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    // Log the full response for debugging
    
    // Check if response contains the expected data structure
    if (response && response.data && 
        typeof response.data.followers === 'number' && 
        typeof response.data.following === 'number') {
      return response.data;
    } else {
      console.error("🔴 API Response is invalid:", response);
      return Promise.reject(new Error("Invalid response format from the server."));
    }
  } catch (error: any) {
    // Log the error for troubleshooting
    console.error("🔴 Error fetching follow counts:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return Promise.reject(new Error("Failed to fetch follow counts from the server."));
  }
};

/**
 * Check if user is following another user
 * GET /api/follow/is-following
 */
// Updated followUserAPI to properly handle the "already following" case
export const followUserAPI = async (followingId: number): Promise<any> => {
  const url = `/api/follow/follow?followingId=${followingId}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.post(url);
    
    // Success response is the follow relationship object
    if (response.data && response.data.id) {
      return {
        success: true,
        data: response.data,
        message: "Successfully followed user"
      };
    } 
    // Some APIs might return success: false directly
    else if (response.data && response.data.success === false) {
      throw new Error(response.data.message || "Failed to follow user");
    }
    else {
      throw new Error("Invalid response format from server.");
    }
  } catch (error: any) {
    // Special handling for "already following" error
    if (error.response?.data?.errors?.some((err: string) => 
      err.includes("You are already following this user.")
    )) {
      // Return success true since the user is already being followed
      return {
        success: true,
        message: "Already following this user",
        alreadyFollowing: true
      };
    }
    
    console.error("🔴 Follow User API Error:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Failed to follow user. Please try again.");
  }
};

// Updated checkIsFollowingAPI with better error handling
export const checkIsFollowingAPI = async (targetUserId: number): Promise<boolean> => {
  const url = `/api/follow/is-following?targetId=${targetUserId}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    // Check if response contains the expected data structure
    if (response && response.data && typeof response.data.isFollowing === 'boolean') {
      return response.data.isFollowing;
    } else {
      return false; // Default to false instead of rejecting
    }
  } catch (error: any) {
    // Log the error for troubleshooting
    console.error("🔴 Error checking follow status:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    // Check if error indicates "already following"
    if (error.response?.data?.errors?.some((err: string) => 
      err.includes("You are already following this user.")
    )) {
      return true; // Return true since the user is already following
    }
    
    return false; // Default to false for other errors
  }
};