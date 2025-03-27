import { initApiClient } from "@/config/axiosConfig";
import { LogBox } from "react-native";

// Ignore specific warnings related to Axios error codes
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

export interface IAddress {
  id: string;

  fullName: string;
  phone: string;
  type: 0 | 1;  // 0 for "Home", 1 for "Office"
  isDefault: boolean;
  province: string;
  district: string;
  ward: string;
  street: string;
  detail: string;
}


interface IApiResponse<T> {
  success: boolean; // Make `success` mandatory
  errors?: string[];  // List of errors (optional)
  data?: T; // Data returned from the API
  message?: string; // Add message property (optional)
}

// Helper function for API calls
const handleApiRequest = async <T>(request: Promise<IApiResponse<T>>): Promise<T> => {
  try {
    const response = await request;

    // Improved error handling with consistent structure
    if (response.success && response.data) {
      return response.data;
    } else {
      const errorMessage = response.errors?.join(", ") || "An unknown error occurred.";
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error("🔴 API Request Error:", error);
    throw new Error(error?.message || "An error occurred during the request.");
  }
};

// GET /api/Address: Retrieve all addresses
export const getAddressesAPI = async (): Promise<IAddress[]> => {
  const url = "/api/Address";
  const apiClient = await initApiClient();
  return handleApiRequest<IAddress[]>(apiClient.get(url));
};
export const createAddressAPI = async (newAddress: IAddress): Promise<IApiResponse<IAddress>> => {
  const url = "/api/Address"; // Ensure the URL is correct
  const apiClient = await initApiClient(); // Ensure axios client is initialized

  try {
    console.log("Sending POST request with data:", newAddress); // Log the data sent
    const response = await apiClient.post(url, newAddress);
    console.log("Response from API:", response); // Log the response received

    // Check for success in the response
    if (response.data && response.data.success) {
      return { success: true, data: response.data.data }; // Return the data if successful
    } else {
      console.error("Failed response:", response);
      return { success: false, message: response.data?.message || "Unknown error" };
    }
  } catch (error) {
    console.error("Error in API request:", error);
    return { success: false, message: "Failed to create address" };
  }
};


// PUT /api/Address/{id}: Update an address by ID
export const updateAddressAPI = async (id: string, address: IAddress): Promise<IAddress> => {
  const url = `/api/Address/${id}`;
  const apiClient = await initApiClient();
  return handleApiRequest<IAddress>(apiClient.put(url, address));
};

// DELETE /api/Address/{id}: Delete an address by ID
export const deleteAddressAPI = async (id: string): Promise<boolean> => {
  const url = `/api/Address/${id}`;
  const apiClient = await initApiClient();

  try {
    const response: IApiResponse<null> = await apiClient.delete(url);
    if (response.success) {
      return true;
    } else {
      const errorMessage = response.errors?.join(", ") || "Failed to delete address.";
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error("🔴 Delete Address API Error:", error);
    throw new Error("Failed to delete address.");
  }
};

// POST /api/Address/set-default/{id}: Set an address as default
export const setDefaultAddressAPI = async (id: string): Promise<IAddress> => {
  const url = `/api/Address/set-default/${id}`;
  const apiClient = await initApiClient();
  return handleApiRequest<IAddress>(apiClient.post(url));
};
