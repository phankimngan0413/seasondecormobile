import { initApiClient } from "@/config/axiosConfig";
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
    const response = await apiClient.put(`/api/AccountManagement/update/${userId}`, userData);
    
    // Return the updated data from the server
    return response.data;
  } catch (error) {
    console.error("Error updating account details: ", error);
    throw error;
  }
};

// Login API call

export const updateAvatar = async (file: any): Promise<any> => {
  try {
    if (!file) {
      throw new Error("No file selected."); // Check if a file is selected
    }

    console.log("Selected file:", file); // Log the file to ensure it's valid

    const token = await getToken();
    if (!token) throw new Error("No token found!");

    // Decode token to get userId
    const decoded: any = jwtDecode(token);
    const userId = decoded?.nameid;
    if (!userId) throw new Error("No user ID found in token.");

    // Prepare FormData to send the file
    const formData = new FormData();

    // Flatten the file structure if needed
    const fileObject = file._parts ? file._parts[0][1] : file;

    // Ensure the file is added to FormData as a proper File/Blob object
    const blob = {
      uri: fileObject.uri,
      type: fileObject.type || "image/jpeg",
      name: fileObject.fileName || "avatar.jpg",
    };

    formData.append("file", new Blob([blob.uri], { type: blob.type }), blob.name);

    console.log("FormData:", formData); // Log FormData to check if the file is correctly appended

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
