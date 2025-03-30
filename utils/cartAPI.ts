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
export const addToCartAPI = async (accountId: number, productId: number, quantity: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }
  
  try {
    console.log(`Adding product ID ${productId} to cart for account ID ${accountId} with quantity ${quantity}`);
    const response = await apiClient.post(
      `/api/Cart/addToCart/${accountId}`, // accountId from token in the path
      null, // No request body
      {
        params: { 
          productId: productId, // Product ID from your product data
          quantity: quantity 
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log("🟢 Product Added to Cart:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Add to Cart API Error:", error.response?.data);
    
    // More detailed error logging
    if (error.response) {
      console.error("Status code:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    
    throw new Error("Failed to add product to cart. Please try again.");
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
    
};
