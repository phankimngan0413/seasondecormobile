import { initApiClient } from "@/config/axiosConfig";
import { getToken, getUserIdFromToken } from "@/services/auth";
import { Alert } from "react-native";

// Get Order List
export const getOrderListAPI = async () => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.get("/api/Order/getList", {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Order List:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Get Order List API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch order list.");
  }
};

// Get Paginated Order List
export const getPaginatedOrderListAPI = async (page: number = 1, pageSize: number = 10) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.get("/api/Order/getPaginatedList", {
      params: { page, pageSize },
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Paginated Order List:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Get Paginated Order List API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch paginated order list.");
  }
};

// Get Order by ID
export const getOrderByIdAPI = async (orderId: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.get(`/api/Order/getById/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Order Details:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Get Order by ID API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch order details.");
  }
};

// Create Order
export const createOrderAPI = async (orderId: number, orderDetails: any) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.post(`/api/Order/createorder/${orderId}`, orderDetails, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Order Created:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Create Order API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create order.");
  }
};

// Update Order Status
export const updateOrderStatusAPI = async (orderId: number, status: string) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.put(`/api/Order/updatestatus/${orderId}`, 
      { status }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("🟢 Order Status Updated:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Update Order Status API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to update order status.");
  }
};

// Cancel Order
export const cancelOrderAPI = async (orderId: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.delete(`/api/Order/cancelorder/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Order Cancelled:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Cancel Order API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to cancel order.");
  }
};

// Process Payment for Order
export const processOrderPaymentAPI = async (orderId: number, paymentDetails: any) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.post(`/api/Order/payment/${orderId}`, paymentDetails, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🟢 Order Payment Processed:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Order Payment API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to process order payment.");
  }
};