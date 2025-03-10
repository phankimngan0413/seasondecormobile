import { initApiClient } from "@/utils/axiosConfig";
import { getToken, getUserIdFromToken } from "@/services/auth";

export const createCartAPI = async () => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) throw new Error("Unauthorized: Please log in.");

  try {
    const response = await apiClient.post(
      "/api/Cart/create",
      { totalItem: 0, totalPrice: 0, accountId: await getUserIdFromToken() },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("🟢 Cart Created:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Create Cart API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create cart.");
  }
};

export const addToCartAPI = async (cartId: number, productId: number, quantity: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) throw new Error("Unauthorized: Please log in.");

  try {
    const response = await apiClient.post(
      `/api/Cart/addToCart/${cartId}`,
      null,
      {
        params: { productId, quantity },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("🟢 Added to Cart:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Add to Cart API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to add product to cart.");
  }
};
export const getCartAPI = async (userId: number) => {
    const apiClient = initApiClient();
    try {
      const response = await (await apiClient).get(`/api/Cart/getCart/${userId}`);
      console.log("🟢 API Response:", response.data);
      return response.data; 
    } catch (error: any) {
      console.error("🔴 Get Cart API Error:", error.response?.status, error.response?.data);
      throw new Error(error.response?.data?.message || "Failed to fetch cart.");
    }
  };
  
  
 
  export const removeProductFromCartAPI = async (userId: number, productId: number) => {
    const url = `/api/Cart/removeProduct/${userId}?productId=${productId}`;
  
    const apiClient = await initApiClient();
    console.log("🔴 Removing product from cart:", apiClient.defaults.baseURL + url);
  
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(url);
      console.log("🟢 Remove Product Response:", response.data);
  
      if (response.data.success) {
        return response.data.message;
      } else {
        throw new Error("Failed to remove product.");
      }
    } catch (error: any) {
      console.error("🔴 Remove Product API Error:", error);
      throw new Error("Error removing product from cart.");
    }
  };