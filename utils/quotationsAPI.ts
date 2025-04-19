import { initApiClient } from "@/config/axiosConfig";
import { getToken, getUserIdFromToken } from "@/services/auth";

// Get Paginated Quotations API
export const getPaginatedQuotationsAPI = async (
  quotationCode?: string,
  status?: number,
  pageIndex: number = 0,
  pageSize: number = 10
) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    // Build query parameters
    const params: any = {
      pageIndex,
      pageSize
    };
    
    // Add optional parameters if provided
    if (quotationCode) params.quotationCode = quotationCode;
    if (status !== undefined) params.status = status;

    const response = await apiClient.get(
      "/api/Quotation/getPaginatedQuotationsForCustomer",
      { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log("🟢 Paginated Quotations Retrieved:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Get Paginated Quotations API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to retrieve quotations.");
  }
};

// Get Quotation Details API
export const getQuotationDetailsAPI = async (quotationId: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.get(
      `/api/Quotation/getQuotation/${quotationId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("🟢 Quotation Details Retrieved:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Get Quotation Details API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to retrieve quotation details.");
  }
};

// Create Quotation API
export const createQuotationAPI = async (quotationData: {
  products: Array<{ productId: number, quantity: number }>,
  notes?: string
}) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const userId = await getUserIdFromToken();
    const response = await apiClient.post(
      "/api/Quotation/create",
      {
        ...quotationData,
        customerId: userId
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("🟢 Quotation Created:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Create Quotation API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create quotation.");
  }
};

// Update Quotation Status API
export const updateQuotationStatusAPI = async (quotationId: number, status: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.put(
      `/api/Quotation/updateStatus/${quotationId}`,
      null,
      {
        params: { status },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log("🟢 Quotation Status Updated:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Update Quotation Status API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to update quotation status.");
  }
};

// Accept Quotation API
export const acceptQuotationAPI = async (quotationId: number) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.put(
      `/api/Quotation/accept/${quotationId}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("🟢 Quotation Accepted:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Accept Quotation API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to accept quotation.");
  }
};

// Reject Quotation API
export const rejectQuotationAPI = async (quotationId: number, reason?: string) => {
  const apiClient = await initApiClient();
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized: Please log in.");
  }

  try {
    const response = await apiClient.put(
      `/api/Quotation/reject/${quotationId}`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("🟢 Quotation Rejected:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("🔴 Reject Quotation API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to reject quotation.");
  }
};