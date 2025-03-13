import { initApiClient } from "@/utils/axiosConfig";
import { getToken, setToken } from "@/services/auth"; // Your utility to get and set the token
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
    const response = await apiClient.get(`/api/AccountManagement/${userId}`);
    
    // Return the user account data from API
    return response.data;
  } catch (error) {
    console.error("Error fetching account details: ", error);
    throw error;
  }
};

// Update Account Details (Example)
export const updateAccountDetails = async (userData: any): Promise<any> => {
  try {
    const token = await getToken();
    if (!token) throw new Error("No token found!");

    // Decode the token to get the userId
    const decoded: any = jwtDecode(token);
    const userId = decoded?.nameid;
    if (!userId) throw new Error("No user ID in the token.");

    const apiClient = await initApiClient();
    const response = await apiClient.put(`/api/AccountProfile/update-account`, userData, {
      headers: {
        Authorization: `Bearer ${token}`, // Attach the token to the request
      },
    });
    
    return response.data; // Return the updated account data from the server
  } catch (error) {
    console.error("Error updating account details: ", error);
    throw error;
  }
};
export const updateAvatar = async (file: any): Promise<any> => {
  try {
    if (!file) {
      throw new Error("No file selected."); // Check if a file is selected
    }

    const token = await getToken();
    if (!token) throw new Error("No token found!");

    // Decode token to get userId
    const decoded: any = jwtDecode(token);
    const userId = decoded?.nameid;
    if (!userId) throw new Error("No user ID found in token.");

    // Prepare FormData to send the file
    const formData = new FormData();
    formData.append("file", file);  // Ensure the file is attached to the request

    const apiClient = await initApiClient();
    const response = await apiClient.put(`/api/AccountProfile/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`, // Include token for authorization
      },
    });

    return response.data; // Return the updated avatar data from the server
  } catch (error) {
    console.error("Error uploading avatar: ", error);
    throw error; // Rethrow the error to handle it in the calling code
  }
};
