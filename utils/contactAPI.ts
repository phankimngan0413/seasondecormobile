import { initApiClient } from "@/utils/axiosConfig"; // Assuming your axiosConfig is correctly set up
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
export const addContactAPI = async (receiverId: number): Promise<IContact> => {
  const url = `/api/contact/add/${receiverId}`; // API endpoint to add a new contact

  const apiClient = await initApiClient();
  try {
    // Make POST request to the API
    const response = await apiClient.post(url); // Send POST request to add a contact

    // Log the entire response object to check its structure
    console.log("🟢 Full API Response:", response);
    console.log("🟢 Response Status:", response.status); // If available

    // Ensure response.data exists before checking success and message
    if (response.data && response.data.success !== undefined) {
      if (response.data.success) {
        console.log("🟢 Contact added successfully:", response.data);
        return response.data; // Return the added contact
      } else {
        // Handle failure response (e.g., "Contact already exists")
        console.error("🔴 Error message:", response.data.message || "Unknown error");
        throw new Error(response.data.message || "Failed to add contact.");
      }
    } else {
      console.error("🔴 Invalid response format:", response.data);
      throw new Error("Invalid response format from server.");
    }
  } catch (error: any) {
    console.error("🔴 Add Contact API Error:", error);

    // Log detailed error information
    if (error.response) {
      console.error("Error Response Data:", error.response.data);
      console.error("Error Response Status:", error.response.status); // Log status code for debugging
    } else {
      console.error("Error Message:", error.message); // Log the error message if no response
    }

    // Return a user-friendly error message
    throw new Error("Failed to add contact. Please try again.");
  }
};