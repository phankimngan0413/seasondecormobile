import { initApiClient } from "@/config/axiosConfig";
import { getToken, getUserIdFromToken } from "@/services/auth";

// Favorite Product API
export const getFavoriteProductListAPI = async () => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.get("/api/FavoriteProduct/productList", {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Favorite Product List:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Get Favorite Product List API Error:", error.response?.data);
    throw new Error(error.response?.data?.message || "Failed to fetch favorite products.");
  }
};

export const addFavoriteProductAPI = async (productId: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.post(`/api/FavoriteProduct/${productId}`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Added Favorite Product:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Add Favorite Product API Error:", error.response?.data);
    throw new Error(error.response?.data?.message || "Failed to add favorite product.");
  }
};

export const removeFavoriteProductAPI = async (productId: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.delete(`/api/FavoriteProduct/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Removed Favorite Product:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Remove Favorite Product API Error:", error.response?.data);
    throw new Error(error.response?.data?.message || "Failed to remove favorite product.");
  }
};

// Favorite Service API
export const getFavoriteServiceListAPI = async () => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.get("/api/FavoriteService/myFavorite", {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Favorite Service List:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Get Favorite Service List API Error:", error.response?.data);
    throw new Error(error.response?.data?.message || "Failed to fetch favorite services.");
  }
};

export const addFavoriteServiceAPI = async (decorServiceId: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.post(`/api/FavoriteService/${decorServiceId}`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Added Favorite Service:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Add Favorite Service API Error:", error.response?.data);
    throw new Error(error.response?.data?.message || "Failed to add favorite service.");
  }
};

export const removeFavoriteServiceAPI = async (decorServiceId: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.delete(`/api/FavoriteService/${decorServiceId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Removed Favorite Service:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Remove Favorite Service API Error:", error.response?.data);
    throw new Error(error.response?.data?.message || "Failed to remove favorite service.");
  }
};