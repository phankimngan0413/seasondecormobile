import { initApiClient } from "@/config/axiosConfig";
import { getToken, getUserIdFromToken } from "@/services/auth";
import { Alert } from "react-native";

// Create Cart API
export const createCartAPI = async () => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const userId = await getUserIdFromToken(); // Retrieve userId from token
    const response = await apiClient.post(
      "/api/Cart/create", // No {id} in URL, it's the user's cart
      { totalItem: 0, totalPrice: 0, accountId: userId }, // Pass userId in request body
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("🟢 Cart Created:", response.data);
    return response.data.id; // Return the created cartId for further use
  } catch (error: any) {
    console.error("🔴 Create Cart API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create cart.");
  }
};

// Add Product to Cart API
export const addToCartAPI = async (userId: number, productId: number, quantity: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.post(
      `/api/Cart/addToCart/${userId}`, // Use userId for cart operations
      null,
      { 
        params: { productId, quantity }, 
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log("🟢 Product Added to Cart:", response.data);
    return response.data;
  } catch (error: any) {
    const errorDetails = error.response?.data || error.message;
    console.error("🔴 Add to Cart API Error:", errorDetails);
    Alert.alert("❌ Error", errorDetails);
    throw new Error(errorDetails);
  }
};

export const getCartAPI = async (userId: number) => {
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(`/api/Cart/getCart/${userId}`);
    console.log("🟢 API Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Get Cart API Error:", error.response?.status, error.response?.data);
    if (error.response) {
      console.error("Error details:", error.response.data);
    }
    throw new Error(error.response?.data?.message || "Failed to fetch cart.");
  }
};

export const removeProductFromCartAPI = async (userId: number, productId: number) => {
  const apiClient = await initApiClient();
  const url = `/api/Cart/removeProduct/${userId}?productId=${productId}`;

  try {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
      data: {
        cartItems: any[]; // Updated cart items list after removal
        totalItem: number;
        totalPrice: number;
      };
    }>(url);

    console.log("🟢 Remove Product Response:", response.data);
    console.log("Removing product with URL:", url);

    // Validate the response structure
    if (response.data && typeof response.data.success !== "undefined") {
      if (response.data.success) {
        // Return updated data if success is true
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to remove product.");
      }
    } else {
      throw new Error("Invalid API response structure.");
    }
  } catch (error: any) {
    // Handle any errors from the API call
    console.error("🔴 Remove Product API Error:", error);
    throw new Error("Error removing product from cart.");
  }
};
