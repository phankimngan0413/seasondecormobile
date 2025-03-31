import { initApiClient } from "@/config/axiosConfig";
import { getToken } from "@/services/auth"; // Your utility to get and set the token
import { jwtDecode } from "jwt-decode";

// Get Account Details by User ID
export const getAccountDetails = async (): Promise<any> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    // Decode the token to get the userId
    const decoded: any = jwtDecode(token);
    const userId = decoded?.nameid;
    if (!userId) throw new Error("No user ID in the token.");
    
    const apiClient = await initApiClient();
    const response = await apiClient.get(`/api/AccountProfile/${userId}`);
    
    // Return the user account data from API
    return response.data;
  } catch (error) {
    console.error("Error fetching account details: ", error);
    throw error;
  }
};

// Get Account Details by ID (for other users)
export const getAccountDetailsById = async (userId: string | number): Promise<any> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    const apiClient = await initApiClient();
    const response = await apiClient.get(`/api/AccountProfile/${userId}`);
    
    // Return the user account data from API
    return response.data;
  } catch (error) {
    console.error(`Error fetching account details for user ${userId}: `, error);
    throw error;
  }
};

// Update Account Details
export const updateAccountDetails = async (userData: any): Promise<any> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    // Ensure all required fields have values
    const requestData = {
      FirstName: userData.FirstName || "",
      LastName: userData.LastName || "",
      Slug: userData.Slug || "",
      DateOfBirth: userData.DateOfBirth || "",
      Gender: userData.Gender === undefined ? true : userData.Gender,
      Phone: userData.Phone || ""
    };
    
    console.log("Final API Request Data:", requestData);
    
    const apiClient = await initApiClient();
    const response = await apiClient.put(`/api/AccountProfile/update-account`, requestData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error updating account details: ", error);
    throw error;
  }
};

// Upload avatar
export const updateAvatar = async (formData: FormData): Promise<any> => {
  try {
    // Check if formData is valid
    if (!formData) {
      throw new Error("No file selected.");
    }
    
    const token = await getToken();
    if (!token) throw new Error("No token found!");
    
    // Decode token to get userId
    const decoded: any = jwtDecode(token);
    const userId = decoded?.nameid;
    if (!userId) throw new Error("No user ID found in token.");
    
    const apiClient = await initApiClient();
    
    // Add timeout and retry logic for network reliability
    const response = await apiClient.put(`/api/AccountProfile/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000, // 30 seconds timeout
    });
    
    return response.data;
  } catch (error: any) {
    // Improve error message for network issues
    if (error.message === 'Network Error') {
      console.error("Network error while uploading avatar. Check your connection.");
      throw { message: "Network connection issue. Please try again when you have a stable connection." };
    }
    
    console.error("Error uploading avatar: ", error);
    throw error;
  }
};