import { initApiClient } from "@/config/axiosConfig"; // Assuming your axiosConfig is correctly set up
import { LogBox } from "react-native";

// Ignoring Axios 400 Errors for cleaner logs
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

// Interface for contact data
export interface IContact {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string; // Avatar of the contact
}

// API to fetch all contacts
export const getContactsAPI = async (): Promise<IContact[]> => {
  const url = "/api/contact/contacts"; // Your API endpoint to get contacts
  
  const apiClient = await initApiClient();
  try {
    const response = await apiClient.get(url); // Fetching the data

    // Log the full response for debugging
    console.log("Full API Response:", response);

    // Check if response contains 'data' and it's an array
    if (response && Array.isArray(response.data)) {
      return response.data; // Return the valid array of contacts
    } else {
      console.error("🔴 API Response is invalid:", response);
      return Promise.reject(new Error("Invalid response format from the server."));
    }
  } catch (error: any) {
    // Log the error for troubleshooting
    console.error("🔴 Error fetching contacts:", error);

    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }

    return Promise.reject(new Error("Failed to fetch contacts from the server."));
  }
};
// Defining the correct response interface
interface IAddContactResponse {
  success: boolean;
  message?: string;
}

export const addContactAPI = async (receiverId: number): Promise<IAddContactResponse> => {
  const url = `/api/contact/add/${receiverId}`; // API endpoint to add a new contact

  const apiClient = await initApiClient();
  try {
    // Make POST request to the API
    const response = await apiClient.post(url); // Send POST request to add a contact
    if (response.data && response.data.success !== undefined) {
      return response.data; // Returning the response that contains success and message
    } else {
      throw new Error("Invalid response format from server.");
    }
  } catch (error: any) {
    console.error("🔴 Add Contact API Error:", error);

    if (error.response) {
      console.error("Error Response Data:", error.response.data);
    } else {
      console.error("Error Message:", error.message);
    }

    // Return a user-friendly error message
    throw new Error("Failed to add contact. Please try again.");
  }
};
