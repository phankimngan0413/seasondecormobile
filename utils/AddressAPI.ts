import { initApiClient } from "@/config/axiosConfig";
import { getToken } from "@/services/auth";
import { LogBox } from "react-native";

// Ignore specific warnings related to Axios error codes
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

export interface IAddress {
  id: string;
  fullName: string;
  phone: string;
  addressType: 0 | 1;  // Change 'type' to 'addressType'
  isDefault: boolean;
  province: string;
  district: string;
  ward: string;
  street: string;
  detail: string;
}

export interface IApiResponse<T = any> {
  success: boolean;
  errors?: string[];
  data?: T;
  message?: string;
}

// Improved helper function for API calls
const handleApiRequest = async <T>(request: Promise<any>): Promise<T> => {
  try {
    const response = await request;
    const responseData = response.data;

    // Check if the response has the expected structure
    if (responseData && typeof responseData.success === 'boolean') {
      if (responseData.success && responseData.data) {
        return responseData.data;
      } else {
        const errorMessage = responseData.errors?.join(", ") || responseData.message || "An unknown error occurred.";
        throw new Error(errorMessage);
      }
    } else {
      // For responses without the standard structure, return the raw data
      return response.data;
    }
  } catch (error: any) {
    console.error("API Request Error:", error);
    throw new Error(error?.message || "An error occurred during the request.");
  }
};

// GET /api/Address: Retrieve all addresses
export const getAddressesAPI = async (): Promise<IAddress[]> => {   
  try {     
    const token = await getToken();
    if (!token) throw new Error("No token found!");
          
    const apiClient = await initApiClient();
    const response = await apiClient.get('/api/Address', {       
      headers: {         
        Authorization: `Bearer ${token}`,       
      }     
    });
          
    // Trả về trực tiếp response.data thay vì response.data.data
    return response.data;
  } catch (error) {     
    console.error("Error fetching addresses:", error);     
    return [];   
  } 
};

export const createAddressAPI = async (address: any): Promise<IApiResponse> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    console.log("Sending request data:", address);
    
    const response = await apiClient.post('/api/Address', address, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("Raw API response:", response.data);
    
    // Simply return the response data without modifying it
    return response.data;
  } catch (error: any) {
    console.error("Error in createAddressAPI:", error);
    return {
      success: false,
      message: error.message || "Failed to create address",
      errors: []
    };
  }
};
// PUT /api/Address/{id}: Update an address by ID
export const updateAddressAPI = async (id: string, address: IAddress): Promise<IAddress> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    const response = await apiClient.put(`/api/Address/${id}`, address, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    console.log('Full Update Response:', JSON.stringify(response.data, null, 2));
    
    // Check for success in response
    if (response.data && response.data.success) {
      return response.data.data || address;
    } else {
      // Log specific error message if available
      const errorMessage = response.data?.message || 
                           response.data?.errors?.join(', ') || 
                           "Unknown error occurred";
      throw new Error(errorMessage);
    }
  } catch (error: any) {

    
    // Throw a more informative error
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      "Failed to update address"
    );
  }
};

// DELETE /api/Address/{id}: Delete an address by ID
export const deleteAddressAPI = async (id: string): Promise<boolean> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    const response = await apiClient.delete(`/api/Address/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    return response.data?.success === true;
  } catch (error: any) {
    console.error("Error deleting address:", error);
    throw new Error("Failed to delete address");
  }
};
export const setDefaultAddressAPI = async (id: string): Promise<IAddress> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    const response = await apiClient.post(`/api/Address/set-default/${id}`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    
    // Directly return the response data since it's already the address object
    console.log('Set Default Address Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error setting default address:", error);
    throw new Error("Failed to set default address");
  }
};