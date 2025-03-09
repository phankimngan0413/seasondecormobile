import apiClient from "@/utils/axiosConfig"; // import your Axios instance
import { LogBox } from "react-native";

// ✅ Ẩn lỗi Axios 400 từ LogBox
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

// Define backend response interface
interface IBackendRes<T> {
  success?: boolean;
  token?: string;
  errors?: string[];
  requiresTwoFactor?: boolean;
  data?: T;
}

// Define Address and Address API response types
interface IAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

interface IAddressResponse {
  addresses: IAddress[];
}

// Fetch all addresses
export const getAllAddressesAPI = async (): Promise<IAddressResponse> => {
  const url = "/api/Address";

  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<IAddressResponse> = await apiClient.get(url);
    console.log("🟢 Full API Response:", response);

    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    if (!response.success) {
      console.error("🔴 Failed to fetch addresses:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Failed to fetch addresses."));
    }

    return response.data || { addresses: [] };
  } catch (error: any) {
    console.error("🔴 Fetch addresses API Error:", error);

    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    return Promise.reject(new Error("Network error, please try again."));
  }
};

// Create a new address
export const createAddressAPI = async (address: IAddress): Promise<IAddress> => {
  const url = "/api/Address/create";

  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<IAddress> = await apiClient.post(url, address);
    console.log("🟢 Full API Response:", response);

    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    if (!response.success) {
      console.error("🔴 Failed to create address:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Failed to create address."));
    }

    return response.data || {} as IAddress;
  } catch (error: any) {
    console.error("🔴 Create address API Error:", error);

    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    return Promise.reject(new Error("Network error, please try again."));
  }
};

// Update an address
export const updateAddressAPI = async (id: string, address: IAddress): Promise<IAddress> => {
  const url = `/api/Address/update/${id}`;

  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<IAddress> = await apiClient.put(url, address);
    console.log("🟢 Full API Response:", response);

    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    if (!response.success) {
      console.error("🔴 Failed to update address:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Failed to update address."));
    }

    return response.data || {} as IAddress;
  } catch (error: any) {
    console.error("🔴 Update address API Error:", error);

    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    return Promise.reject(new Error("Network error, please try again."));
  }
};

// Delete an address
export const deleteAddressAPI = async (id: string): Promise<boolean> => {
  const url = `/api/Address/delete/${id}`;

  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<null> = await apiClient.delete(url);
    console.log("🟢 Full API Response:", response);

    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    if (!response.success) {
      console.error("🔴 Failed to delete address:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Failed to delete address."));
    }

    return true;
  } catch (error: any) {
    console.error("🔴 Delete address API Error:", error);

    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    return Promise.reject(new Error("Network error, please try again."));
  }
};

// Set address as default
export const setDefaultAddressAPI = async (id: string): Promise<boolean> => {
  const url = `/api/Address/set-default/${id}`;

  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<null> = await apiClient.post(url);
    console.log("🟢 Full API Response:", response);

    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    if (!response.success) {
      console.error("🔴 Failed to set default address:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Failed to set default address."));
    }

    return true;
  } catch (error: any) {
    console.error("🔴 Set default address API Error:", error);

    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    return Promise.reject(new Error("Network error, please try again."));
  }
};
