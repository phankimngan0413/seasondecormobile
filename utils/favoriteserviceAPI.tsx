import { initApiClient } from "@/config/axiosConfig";

export interface IFavoriteService {
  id: number;
  decorServiceId: number;
  accountId: number;
  createdAt: string;
  decorService?: {
    id: number;
    style: string;
    description?: string;
    province?: string;
    sublocation?: string;
    images?: string[];
    provider?: {
      id: number;
      businessName: string;
    }
  }
}

export interface IFavoriteResponse {
  success: boolean;
  message?: string;
  favorites?: IFavoriteService[];
}

export interface IToggleFavoriteResponse {
  success: boolean;
  message?: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Get all favorite services for the current user
 * @returns Promise with the list of favorite services
 */
export const getFavoritesAPI = async (): Promise<IFavoriteResponse> => {
  const url = "/api/FavoriteService/myfavorite";
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url);
    
    if (response && response.data) {
      return {
        success: true,
        favorites: response.data
      };
    } else {
      console.error("🔴 Invalid favorites response:", response);
      return {
        success: false,
        message: "Failed to retrieve favorites information",
        favorites: []
      };
    }
  } catch (error: any) {
    console.error("🔴 Error fetching favorites:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: "Failed to connect to favorites service",
      favorites: []
    };
  }
};

/**
 * Add a decor service to favorites
 * @param decorServiceId The ID of the decor service to add to favorites
 * @returns Promise with the result of the operation
 */
export const addToFavoritesAPI = async (decorServiceId: number): Promise<IToggleFavoriteResponse> => {
  const url = `/api/FavoriteService/${decorServiceId}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.post(url);
    
    if (response && response.data) {
      return {
        success: true,
        message: "Successfully added to favorites",
        added: true
      };
    } else {
      return {
        success: false,
        message: "Failed to add to favorites"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error adding to favorites:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to add to favorites"
    };
  }
};

/**
 * Remove a decor service from favorites
 * @param decorServiceId The ID of the decor service to remove from favorites
 * @returns Promise with the result of the operation
 */
export const removeFromFavoritesAPI = async (decorServiceId: number): Promise<IToggleFavoriteResponse> => {
  const url = `/api/FavoriteService/${decorServiceId}`;
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.delete(url);
    
    if (response && response.status === 200) {
      return {
        success: true,
        message: "Successfully removed from favorites",
        removed: true
      };
    } else {
      return {
        success: false,
        message: "Failed to remove from favorites"
      };
    }
  } catch (error: any) {
    console.error("🔴 Error removing from favorites:", error);
    
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to remove from favorites"
    };
  }
};

/**
 * Check if a decor service is in favorites
 * @param decorServiceId The ID of the decor service to check
 * @returns Promise with the result indicating if the service is favorited
 */
export const checkFavoriteStatusAPI = async (decorServiceId: number): Promise<boolean> => {
  try {
    const favoritesResponse = await getFavoritesAPI();
    
    if (!favoritesResponse.success || !favoritesResponse.favorites) {
      return false;
    }
    
    return favoritesResponse.favorites.some(
      favorite => favorite.decorServiceId === decorServiceId
    );
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }
};

/**
 * Toggle favorite status for a decor service (add if not favorited, remove if already favorited)
 * @param decorServiceId The ID of the decor service to toggle
 * @returns Promise with the result of the operation
 */
export const toggleFavoriteAPI = async (decorServiceId: number): Promise<IToggleFavoriteResponse> => {
  try {
    // First check if it's already a favorite
    const isFavorite = await checkFavoriteStatusAPI(decorServiceId);
    
    if (isFavorite) {
      // If it's already a favorite, remove it
      return await removeFromFavoritesAPI(decorServiceId);
    } else {
      // If it's not a favorite, add it
      return await addToFavoritesAPI(decorServiceId);
    }
  } catch (error: any) {
    console.error("Error toggling favorite status:", error);
    return {
      success: false,
      message: "Error toggling favorite status"
    };
  }
};